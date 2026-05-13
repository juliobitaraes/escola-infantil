const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function getUserRole(uid) {
  const snap = await db.collection("usuarios").doc(uid).get();
  if (!snap.exists) return null;
  return snap.get("role") || null;
}

function requireAuth(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Usuario nao autenticado.");
  }
}

function requireFinanceRole(role) {
  const allowed = ["admin", "direcao", "financeiro"];
  if (!allowed.includes(role)) {
    throw new HttpsError("permission-denied", "Sem permissao para operacao financeira.");
  }
}

async function writeAudit({ action, area, uid, email, details }) {
  await db.collection("auditoria").add({
    action,
    area,
    user_uid: uid || null,
    user_email: email || null,
    details: details || null,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function criarCobrancaAsaas(payload) {
  const baseUrl = process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3";
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "ASAAS_API_KEY nao configurada.");
  }

  const response = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error("Erro Asaas", text);
    throw new HttpsError("internal", "Erro ao criar cobranca no provedor.");
  }

  return response.json();
}

exports.criarCobrancaExterna = onCall({ region: "southamerica-east1" }, async (request) => {
  requireAuth(request);
  const role = await getUserRole(request.auth.uid);
  requireFinanceRole(role);

  const { cobrancaId, customerRef, description } = request.data || {};
  if (!cobrancaId || !customerRef) {
    throw new HttpsError("invalid-argument", "cobrancaId e customerRef sao obrigatorios.");
  }

  const cobrancaRef = db.collection("cobrancas").doc(cobrancaId);
  const cobrancaSnap = await cobrancaRef.get();
  if (!cobrancaSnap.exists) {
    throw new HttpsError("not-found", "Cobranca nao encontrada.");
  }

  const cobranca = cobrancaSnap.data();
  const provider = process.env.BILLING_PROVIDER || "asaas";

  let external = null;
  if (provider === "asaas") {
    external = await criarCobrancaAsaas({
      customer: customerRef,
      billingType: (cobranca.metodo || "BOLETO").toUpperCase(),
      value: Number(cobranca.valor || 0),
      dueDate: cobranca.vencimento || todayISO(),
      description: description || `Cobranca aluno ${cobranca.aluno || ""}`
    });
  } else {
    throw new HttpsError("failed-precondition", "BILLING_PROVIDER nao suportado.");
  }

  await cobrancaRef.set(
    {
      external_provider: provider,
      external_id: external.id || null,
      external_payload: external,
      external_status: external.status || "pending",
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: request.auth.uid
    },
    { merge: true }
  );

  await writeAudit({
    action: "create",
    area: "cobranca_externa",
    uid: request.auth.uid,
    email: request.auth.token && request.auth.token.email,
    details: { cobrancaId, provider }
  });

  return {
    ok: true,
    provider,
    externalId: external.id || null,
    invoiceUrl: external.invoiceUrl || null,
    pixQrCode: external.pixTransaction && external.pixTransaction.qrCode ? external.pixTransaction.qrCode : null
  };
});

async function enviarNotificacao({ canal, destino: _destino, mensagem: _mensagem }) {
  if (canal === "email") {
    if ((process.env.MAIL_PROVIDER || "none") === "none") {
      return { sent: false, reason: "MAIL_PROVIDER nao configurado" };
    }
    return { sent: true, provider: process.env.MAIL_PROVIDER };
  }

  if (canal === "sms") {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM) {
      return { sent: false, reason: "Credenciais Twilio ausentes" };
    }
    return { sent: true, provider: "twilio" };
  }

  return { sent: true, provider: "app" };
}

exports.processarReguaCobranca = onSchedule(
  {
    schedule: "every day 08:00",
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1"
  },
  async () => {
    const hoje = todayISO();
    const snap = await db
      .collection("regua_cobranca")
      .where("status", "==", "agendado")
      .where("enviar_em", "<=", hoje)
      .limit(200)
      .get();

    if (snap.empty) {
      logger.info("Regua: sem lembretes para envio");
      return;
    }

    const batch = db.batch();

    for (const docSnap of snap.docs) {
      const row = docSnap.data();
      const noti = await enviarNotificacao({
        canal: row.canal || "app",
        destino: row.destino || null,
        mensagem: row.mensagem || "Lembrete de vencimento"
      });

      batch.set(
        docSnap.ref,
        {
          status: noti.sent ? "enviado" : "erro",
          envio_resultado: noti,
          processado_em: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      await writeAudit({
        action: "process",
        area: "regua_cobranca",
        details: { id: docSnap.id, resultado: noti }
      });
    }

    await batch.commit();
  }
);

exports.receberWebhookCobranca = onRequest({ region: "southamerica-east1" }, async (req, res) => {
  const token = process.env.BILLING_WEBHOOK_TOKEN;
  const incoming = req.headers["x-webhook-token"];
  if (!token || incoming !== token) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  const payload = req.body || {};
  const externalId = payload.payment && payload.payment.id ? payload.payment.id : null;
  const status = payload.payment && payload.payment.status ? payload.payment.status : "unknown";

  if (!externalId) {
    res.status(400).json({ ok: false, error: "external id missing" });
    return;
  }

  const snap = await db.collection("cobrancas").where("external_id", "==", externalId).limit(1).get();
  if (snap.empty) {
    res.status(404).json({ ok: false, error: "cobranca not found" });
    return;
  }

  const cobrancaRef = snap.docs[0].ref;
  await cobrancaRef.set(
    {
      external_status: status,
      status: status === "RECEIVED" ? "pago" : "pendente",
      webhook_payload: payload,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  await writeAudit({
    action: "webhook",
    area: "cobrancas",
    details: { externalId, status }
  });

  res.status(200).json({ ok: true });
});
