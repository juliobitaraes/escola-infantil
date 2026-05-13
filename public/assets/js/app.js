import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVPjBwXLM2gfN_TXffajP5hNqkcRF3nws",
  authDomain: "escola-infantil-edu.firebaseapp.com",
  projectId: "escola-infantil-edu",
  storageBucket: "escola-infantil-edu.firebasestorage.app",
  messagingSenderId: "1049810439266",
  appId: "1:1049810439266:web:4cdd5af8dd78116e0c953b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const SUPERUSER_EMAIL = "julio.bitaraes.mail@gmail.com";

const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginError = document.getElementById("loginError");
const userDisplay = document.getElementById("userDisplay");
const userRole = document.getElementById("userRole");
const familyDashboard = document.getElementById("familyDashboard");
const mainGrid = document.getElementById("mainGrid");

let detachListeners = [];
let currentProfile = { role: "coordenacao", escola_id: "escola-padrao" };
let selectedAgendaId = null;
let selectedAgendaData = null;
let cachedAgendaEvents = [];

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isSuperUser() {
  const authEmail = auth.currentUser ? normalizeEmail(auth.currentUser.email) : "";
  const profileEmail = normalizeEmail(currentProfile.email);
  return authEmail === SUPERUSER_EMAIL || profileEmail === SUPERUSER_EMAIL;
}

function currentSchoolId() {
  return currentProfile.escola_id || null;
}

function withSchoolScope(payload) {
  const schoolId = currentSchoolId();
  if (payload && payload.escola_id) return payload;
  if (!schoolId) return payload;
  return { ...payload, escola_id: schoolId };
}

function scopedCollectionQuery(collectionName, constraints = []) {
  const scope = !isSuperUser() && currentSchoolId() ? [where("escola_id", "==", currentSchoolId())] : [];
  return query(collection(db, collectionName), ...scope, ...constraints);
}

function formatDate(value) {
  if (!value) return "sem data";
  if (typeof value.toDate === "function") return value.toDate().toLocaleString("pt-BR");
  return String(value);
}

function money(n) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function agendaIdFor(aluno, data) {
  return `${slugify(aluno)}-${data}`;
}

function canManageAgendaSchool() {
  return isSuperUser() || ["superadmin", "admin", "direcao", "coordenacao", "professor"].includes(currentProfile.role || "");
}

function canUseAgendaFamily() {
  return isSuperUser() || ["responsavel", "superadmin", "admin", "direcao", "coordenacao"].includes(currentProfile.role || "");
}

function isFamilyOnlyRole() {
  return currentProfile.role === "responsavel";
}

function applyRoleLayout() {
  const cards = Array.from(mainGrid.querySelectorAll(":scope > .card"));
  const familyOnly = isFamilyOnlyRole();
  
  // Mostrar/ocultar dashboard da família
  if (familyDashboard) {
    familyDashboard.classList.toggle("active", familyOnly);
  }
  
  // Para responsáveis, mostrar apenas o primeiro card (agenda)
  if (familyOnly) {
    cards.forEach((card, index) => {
      card.style.display = index === 0 ? "block" : "none";
    });
  } else {
    // Para staff, manter a secao ativa definida pela navegacao lateral.
    const activeItem = document.querySelector(".nav-item.active");
    const activeSection = activeItem ? activeItem.getAttribute("data-section") : "agenda";
    if (typeof window.showSection === "function") {
      window.showSection(activeSection);
    }
  }
  
  document.querySelectorAll(".school-only").forEach((element) => {
    element.style.display = familyOnly ? "none" : "flex";
    if (element.classList.contains("agenda-block")) {
      element.style.display = familyOnly ? "none" : "block";
    }
  });
  document.querySelectorAll(".family-only").forEach((element) => {
    element.style.display = canUseAgendaFamily() ? "block" : "none";
  });
}

function setAgendaMode() {
  const modeTag = document.getElementById("agendaModeTag");
  const schoolIds = [
    "agendaAluno",
    "agendaTurma",
    "agendaData",
    "agendaResponsavelUid",
    "agendaStatus",
    "agendaAlimentacao",
    "agendaAlimentacaoObs",
    "agendaSonoInicio",
    "agendaSonoFim",
    "agendaSonoQualidade",
    "agendaHumor",
    "agendaEvacuacao",
    "agendaBanho",
    "agendaSaude",
    "agendaAtividades",
    "agendaDestaque",
    "agendaAtencao",
    "agendaRecadoEscola",
    "btnAgenda",
    "btnAgendaCopiar",
    "btnAgendaEnviar"
  ];
  const familyIds = ["agendaRespostaResponsavel", "btnAgendaLer", "btnAgendaResponder"];
  const schoolEnabled = canManageAgendaSchool();
  const familyEnabled = canUseAgendaFamily();

  schoolIds.forEach((id) => {
    document.getElementById(id).disabled = !schoolEnabled;
  });
  familyIds.forEach((id) => {
    document.getElementById(id).disabled = !familyEnabled;
  });

  modeTag.textContent = currentProfile.role === "responsavel" ? "Modo familia" : "Modo escola";
}

function setSelectedAgenda(id, data) {
  selectedAgendaId = id;
  selectedAgendaData = data || null;
  const statusTag = document.getElementById("agendaSelectedStatus");
  const meta = document.getElementById("agendaFamilyMeta");
  if (!data) {
    statusTag.textContent = "Nenhuma agenda selecionada";
    meta.textContent = "Nenhuma agenda selecionada.";
    document.getElementById("agendaRespostaResponsavel").value = "";
    return;
  }
  statusTag.textContent = `Selecionada: ${data.aluno || "Aluno"} - ${data.status || "rascunho"}`;
  meta.textContent = `Aluno: ${data.aluno || "-"} | Data: ${data.data || "-"} | Leitura: ${data.lido_em ? "confirmada" : "pendente"}`;
  document.getElementById("agendaRespostaResponsavel").value = data.resposta_responsavel || "";
  renderAgendaEventsList();
}

function renderAgendaEventsList() {
  const list = document.getElementById("listAgendaEventos");
  list.classList.add("event-list");
  list.innerHTML = "";
  const docs = cachedAgendaEvents.filter((row) => !selectedAgendaId || row.data.agenda_id === selectedAgendaId);
  if (!docs.length) {
    list.innerHTML = "<p class=\"small\">Sem eventos para a agenda selecionada.</p>";
    return;
  }
  docs.forEach(({ data }) => {
    list.appendChild(
      renderItem(
        `Evento - ${data.tipo || "agenda"}`,
        [`${data.detalhe || "Sem detalhe"}`, `Por: ${data.created_by_email || data.created_by || "-"}`],
        data.created_at
      )
    );
  });
}

function clearAgendaForm() {
  [
    "agendaAluno",
    "agendaTurma",
    "agendaResponsavelUid",
    "agendaAlimentacaoObs",
    "agendaSonoInicio",
    "agendaSonoFim",
    "agendaEvacuacao",
    "agendaBanho",
    "agendaSaude",
    "agendaAtividades",
    "agendaDestaque",
    "agendaAtencao",
    "agendaRecadoEscola"
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("agendaAlimentacao").value = "Comeu tudo";
  document.getElementById("agendaSonoQualidade").value = "Dormiu bem";
  document.getElementById("agendaHumor").value = "Tranquilo";
  document.getElementById("agendaStatus").value = "rascunho";
  document.getElementById("agendaData").value = todayString();
}

async function findAlunoByNome(nome) {
  if (!nome) return null;
  const snap = await getDocs(scopedCollectionQuery("alunos", [where("nome", "==", nome), limit(1)]));
  if (snap.empty) {
    return null;
  }
  return { id: snap.docs[0].id, data: snap.docs[0].data() };
}

async function syncAgendaBinding() {
  const aluno = document.getElementById("agendaAluno").value.trim();
  if (!aluno) {
    document.getElementById("agendaResponsavelUid").value = "";
    return;
  }
  const found = await findAlunoByNome(aluno);
  if (!found) {
    document.getElementById("agendaResponsavelUid").value = "";
    return;
  }
  document.getElementById("agendaResponsavelUid").value = found.data.responsavel_uid || "";
  if (!document.getElementById("agendaTurma").value) {
    document.getElementById("agendaTurma").value = found.data.turma || "";
  }
}

function fillAgendaForm(data) {
  document.getElementById("agendaAluno").value = data.aluno || "";
  document.getElementById("agendaTurma").value = data.turma || "";
  document.getElementById("agendaData").value = data.data || todayString();
  document.getElementById("agendaResponsavelUid").value = data.responsavel_uid || "";
  document.getElementById("agendaStatus").value = data.status || "rascunho";
  document.getElementById("agendaAlimentacao").value = data.alimentacao?.status || "Comeu tudo";
  document.getElementById("agendaAlimentacaoObs").value = data.alimentacao?.observacao || "";
  document.getElementById("agendaSonoInicio").value = data.sono?.inicio || "";
  document.getElementById("agendaSonoFim").value = data.sono?.fim || "";
  document.getElementById("agendaSonoQualidade").value = data.sono?.qualidade || "Dormiu bem";
  document.getElementById("agendaHumor").value = data.humor || "Tranquilo";
  document.getElementById("agendaEvacuacao").value = data.evacuacao || "";
  document.getElementById("agendaBanho").value = data.higiene || "";
  document.getElementById("agendaSaude").value = data.saude || "";
  document.getElementById("agendaAtividades").value = data.atividades || "";
  document.getElementById("agendaDestaque").value = data.destaque_positivo || "";
  document.getElementById("agendaAtencao").value = data.ponto_atencao || "";
  document.getElementById("agendaRecadoEscola").value = data.recado_escola || "";
}

function collectAgendaForm() {
  const aluno = document.getElementById("agendaAluno").value.trim();
  const data = document.getElementById("agendaData").value || todayString();
  return {
    id: agendaIdFor(aluno, data),
    aluno,
    turma: document.getElementById("agendaTurma").value.trim(),
    data,
    responsavel_uid: document.getElementById("agendaResponsavelUid").value.trim(),
    status: document.getElementById("agendaStatus").value,
    alimentacao: {
      status: document.getElementById("agendaAlimentacao").value,
      observacao: document.getElementById("agendaAlimentacaoObs").value.trim()
    },
    sono: {
      inicio: document.getElementById("agendaSonoInicio").value,
      fim: document.getElementById("agendaSonoFim").value,
      qualidade: document.getElementById("agendaSonoQualidade").value
    },
    evacuacao: document.getElementById("agendaEvacuacao").value.trim(),
    higiene: document.getElementById("agendaBanho").value.trim(),
    humor: document.getElementById("agendaHumor").value,
    saude: document.getElementById("agendaSaude").value.trim(),
    atividades: document.getElementById("agendaAtividades").value.trim(),
    destaque_positivo: document.getElementById("agendaDestaque").value.trim(),
    ponto_atencao: document.getElementById("agendaAtencao").value.trim(),
    recado_escola: document.getElementById("agendaRecadoEscola").value.trim()
  };
}

async function logAgendaEvent(agendaId, tipo, detalhe) {
  if (!auth.currentUser) return;
  await addDoc(collection(db, "agenda_eventos"), withSchoolScope({
    agenda_id: agendaId,
    tipo,
    detalhe,
    responsavel_uid: selectedAgendaData?.responsavel_uid || document.getElementById("agendaResponsavelUid").value.trim() || null,
    created_at: serverTimestamp(),
    created_by: auth.currentUser.uid,
    created_by_email: auth.currentUser.email
  }));
}

async function saveAgenda(statusOverride) {
  if (!canManageAgendaSchool()) {
    alert("Seu perfil nao pode editar a agenda da escola.");
    return;
  }
  const payload = collectAgendaForm();
  if (!payload.aluno) {
    alert("Informe o aluno para salvar a agenda.");
    return;
  }
  if (statusOverride) {
    payload.status = statusOverride;
    document.getElementById("agendaStatus").value = statusOverride;
  }

  const ref = doc(db, "agenda_diaria", payload.id);
  const existing = await getDoc(ref);
  await setDoc(
    ref,
    withSchoolScope({
      aluno: payload.aluno,
      turma: payload.turma,
      data: payload.data,
      responsavel_uid: payload.responsavel_uid || null,
      status: payload.status,
      alimentacao: payload.alimentacao,
      sono: payload.sono,
      evacuacao: payload.evacuacao,
      higiene: payload.higiene,
      humor: payload.humor,
      saude: payload.saude,
      atividades: payload.atividades,
      destaque_positivo: payload.destaque_positivo,
      ponto_atencao: payload.ponto_atencao,
      recado_escola: payload.recado_escola,
      professor_id: auth.currentUser.uid,
      professor_email: auth.currentUser.email,
      created_at: existing.exists() ? existing.data().created_at || serverTimestamp() : serverTimestamp(),
      updated_at: serverTimestamp(),
      updated_by: auth.currentUser.uid,
      enviado_em: payload.status === "enviado" ? serverTimestamp() : existing.exists() ? existing.data().enviado_em || null : null
    }),
    { merge: true }
  );
  await audit(existing.exists() ? "update" : "create", "agenda_diaria");
  await logAgendaEvent(payload.id, payload.status === "enviado" ? "enviada" : existing.exists() ? "atualizada" : "criada", `Status ${payload.status}`);
  showOk("okAgenda");
}

async function ensureUserProfile(user) {
  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);
  const email = normalizeEmail(user.email);
  const superUser = email === SUPERUSER_EMAIL;
  if (!snap.exists()) {
    const profile = {
      uid: user.uid,
      email: user.email,
      role: superUser ? "superadmin" : "coordenacao",
      escola_id: superUser ? "global" : "escola-padrao",
      created_at: serverTimestamp()
    };
    await setDoc(ref, profile);
    currentProfile = profile;
    return;
  }
  const data = snap.data();
  if (superUser && data.role !== "superadmin") {
    await setDoc(ref, { role: "superadmin", updated_at: serverTimestamp(), updated_by: user.uid }, { merge: true });
  }
  currentProfile = {
    ...data,
    role: superUser ? "superadmin" : data.role || "coordenacao",
    escola_id: data.escola_id || (superUser ? "global" : "escola-padrao")
  };
}

async function audit(action, area) {
  if (!auth.currentUser) return;
  await addDoc(collection(db, "auditoria"), withSchoolScope({
    action,
    area,
    user_uid: auth.currentUser.uid,
    user_email: auth.currentUser.email,
    created_at: serverTimestamp()
  }));
}

function renderItem(entryTitle, lines, dateValue) {
  const div = document.createElement("div");
  div.className = "item";
  const bodyLines = lines.map((line) => `<p class=\"line\">${line}</p>`).join("");
  div.innerHTML = `<strong>${entryTitle}</strong>${bodyLines}<p class=\"small\">${formatDate(dateValue)}</p>`;
  return div;
}

function showOk(id) {
  const msg = document.getElementById(id);
  msg.style.display = "block";
  setTimeout(() => {
    msg.style.display = "none";
  }, 1800);
}

function clearListeners() {
  detachListeners.forEach((off) => off());
  detachListeners = [];
}

function attachList(collectionName, containerId, draw, options = {}) {
  const list = document.getElementById(containerId);
  const orderedBy = options.orderByField || "created_at";
  const q = scopedCollectionQuery(collectionName, [limit(options.limitValue || 20)]);
  const unsubscribe = onSnapshot(q, (snap) => {
    list.innerHTML = "";
    if (snap.empty) {
      list.innerHTML = "<p class=\"small\">Sem registros ainda.</p>";
      return;
    }
    const docs = snap.docs
      .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }))
      .sort((left, right) => {
        const leftValue = left.data[orderedBy];
        const rightValue = right.data[orderedBy];
        const leftTs = leftValue && typeof leftValue.toDate === "function" ? leftValue.toDate().getTime() : 0;
        const rightTs = rightValue && typeof rightValue.toDate === "function" ? rightValue.toDate().getTime() : 0;
        return rightTs - leftTs;
      });
    docs.forEach((row) => list.appendChild(draw(row.id, row.data)));
  });
  detachListeners.push(unsubscribe);
}

function attachUiHandlers() {
  document.getElementById("agendaData").value = todayString();
  setAgendaMode();
  applyRoleLayout();

  document.getElementById("agendaAluno").addEventListener("change", syncAgendaBinding);
  document.getElementById("agendaAluno").addEventListener("blur", syncAgendaBinding);

  document.getElementById("btnAgenda").onclick = async () => {
    await saveAgenda();
  };

  document.getElementById("btnAgendaEnviar").onclick = async () => {
    await saveAgenda("enviado");
  };

  document.getElementById("btnAgendaCopiar").onclick = async () => {
    if (!canManageAgendaSchool()) {
      alert("Seu perfil nao pode copiar a rotina base.");
      return;
    }
    const aluno = document.getElementById("agendaAluno").value.trim();
    if (!aluno) {
      alert("Informe o aluno para copiar a ultima rotina.");
      return;
    }
    const qAgenda = scopedCollectionQuery("agenda_diaria", [limit(20)]);
    const snapshot = await new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        qAgenda,
        (snap) => {
          unsubscribe();
          resolve(snap);
        },
        reject
      );
    });
    const found = snapshot.docs.find((row) => row.data().aluno === aluno);
    if (!found) {
      alert("Nenhuma rotina anterior encontrada para esse aluno.");
      return;
    }
    fillAgendaForm(found.data());
    await syncAgendaBinding();
    document.getElementById("agendaData").value = todayString();
    document.getElementById("agendaStatus").value = "rascunho";
    showOk("okAgenda");
  };

  document.getElementById("btnAgendaLer").onclick = async () => {
    if (!selectedAgendaId || !selectedAgendaData) {
      alert("Selecione uma agenda para confirmar leitura.");
      return;
    }
    if (!canUseAgendaFamily()) {
      alert("Seu perfil nao pode registrar leitura da familia.");
      return;
    }
    await setDoc(
      doc(db, "agenda_diaria", selectedAgendaId),
      withSchoolScope({
        lido_em: serverTimestamp(),
        family_last_action: "leitura",
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }),
      { merge: true }
    );
    await audit("update", "agenda_diaria.leitura");
    await logAgendaEvent(selectedAgendaId, "leitura_confirmada", "Leitura confirmada pela familia");
    showOk("okAgendaFamilia");
  };

  document.getElementById("btnAgendaResponder").onclick = async () => {
    if (!selectedAgendaId || !selectedAgendaData) {
      alert("Selecione uma agenda para responder.");
      return;
    }
    if (!canUseAgendaFamily()) {
      alert("Seu perfil nao pode responder a agenda.");
      return;
    }
    await setDoc(
      doc(db, "agenda_diaria", selectedAgendaId),
      withSchoolScope({
        resposta_responsavel: document.getElementById("agendaRespostaResponsavel").value.trim(),
        respondido_em: serverTimestamp(),
        family_last_action: "resposta",
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }),
      { merge: true }
    );
    await audit("update", "agenda_diaria.resposta_responsavel");
    await logAgendaEvent(selectedAgendaId, "resposta_responsavel", "Resposta registrada pela familia");
    showOk("okAgendaFamilia");
  };

  document.getElementById("btnMural").onclick = async () => {
    await addDoc(collection(db, "mural_avisos"), withSchoolScope({
      titulo: document.getElementById("muralTitulo").value.trim(),
      tipo: document.getElementById("muralTipo").value.trim(),
      texto: document.getElementById("muralTexto").value.trim(),
      autor: auth.currentUser.email,
      created_at: serverTimestamp()
    }));
    await audit("create", "mural_avisos");
    showOk("okMural");
  };

  document.getElementById("btnChat").onclick = async () => {
    await addDoc(collection(db, "chat_mensagens"), withSchoolScope({
      para: document.getElementById("chatPara").value.trim(),
      mensagem: document.getElementById("chatMsg").value.trim(),
      de_uid: auth.currentUser.uid,
      de_email: auth.currentUser.email,
      created_at: serverTimestamp()
    }));
    await audit("create", "chat_mensagens");
    showOk("okChat");
  };

  document.getElementById("btnGaleria").onclick = async () => {
    await addDoc(collection(db, "galeria_fotos"), withSchoolScope({
      aluno_turma: document.getElementById("galeriaAluno").value.trim(),
      foto_url: document.getElementById("galeriaUrl").value.trim(),
      legenda: document.getElementById("galeriaLegenda").value.trim(),
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "galeria_fotos");
    showOk("okGaleria");
  };

  document.getElementById("btnAut").onclick = async () => {
    await addDoc(collection(db, "autorizacoes_digitais"), withSchoolScope({
      aluno: document.getElementById("autAluno").value.trim(),
      tipo: document.getElementById("autTipo").value.trim(),
      terceiro_autorizado: document.getElementById("autTerceiro").value.trim(),
      status: "registrada",
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "autorizacoes_digitais");
    showOk("okAut");
  };

  document.getElementById("btnRelatorio").onclick = async () => {
    await addDoc(collection(db, "relatorios_bncc"), withSchoolScope({
      aluno: document.getElementById("relAluno").value.trim(),
      campo_bncc: document.getElementById("relCampo").value.trim(),
      avaliacao: document.getElementById("relAvaliacao").value.trim(),
      autor: auth.currentUser.email,
      created_at: serverTimestamp()
    }));
    await audit("create", "relatorios_bncc");
    showOk("okRel");
  };

  document.getElementById("btnPlan").onclick = async () => {
    await addDoc(collection(db, "planejamento_aulas"), withSchoolScope({
      turma: document.getElementById("planTurma").value.trim(),
      faixa_etaria: document.getElementById("planFaixa").value.trim(),
      atividades: document.getElementById("planAtividades").value.trim(),
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "planejamento_aulas");
    showOk("okPlan");
  };

  document.getElementById("btnAnamnese").onclick = async () => {
    await addDoc(collection(db, "fichas_anamnese"), withSchoolScope({
      aluno: document.getElementById("anaAluno").value.trim(),
      alergias: document.getElementById("anaAlergias").value.trim(),
      restricoes: document.getElementById("anaRestricoes").value.trim(),
      historico_saude: document.getElementById("anaSaude").value.trim(),
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "fichas_anamnese");
    showOk("okAna");
  };

  document.getElementById("btnOcorrencia").onclick = async () => {
    await addDoc(collection(db, "ocorrencias"), withSchoolScope({
      aluno: document.getElementById("ocoAluno").value.trim(),
      tipo: document.getElementById("ocoTipo").value.trim(),
      descricao: document.getElementById("ocoDescricao").value.trim(),
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "ocorrencias");
    showOk("okOco");
  };

  document.getElementById("btnFrequencia").onclick = async () => {
    await addDoc(collection(db, "frequencia"), withSchoolScope({
      data: document.getElementById("freqData").value,
      turma: document.getElementById("freqTurma").value.trim(),
      aluno: document.getElementById("freqAluno").value.trim(),
      presente: document.getElementById("freqPresente").value === "sim",
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "frequencia");
    showOk("okFreq");
  };

  document.getElementById("btnCobranca").onclick = async () => {
    await addDoc(collection(db, "cobrancas"), withSchoolScope({
      aluno: document.getElementById("cobAluno").value.trim(),
      valor: Number(document.getElementById("cobValor").value || 0),
      vencimento: document.getElementById("cobVenc").value,
      metodo: document.getElementById("cobMetodo").value,
      status: document.getElementById("cobStatus").value,
      recorrente: document.getElementById("cobRec").checked,
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "cobrancas");
    showOk("okCob");
  };

  document.getElementById("btnRegua").onclick = async () => {
    await addDoc(collection(db, "regua_cobranca"), withSchoolScope({
      cobranca_ref: document.getElementById("reguaRef").value.trim(),
      canal: document.getElementById("reguaCanal").value,
      enviar_em: document.getElementById("reguaData").value,
      status: "agendado",
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "regua_cobranca");
    showOk("okRegua");
  };

  document.getElementById("btnExtra").onclick = async () => {
    await addDoc(collection(db, "extras_financeiros"), withSchoolScope({
      aluno: document.getElementById("extAluno").value.trim(),
      descricao: document.getElementById("extDesc").value.trim(),
      valor: Number(document.getElementById("extValor").value || 0),
      competencia: document.getElementById("extComp").value,
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "extras_financeiros");
    showOk("okExtra");
  };

  document.getElementById("btnCaixa").onclick = async () => {
    await addDoc(collection(db, "fluxo_caixa"), withSchoolScope({
      tipo: document.getElementById("caixaTipo").value,
      descricao: document.getElementById("caixaDesc").value.trim(),
      valor: Number(document.getElementById("caixaValor").value || 0),
      vencimento: document.getElementById("caixaVenc").value,
      numero_nota: document.getElementById("caixaNota").value.trim(),
      status: "aberto",
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "fluxo_caixa");
    showOk("okCaixa");
  };

  document.getElementById("btnMatricula").onclick = async () => {
    const aluno = document.getElementById("matAluno").value.trim();
    const responsavel = document.getElementById("matResp").value.trim();
    const turma = document.getElementById("matTurma").value.trim();
    const responsavelUid = document.getElementById("matRespUid").value.trim();
    const responsavelEmail = document.getElementById("matRespEmail").value.trim();
    const matriculaRef = await addDoc(collection(db, "matriculas"), withSchoolScope({
      aluno,
      responsavel,
      turma,
      responsavel_uid: responsavelUid || null,
      responsavel_email: responsavelEmail || null,
      documentos_url: document.getElementById("matDocUrl").value.trim(),
      contrato_assinado: document.getElementById("matContrato").checked,
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await setDoc(
      doc(db, "alunos", slugify(aluno)),
      withSchoolScope({
        nome: aluno,
        turma,
        responsavel_nome: responsavel,
        responsavel_uid: responsavelUid || null,
        responsavel_email: responsavelEmail || null,
        matricula_id: matriculaRef.id,
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }),
      { merge: true }
    );
    await audit("create", "matriculas");
    await audit("update", "alunos.vinculo_responsavel");
    showOk("okMat");
  };

  document.getElementById("btnProntuario").onclick = async () => {
    await addDoc(collection(db, "prontuarios"), withSchoolScope({
      aluno: document.getElementById("proAluno").value.trim(),
      tipo_documento: document.getElementById("proTipo").value.trim(),
      arquivo_url: document.getElementById("proArquivo").value.trim(),
      observacao: document.getElementById("proObs").value.trim(),
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "prontuarios");
    showOk("okPro");
  };

  document.getElementById("btnAcesso").onclick = async () => {
    if (!isSuperUser() && !["superadmin", "admin", "direcao"].includes(currentProfile.role || "")) {
      alert("Somente direcao/admin pode alterar permissoes.");
      return;
    }
    const uid = document.getElementById("accUid").value.trim();
    if (!uid) {
      alert("Informe o UID do usuario.");
      return;
    }
    await setDoc(
      doc(db, "usuarios", uid),
      {
        uid,
        role: document.getElementById("accRole").value,
        escola_id: document.getElementById("accEscola")?.value.trim() || currentSchoolId() || "escola-padrao",
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      },
      { merge: true }
    );
    await audit("update", "usuarios.role");
    showOk("okAcesso");
  };

  document.getElementById("btnTurma").onclick = async () => {
    await addDoc(collection(db, "turmas"), withSchoolScope({
      nome: document.getElementById("turmaNome").value.trim(),
      faixa_etaria: document.getElementById("turmaFaixa").value.trim(),
      limite_alunos: Number(document.getElementById("turmaLimite").value || 0),
      professor_uid: document.getElementById("turmaProf").value.trim(),
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "turmas");
    showOk("okTurma");
  };

  document.getElementById("btnPortaria").onclick = async () => {
    await addDoc(collection(db, "portaria_retiradas"), withSchoolScope({
      aluno: document.getElementById("porAluno").value.trim(),
      retirado_por: document.getElementById("porRetirado").value.trim(),
      parentesco: document.getElementById("porParentesco").value.trim(),
      rg: document.getElementById("porRg").value.trim(),
      foto_url: document.getElementById("porFoto").value.trim(),
      validado_por: auth.currentUser.uid,
      created_at: serverTimestamp()
    }));
    await audit("create", "portaria_retiradas");
    showOk("okPortaria");
  };

  document.getElementById("btnLgpd").onclick = async () => {
    await addDoc(collection(db, "lgpd_consentimentos"), withSchoolScope({
      aluno: document.getElementById("lgpdAluno").value.trim(),
      responsavel: document.getElementById("lgpdResp").value.trim(),
      escopo: document.getElementById("lgpdEscopo").value.trim(),
      versao: "1.0",
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "lgpd_consentimentos");
    showOk("okLgpd");
  };
}

function attachLists() {
  const agendaQuery = currentProfile.role === "responsavel"
    ? scopedCollectionQuery("agenda_diaria", [where("responsavel_uid", "==", auth.currentUser.uid), limit(20)])
    : scopedCollectionQuery("agenda_diaria", [limit(40)]);
  const offAgenda = onSnapshot(agendaQuery, (snap) => {
    const list = document.getElementById("listAgenda");
    list.innerHTML = "";
    if (snap.empty) {
      list.innerHTML = "<p class=\"small\">Sem agendas registradas.</p>";
      setSelectedAgenda(null, null);
      return;
    }
    const docs = snap.docs
      .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }))
      .sort((left, right) => String(right.data.data || "").localeCompare(String(left.data.data || "")));
    const familyAgendaCount = document.getElementById("familyAgendaCount");
    const familyUnreadCount = document.getElementById("familyUnreadCount");
    if (familyAgendaCount) {
      familyAgendaCount.textContent = `Agendas disponiveis: ${docs.length}`;
    }
    if (familyUnreadCount) {
      familyUnreadCount.textContent = `Leituras pendentes: ${docs.filter((item) => !item.data.lido_em).length}`;
    }
    docs.forEach(({ id, data }) => {
      const item = renderItem(
        `${data.aluno || "Aluno"} - ${data.data || "sem data"}`,
        [
          `Turma: ${data.turma || "-"}`,
          `Status: ${data.status || "rascunho"}`,
          `Alimentacao: ${data.alimentacao?.status || "-"}`,
          `Sono: ${data.sono?.qualidade || "-"}`,
          `Familia leu: ${data.lido_em ? "sim" : "nao"}`,
          `Resposta: ${data.resposta_responsavel || "sem retorno"}`
        ],
        data.updated_at || data.created_at
      );
      if (selectedAgendaId === id) {
        item.classList.add("active");
      }
      item.onclick = () => {
        fillAgendaForm(data);
        setSelectedAgenda(id, data);
        Array.from(list.children).forEach((child) => child.classList.remove("active"));
        item.classList.add("active");
      };
      list.appendChild(item);
      if (!selectedAgendaId) {
        setSelectedAgenda(id, data);
      }
    });
  });
  detachListeners.push(offAgenda);

  const agendaEventQueryBase = currentProfile.role === "responsavel"
    ? scopedCollectionQuery("agenda_eventos", [where("responsavel_uid", "==", auth.currentUser.uid), limit(30)])
    : scopedCollectionQuery("agenda_eventos", [limit(60)]);
  const offAgendaEvents = onSnapshot(agendaEventQueryBase, (snap) => {
    if (snap.empty) {
      cachedAgendaEvents = [];
      renderAgendaEventsList();
      return;
    }
    cachedAgendaEvents = snap.docs
      .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }))
      .sort((left, right) => String(formatDate(right.data.created_at)).localeCompare(String(formatDate(left.data.created_at))));
    renderAgendaEventsList();
  });
  detachListeners.push(offAgendaEvents);

  attachList("mural_avisos", "listMural", (_, data) =>
    renderItem(data.titulo || "Aviso", [`Tipo: ${data.tipo || "-"}`, data.texto || "Sem texto"], data.created_at)
  );

  attachList("chat_mensagens", "listChat", (_, data) =>
    renderItem(`${data.de_email || "usuario"} > ${data.para || "canal"}`, [data.mensagem || "Sem mensagem"], data.created_at)
  );

  attachList("galeria_fotos", "listGaleria", (_, data) =>
    renderItem(
      `Galeria - ${data.aluno_turma || "sem turma"}`,
      [`URL: ${data.foto_url || "-"}`, `Legenda: ${data.legenda || "-"}`],
      data.created_at
    )
  );
  attachList("autorizacoes_digitais", "listAutorizacoes", (_, data) =>
    renderItem(
      `Autorizacao - ${data.aluno || "sem aluno"}`,
      [`Tipo: ${data.tipo || "-"}`, `Terceiro: ${data.terceiro_autorizado || "-"}`],
      data.created_at
    )
  );

  attachList("relatorios_bncc", "listRelatoriosBncc", (_, data) =>
    renderItem(
      `Relatorio BNCC - ${data.aluno || "aluno"}`,
      [`Campo: ${data.campo_bncc || "-"}`, data.avaliacao || "Sem avaliacao"],
      data.created_at
    )
  );
  attachList("planejamento_aulas", "listPlanejamento", (_, data) =>
    renderItem(
      `Planejamento - ${data.turma || "turma"}`,
      [`Faixa: ${data.faixa_etaria || "-"}`, data.atividades || "Sem atividades"],
      data.created_at
    )
  );

  attachList("fichas_anamnese", "listAnamnese", (_, data) =>
    renderItem(
      `Anamnese - ${data.aluno || "aluno"}`,
      [`Alergias: ${data.alergias || "-"}`, `Restricoes: ${data.restricoes || "-"}`],
      data.created_at
    )
  );
  attachList("ocorrencias", "listOcorrencias", (_, data) =>
    renderItem(`Ocorrencia - ${data.aluno || "aluno"}`, [`Tipo: ${data.tipo || "-"}`, data.descricao || "Sem descricao"], data.created_at)
  );
  attachList("frequencia", "listFrequencia", (_, data) =>
    renderItem(`Frequencia - ${data.aluno || "aluno"}`, [`Data: ${data.data || "-"}`, `Presente: ${data.presente ? "sim" : "nao"}`], data.created_at)
  );

  attachList("cobrancas", "listCobrancas", (_, data) =>
    renderItem(
      `Cobranca - ${data.aluno || "aluno"}`,
      [`Valor: ${money(data.valor)}`, `Vencimento: ${data.vencimento || "-"}`, `Status: ${data.status || "-"}`],
      data.created_at
    )
  );
  attachList("regua_cobranca", "listRegua", (_, data) =>
    renderItem(
      `Regua - ref ${data.cobranca_ref || "-"}`,
      [`Canal: ${data.canal || "-"}`, `Envio: ${data.enviar_em || "-"}`, `Status: ${data.status || "-"}`],
      data.created_at
    )
  );

  attachList("extras_financeiros", "listExtras", (_, data) =>
    renderItem(
      `Extra - ${data.aluno || "aluno"}`,
      [`${data.descricao || "-"}`, `Valor: ${money(data.valor)}`, `Competencia: ${data.competencia || "-"}`],
      data.created_at
    )
  );
  attachList("fluxo_caixa", "listCaixa", (_, data) =>
    renderItem(
      `Caixa - ${data.tipo || "-"}`,
      [`${data.descricao || "-"}`, `Valor: ${money(data.valor)}`, `Nota: ${data.numero_nota || "-"}`],
      data.created_at
    )
  );

  attachList("matriculas", "listMatriculas", (_, data) =>
    renderItem(
      `Matricula - ${data.aluno || "aluno"}`,
      [
        `Responsavel: ${data.responsavel || "-"}`,
        `UID responsavel: ${data.responsavel_uid || "-"}`,
        `Turma: ${data.turma || "-"}`,
        `Contrato assinado: ${data.contrato_assinado ? "sim" : "nao"}`
      ],
      data.created_at
    )
  );
  attachList("alunos", "listAlunos", (_, data) =>
    renderItem(
      `Aluno - ${data.nome || "aluno"}`,
      [
        `Turma: ${data.turma || "-"}`,
        `Responsavel: ${data.responsavel_nome || "-"}`,
        `UID vinculado: ${data.responsavel_uid || "-"}`
      ],
      data.updated_at || data.created_at
    )
  );
  attachList("prontuarios", "listProntuarios", (_, data) =>
    renderItem(`Prontuario - ${data.aluno || "aluno"}`, [`Tipo: ${data.tipo_documento || "-"}`, `Arquivo: ${data.arquivo_url || "-"}`], data.created_at)
  );

  attachList(
    "usuarios",
    "listUsuarios",
    (id, data) => renderItem(`Usuario - ${data.email || id}`, [`UID: ${id}`, `Perfil: ${data.role || "-"}`], data.updated_at || data.created_at),
    { orderByField: "updated_at" }
  );
  attachList("turmas", "listTurmas", (_, data) =>
    renderItem(`Turma - ${data.nome || "-"}`, [`Faixa: ${data.faixa_etaria || "-"}`, `Limite: ${data.limite_alunos || 0}`], data.created_at)
  );

  attachList("portaria_retiradas", "listPortaria", (_, data) =>
    renderItem(
      `Retirada - ${data.aluno || "aluno"}`,
      [`Por: ${data.retirado_por || "-"}`, `RG: ${data.rg || "-"}`, `Parentesco: ${data.parentesco || "-"}`],
      data.created_at
    )
  );
  attachList("lgpd_consentimentos", "listLgpd", (_, data) =>
    renderItem(`LGPD - ${data.aluno || "aluno"}`, [`Responsavel: ${data.responsavel || "-"}`, `Escopo: ${data.escopo || "-"}`], data.created_at)
  );

  const qCob = scopedCollectionQuery("cobrancas", [limit(80)]);
  const offCob = onSnapshot(qCob, (snap) => {
    const hoje = new Date().toISOString().slice(0, 10);
    let inad = 0;
    snap.forEach((d) => {
      const item = d.data();
      if (item.status !== "pago" && item.vencimento && item.vencimento < hoje) {
        inad += 1;
      }
    });
    const kpiCobrancas = document.getElementById("kpiCobrancas");
    if (kpiCobrancas) {
      kpiCobrancas.textContent = `Inadimplencia: ${inad}`;
    }
  });
  detachListeners.push(offCob);

  const qCaixa = scopedCollectionQuery("fluxo_caixa", [limit(120)]);
  const offCaixa = onSnapshot(qCaixa, (snap) => {
    let saldo = 0;
    snap.forEach((d) => {
      const item = d.data();
      if (item.tipo === "receber") {
        saldo += Number(item.valor || 0);
      } else {
        saldo -= Number(item.valor || 0);
      }
    });
    const kpiCaixa = document.getElementById("kpiCaixa");
    if (kpiCaixa) {
      kpiCaixa.textContent = `Saldo caixa: ${money(saldo)}`;
    }
  });
  detachListeners.push(offCaixa);
}

function attachKpiOnly() {
  const qCob = scopedCollectionQuery("cobrancas", [limit(80)]);
  const offCob = onSnapshot(qCob, (snap) => {
    const hoje = new Date().toISOString().slice(0, 10);
    let inad = 0;
    snap.forEach((d) => {
      const item = d.data();
      if (item.status !== "pago" && item.vencimento && item.vencimento < hoje) {
        inad += 1;
      }
    });
    const kpiCobrancas = document.getElementById("kpiCobrancas");
    if (kpiCobrancas) {
      kpiCobrancas.textContent = `Inadimplencia: ${inad}`;
    }
  });
  detachListeners.push(offCob);

  const qCaixa = scopedCollectionQuery("fluxo_caixa", [limit(120)]);
  const offCaixa = onSnapshot(qCaixa, (snap) => {
    let saldo = 0;
    snap.forEach((d) => {
      const item = d.data();
      if (item.tipo === "receber") {
        saldo += Number(item.valor || 0);
      } else {
        saldo -= Number(item.valor || 0);
      }
    });
    const kpiCaixa = document.getElementById("kpiCaixa");
    if (kpiCaixa) {
      kpiCaixa.textContent = `Saldo caixa: ${money(saldo)}`;
    }
  });
  detachListeners.push(offCaixa);
}

btnLogin.addEventListener("click", () => {
  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => {
      loginError.style.display = "none";
    })
    .catch(() => {
      loginError.textContent = "Erro ao fazer login. Verifique suas credenciais.";
      loginError.style.display = "block";
    });
});

btnLogout.addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  clearListeners();
  if (!user) {
    loginScreen.style.display = "flex";
    dashboardScreen.style.display = "none";
    emailInput.value = "";
    passwordInput.value = "";
    return;
  }

  try {
    await ensureUserProfile(user);
    if (!isSuperUser() && !currentSchoolId()) {
      throw new Error("Usuario sem escola vinculada. Defina escola_id no perfil.");
    }
    if (userDisplay) {
      userDisplay.textContent = `Ola, ${user.email}`;
    }
    if (userRole) {
      const schoolLabel = currentSchoolId() || "sem escola";
      userRole.textContent = `Perfil: ${currentProfile.role || "coordenacao"} | Escola: ${schoolLabel}`;
    }
    loginScreen.style.display = "none";
    dashboardScreen.style.display = "block";
    attachUiHandlers();
    attachLists();
    applyRoleLayout();
    await audit("login", "auth");
  } catch (error) {
    console.error(error);
    alert("Erro ao carregar perfil e modulos. Verifique as regras do Firestore.");
  }
});
