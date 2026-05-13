const admin = require("firebase-admin");
const fs = require("fs");

const SUPERUSER_EMAIL = "julio.bitaraes.mail@gmail.com";
const DEFAULT_SCHOOL = "escola-padrao";
const GLOBAL_SCHOOL = "global";
const BATCH_LIMIT = 400;

const COLLECTIONS = [
  "auditoria",
  "agenda_diaria",
  "agenda_eventos",
  "mural_avisos",
  "chat_mensagens",
  "galeria_fotos",
  "autorizacoes_digitais",
  "relatorios_bncc",
  "planejamento_aulas",
  "fichas_anamnese",
  "ocorrencias",
  "frequencia",
  "cobrancas",
  "regua_cobranca",
  "extras_financeiros",
  "fluxo_caixa",
  "matriculas",
  "alunos",
  "prontuarios",
  "turmas",
  "portaria_retiradas",
  "lgpd_consentimentos"
];

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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function updateUsers(db, schoolId, dryRun) {
  const snap = await db.collection("usuarios").get();
  let touched = 0;
  let writes = 0;
  let batch = db.batch();

  for (const docSnap of snap.docs) {
    const data = docSnap.data() || {};
    const email = normalizeEmail(data.email);
    const isSuper = email === SUPERUSER_EMAIL;
    const desiredSchool = isSuper ? GLOBAL_SCHOOL : schoolId;
    const desiredRole = isSuper ? "superadmin" : (data.role || "coordenacao");

    const patch = {};
    if (data.escola_id !== desiredSchool) patch.escola_id = desiredSchool;
    if (data.role !== desiredRole) patch.role = desiredRole;
    if (Object.keys(patch).length === 0) continue;

    touched += 1;
    if (dryRun) continue;

    batch.set(docSnap.ref, patch, { merge: true });
    writes += 1;
    if (writes % BATCH_LIMIT === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  if (!dryRun && writes % BATCH_LIMIT !== 0) {
    await batch.commit();
  }

  return { touched, writes };
}

async function updateCollectionSchoolId(db, collectionName, schoolId, dryRun) {
  const snap = await db.collection(collectionName).where("escola_id", "==", null).get();
  const fallbackSnap = await db.collection(collectionName).get();

  const targets = [];
  const seen = new Set();

  for (const docSnap of snap.docs) {
    targets.push(docSnap);
    seen.add(docSnap.id);
  }

  for (const docSnap of fallbackSnap.docs) {
    if (seen.has(docSnap.id)) continue;
    const data = docSnap.data() || {};
    if (data.escola_id !== undefined) continue;
    targets.push(docSnap);
  }

  if (!targets.length) {
    return { touched: 0, writes: 0 };
  }

  let touched = 0;
  let writes = 0;
  let batch = db.batch();

  for (const docSnap of targets) {
    touched += 1;
    if (dryRun) continue;

    batch.set(docSnap.ref, { escola_id: schoolId }, { merge: true });
    writes += 1;

    if (writes % BATCH_LIMIT === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  if (!dryRun && writes % BATCH_LIMIT !== 0) {
    await batch.commit();
  }

  return { touched, writes };
}

async function main() {
  const schoolId = parseArg("school", DEFAULT_SCHOOL);
  const dryRun = hasFlag("dry-run");
  const projectId = parseArg("project", process.env.GCLOUD_PROJECT || "");
  const serviceAccountPath = parseArg("service-account", process.env.GOOGLE_APPLICATION_CREDENTIALS || "");

  initAdmin(projectId, serviceAccountPath);
  const db = admin.firestore();

  console.log(
    `Iniciando migracao de escola_id | escola=${schoolId} | dryRun=${dryRun} | project=${projectId || "auto"}`
  );

  const userResult = await updateUsers(db, schoolId, dryRun);
  console.log(`usuarios | candidatos=${userResult.touched} | gravados=${userResult.writes}`);

  for (const collectionName of COLLECTIONS) {
    const result = await updateCollectionSchoolId(db, collectionName, schoolId, dryRun);
    console.log(`${collectionName} | candidatos=${result.touched} | gravados=${result.writes}`);
  }

  console.log("Migracao concluida.");
}

main().catch((error) => {
  console.error("Falha na migracao:", error.message);
  console.error(
    "Dica: use --service-account=/caminho/chave.json --project=seu-projeto ou configure GOOGLE_APPLICATION_CREDENTIALS"
  );
  process.exitCode = 1;
});
