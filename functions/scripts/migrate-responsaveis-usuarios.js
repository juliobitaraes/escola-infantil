/**
 * migrate-responsaveis-usuarios.js
 *
 * Cria usuários no Firebase Auth para todos os responsáveis já cadastrados nas
 * matrículas que possuem CPF mas ainda não possuem responsavel_uid.
 *
 * Uso:
 *   node scripts/migrate-responsaveis-usuarios.js
 *
 * Requer a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS apontando para
 * a chave de serviço do projeto, ou deve ser executado em ambiente com
 * credenciais padrão do Google Cloud (ADC).
 */

"use strict";

const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

const RESPONSAVEL_EMAIL_DOMAIN = "responsavel.escola";
const RESPONSAVEL_SENHA_PADRAO = "123456";

function cpfToEmail(cpf) {
  return `${String(cpf).replace(/\D/g, "")}@${RESPONSAVEL_EMAIL_DOMAIN}`;
}

async function migrate() {
  console.log("Iniciando migração de responsáveis...");

  const snap = await db.collection("matriculas").get();
  console.log(`Total de matrículas encontradas: ${snap.size}`);

  let created = 0;
  let skipped = 0;
  const errors = [];

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const cpf = String(data.responsavel_cpf || "").replace(/\D/g, "");
    const escolaId = data.escola_id || null;
    const nome = data.responsavel || cpf;

    if (!cpf || cpf.length !== 11 || !escolaId) {
      skipped++;
      continue;
    }

    const userEmail = cpfToEmail(cpf);

    try {
      let uid;
      let wasCreated = false;

      try {
        const existing = await auth.getUserByEmail(userEmail);
        uid = existing.uid;
      } catch (err) {
        if (err.code === "auth/user-not-found") {
          const newUser = await auth.createUser({
            displayName: nome,
            email: userEmail,
            password: RESPONSAVEL_SENHA_PADRAO,
            emailVerified: false,
            disabled: false
          });
          uid = newUser.uid;
          wasCreated = true;
        } else {
          throw err;
        }
      }

      // Salva/atualiza no Firestore
      await db.collection("usuarios").doc(uid).set(
        {
          uid,
          nome,
          email: userEmail,
          cpf,
          role: "responsavel",
          escola_id: escolaId,
          status: "ativo",
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          created_at: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      // Atualiza a matrícula com o UID do responsável
      await db.collection("matriculas").doc(docSnap.id).set(
        {
          responsavel_uid: uid,
          responsavel_email: userEmail,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      // Atualiza o aluno vinculado, se existir
      const alunoSlug = (data.aluno || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      if (alunoSlug) {
        await db.collection("alunos").doc(alunoSlug).set(
          {
            responsavel_uid: uid,
            responsavel_email: userEmail,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
      }

      if (wasCreated) {
        created++;
        console.log(`  [CRIADO] CPF ${cpf} → uid ${uid} (matrícula: ${docSnap.id})`);
      } else {
        skipped++;
        console.log(`  [JÁ EXISTIA] CPF ${cpf} → uid ${uid} (matrícula: ${docSnap.id})`);
      }
    } catch (err) {
      errors.push({ matriculaId: docSnap.id, cpf, error: String(err.message || err) });
      console.error(`  [ERRO] matriculaId=${docSnap.id} cpf=${cpf}:`, err.message || err);
    }
  }

  console.log("\n=== RESULTADO ===");
  console.log(`Criados:  ${created}`);
  console.log(`Ignorados/já existiam: ${skipped}`);
  console.log(`Erros:    ${errors.length}`);
  if (errors.length) {
    console.error("Detalhes dos erros:", JSON.stringify(errors, null, 2));
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

migrate().catch((err) => {
  console.error("Erro fatal na migração:", err);
  process.exit(1);
});
