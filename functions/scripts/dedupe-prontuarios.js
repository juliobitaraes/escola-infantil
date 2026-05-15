const admin = require("firebase-admin");
const fs = require("fs");

const BATCH_LIMIT = 300;

function parseArg(name, fallback) {
  const full = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(full));
  if (!match) return fallback;
  return match.slice(full.length).trim() || fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function initAdmin(projectId, serviceAccountPath) {
  if (serviceAccountPath) {
    const raw = fs.readFileSync(serviceAccountPath, "utf8");
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id
    });
    return;
  }

  admin.initializeApp(projectId ? { projectId } : undefined);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function identityFromDoc(documento = {}) {
  return [String(documento.url || ""), String(documento.caminho || ""), String(documento.nome || "")].join("::");
}

function mergeUniqueDocumentos(items) {
  const result = [];
  const seen = new Set();
  for (const item of items || []) {
    const key = identityFromDoc(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function toMillis(tsLike) {
  if (!tsLike) return 0;
  if (typeof tsLike.toDate === "function") return tsLike.toDate().getTime();
  if (tsLike instanceof Date) return tsLike.getTime();
  return 0;
}

async function flushBatchIfNeeded({ db, batch, writes }, force = false) {
  if (!force && writes % BATCH_LIMIT !== 0) {
    return { batch, commits: 0 };
  }
  if (writes === 0) {
    return { batch, commits: 0 };
  }
  await batch.commit();
  return { batch: db.batch(), commits: 1 };
}

async function dedupeProntuarios({ db, schoolId, dryRun }) {
  const snap = await db.collection("prontuarios").get();
  const groups = new Map();

  for (const docSnap of snap.docs) {
    const data = docSnap.data() || {};
    if (schoolId && String(data.escola_id || "") !== schoolId) continue;
    const alunoKey = slugify(data.aluno || "");
    if (!alunoKey) continue;
    const scope = String(data.escola_id || "sem-escola");
    const groupKey = `${scope}::${alunoKey}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push({ id: docSnap.id, ref: docSnap.ref, data });
  }

  let candidateGroups = 0;
  let updateWrites = 0;
  let deleteWrites = 0;
  let mergedDocsCount = 0;
  let batch = db.batch();
  let commits = 0;

  for (const entries of groups.values()) {
    if (entries.length <= 1) continue;
    candidateGroups += 1;

    entries.sort((a, b) => {
      const aTs = toMillis(a.data.updated_at) || toMillis(a.data.created_at);
      const bTs = toMillis(b.data.updated_at) || toMillis(b.data.created_at);
      return bTs - aTs;
    });

    const keep = entries[0];
    const stale = entries.slice(1);
    const mergedUpload = mergeUniqueDocumentos(entries.flatMap((entry) => Array.isArray(entry.data.documentos_upload) ? entry.data.documentos_upload : []));
    const mergedMatricula = mergeUniqueDocumentos(entries.flatMap((entry) => Array.isArray(entry.data.documentos_matricula) ? entry.data.documentos_matricula : []));

    const allUrls = entries.flatMap((entry) => {
      if (Array.isArray(entry.data.arquivos_url)) return entry.data.arquivos_url;
      if (entry.data.arquivo_url) return [entry.data.arquivo_url];
      return [];
    });
    const mergedUrls = Array.from(new Set(allUrls.map((url) => String(url || "").trim()).filter(Boolean)));

    const nonEmptyTipo = entries.map((entry) => String(entry.data.tipo_documento || "").trim()).find(Boolean) || "";
    const nonEmptyObs = entries.map((entry) => String(entry.data.observacao || "").trim()).find(Boolean) || "";

    const payload = {
      aluno: keep.data.aluno || "",
      tipo_documento: keep.data.tipo_documento || nonEmptyTipo,
      arquivo_url: keep.data.arquivo_url || mergedUrls[0] || "",
      arquivos_url: mergedUrls,
      documentos_upload: mergedUpload,
      documentos_matricula: mergedMatricula,
      observacao: keep.data.observacao || nonEmptyObs,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      migrated_dedupe_at: admin.firestore.FieldValue.serverTimestamp()
    };

    mergedDocsCount += stale.length;

    if (dryRun) continue;

    batch.set(keep.ref, payload, { merge: true });
    updateWrites += 1;
    let flushResult = await flushBatchIfNeeded({ db, batch, writes: updateWrites + deleteWrites }, false);
    batch = flushResult.batch;
    commits += flushResult.commits;

    for (const oldEntry of stale) {
      batch.delete(oldEntry.ref);
      deleteWrites += 1;
      flushResult = await flushBatchIfNeeded({ db, batch, writes: updateWrites + deleteWrites }, false);
      batch = flushResult.batch;
      commits += flushResult.commits;
    }
  }

  if (!dryRun) {
    const finalFlush = await flushBatchIfNeeded({ db, batch, writes: updateWrites + deleteWrites }, true);
    commits += finalFlush.commits;
  }

  return {
    totalRecords: snap.size,
    candidateGroups,
    duplicatesToDelete: mergedDocsCount,
    updateWrites,
    deleteWrites,
    commits
  };
}

async function main() {
  const dryRun = hasFlag("dry-run");
  const schoolId = parseArg("school", "");
  const projectId = parseArg("project", process.env.GCLOUD_PROJECT || "");
  const serviceAccountPath = parseArg("service-account", process.env.GOOGLE_APPLICATION_CREDENTIALS || "");

  initAdmin(projectId, serviceAccountPath);
  const db = admin.firestore();

  console.log(`Iniciando deduplicacao de prontuarios | dryRun=${dryRun} | school=${schoolId || "todas"} | project=${projectId || "auto"}`);

  const result = await dedupeProntuarios({ db, schoolId, dryRun });
  console.log(`prontuarios_total=${result.totalRecords}`);
  console.log(`grupos_duplicados=${result.candidateGroups}`);
  console.log(`duplicados_para_remover=${result.duplicatesToDelete}`);
  console.log(`grava_updates=${result.updateWrites}`);
  console.log(`grava_deletes=${result.deleteWrites}`);
  console.log(`commits=${result.commits}`);
  console.log("Deduplicacao concluida.");
}

main().catch((error) => {
  console.error("Falha na deduplicacao:", error.message);
  console.error(
    "Dica: use --service-account=/caminho/chave.json --project=seu-projeto ou configure GOOGLE_APPLICATION_CREDENTIALS"
  );
  process.exitCode = 1;
});
