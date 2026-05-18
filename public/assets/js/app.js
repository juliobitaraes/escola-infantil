import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";
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
  setDoc,
  deleteDoc,
  deleteField
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVPjBwXLM2gfN_TXffajP5hNqkcRF3nws",
  authDomain: "escola-infantil-edu.firebaseapp.com",
  projectId: "escola-infantil-edu",
  storageBucket: "escola-infantil-edu.appspot.com",
  messagingSenderId: "1049810439266",
  appId: "1:1049810439266:web:4cdd5af8dd78116e0c953b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "southamerica-east1");
const criarDiretorEscolaFn = httpsCallable(functions, "criarDiretorEscola");
const criarUsuarioEscolaFn = httpsCallable(functions, "criarUsuarioEscola");
const resetDiretorSenhaFn = httpsCallable(functions, "resetDiretorSenha");
const setDiretorStatusFn = httpsCallable(functions, "setDiretorStatus");
const criarResponsavelDeMatriculaFn = httpsCallable(functions, "criarResponsavelDeMatricula");
const migrarResponsaveisUsuariosFn = httpsCallable(functions, "migrarResponsaveisUsuarios");
const SUPERUSER_EMAIL = "julio.bitaraes.mail@gmail.com";
const STORAGE_UPLOAD_FUNCTION_URL = "https://uploadmatriculadocumento-ry5gli47hq-rj.a.run.app";
const STORAGE_DELETE_FUNCTION_URL = "https://deletematriculadocumento-ry5gli47hq-rj.a.run.app";
const STORAGE_SERVE_FUNCTION_URL = "https://southamerica-east1-escola-infantil-edu.cloudfunctions.net/serveMatriculaDocumento";

const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginError = document.getElementById("loginError");
const userDisplay = document.getElementById("userDisplay");
const userRole = document.getElementById("userRole");
const schoolHeaderName = document.getElementById("schoolHeaderName");
const familyDashboard = document.getElementById("familyDashboard");
const mainGrid = document.getElementById("mainGrid");

let detachListeners = [];
let currentProfile = { role: "coordenacao", escola_id: "escola-padrao" };
let selectedAgendaId = null;
let selectedAgendaData = null;
let cachedAgendaEvents = [];
let selectedSchoolId = null;
let selectedDirectorId = null;
let cachedSchools = [];
let cachedDirectors = [];
let cachedUsers = [];
let cachedStudents = [];
let cachedEnrollments = [];
let cachedFaixasEtarias = [];
let cachedTurmas = [];
let matriculaCameraStream = null;
let capturedMatriculaPhotoFile = null;
let capturedMatriculaPhotoPreviewUrl = null;
let pendingMatriculaDocumentos = [];
let pendingProntuarioDocumentos = [];
let prontuarioPreviewRequestId = 0;
let editingMatriculaId = null;
let editingLgpdConsentId = null;
let editingBnccReportId = null;
let editingAnamneseId = null;
let selectedAnamneseId = null;
let cachedAnamneseRecords = [];
let cachedFinanceTransactions = [];
let editingFinanceId = null;
let financeSortState = { field: "data", dir: "desc" };
let reguaChatProcessorTimer = null;

const LGPD_NOTICE_MESSAGE = [
  "Comunicado Importante: Proteção de Imagem dos Nossos Alunos",
  "Prezadas famílias,",
  "Para garantirmos um ambiente seguro e em total conformidade com a LGPD, lembramos que a captura de imagens em nossa escola infantil exige cuidados especiais.",
  "Durante nossas festas e apresentações, pedimos a colaboração de todos para que fotografem e filmem exclusivamente os seus próprios filhos. Caso a imagem de outra criança apareça ao fundo da sua foto, solicitamos que não a publique nas redes sociais ou utilize ferramentas para desfocar o rosto dos demais alunos.",
  "A escola mantém um controle rigoroso de autorizações de imagem e contamos com a parceria de vocês para proteger a privacidade e a infância de todos os nossos pequenos.",
  "Atenciosamente,",
  "Direção Escolar"
].join("\n\n");

const AGENDA_STATUS_LABELS = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  corrigido: "Corrigido",
  leitura_confirmada: "Leitura confirmada"
};

const CHAT_ROLE_TARGETS = ["direcao", "secretaria", "coordenacao"];
const CHAT_ROLE_LABELS = {
  direcao: "Direcao",
  secretaria: "Secretaria",
  coordenacao: "Coordenacao"
};

const BNCC_MATRIZ = {
  EI01: [
    { campo: "O eu, o outro e o nos", codigo: "EI01EO01", desc: "Perceber que suas acoes tem efeito nas outras criancas e nos adultos." },
    { campo: "O eu, o outro e o nos", codigo: "EI01EO02", desc: "Perceber as possibilidades e os limites de seu corpo nas brincadeiras e interacoes." },
    { campo: "Corpo, gestos e movimentos", codigo: "EI01CG02", desc: "Experimentar as possibilidades corporais nas interacoes e brincadeiras em ambientes diversos." },
    { campo: "Corpo, gestos e movimentos", codigo: "EI01CG05", desc: "Utilizar os movimentos de preensao, encaixe e lancamento, ampliando suas habilidades motoras." },
    { campo: "Tracos, sons, cores e formas", codigo: "EI01TS01", desc: "Explorar sons produzidos com o proprio corpo e com objetos do ambiente." },
    { campo: "Escuta, fala, pensamento e imaginacao", codigo: "EI01EF01", desc: "Reconhecer quando e chamado por seu nome e centrar a atencao quando interpelado." },
    { campo: "Escuta, fala, pensamento e imaginacao", codigo: "EI01EF06", desc: "Comunicar-se com outras pessoas usando gestos, balbucios, palavras e expressoes." },
    { campo: "Espacos, tempos, quantidades", codigo: "EI01ET01", desc: "Explorar e descobrir as propriedades de objetos e materiais (odor, cor, sabor, temperatura)." },
    { campo: "Espacos, tempos, quantidades", codigo: "EI01ET05", desc: "Manipular objetos e brinquedos de diferentes formas, texturas e tamanhos." }
  ],
  EI02: [
    { campo: "O eu, o outro e o nos", codigo: "EI02EO01", desc: "Demonstrar atitudes de cuidado e solidariedade na interacao com criancas e adultos." },
    { campo: "O eu, o outro e o nos", codigo: "EI02EO04", desc: "Comunicar-se com os colegas e os adultos, buscando compreende-los e fazendo-se compreender." },
    { campo: "Corpo, gestos e movimentos", codigo: "EI02CG01", desc: "Deslocar-se no espaco com destreza ao correr, pular, saltar, dancar, escorregar e girar." },
    { campo: "Corpo, gestos e movimentos", codigo: "EI02CG05", desc: "Desenvolver progressivamente as habilidades manuais, adquirindo controle para desenhar, pintar, rasgar e folhear." },
    { campo: "Tracos, sons, cores e formas", codigo: "EI02TS02", desc: "Utilizar materiais variados com possibilidades de manipulacao, explorando cores, texturas, superficies e planos." },
    { campo: "Escuta, fala, pensamento e imaginacao", codigo: "EI02EF01", desc: "Dialogar com criancas e adultos, expressando desejos, necessidades, sentimentos e ideias." },
    { campo: "Escuta, fala, pensamento e imaginacao", codigo: "EI02EF05", desc: "Relatar fatos acontecidos, historias ouvidas e vivencias cotidianas em sequencia temporal." },
    { campo: "Espacos, tempos, quantidades", codigo: "EI02ET05", desc: "Classificar objetos, considerando determinado atributo (tamanho, peso, cor e forma)." },
    { campo: "Espacos, tempos, quantidades", codigo: "EI02ET07", desc: "Contar oralmente objetos, pessoas e livros em contextos diversos." }
  ],
  EI03: [
    { campo: "O eu, o outro e o nos", codigo: "EI03EO01", desc: "Demonstrar empatia pelos outros, percebendo sentimentos, necessidades e formas de agir diferentes." },
    { campo: "O eu, o outro e o nos", codigo: "EI03EO04", desc: "Comunicar suas ideias e sentimentos a pessoas e grupos diversos." },
    { campo: "Corpo, gestos e movimentos", codigo: "EI03CG02", desc: "Demonstrar controle e adequacao do uso do corpo em jogos, brincadeiras, danca e atividades artisticas." },
    { campo: "Corpo, gestos e movimentos", codigo: "EI03CG05", desc: "Coordenar habilidades manuais no atendimento de necessidades cotidianas." },
    { campo: "Tracos, sons, cores e formas", codigo: "EI03TS02", desc: "Expressar-se por meio de desenho, pintura, colagem, dobradura e escultura." },
    { campo: "Escuta, fala, pensamento e imaginacao", codigo: "EI03EF01", desc: "Expressar ideias, desejos e sentimentos por meio da linguagem oral e escrita espontanea." },
    { campo: "Escuta, fala, pensamento e imaginacao", codigo: "EI03EF03", desc: "Escolher e folhear livros, orientando-se por temas e ilustracoes e tentando identificar palavras conhecidas." },
    { campo: "Escuta, fala, pensamento e imaginacao", codigo: "EI03EF06", desc: "Produzir narrativas orais e textos escritos (escrita espontanea), tendo o professor como escriba." },
    { campo: "Espacos, tempos, quantidades", codigo: "EI03ET05", desc: "Classificar objetos e figuras de acordo com suas propriedades cognitivas." },
    { campo: "Espacos, tempos, quantidades", codigo: "EI03ET07", desc: "Relacionar numeros as respectivas quantidades e identificar antes, depois e entre em sequencias." }
  ]
};

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isSuperUser() {
  const authEmail = auth.currentUser ? normalizeEmail(auth.currentUser.email) : "";
  const profileEmail = normalizeEmail(currentProfile.email);
  return authEmail === SUPERUSER_EMAIL || profileEmail === SUPERUSER_EMAIL;
}

function isSuperAdmin() {
  return isSuperUser();
}

function normalizeAgendaStatus(value) {
  return Object.prototype.hasOwnProperty.call(AGENDA_STATUS_LABELS, value) ? value : "rascunho";
}

function agendaStatusLabel(value) {
  return AGENDA_STATUS_LABELS[normalizeAgendaStatus(value)];
}

const REGUA_AUTOMATICA_ETAPAS = [
  { codigo: "pre_vencimento_3d", label: "3 dias antes do vencimento", offsetDias: -3 },
  { codigo: "dia_vencimento", label: "No dia do vencimento", offsetDias: 0 },
  { codigo: "atraso_3d", label: "3 dias em atraso", offsetDias: 3 },
  { codigo: "atraso_7d", label: "7 dias em atraso", offsetDias: 7 }
];

const FINANCE_CATEGORIES = {
  receita: ["Mensalidade", "Matricula", "Material Escolar", "Uniforme", "Colonia de Ferias/Eventos", "Outras Receitas"],
  despesa: ["Salarios/Professores", "Alimentacao/Cantina", "Manutencao/Limpeza", "Aluguel/Agua/Luz", "Brinquedos/Pedagogico", "Impostos/Contador"]
};

function setAgendaStatusField(value) {
  const agendaStatus = document.getElementById("agendaStatus");
  if (!agendaStatus) return;
  agendaStatus.value = normalizeAgendaStatus(value);
  agendaStatus.disabled = true;
}

function formatDateOnlyBr(isoDate) {
  if (!isoDate) return "-";
  const [year, month, day] = String(isoDate).split("-").map(Number);
  if (!year || !month || !day) return String(isoDate);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function addDaysToIsoDate(isoDate, offsetDays) {
  const [year, month, day] = String(isoDate || "").split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Number(offsetDays || 0));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildReguaMessage(etapaCodigo, cobrancaData, linkBoleto) {
  const aluno = String(cobrancaData?.aluno || "familia").trim() || "familia";
  const valorLabel = money(Number(cobrancaData?.valor || 0));
  const vencimento = formatDateOnlyBr(cobrancaData?.vencimento || "");
  const linkLabel = String(linkBoleto || "").trim();
  const linhaLink = linkLabel
    ? ` Atualize o boleto aqui: ${linkLabel}`
    : " Entre em contato com a secretaria para atualizacao do boleto.";

  if (etapaCodigo === "pre_vencimento_3d") {
    return `Aviso amigavel: a mensalidade de ${aluno}, no valor de ${valorLabel}, vence em ${vencimento}.`;
  }
  if (etapaCodigo === "dia_vencimento") {
    return `Confirmacao de vencimento: hoje e o vencimento da mensalidade de ${aluno} (${valorLabel}).`;
  }
  if (etapaCodigo === "atraso_3d") {
    return `Lembrete: a mensalidade de ${aluno} esta com 3 dias de atraso.${linhaLink}`;
  }
  return `Importante: a mensalidade de ${aluno} esta com 7 dias de atraso. Podemos seguir com renegociacao antes do envio para cobranca.${linhaLink}`;
}

async function gerarReguaAutomaticaParaCobranca({ cobrancaId, canal, linkBoleto }) {
  const cobrancaSnap = await getDoc(doc(db, "cobrancas", cobrancaId));
  if (!cobrancaSnap.exists()) {
    throw new Error("Cobranca nao encontrada para o ID informado.");
  }

  const cobrancaData = cobrancaSnap.data() || {};
  const vencimento = String(cobrancaData.vencimento || "").trim();
  if (!vencimento) {
    throw new Error("A cobranca selecionada nao possui data de vencimento.");
  }

  const cobrancaStatus = String(cobrancaData.status || "").trim().toLowerCase();
  if (cobrancaStatus === "pago") {
    throw new Error("A cobranca ja esta paga. Nao e necessario gerar regua.");
  }

  for (const etapa of REGUA_AUTOMATICA_ETAPAS) {
    const enviarEm = addDaysToIsoDate(vencimento, etapa.offsetDias);
    const mensagem = buildReguaMessage(etapa.codigo, cobrancaData, linkBoleto);
    const docId = slugify(`${cobrancaId}-${canal}-${etapa.codigo}`) || `${Date.now()}-${etapa.codigo}`;
    await setDoc(doc(db, "regua_cobranca", docId), withSchoolScope({
      cobranca_ref: cobrancaId,
      aluno: cobrancaData.aluno || "",
      valor: Number(cobrancaData.valor || 0),
      vencimento,
      canal,
      etapa_codigo: etapa.codigo,
      etapa_label: etapa.label,
      mensagem,
      enviar_em: enviarEm,
      status: "agendado",
      updated_at: serverTimestamp(),
      updated_by: auth.currentUser.uid,
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }), { merge: true });
  }
}

async function resolveReguaChatRecipient(cobrancaData) {
  const uidDireto = String(cobrancaData?.responsavel_uid || "").trim();
  if (uidDireto) {
    return {
      uid: uidDireto,
      nome: String(cobrancaData?.responsavel_nome || cobrancaData?.responsavel || uidDireto).trim() || uidDireto
    };
  }

  const alunoNome = String(cobrancaData?.aluno || "").trim();
  if (!alunoNome) return null;

  const alunoSnap = await getDocs(scopedCollectionQuery("alunos", [where("nome", "==", alunoNome), limit(1)]));
  if (alunoSnap.empty) return null;
  const alunoData = alunoSnap.docs[0].data() || {};
  const uid = String(alunoData.responsavel_uid || "").trim();
  if (!uid) return null;

  return {
    uid,
    nome: String(alunoData.responsavel_nome || alunoData.responsavel || uid).trim() || uid
  };
}

async function processarReguaAutomaticaNoChat() {
  if (!auth.currentUser || isFamilyOnlyRole()) return;

  const hojeIso = todayString();
  const reguaSnap = await getDocs(scopedCollectionQuery("regua_cobranca", [where("status", "==", "agendado"), limit(300)]));
  if (reguaSnap.empty) return;

  const pendentes = reguaSnap.docs
    .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() || {} }))
    .filter((row) => {
      const enviarEm = String(row.data.enviar_em || "").trim();
      return Boolean(enviarEm) && enviarEm <= hojeIso;
    })
    .sort((a, b) => String(a.data.enviar_em || "").localeCompare(String(b.data.enviar_em || "")));

  for (const row of pendentes) {
    const reguaRef = doc(db, "regua_cobranca", row.id);
    const cobrancaRef = String(row.data.cobranca_ref || "").trim();
    if (!cobrancaRef) {
      await setDoc(reguaRef, withSchoolScope({
        status: "erro_sem_cobranca",
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }), { merge: true });
      continue;
    }

    const cobrancaSnap = await getDoc(doc(db, "cobrancas", cobrancaRef));
    if (!cobrancaSnap.exists()) {
      await setDoc(reguaRef, withSchoolScope({
        status: "erro_cobranca_nao_encontrada",
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }), { merge: true });
      continue;
    }

    const cobrancaData = cobrancaSnap.data() || {};
    if (String(cobrancaData.status || "").trim().toLowerCase() === "pago") {
      await setDoc(reguaRef, withSchoolScope({
        status: "cancelado_pago",
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }), { merge: true });
      continue;
    }

    const recipient = await resolveReguaChatRecipient(cobrancaData);
    if (!recipient?.uid) {
      await setDoc(reguaRef, withSchoolScope({
        status: "erro_sem_destinatario",
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }), { merge: true });
      continue;
    }

    const chatMessageId = `regua-${row.id}`;
    const chatRef = doc(db, "chat_mensagens", chatMessageId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, withSchoolScope({
        para: recipient.nome,
        para_scope: "uid",
        para_uid: recipient.uid,
        para_role: null,
        mensagem: String(row.data.mensagem || "Lembrete financeiro").trim() || "Lembrete financeiro",
        de_uid: auth.currentUser.uid,
        de_email: auth.currentUser.email,
        de_nome: "Sistema Financeiro",
        de_role: "sistema",
        read_by: {
          [auth.currentUser.uid]: new Date().toISOString()
        },
        origem: "regua_automatica",
        origem_ref: row.id,
        updated_at: serverTimestamp(),
        created_at: serverTimestamp(),
        created_by: auth.currentUser.uid
      }), { merge: true });
      await audit("create", "chat_mensagens.regua_automatica");
    }

    await setDoc(reguaRef, withSchoolScope({
      status: "enviado_chat",
      chat_message_id: chatMessageId,
      enviado_em: serverTimestamp(),
      updated_at: serverTimestamp(),
      updated_by: auth.currentUser.uid
    }), { merge: true });
    await audit("update", "regua_cobranca.enviado_chat");
  }
}

function atualizarStatusProcessadorRegua({ tipo = "idle", mensagem = "", ultimaExecucao = null }) {
  const statusEl = document.getElementById("reguaProcessorStatus");
  const lastRunEl = document.getElementById("reguaProcessorLastRun");

  if (statusEl) {
    statusEl.classList.remove("ok", "processing", "error");
    if (tipo === "ok") statusEl.classList.add("ok");
    if (tipo === "processing") statusEl.classList.add("processing");
    if (tipo === "error") statusEl.classList.add("error");
    statusEl.textContent = mensagem || "Processador automatico: sem status.";
  }

  if (lastRunEl && ultimaExecucao instanceof Date) {
    lastRunEl.textContent = `Ultima execucao: ${ultimaExecucao.toLocaleString("pt-BR")}`;
  }
}

async function executarProcessadorReguaNoChat() {
  atualizarStatusProcessadorRegua({
    tipo: "processing",
    mensagem: "Processador automatico: executando varredura de disparos..."
  });

  try {
    await processarReguaAutomaticaNoChat();
    atualizarStatusProcessadorRegua({
      tipo: "ok",
      mensagem: "Processador automatico: ativo e monitorando cobrancas.",
      ultimaExecucao: new Date()
    });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "erro inesperado";
    atualizarStatusProcessadorRegua({
      tipo: "error",
      mensagem: `Processador automatico: erro na execucao (${errorMessage}).`,
      ultimaExecucao: new Date()
    });
  }
}

function iniciarProcessadorReguaNoChat() {
  if (isFamilyOnlyRole()) {
    atualizarStatusProcessadorRegua({
      tipo: "idle",
      mensagem: "Processador automatico: indisponivel para perfil responsavel."
    });
    return;
  }

  executarProcessadorReguaNoChat();

  if (reguaChatProcessorTimer) {
    clearInterval(reguaChatProcessorTimer);
    reguaChatProcessorTimer = null;
  }

  // Reprocessa periodicamente para nao depender de refresh da pagina.
  reguaChatProcessorTimer = setInterval(() => {
    executarProcessadorReguaNoChat();
  }, 60 * 1000);

  detachListeners.push(() => {
    if (reguaChatProcessorTimer) {
      clearInterval(reguaChatProcessorTimer);
      reguaChatProcessorTimer = null;
      atualizarStatusProcessadorRegua({
        tipo: "idle",
        mensagem: "Processador automatico: pausado."
      });
    }
  });
}

async function atualizarReguaPorStatusCobranca({ cobrancaId, status, linkBoleto = "" }) {
  const cobrancaRef = String(cobrancaId || "").trim();
  if (!cobrancaRef) return;

  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (normalizedStatus === "pago") {
    const reguaSnap = await getDocs(scopedCollectionQuery("regua_cobranca", [where("cobranca_ref", "==", cobrancaRef), limit(120)]));
    for (const docSnap of reguaSnap.docs) {
      const data = docSnap.data() || {};
      if (String(data.status || "").trim().toLowerCase() !== "agendado") continue;
      await setDoc(doc(db, "regua_cobranca", docSnap.id), withSchoolScope({
        status: "cancelado_pago",
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }), { merge: true });
    }
    return;
  }

  await gerarReguaAutomaticaParaCobranca({
    cobrancaId: cobrancaRef,
    canal: "app",
    linkBoleto: String(linkBoleto || "").trim()
  });
}

function initAnamneseStepper() {
  const wizard = document.getElementById("anamneseWizard");
  if (!wizard) return;

  const steps = Array.from(wizard.querySelectorAll(".anamnese-form-step"));
  const tabs = Array.from(wizard.querySelectorAll(".anamnese-step-tab"));
  const btnPrev = document.getElementById("btnAnaPrev");
  const btnSubmit = document.getElementById("btnAnamnese");

  if (!steps.length || !tabs.length || !btnPrev || !btnSubmit) return;

  let currentStep = 0;

  const updateButtons = () => {
    btnPrev.style.display = currentStep === 0 ? "none" : "inline-block";
    btnSubmit.style.display = "inline-block";
  };

  const showStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    steps[currentStep].classList.remove("active");
    tabs[currentStep].classList.remove("active");

    currentStep = stepIndex;

    steps[currentStep].classList.add("active");
    tabs[currentStep].classList.add("active");
    updateButtons();
  };

  tabs.forEach((tab, index) => {
    tab.onclick = () => {
      const value = Number(tab.dataset.step);
      showStep(Number.isNaN(value) ? index : value);
    };
  });

  btnPrev.onclick = () => showStep(currentStep - 1);
  showStep(0);
}

function getAnamneseFieldIds() {
  return [
    "nome_aluno",
    "data_nascimento",
    "genero",
    "nome_mae",
    "tel_mae",
    "nome_pai",
    "tel_pai",
    "gestacao_planejada",
    "tipo_parto",
    "intercorrencias_gravidez",
    "tempo_gestacao",
    "peso_nascimento",
    "problemas_nascimento",
    "idade_sustentou_cabeca",
    "idade_andou",
    "equilibrio",
    "lateralidade",
    "desenvolvimento_fala",
    "vacinas",
    "desfralde",
    "diagnostico_medico",
    "especialistas",
    "alergias_graves",
    "restricoes_alimentares",
    "pais_juntos",
    "irmaos",
    "sono_qualidade",
    "tempo_telas",
    "comportamento_frustracao",
    "obs_finais"
  ];
}

function readAnamneseField(id) {
  const element = document.getElementById(id);
  return element ? String(element.value || "").trim() : "";
}

function setAnamneseField(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.value = value == null ? "" : String(value);
}

function setAnamneseEditMode(anamneseId) {
  editingAnamneseId = anamneseId || null;
  const saveButton = document.getElementById("btnAnamnese");
  const cancelButton = document.getElementById("btnAnamneseCancelar");
  if (saveButton) {
    saveButton.textContent = editingAnamneseId ? "Atualizar Anamnese" : "Salvar Anamnese Completa";
  }
  if (cancelButton) {
    cancelButton.classList.toggle("hidden", !editingAnamneseId);
  }
}

function setAnamneseReadOnlyMode(enabled) {
  const wizard = document.getElementById("anamneseWizard");
  if (!wizard) return;
  wizard.querySelectorAll("input, select, textarea").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    if (element.id === "btnAnamnesePrint") return;
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.readOnly = enabled;
      element.disabled = enabled;
    }
    if (element instanceof HTMLSelectElement) {
      element.disabled = enabled;
    }
  });
}

function applyAnamneseAccessLayout() {
  const familyOnly = isFamilyOnlyRole();
  const saveButton = document.getElementById("btnAnamnese");
  const cancelButton = document.getElementById("btnAnamneseCancelar");
  const filters = document.getElementById("anamneseStaffFilters");

  if (saveButton) saveButton.style.display = familyOnly ? "inline-block" : "none";
  if (cancelButton) cancelButton.classList.add("hidden");
  if (filters) filters.classList.toggle("hidden", familyOnly);

  if (!familyOnly) {
    setAnamneseEditMode(null);
  }
  setAnamneseReadOnlyMode(!familyOnly);
}

function clearAnamneseForm() {
  const form = document.getElementById("anamneseForm");
  if (form instanceof HTMLFormElement) {
    form.reset();
  }
  selectedAnamneseId = null;
  setAnamneseEditMode(null);
}

function resolveAnamneseStudentByName(nomeAluno) {
  const normalized = String(nomeAluno || "").trim().toLowerCase();
  if (!normalized) return null;
  return cachedStudents.find(({ data }) => String(data?.nome || "").trim().toLowerCase() === normalized) || null;
}

function buildAnamnesePayload() {
  const nomeAluno = readAnamneseField("nome_aluno");
  const alunoEntry = resolveAnamneseStudentByName(nomeAluno);
  const diagnostico = readAnamneseField("diagnostico_medico");
  const especialistas = readAnamneseField("especialistas");
  const problemasNascimento = readAnamneseField("problemas_nascimento");
  return {
    aluno: nomeAluno,
    aluno_id: alunoEntry?.id || "",
    turma: String(alunoEntry?.data?.turma || "").trim(),
    responsavel_uid: isFamilyOnlyRole() ? auth.currentUser?.uid || "" : readAnamneseField("responsavel_uid"),
    alergias: readAnamneseField("alergias_graves"),
    restricoes: readAnamneseField("restricoes_alimentares"),
    historico_saude: [diagnostico, especialistas, problemasNascimento].filter(Boolean).join(" | "),
    nome_aluno: nomeAluno,
    data_nascimento: readAnamneseField("data_nascimento"),
    genero: readAnamneseField("genero"),
    nome_mae: readAnamneseField("nome_mae"),
    tel_mae: readAnamneseField("tel_mae"),
    nome_pai: readAnamneseField("nome_pai"),
    tel_pai: readAnamneseField("tel_pai"),
    gestacao_planejada: readAnamneseField("gestacao_planejada"),
    tipo_parto: readAnamneseField("tipo_parto"),
    intercorrencias_gravidez: readAnamneseField("intercorrencias_gravidez"),
    tempo_gestacao: readAnamneseField("tempo_gestacao"),
    peso_nascimento: readAnamneseField("peso_nascimento"),
    problemas_nascimento: problemasNascimento,
    idade_sustentou_cabeca: readAnamneseField("idade_sustentou_cabeca"),
    idade_andou: readAnamneseField("idade_andou"),
    equilibrio: readAnamneseField("equilibrio"),
    lateralidade: readAnamneseField("lateralidade"),
    desenvolvimento_fala: readAnamneseField("desenvolvimento_fala"),
    vacinas: readAnamneseField("vacinas"),
    desfralde: readAnamneseField("desfralde"),
    diagnostico_medico: diagnostico,
    especialistas,
    alergias_graves: readAnamneseField("alergias_graves"),
    restricoes_alimentares: readAnamneseField("restricoes_alimentares"),
    pais_juntos: readAnamneseField("pais_juntos"),
    irmaos: readAnamneseField("irmaos"),
    sono_qualidade: readAnamneseField("sono_qualidade"),
    tempo_telas: readAnamneseField("tempo_telas"),
    comportamento_frustracao: readAnamneseField("comportamento_frustracao"),
    obs_finais: readAnamneseField("obs_finais")
  };
}

function anamnesePrintStyles() {
  return `
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      line-height: 1.45;
    }
    .print-wrap {
      max-width: 900px;
      margin: 0 auto;
    }
    .print-head {
      border-bottom: 2px solid #0f766e;
      margin-bottom: 14px;
      padding-bottom: 10px;
    }
    .print-head h1 {
      margin: 0;
      color: #0f766e;
      font-size: 21px;
    }
    .print-head p {
      margin: 4px 0 0;
      color: #374151;
      font-size: 12px;
    }
    .print-step {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 12px;
      margin: 0 0 12px;
      page-break-inside: avoid;
    }
    .print-step h2 {
      margin: 0 0 10px;
      color: #0f766e;
      font-size: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }
    .print-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 12px;
    }
    .print-field {
      margin-bottom: 6px;
    }
    .print-field.full {
      grid-column: 1 / -1;
    }
    .print-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .print-value {
      min-height: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .print-signatures {
      margin-top: 22px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      page-break-inside: avoid;
    }
    .print-signature {
      text-align: center;
      padding-top: 24px;
    }
    .print-signature-line {
      border-top: 1px solid #111827;
      margin-bottom: 6px;
      height: 1px;
    }
    .print-signature-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #374151;
    }
    .print-footer-note {
      margin-top: 18px;
      font-size: 10px;
      color: #6b7280;
      text-align: center;
    }
  `;
}

function buildAnamnesePrintSection(title, fields) {
  const fieldsHtml = fields
    .map((field) => {
      const rawValue = readAnamneseField(field.id);
      const safeValue = escapeHtml(rawValue || "-");
      const fullClass = field.full ? " full" : "";
      return `
        <div class="print-field${fullClass}">
          <span class="print-label">${escapeHtml(field.label)}</span>
          <div class="print-value">${safeValue}</div>
        </div>
      `;
    })
    .join("");

  return `<section class="print-step"><h2>${escapeHtml(title)}</h2><div class="print-grid">${fieldsHtml}</div></section>`;
}

function printAnamneseForm() {
  const printWindow = window.open("", "_blank", "width=1100,height=850");
  if (!printWindow) {
    alert("O navegador bloqueou a janela de impressao. Permita pop-ups e tente novamente.");
    return;
  }

  const generatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date());

  const sectionsHtml = [
    buildAnamnesePrintSection("1. Identificacao", [
      { id: "nome_aluno", label: "Nome completo da crianca", full: true },
      { id: "data_nascimento", label: "Data de nascimento" },
      { id: "genero", label: "Genero" },
      { id: "nome_mae", label: "Nome da mae/responsavel 1" },
      { id: "tel_mae", label: "Telefone da mae" },
      { id: "nome_pai", label: "Nome do pai/responsavel 2" },
      { id: "tel_pai", label: "Telefone do pai" }
    ]),
    buildAnamnesePrintSection("2. Gestacao e Nascimento", [
      { id: "gestacao_planejada", label: "Gestacao planejada" },
      { id: "tipo_parto", label: "Tipo de parto" },
      { id: "intercorrencias_gravidez", label: "Intercorrencias na gravidez", full: true },
      { id: "tempo_gestacao", label: "Tempo de gestacao (semanas)" },
      { id: "peso_nascimento", label: "Peso ao nascer (gramas)" },
      { id: "problemas_nascimento", label: "Complicacoes ao nascer", full: true }
    ]),
    buildAnamnesePrintSection("3. Desenvolvimento", [
      { id: "idade_sustentou_cabeca", label: "Idade que sustentou a cabeca" },
      { id: "idade_andou", label: "Idade que comecou a andar" },
      { id: "equilibrio", label: "Equilibrio" },
      { id: "lateralidade", label: "Lateralidade" },
      { id: "desenvolvimento_fala", label: "Desenvolvimento da fala", full: true }
    ]),
    buildAnamnesePrintSection("4. Saude", [
      { id: "vacinas", label: "Carteira de vacinacao em dia" },
      { id: "desfralde", label: "Desfralde" },
      { id: "diagnostico_medico", label: "Diagnostico clinico/deficiencia", full: true },
      { id: "especialistas", label: "Acompanhamento com especialistas", full: true },
      { id: "alergias_graves", label: "Alergias graves" },
      { id: "restricoes_alimentares", label: "Restricoes/intolerancias alimentares" }
    ]),
    buildAnamnesePrintSection("5. Rotina e Familia", [
      { id: "pais_juntos", label: "Pais residem juntos" },
      { id: "irmaos", label: "Irmaos" },
      { id: "sono_qualidade", label: "Qualidade do sono" },
      { id: "tempo_telas", label: "Tempo de telas" },
      { id: "comportamento_frustracao", label: "Reacao a frustracao", full: true },
      { id: "obs_finais", label: "Observacoes finais", full: true }
    ])
  ].join("");

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Anamnese - Impressao</title>
        <style>${anamnesePrintStyles()}</style>
      </head>
      <body>
        <div class="print-wrap">
          <header class="print-head">
            <h1>Ficha de Anamnese Completa</h1>
            <p>Educacao Infantil • Registro Pedagogico e de Saude • Gerado em ${escapeHtml(generatedAt)}</p>
          </header>
          ${sectionsHtml}
          <section class="print-signatures" aria-label="Assinaturas">
            <div class="print-signature">
              <div class="print-signature-line"></div>
              <div class="print-signature-label">Assinatura do Responsavel</div>
            </div>
            <div class="print-signature">
              <div class="print-signature-line"></div>
              <div class="print-signature-label">Assinatura da Escola / Professor(a)</div>
            </div>
          </section>
          <div class="print-footer-note">Documento para conferencia e assinatura fisica.</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  const triggerPrint = () => {
    printWindow.print();
    printWindow.close();
  };

  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 120);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 120);
  }
}

function loadAnamneseForEdit(anamneseId, data) {
  if (!anamneseId || !data) return;
  selectedAnamneseId = anamneseId;
  getAnamneseFieldIds().forEach((fieldId) => {
    if (fieldId === "nome_aluno") {
      setAnamneseField(fieldId, data[fieldId] || data.aluno || "");
      return;
    }
    if (fieldId === "alergias_graves") {
      setAnamneseField(fieldId, data[fieldId] || data.alergias || "");
      return;
    }
    if (fieldId === "restricoes_alimentares") {
      setAnamneseField(fieldId, data[fieldId] || data.restricoes || "");
      return;
    }
    setAnamneseField(fieldId, data[fieldId] || "");
  });
  if (isFamilyOnlyRole()) {
    setAnamneseEditMode(anamneseId);
  } else {
    setAnamneseEditMode(null);
  }
}

async function deleteAnamnese(anamneseId) {
  if (!anamneseId) return;
  if (!confirm("Excluir esta anamnese?")) return;
  await deleteDoc(doc(db, "fichas_anamnese", anamneseId));
  await audit("delete", "fichas_anamnese");
  if (editingAnamneseId === anamneseId || selectedAnamneseId === anamneseId) {
    clearAnamneseForm();
    applyAnamneseAccessLayout();
  }
}

function renderAnamneseItem(id, data) {
  const familyOnly = isFamilyOnlyRole();
  const actions = familyOnly
    ? '<span class="lgpd-actions"><button type="button" class="anamnese-edit-btn">Editar</button><button type="button" class="anamnese-delete-btn">Excluir</button><button type="button" class="anamnese-print-btn">Imprimir</button></span>'
    : '<span class="lgpd-actions"><button type="button" class="anamnese-view-btn">Abrir ficha</button><button type="button" class="anamnese-delete-btn">Excluir</button><button type="button" class="anamnese-print-btn">Imprimir</button></span>';
  const div = renderItem(
    `Anamnese - ${data.nome_aluno || data.aluno || "aluno"}`,
    [
      actions,
      `Turma: ${data.turma || "Sem turma"}`,
      `Alergias: ${data.alergias_graves || data.alergias || "-"}`,
      `Restricoes: ${data.restricoes_alimentares || data.restricoes || "-"}`,
      `Vacinacao: ${data.vacinas || "-"}`
    ],
    data.updated_at || data.created_at
  );
  div.dataset.anamneseId = id;
  if (selectedAnamneseId === id) {
    div.classList.add("anamnese-item-active");
  }
  return div;
}

function normalizeAnamneseTurma(data) {
  const turma = String(data?.turma || "").trim();
  return turma || "Sem turma";
}

function getAnamneseFilters() {
  const filtroNome = String(document.getElementById("anaFiltroNome")?.value || "").trim().toLowerCase();
  const filtroTurma = String(document.getElementById("anaFiltroTurma")?.value || "").trim().toLowerCase();
  return { filtroNome, filtroTurma };
}

function populateAnamneseTurmaFilterOptions() {
  const select = document.getElementById("anaFiltroTurma");
  if (!select) return;
  const previous = select.value;
  const turmaSet = new Set();
  cachedTurmas.forEach(({ data }) => {
    const turmaNome = String(data?.nome || "").trim();
    if (turmaNome) turmaSet.add(turmaNome);
  });
  cachedAnamneseRecords.forEach(({ data }) => {
    turmaSet.add(normalizeAnamneseTurma(data));
  });

  const turmas = Array.from(turmaSet).filter(Boolean).sort((a, b) => a.localeCompare(b));
  select.innerHTML = '<option value="">Todas as turmas</option>';
  turmas.forEach((turma) => {
    const option = document.createElement("option");
    option.value = turma;
    option.textContent = turma;
    select.appendChild(option);
  });
  if (previous && turmas.includes(previous)) {
    select.value = previous;
  }
}

function renderAnamneseList() {
  const list = document.getElementById("listAnamnese");
  if (!list) return;

  const rowsBase = cachedAnamneseRecords
    .slice()
    .sort((left, right) => {
      const leftRef = left.data?.updated_at || left.data?.created_at;
      const rightRef = right.data?.updated_at || right.data?.created_at;
      const leftTs = leftRef && typeof leftRef.toDate === "function" ? leftRef.toDate().getTime() : 0;
      const rightTs = rightRef && typeof rightRef.toDate === "function" ? rightRef.toDate().getTime() : 0;
      return rightTs - leftTs;
    });

  list.innerHTML = "";
  if (!rowsBase.length) {
    list.innerHTML = '<p class="small">Sem registros ainda.</p>';
    return;
  }

  if (isFamilyOnlyRole()) {
    rowsBase.forEach((row) => list.appendChild(renderAnamneseItem(row.id, row.data)));
    return;
  }

  const { filtroNome, filtroTurma } = getAnamneseFilters();
  const rows = rowsBase.filter((row) => {
    const nome = String(row.data?.nome_aluno || row.data?.aluno || row.data?.dependente || "").trim().toLowerCase();
    const turma = normalizeAnamneseTurma(row.data).toLowerCase();
    const matchNome = !filtroNome || nome.includes(filtroNome);
    const matchTurma = !filtroTurma || turma === filtroTurma;
    return matchNome && matchTurma;
  });

  if (!rows.length) {
    list.innerHTML = '<p class="small">Nenhuma ficha encontrada para os filtros informados.</p>';
    return;
  }

  const selectedRow = rows.find((row) => row.id === selectedAnamneseId) || rows[0];
  if (selectedRow) {
    loadAnamneseForEdit(selectedRow.id, selectedRow.data || {});
    applyAnamneseAccessLayout();
  }
  const selectedTurma = selectedRow ? normalizeAnamneseTurma(selectedRow.data) : "";

  const groups = new Map();
  rows.forEach((row) => {
    const turma = normalizeAnamneseTurma(row.data);
    if (!groups.has(turma)) groups.set(turma, []);
    groups.get(turma).push(row);
  });

  Array.from(groups.keys()).sort((a, b) => a.localeCompare(b)).forEach((turma) => {
    const wrapper = document.createElement("section");
    wrapper.className = turma === selectedTurma ? "anamnese-group" : "anamnese-group collapsed";

    const header = document.createElement("button");
    header.type = "button";
    header.className = "anamnese-group-header";
    header.textContent = `Turma: ${turma} (${groups.get(turma).length})`;

    const body = document.createElement("div");
    body.className = "anamnese-group-body";
    groups.get(turma).forEach((row) => body.appendChild(renderAnamneseItem(row.id, row.data)));

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    list.appendChild(wrapper);
  });
}

function getCachedAnamneseById(anamneseId) {
  return cachedAnamneseRecords.find((row) => row.id === anamneseId) || null;
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

function setSelectedSchool(id, data) {
  selectedSchoolId = id || null;
  const fields = ["schoolId", "schoolName", "schoolCity", "schoolStatus"];
  if (!id || !data) {
    fields.forEach((fieldId) => {
      const element = document.getElementById(fieldId);
      if (element) element.value = "";
    });
    return;
  }
  const mappings = {
    schoolId: data.escola_id || id || "",
    schoolName: data.nome || "",
    schoolCity: data.cidade || "",
    schoolStatus: data.status || "ativa"
  };
  Object.entries(mappings).forEach(([fieldId, value]) => {
    const element = document.getElementById(fieldId);
    if (element) element.value = value;
  });
}

function setSelectedDirector(id, data) {
  selectedDirectorId = id || null;
  const fields = ["directorUid", "directorName", "directorEmail", "directorSchoolId", "directorTempPassword", "directorStatus"];
  if (!id || !data) {
    fields.forEach((fieldId) => {
      const element = document.getElementById(fieldId);
      if (element) element.value = "";
    });
    const status = document.getElementById("directorStatus");
    if (status) status.value = "ativo";
    return;
  }
  const mappings = {
    directorUid: id,
    directorName: data.nome || "",
    directorEmail: data.email || "",
    directorSchoolId: data.escola_id || "",
    directorTempPassword: "",
    directorStatus: data.status || "ativo"
  };
  Object.entries(mappings).forEach(([fieldId, value]) => {
    const element = document.getElementById(fieldId);
    if (element) element.value = value;
  });
}

function clearSchoolForm() {
  setSelectedSchool(null, null);
}

function clearDirectorForm() {
  setSelectedDirector(null, null);
}

function populateDirectorSchoolOptions() {
  const schoolSelect = document.getElementById("directorSchoolId");
  if (!schoolSelect) return;

  const previousValue = schoolSelect.value;
  const rows = cachedSchools
    .map(({ id, data }) => {
      const schoolId = data.escola_id || id;
      const schoolName = data.nome || schoolId;
      return { id: schoolId, name: schoolName };
    })
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  schoolSelect.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Selecione a escola vinculada";
  schoolSelect.appendChild(placeholderOption);

  rows.forEach((row) => {
    const option = document.createElement("option");
    option.value = row.id;
    option.textContent = `${row.name} (${row.id})`;
    schoolSelect.appendChild(option);
  });

  if (previousValue) {
    const hasOption = rows.some((row) => row.id === previousValue);
    if (!hasOption) {
      const fallbackOption = document.createElement("option");
      fallbackOption.value = previousValue;
      fallbackOption.textContent = previousValue;
      schoolSelect.appendChild(fallbackOption);
    }
    schoolSelect.value = previousValue;
  }
}

function populateAccUserOptions() {
  const userSelect = document.getElementById("accUserSelect");
  if (!userSelect) return;

  const previousValue = userSelect.value;
  const users = cachedUsers
    .map(({ id, data }) => ({ id, email: data.email || id, nome: data.nome || "", role: data.role || "-" }))
    .sort((a, b) => String(a.email).localeCompare(String(b.email)));

  userSelect.innerHTML = "<option value=\"\">Selecione o usuario</option>";
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.nome || user.email} (${user.role})`;
    userSelect.appendChild(option);
  });

  if (previousValue && users.some((user) => user.id === previousValue)) {
    userSelect.value = previousValue;
  }
}

function populateProfessorOptions() {
  const professorSelect = document.getElementById("turmaProf");
  if (!professorSelect) return;

  const previousValue = professorSelect.value;
  const allowedRoles = new Set(["professor", "coordenacao", "direcao"]);
  const professors = cachedUsers
    .filter(({ data }) => allowedRoles.has(data.role || ""))
    .map(({ id, data }) => ({ id, nome: data.nome || "", email: data.email || id, role: data.role || "-" }))
    .sort((a, b) => String(a.nome || a.email).localeCompare(String(b.nome || b.email)));

  professorSelect.innerHTML = "<option value=\"\">Selecione o professor responsavel</option>";
  professors.forEach((professor) => {
    const option = document.createElement("option");
    option.value = professor.id;
    option.textContent = `${professor.nome || professor.email} (${professor.role})`;
    professorSelect.appendChild(option);
  });

  if (previousValue && professors.some((professor) => professor.id === previousValue)) {
    professorSelect.value = previousValue;
  }
}

function chatRoleLabel(role) {
  return CHAT_ROLE_LABELS[String(role || "").trim()] || String(role || "").trim() || "-";
}

function populateChatTurmaFilterOptions() {
  const turmaSelect = document.getElementById("chatTurmaFiltro");
  if (!(turmaSelect instanceof HTMLSelectElement)) return;

  if (isFamilyOnlyRole()) {
    turmaSelect.classList.add("hidden");
    turmaSelect.value = "";
    return;
  }

  turmaSelect.classList.remove("hidden");
  const previousValue = turmaSelect.value;
  const turmas = Array.from(
    new Set(
      cachedStudents
        .map(({ data }) => String(data.turma || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => String(a).localeCompare(String(b)));

  turmaSelect.innerHTML = "<option value=\"\">Todas as turmas</option>";
  turmas.forEach((turma) => {
    const option = document.createElement("option");
    option.value = turma;
    option.textContent = turma;
    turmaSelect.appendChild(option);
  });

  if (previousValue && turmas.includes(previousValue)) {
    turmaSelect.value = previousValue;
  }
}

function populateChatRecipientOptions() {
  const paraSelect = document.getElementById("chatPara");
  if (!(paraSelect instanceof HTMLSelectElement)) return;
  const turmaSelect = document.getElementById("chatTurmaFiltro");
  const selectedTurma = turmaSelect instanceof HTMLSelectElement ? String(turmaSelect.value || "").trim() : "";

  const previousValue = paraSelect.value;
  paraSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecione o destinatario";
  paraSelect.appendChild(placeholder);

  if (isFamilyOnlyRole()) {
    CHAT_ROLE_TARGETS.forEach((roleName) => {
      const option = document.createElement("option");
      option.value = roleName;
      option.textContent = chatRoleLabel(roleName);
      option.dataset.scope = "role";
      option.dataset.role = roleName;
      option.dataset.label = chatRoleLabel(roleName);
      paraSelect.appendChild(option);
    });
    if (previousValue && CHAT_ROLE_TARGETS.includes(previousValue)) {
      paraSelect.value = previousValue;
    }
    return;
  }

  const responsaveis = new Map();
  cachedStudents.forEach(({ data }) => {
    const turma = String(data.turma || "").trim();
    if (selectedTurma && turma !== selectedTurma) return;
    const uid = String(data.responsavel_uid || "").trim();
    const nome = String(data.responsavel_nome || data.responsavel || "").trim();
    if (!uid) return;
    if (!responsaveis.has(uid)) {
      responsaveis.set(uid, {
        uid,
        nome: nome || uid,
        turmas: new Set()
      });
    }
    if (turma) {
      responsaveis.get(uid).turmas.add(turma);
    }
  });

  const rows = Array.from(responsaveis.values()).sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
  rows.forEach((row) => {
    const turmasLabel = Array.from(row.turmas).sort((a, b) => String(a).localeCompare(String(b))).join(", ");
    const option = document.createElement("option");
    option.value = row.uid;
    option.textContent = turmasLabel ? `${row.nome} (${turmasLabel})` : row.nome;
    option.dataset.scope = "uid";
    option.dataset.uid = row.uid;
    option.dataset.label = row.nome;
    paraSelect.appendChild(option);
  });

  if (previousValue && rows.some((row) => row.uid === previousValue)) {
    paraSelect.value = previousValue;
  }
}

function canCurrentUserReadChatMessage(data) {
  const myUid = auth.currentUser?.uid || "";
  if (!myUid) return false;
  if (String(data.de_uid || "") === myUid) return true;

  const paraUid = String(data.para_uid || "").trim();
  if (paraUid) {
    return paraUid === myUid;
  }

  const paraRole = String(data.para_role || "").trim();
  if (paraRole) {
    return paraRole === String(currentProfile.role || "").trim();
  }

  // Mantem mensagens antigas sem roteamento explicito visiveis.
  return true;
}

function renderChatMessageItem(id, data) {
  const div = document.createElement("div");
  div.className = "item chat-item";

  const sender = String(data.de_nome || data.de_email || "usuario").trim() || "usuario";
  const targetLabel = String(data.para || "").trim() || (data.para_role ? chatRoleLabel(data.para_role) : "destinatario");
  const readBy = data.read_by && typeof data.read_by === "object" ? data.read_by : {};
  const myUid = auth.currentUser?.uid || "";
  const isReadByMe = Boolean(readBy[myUid]);
  const totalReads = Object.keys(readBy).length;

  if (!isReadByMe) {
    div.classList.add("chat-unread");
  }

  const leituraButton = isReadByMe
    ? ""
    : `<button type="button" class="chat-read-btn" data-chat-id="${escapeHtml(id)}">Confirmar leitura</button>`;
  const mensagem = escapeHtml(String(data.mensagem || "Sem mensagem")).replace(/\n/g, "<br>");

  div.innerHTML = `
    <strong>${escapeHtml(sender)}</strong>
    <div class="line">Para: ${escapeHtml(targetLabel)}</div>
    <div class="line">${mensagem}</div>
    <div class="line">Leituras confirmadas: ${totalReads}</div>
    <div class="line">Seu status: ${isReadByMe ? "lida" : "pendente"} ${leituraButton}</div>
    <p class="small">${formatDate(data.created_at)}</p>
  `;
  return div;
}

async function markChatMessageAsRead(chatMessageId) {
  if (!chatMessageId || !auth.currentUser) return;

  const ref = doc(db, "chat_mensagens", chatMessageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() || {};
  const currentReadBy = data.read_by && typeof data.read_by === "object" ? data.read_by : {};
  if (currentReadBy[auth.currentUser.uid]) return;

  await setDoc(
    ref,
    withSchoolScope({
      read_by: {
        ...currentReadBy,
        [auth.currentUser.uid]: new Date().toISOString()
      },
      updated_at: serverTimestamp()
    }),
    { merge: true }
  );
  await audit("update", "chat_mensagens.leitura");
}

function updateChatUnreadBadge(rows) {
  const badge = document.getElementById("chatUnreadBadge");
  if (!badge) return;
  const myUid = auth.currentUser?.uid || "";
  const unread = (Array.isArray(rows) ? rows : []).filter((row) => {
    if (String(row.data.de_uid || "") === myUid) return false;
    const readBy = row.data.read_by && typeof row.data.read_by === "object" ? row.data.read_by : {};
    return !Boolean(readBy[myUid]);
  }).length;
  badge.textContent = String(unread);
  badge.classList.toggle("hidden", unread <= 0);
}

function bnccStatusLabel(value) {
  if (value === "D") return "Desenvolvido (D)";
  if (value === "ND") return "Nao Desenvolvido (ND)";
  return "Em Desenvolvimento (EM)";
}

function buildBnccPrintableTableRowsHtml() {
  const tbody = document.getElementById("bnccTabelaCorpo");
  if (!tbody) return "";

  const rows = Array.from(tbody.querySelectorAll("tr"));
  return rows.map((row) => {
    if (row.classList.contains("bncc-group-row")) {
      const field = String(row.querySelector("td")?.textContent || "").trim();
      return `<tr class="field-group-row"><td colspan="4">${escapeHtml(field)}</td></tr>`;
    }

    const codigo = String(row.dataset.codigo || "").trim();
    const descricao = String(row.dataset.descricao || "").trim();
    const status = row.querySelector("[data-bncc-status]")?.value || "EM";
    const evidencia = String(row.querySelector("[data-bncc-evidencia]")?.value || "").trim();
    const intervencao = String(row.querySelector("[data-bncc-intervencao]")?.value || "").trim();

    const objectiveCell = `${escapeHtml(codigo)}${descricao ? `<br>${escapeHtml(descricao)}` : ""}`;
    return `
      <tr>
        <td>${objectiveCell}</td>
        <td>${escapeHtml(bnccStatusLabel(status))}</td>
        <td>${escapeHtml(evidencia).replace(/\n/g, "<br>")}</td>
        <td>${escapeHtml(intervencao).replace(/\n/g, "<br>")}</td>
      </tr>
    `;
  }).join("");
}

function resolveBnccPrintMode(selectedMode) {
  const mode = String(selectedMode || "auto").trim().toLowerCase();
  if (mode === "compact" || mode === "read") return mode;

  const objectiveRows = Array.from(document.querySelectorAll("#bnccTabelaCorpo tr[data-bncc-item='1']"));
  let textSize = 0;
  objectiveRows.forEach((row) => {
    const desc = String(row.dataset.descricao || "").trim();
    const evidencia = String(row.querySelector("[data-bncc-evidencia]")?.value || "").trim();
    const intervencao = String(row.querySelector("[data-bncc-intervencao]")?.value || "").trim();
    textSize += desc.length + evidencia.length + intervencao.length;
  });

  if (objectiveRows.length >= 12 || textSize >= 3800) {
    return "compact";
  }
  return "read";
}

function bnccPrintStyleFor(modeName) {
  const mode = resolveBnccPrintMode(modeName);
  if (mode === "compact") {
    return {
      pageMargin: "10mm",
      colObj: "34%",
      colAva: "12%",
      colEvi: "27%",
      colInt: "27%",
      cellPadding: "5px 6px",
      fontSize: "9.4pt",
      lineHeight: "1.2"
    };
  }

  return {
    pageMargin: "14mm",
    colObj: "35%",
    colAva: "13%",
    colEvi: "26%",
    colInt: "26%",
    cellPadding: "7px 8px",
    fontSize: "10.2pt",
    lineHeight: "1.28"
  };
}

function printBnccTableOnly(modeName = "auto") {
  const rowsHtml = buildBnccPrintableTableRowsHtml();
  if (!rowsHtml.trim()) {
    alert("Nao foi possivel gerar a tabela BNCC para impressao.");
    return;
  }
  const printStyle = bnccPrintStyleFor(modeName);

  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) {
    alert("O navegador bloqueou a janela de impressao. Permita pop-ups e tente novamente.");
    return;
  }

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Ficha BNCC</title>
        <style>
          @page {
            size: A4 portrait;
            margin: ${printStyle.pageMargin};
          }
          html, body {
            margin: 0;
            padding: 0;
            font-family: "Segoe UI", "Arial", sans-serif;
            color: #111;
            background: #fff;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          col.col-obj { width: ${printStyle.colObj}; }
          col.col-ava { width: ${printStyle.colAva}; }
          col.col-evi { width: ${printStyle.colEvi}; }
          col.col-int { width: ${printStyle.colInt}; }
          th, td {
            border: 1px solid #333;
            padding: ${printStyle.cellPadding};
            font-size: ${printStyle.fontSize};
            line-height: ${printStyle.lineHeight};
            vertical-align: top;
            text-align: left;
            word-wrap: break-word;
            overflow-wrap: anywhere;
          }
          thead th {
            background: #f1f1f1;
            font-weight: 700;
          }
          tr {
            page-break-inside: avoid;
          }
          .field-group-row td {
            background: #e8eef7;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <table>
          <colgroup>
            <col class="col-obj">
            <col class="col-ava">
            <col class="col-evi">
            <col class="col-int">
          </colgroup>
          <thead>
            <tr>
              <th>Campo de experiencia / Objetivo</th>
              <th>Avaliacao</th>
              <th>Evidencias observadas</th>
              <th>Planejamento de intervencao</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  const triggerPrint = () => {
    printWindow.print();
    printWindow.close();
  };

  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 120);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 120);
  }
}

function currentPlanningTimestampLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function getPlanningEditor() {
  return document.getElementById("planEditor");
}

function getPlanningTemplateMarkup() {
  const template = document.getElementById("planEditorTemplate");
  return template instanceof HTMLTemplateElement ? template.innerHTML.trim() : "";
}

function resetPlanningEditor() {
  const editor = getPlanningEditor();
  const templateMarkup = getPlanningTemplateMarkup();
  if (!editor || !templateMarkup) return;
  editor.innerHTML = templateMarkup;
  syncPlanningInstitution();
  updatePlanningTimestamp();
}

function getPlanningRoleElement(roleName) {
  return document.querySelector(`[data-plan-role="${roleName}"]`);
}

function getPlanningRoleText(roleName) {
  return String(getPlanningRoleElement(roleName)?.textContent || "").trim();
}

function syncPlanningInstitution() {
  const institutionEl = getPlanningRoleElement("institution");
  if (!institutionEl) return;

  const schoolName = String(schoolHeaderName?.textContent || "").trim();
  const currentValue = String(institutionEl.textContent || "").trim();
  if (!schoolName || schoolName === "Carregando escola...") return;
  if (!currentValue || currentValue === "Nome da Escola" || currentValue === "Portal Escolar" || currentValue === "Carregando escola...") {
    institutionEl.textContent = schoolName;
  }
}

function updatePlanningTimestamp() {
  const timestampEl = getPlanningRoleElement("updated-at");
  if (!timestampEl) return;
  timestampEl.textContent = currentPlanningTimestampLabel();
}

function getPlanningSummaryText() {
  const editor = getPlanningEditor();
  if (!editor) return "";
  const text = String(editor.textContent || "").replace(/\s+/g, " ").trim();
  return text.slice(0, 220);
}

function planningPrintStyles() {
  return `
    :root {
      --planning-primary: #A2C2E8;
      --planning-secondary: #BCE7DC;
      --planning-accent: #F9E79F;
      --planning-bg: #FAFAFA;
      --planning-text: #4A4A4A;
      --planning-card-bg: #FFFFFF;
      --planning-pcd-bg: #FADBD8;
    }
    html, body {
      margin: 0;
      padding: 0;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      background: var(--planning-bg);
      color: var(--planning-text);
      line-height: 1.6;
    }
    .planning-surface {
      max-width: 1000px;
      margin: 24px auto;
      padding: 20px;
      box-sizing: border-box;
    }
    .planning-header {
      text-align: center;
      margin-bottom: 32px;
      border-bottom: 3px solid var(--planning-primary);
      padding-bottom: 20px;
    }
    .planning-header h1 {
      color: #5D8AA8;
      margin-bottom: 5px;
      font-weight: 600;
    }
    .planning-stage-section h2 {
      color: #4A6B82;
      border-bottom: 2px solid #E5E7E9;
      padding-bottom: 5px;
      margin-top: 0;
    }
    .planning-metas-section h3 {
      color: #D35400;
      margin-top: 0;
    }
    .planning-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      background: #EAF2F8;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 25px;
    }
    .planning-metas-section {
      background: #FEF9E7;
      border-left: 5px solid #F4D03F;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .planning-metas-list {
      margin: 0;
      padding-left: 20px;
    }
    .planning-metas-list li {
      margin-bottom: 8px;
    }
    .planning-stage-section {
      background: var(--planning-card-bg);
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 30px;
      border: 1px solid #E5E8E8;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
      page-break-inside: avoid;
    }
    .planning-bncc-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 15px 0;
    }
    .planning-badge {
      background: #F2F4F4;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 500;
      color: #566573;
      border: 1px solid #E5E7E9;
    }
    .planning-bncc-code {
      background: #FCF3CF;
      color: #B7950B;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9em;
      margin-left: 4px;
    }
    .planning-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .planning-table th,
    .planning-table td {
      border: 1px solid #E5E8E8;
      padding: 12px;
      text-align: left;
      vertical-align: top;
    }
    .planning-table th {
      background: #F8F9F9;
      width: 25%;
      color: #626567;
    }
    .planning-row-pcd th {
      background: #FADBD8 !important;
      color: #78281F;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .planning-row-pcd td {
      background: #FDEDEC !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .planning-footer {
      margin-top: 50px;
      border-top: 1px solid #E5E7E9;
      padding-top: 20px;
      text-align: center;
      font-size: 0.85em;
      color: #7F8C8D;
    }
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
  `;
}

function printPlanningEditor() {
  const editor = getPlanningEditor();
  if (!editor || !editor.innerHTML.trim()) {
    alert("Nao foi possivel gerar o planejamento para impressao.");
    return;
  }

  updatePlanningTimestamp();
  const printWindow = window.open("", "_blank", "width=1200,height=900");
  if (!printWindow) {
    alert("O navegador bloqueou a janela de impressao. Permita pop-ups e tente novamente.");
    return;
  }

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Planejamento Pedagogico</title>
        <style>${planningPrintStyles()}</style>
      </head>
      <body>${editor.innerHTML}</body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  const triggerPrint = () => {
    printWindow.print();
    printWindow.close();
  };

  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 120);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 120);
  }
}

function setBnccEditMode(reportId) {
  editingBnccReportId = reportId || null;
  const saveButton = document.getElementById("btnRelatorio");
  const cancelButton = document.getElementById("btnRelatorioCancelar");
  if (saveButton) {
    saveButton.textContent = editingBnccReportId ? "Atualizar relatorio" : "Salvar relatorio";
  }
  if (cancelButton) {
    cancelButton.classList.toggle("hidden", !editingBnccReportId);
  }
}

function applyBnccObjetivosToForm(objetivos) {
  const tableRows = Array.from(document.querySelectorAll("#bnccTabelaCorpo tr[data-bncc-item='1']"));
  const objetivosList = Array.isArray(objetivos) ? objetivos : [];
  const byCode = new Map();
  objetivosList.forEach((item) => {
    const code = String(item?.codigo || "").trim();
    if (code) byCode.set(code, item);
  });

  tableRows.forEach((row, index) => {
    const code = String(row.dataset.codigo || "").trim();
    const found = (code && byCode.get(code)) || objetivosList[index] || {};
    const statusField = row.querySelector("[data-bncc-status]");
    const evidenciaField = row.querySelector("[data-bncc-evidencia]");
    const intervencaoField = row.querySelector("[data-bncc-intervencao]");
    if (statusField) statusField.value = found.status || "EM";
    if (evidenciaField) evidenciaField.value = found.evidencia || "";
    if (intervencaoField) intervencaoField.value = found.intervencao || "";
  });
}

function loadBnccReportForEdit(reportId, data) {
  if (!reportId || !data) return;

  const relAluno = document.getElementById("relAluno");
  const relFaixa = document.getElementById("relFaixa");
  const relIdade = document.getElementById("relIdade");
  const relPeriodo = document.getElementById("relPeriodo");
  const relProfessor = document.getElementById("relProfessor");
  const relParecerGlobal = document.getElementById("relParecerGlobal");

  if (relAluno) relAluno.value = data.aluno_id || "";
  if (relFaixa) relFaixa.value = data.faixa_etaria || "EI03";
  renderBnccMatriz();
  applyBnccObjetivosToForm(data.objetivos || []);

  if (relIdade) relIdade.value = data.idade || "";
  if (relPeriodo) relPeriodo.value = data.periodo_letivo || "";
  if (relProfessor) relProfessor.value = data.professor || "";
  if (relParecerGlobal) relParecerGlobal.value = data.parecer_global || "";

  setBnccEditMode(reportId);
}

async function deleteBnccReport(reportId) {
  if (!reportId) return;
  if (!confirm("Excluir este relatorio BNCC?")) return;
  await deleteDoc(doc(db, "relatorios_bncc", reportId));
  await audit("delete", "relatorios_bncc");
  if (editingBnccReportId === reportId) {
    limparFormularioBncc(false);
  }
}

function renderBnccReportItem(id, data) {
  const div = renderItem(
    `Relatorio BNCC - ${data.aluno || "aluno"}`,
    [
      `<span class=\"lgpd-actions\"><button type=\"button\" class=\"bncc-edit-btn\" data-bncc-id=\"${escapeHtml(id)}\">Editar</button><button type=\"button\" class=\"bncc-delete-btn\" data-bncc-id=\"${escapeHtml(id)}\">Excluir</button></span>`,
      `Faixa: ${data.faixa_etaria || data.campo_bncc || "-"}`,
      `Objetivos: ${Array.isArray(data.objetivos) ? data.objetivos.length : 0}`,
      data.parecer_global || data.avaliacao || "Sem avaliacao"
    ],
    data.updated_at || data.created_at
  );
  div.dataset.bnccId = id;
  return div;
}

function populateFaixaEtariaOptions() {
  const faixaSelect = document.getElementById("turmaFaixa");
  if (!faixaSelect) return;

  const previousValue = faixaSelect.value;
  const faixas = cachedFaixasEtarias
    .map(({ id, data }) => ({ id, nome: data.nome || id, descricao: data.descricao || "" }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  faixaSelect.innerHTML = "<option value=\"\">Selecione a faixa etaria</option>";
  faixas.forEach((faixa) => {
    const option = document.createElement("option");
    option.value = faixa.id;
    option.textContent = faixa.nome + (faixa.descricao ? ` - ${faixa.descricao}` : "");
    faixaSelect.appendChild(option);
  });

  if (previousValue && faixas.some((faixa) => faixa.id === previousValue)) {
    faixaSelect.value = previousValue;
  }
}

function populateMatriculaTurmaOptions() {
  const turmaSelect = document.getElementById("matTurma");
  if (!turmaSelect) return;

  const previousValue = turmaSelect.value;
  const turmas = cachedTurmas
    .map(({ id, data }) => ({ id, nome: data.nome || id }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  turmaSelect.innerHTML = "<option value=\"\">Turma do aluno</option>";
  turmas.forEach((turma) => {
    const option = document.createElement("option");
    option.value = turma.nome;
    option.textContent = turma.nome;
    turmaSelect.appendChild(option);
  });

  if (previousValue && turmas.some((turma) => turma.nome === previousValue)) {
    turmaSelect.value = previousValue;
  }
}

function populatePlanTurmaOptions() {
  const turmaSelect = document.getElementById("planTurma");
  if (!turmaSelect) return;

  const previousValue = turmaSelect.value;
  const turmas = cachedTurmas
    .map(({ id, data }) => ({ id, nome: data.nome || id }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  turmaSelect.innerHTML = "<option value=\"\">Turma de referencia</option>";
  turmas.forEach((turma) => {
    const option = document.createElement("option");
    option.value = turma.nome;
    option.textContent = turma.nome;
    turmaSelect.appendChild(option);
  });

  if (previousValue && turmas.some((turma) => turma.nome === previousValue)) {
    turmaSelect.value = previousValue;
  }
}

function populatePlanFaixaOptions() {
  const faixaSelect = document.getElementById("planFaixa");
  if (!faixaSelect) return;

  const previousValue = faixaSelect.value;
  const faixas = cachedFaixasEtarias
    .map(({ id, data }) => ({ id, nome: data.nome || id, descricao: data.descricao || "" }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  faixaSelect.innerHTML = "<option value=\"\">Faixa etaria principal</option>";
  faixas.forEach((faixa) => {
    const option = document.createElement("option");
    option.value = faixa.id;
    option.textContent = faixa.nome + (faixa.descricao ? ` - ${faixa.descricao}` : "");
    faixaSelect.appendChild(option);
  });

  if (previousValue && faixas.some((faixa) => faixa.id === previousValue)) {
    faixaSelect.value = previousValue;
  }
}

function syncLgpdResponsavelFromAluno() {
  const alunoSelect = document.getElementById("lgpdAluno");
  const responsavelInput = document.getElementById("lgpdResp");
  if (!alunoSelect || !responsavelInput) return;

  const alunoId = alunoSelect.value;
  if (!alunoId) {
    responsavelInput.value = "";
    return;
  }

  const found = cachedStudents.find(({ id }) => id === alunoId);
  const data = found?.data || {};
  responsavelInput.value = data.responsavel_nome || data.responsavel || "";
}

function populateLgpdAlunoOptions() {
  const alunoSelect = document.getElementById("lgpdAluno");
  if (!alunoSelect) return;

  const previousValue = alunoSelect.value;
  const alunos = cachedStudents
    .map(({ id, data }) => ({
      id,
      nome: data.nome || id,
      turma: data.turma || ""
    }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  alunoSelect.innerHTML = "<option value=\"\">Selecione o aluno</option>";
  alunos.forEach((aluno) => {
    const option = document.createElement("option");
    option.value = aluno.id;
    option.textContent = aluno.turma ? `${aluno.nome} - ${aluno.turma}` : aluno.nome;
    alunoSelect.appendChild(option);
  });

  if (previousValue && alunos.some((aluno) => aluno.id === previousValue)) {
    alunoSelect.value = previousValue;
  }

  syncLgpdResponsavelFromAluno();
}

function populateGaleriaAlunoOptions() {
  const select = document.getElementById("galeriaAluno");
  if (!select) return;
  const previousValue = select.value;
  const alunos = cachedStudents
    .map(({ id, data }) => ({ id, nome: data.nome || id, turma: data.turma || "" }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
  select.innerHTML = "<option value=\"\">Selecione o aluno</option>";
  alunos.forEach((aluno) => {
    const option = document.createElement("option");
    option.value = aluno.id;
    option.textContent = aluno.turma ? `${aluno.nome} - ${aluno.turma}` : aluno.nome;
    select.appendChild(option);
  });
  if (previousValue && alunos.some((a) => a.id === previousValue)) select.value = previousValue;
}

function populateBnccAlunoOptions() {
  const alunoSelect = document.getElementById("relAluno");
  if (!alunoSelect) return;

  const previousValue = alunoSelect.value;
  const alunos = cachedStudents
    .map(({ id, data }) => ({ id, nome: data.nome || id, turma: data.turma || "" }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  alunoSelect.innerHTML = "<option value=\"\">Selecione o aluno</option>";
  alunos.forEach((aluno) => {
    const option = document.createElement("option");
    option.value = aluno.id;
    option.textContent = aluno.turma ? `${aluno.nome} - ${aluno.turma}` : aluno.nome;
    alunoSelect.appendChild(option);
  });

  if (previousValue && alunos.some((aluno) => aluno.id === previousValue)) {
    alunoSelect.value = previousValue;
  }
}

function renderBnccMatriz() {
  const faixaSelect = document.getElementById("relFaixa");
  const tbody = document.getElementById("bnccTabelaCorpo");
  if (!faixaSelect || !tbody) return;

  const faixa = faixaSelect.value || "EI03";
  const objetivos = BNCC_MATRIZ[faixa] || [];
  tbody.innerHTML = "";

  let campoAtual = "";
  objetivos.forEach((item, index) => {
    if (item.campo !== campoAtual) {
      campoAtual = item.campo;
      const groupRow = document.createElement("tr");
      groupRow.className = "bncc-group-row";
      groupRow.innerHTML = `<td colspan="4">${campoAtual}</td>`;
      tbody.appendChild(groupRow);
    }

    const row = document.createElement("tr");
    row.className = "bncc-objective-row";
    row.dataset.bnccItem = "1";
    row.dataset.codigo = item.codigo;
    row.dataset.campo = item.campo;
    row.dataset.descricao = item.desc;
    row.dataset.index = String(index);

    row.innerHTML = `
      <td>
        <span class="bncc-codigo">${item.codigo}</span>
        <div class="bncc-desc">${item.desc}</div>
      </td>
      <td>
        <select class="field" data-bncc-status>
          <option value="D">Desenvolvido (D)</option>
          <option value="EM" selected>Em Desenvolvimento (EM)</option>
          <option value="ND">Nao Desenvolvido (ND)</option>
        </select>
      </td>
      <td>
        <textarea class="field" rows="3" data-bncc-evidencia placeholder="Registre as acoes observadas"></textarea>
      </td>
      <td>
        <textarea class="field" rows="3" data-bncc-intervencao placeholder="Estrategias para desenvolvimento"></textarea>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function collectBnccObjetivos() {
  const tbody = document.getElementById("bnccTabelaCorpo");
  if (!tbody) return [];

  return Array.from(tbody.querySelectorAll("tr[data-bncc-item='1']")).map((row) => {
    const status = row.querySelector("[data-bncc-status]")?.value || "EM";
    const evidencia = row.querySelector("[data-bncc-evidencia]")?.value.trim() || "";
    const intervencao = row.querySelector("[data-bncc-intervencao]")?.value.trim() || "";
    return {
      codigo: row.dataset.codigo || "",
      campo: row.dataset.campo || "",
      descricao: row.dataset.descricao || "",
      status,
      evidencia,
      intervencao
    };
  });
}

function formatIdadeAluno(isoDate) {
  if (!isoDate) return "";
  const [ano, mes, dia] = isoDate.split("-").map(Number);
  if (!ano || !mes || !dia) return isoDate;
  const dataBr = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
  const hoje = new Date();
  let anos = hoje.getFullYear() - ano;
  let meses = hoje.getMonth() + 1 - mes;
  if (hoje.getDate() < dia) meses -= 1;
  if (meses < 0) { anos -= 1; meses += 12; }
  const parteAnos = anos > 0 ? `${anos} ${anos === 1 ? "ano" : "anos"}` : "";
  const parteMeses = meses > 0 ? `${meses} ${meses === 1 ? "mes" : "meses"}` : "";
  const idade = [parteAnos, parteMeses].filter(Boolean).join(" e ") || "menos de 1 mes";
  return `${dataBr} (${idade})`;
}

function syncBnccFromAluno() {
  const alunoId = document.getElementById("relAluno")?.value || "";
  if (!alunoId) return;

  const alunoEntry = cachedStudents.find(({ id }) => id === alunoId);
  const alunoData = alunoEntry?.data || {};
  const turmaNome = alunoData.turma || "";

  // Turma / Período letivo
  const relPeriodo = document.getElementById("relPeriodo");
  if (relPeriodo && !relPeriodo.value) relPeriodo.value = turmaNome;

  // Data de nascimento / Idade — formato BR com idade calculada
  const relIdade = document.getElementById("relIdade");
  if (relIdade && !relIdade.value && alunoData.data_nascimento) {
    relIdade.value = formatIdadeAluno(alunoData.data_nascimento);
  }

  // Professor regente — busca pela turma em cachedTurmas
  const turmaEntry = cachedTurmas.find(({ data }) => (data.nome || "") === turmaNome);
  const professorUid = turmaEntry?.data?.professor_uid || turmaEntry?.data?.professor_id || "";
  const relProfessor = document.getElementById("relProfessor");
  if (relProfessor && !relProfessor.value && professorUid) {
    const professorEntry = cachedUsers.find(({ id }) => id === professorUid);
    if (professorEntry) relProfessor.value = professorEntry.data.nome || professorEntry.data.email || "";
  }

  // Faixa etária — tenta mapear a partir da turma
  const faixaId = turmaEntry?.data?.faixa_etaria_id || turmaEntry?.data?.faixa_etaria || "";
  const relFaixa = document.getElementById("relFaixa");
  if (relFaixa && faixaId) {
    const upper = faixaId.toUpperCase();
    const mapped = ["EI01", "EI02", "EI03"].find((code) => upper.includes(code));
    if (mapped) {
      relFaixa.value = mapped;
      renderBnccMatriz();
    }
  }
}

function limparFormularioBncc(withConfirm = true) {
  if (withConfirm && !confirm("Tem certeza que deseja limpar os dados da avaliacao BNCC?")) return;

  const relAluno = document.getElementById("relAluno");
  const relIdade = document.getElementById("relIdade");
  const relPeriodo = document.getElementById("relPeriodo");
  const relProfessor = document.getElementById("relProfessor");
  const relParecerGlobal = document.getElementById("relParecerGlobal");
  const relFaixa = document.getElementById("relFaixa");

  if (relAluno) relAluno.value = "";
  if (relIdade) relIdade.value = "";
  if (relPeriodo) relPeriodo.value = "";
  if (relProfessor) relProfessor.value = "";
  if (relParecerGlobal) relParecerGlobal.value = "";
  if (relFaixa) relFaixa.value = "EI03";

  renderBnccMatriz();
  setBnccEditMode(null);
}

function populateAgendaAlunoOptions() {
  const alunoSelect = document.getElementById("agendaAluno");
  if (!alunoSelect) return;

  const previousValue = alunoSelect.value;
  const alunos = cachedStudents
    .map(({ id, data }) => ({
      id,
      nome: data.nome || id,
      turma: data.turma || ""
    }))
    .sort((a, b) => {
      const byName = String(a.nome).localeCompare(String(b.nome));
      if (byName !== 0) return byName;
      return String(a.turma).localeCompare(String(b.turma));
    });

  alunoSelect.innerHTML = "<option value=\"\">Selecione o aluno</option>";
  alunos.forEach((aluno) => {
    const option = document.createElement("option");
    option.value = aluno.nome;
    option.textContent = aluno.turma ? `${aluno.nome} - ${aluno.turma}` : aluno.nome;
    alunoSelect.appendChild(option);
  });

  if (previousValue && alunos.some((aluno) => aluno.nome === previousValue)) {
    alunoSelect.value = previousValue;
  }
}

function populateOcorrenciaAlunoOptions() {
  const alunoSelect = document.getElementById("ocoAluno");
  if (!(alunoSelect instanceof HTMLSelectElement)) return;

  const previousValue = alunoSelect.value;
  const alunos = cachedStudents
    .map(({ data }) => ({
      nome: data.nome || "",
      turma: data.turma || ""
    }))
    .filter((aluno) => String(aluno.nome).trim())
    .sort((a, b) => {
      const byName = String(a.nome).localeCompare(String(b.nome));
      if (byName !== 0) return byName;
      return String(a.turma).localeCompare(String(b.turma));
    });

  alunoSelect.innerHTML = "<option value=\"\">Selecione o aluno</option>";
  alunos.forEach((aluno) => {
    const option = document.createElement("option");
    option.value = aluno.nome;
    option.textContent = aluno.turma ? `${aluno.nome} - ${aluno.turma}` : aluno.nome;
    alunoSelect.appendChild(option);
  });

  if (previousValue && alunos.some((aluno) => aluno.nome === previousValue)) {
    alunoSelect.value = previousValue;
  }
}

function getFrequenciaTurmas() {
  const fromTurmas = cachedTurmas
    .map(({ data }) => String(data?.nome || "").trim())
    .filter(Boolean);
  const fromStudents = cachedStudents
    .map(({ data }) => String(data?.turma || "").trim())
    .filter(Boolean);
  return Array.from(new Set([...fromTurmas, ...fromStudents]))
    .sort((a, b) => String(a).localeCompare(String(b)));
}

function getFrequenciaStudentsByTurma(turmaNome) {
  const turma = String(turmaNome || "").trim();
  if (!turma) return [];
  return cachedStudents
    .filter(({ data }) => String(data?.turma || "").trim() === turma)
    .map(({ id, data }) => ({
      id,
      nome: String(data?.nome || id || "").trim(),
      turma: String(data?.turma || "").trim()
    }))
    .filter((row) => row.nome)
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
}

function populateFrequenciaTurmaOptions() {
  const turmaSelect = document.getElementById("freqTurma");
  if (!(turmaSelect instanceof HTMLSelectElement)) return;

  const previousValue = turmaSelect.value;
  const turmas = getFrequenciaTurmas();
  turmaSelect.innerHTML = "<option value=\"\">Selecione a turma</option>";
  turmas.forEach((turma) => {
    const option = document.createElement("option");
    option.value = turma;
    option.textContent = turma;
    turmaSelect.appendChild(option);
  });

  if (previousValue && turmas.includes(previousValue)) {
    turmaSelect.value = previousValue;
  }
}

function updateFrequenciaRowState(row) {
  if (!(row instanceof HTMLTableRowElement)) return;
  const presenteInput = row.querySelector(".freq-presente");
  const justificativaInput = row.querySelector(".freq-justificativa");
  const anexoInput = row.querySelector(".freq-anexo");
  if (!(presenteInput instanceof HTMLInputElement)) return;

  const ausente = !presenteInput.checked;
  row.classList.toggle("freq-row-ausente", ausente);
  if (justificativaInput instanceof HTMLTextAreaElement) {
    justificativaInput.disabled = !ausente;
    if (!ausente) justificativaInput.value = "";
  }
  if (anexoInput instanceof HTMLInputElement) {
    anexoInput.disabled = !ausente;
    if (!ausente) anexoInput.value = "";
  }

  const label = row.querySelector(".freq-file-selected");
  if (label instanceof HTMLElement && !ausente) {
    label.textContent = "Nenhum arquivo selecionado.";
  }
}

function renderFrequenciaTurmaTable() {
  const container = document.getElementById("freqTurmaTableWrap");
  const turmaSelect = document.getElementById("freqTurma");
  if (!container || !(turmaSelect instanceof HTMLSelectElement)) return;

  const turma = String(turmaSelect.value || "").trim();
  if (!turma) {
    container.innerHTML = "<p class=\"small\">Selecione a turma para carregar os alunos e marcar presencas.</p>";
    return;
  }

  const alunos = getFrequenciaStudentsByTurma(turma);
  if (!alunos.length) {
    container.innerHTML = "<p class=\"small\">Nenhum aluno encontrado para a turma selecionada.</p>";
    return;
  }

  const rows = alunos.map((aluno, index) => `
    <tr data-aluno-id="${escapeHtml(aluno.id)}" data-aluno-nome="${escapeHtml(aluno.nome)}">
      <td>${index + 1}</td>
      <td>${escapeHtml(aluno.nome)}</td>
      <td>
        <label class="freq-presenca-toggle">
          <input type="checkbox" class="freq-presente" checked>
          Presente
        </label>
      </td>
      <td>
        <textarea class="field freq-justificativa" rows="2" placeholder="Descreva a justificativa da falta" disabled></textarea>
      </td>
      <td>
        <input type="file" class="field freq-anexo" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" disabled>
        <small class="freq-file-selected">Nenhum arquivo selecionado.</small>
      </td>
    </tr>
  `).join("");

  container.innerHTML = `
    <table class="freq-table" aria-label="Tabela de frequencia da turma ${escapeHtml(turma)}">
      <thead>
        <tr>
          <th>#</th>
          <th>Aluno</th>
          <th>Presenca</th>
          <th>Justificativa de falta</th>
          <th>Arquivo de justificativa</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function resolveMatriculaIdForAluno(alunoEntry, alunoNome) {
  const matriculaId = alunoEntry?.data?.matricula_id || "";
  if (matriculaId) return matriculaId;

  const normalizedAluno = String(alunoNome || "").trim().toLowerCase();
  if (!normalizedAluno) return "";

  const candidates = cachedEnrollments.filter(({ data }) =>
    String(data?.aluno || "").trim().toLowerCase() === normalizedAluno
  );
  if (!candidates.length) return "";

  candidates.sort((a, b) => {
    const aDate = a.data?.updated_at?.toMillis?.() || a.data?.created_at?.toMillis?.() || 0;
    const bDate = b.data?.updated_at?.toMillis?.() || b.data?.created_at?.toMillis?.() || 0;
    return bDate - aDate;
  });
  return candidates[0].id;
}

function getProntuarioTurmas() {
  return cachedTurmas
    .map(({ id, data }) => ({
      id,
      nome: data.nome || id,
      professorUid: data.professor_uid || data.professor_id || ""
    }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
}

function getProntuarioProfessores() {
  const allowedRoles = new Set(["professor", "coordenacao", "direcao"]);
  return cachedUsers
    .filter(({ data }) => allowedRoles.has(data.role || ""))
    .map(({ id, data }) => ({
      id,
      nome: data.nome || "",
      email: data.email || id,
      role: data.role || "-"
    }))
    .sort((a, b) => String(a.nome || a.email).localeCompare(String(b.nome || b.email)));
}

function getProntuarioAlunoCandidates() {
  const turmaFiltro = document.getElementById("proTurmaFiltro")?.value.trim() || "";
  const professorFiltro = document.getElementById("proProfessorFiltro")?.value.trim() || "";
  const alunoBusca = normalizeSearch(document.getElementById("proAlunoBusca")?.value || "");
  const turmasDoProfessor = professorFiltro
    ? new Set(
        getProntuarioTurmas()
          .filter((turma) => turma.professorUid === professorFiltro)
          .map((turma) => turma.nome)
      )
    : null;

  return cachedStudents.filter(({ data }) => {
    const turmaAluno = String(data.turma || "").trim();
    const nomeAluno = normalizeSearch(data.nome || "");
    if (turmaFiltro && turmaAluno !== turmaFiltro) return false;
    if (turmasDoProfessor && !turmasDoProfessor.has(turmaAluno)) return false;
    if (alunoBusca && !nomeAluno.includes(alunoBusca)) return false;
    return true;
  });
}

function normalizeDocumentoIdentity(documento = {}) {
  return [String(documento?.url || ""), String(documento?.caminho || ""), String(documento?.nome || "")].join("::");
}

function mergeUniqueDocumentos(documentos = []) {
  const result = [];
  const seen = new Set();
  documentos.forEach((documento) => {
    const identity = normalizeDocumentoIdentity(documento);
    if (seen.has(identity)) return;
    seen.add(identity);
    result.push(documento);
  });
  return result;
}

function parseProntuarioUrlDocumentos(rawValue) {
  const lines = String(rawValue || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const documentos = [];
  const invalidUrls = [];

  lines.forEach((url, index) => {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        invalidUrls.push(url);
        return;
      }
      const nome = getFileNameFromUrl(url) || `documento-url-${index + 1}`;
      documentos.push({
        nome,
        url,
        caminho: "",
        tipo: null,
        tamanho: 0,
        uploaded_at: new Date().toISOString(),
        origem: "url"
      });
    } catch (_) {
      invalidUrls.push(url);
    }
  });

  return { documentos, invalidUrls };
}

async function updateProntuarioDocumentosPreview() {
  const container = document.getElementById("proDocumentosPreview");
  if (!container) return;

  const alunoNome = document.getElementById("proAluno")?.value.trim() || "";
  if (!alunoNome || alunoNome === "Nenhum aluno encontrado") {
    container.innerHTML = "<p class=\"small\">Selecione um aluno para ver os documentos já cadastrados.</p>";
    return;
  }

  const requestId = ++prontuarioPreviewRequestId;
  container.innerHTML = "<p class=\"small\">Carregando documentos já cadastrados...</p>";

  try {
    const alunoId = slugify(alunoNome);
    const [matriculaSnap, prontuariosSnap] = await Promise.all([
      alunoId ? getDoc(doc(db, "alunos", alunoId)) : Promise.resolve(null),
      getDocs(scopedCollectionQuery("prontuarios", [where("aluno", "==", alunoNome), limit(50)]))
    ]);

    if (requestId !== prontuarioPreviewRequestId) return;

    const matriculaData = matriculaSnap && typeof matriculaSnap.exists === "function" && matriculaSnap.exists() ? matriculaSnap.data() || {} : {};
    const documentosMatricula = Array.isArray(matriculaData.documentos_upload) ? matriculaData.documentos_upload : [];
    const documentosProntuario = [];

    prontuariosSnap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      if (Array.isArray(data.documentos_upload)) {
        documentosProntuario.push(...data.documentos_upload);
      }
    });

    const prontuariosCount = prontuariosSnap.size || 0;
    container.innerHTML = `
      <div class="prontuario-preview-head">
        <strong>Documentos do aluno selecionado</strong>
        <p class="small">${prontuariosCount} prontuário(s) encontrado(s)</p>
      </div>
      ${formatDocumentosReadOnly(mergeUniqueDocumentos(documentosMatricula), "Documentos cadastrados na matrícula")}
      ${formatDocumentosReadOnly(mergeUniqueDocumentos(documentosProntuario), "Documentos cadastrados no prontuário")}
    `;
  } catch (error) {
    console.error(error);
    if (requestId !== prontuarioPreviewRequestId) return;
    container.innerHTML = "<p class=\"small\">Nao foi possivel carregar os documentos do aluno selecionado.</p>";
  }
}

function populateProntuarioFiltroOptions() {
  const turmaSelect = document.getElementById("proTurmaFiltro");
  const professorSelect = document.getElementById("proProfessorFiltro");

  if (turmaSelect) {
    const previousValue = turmaSelect.value;
    const turmas = getProntuarioTurmas();
    turmaSelect.innerHTML = "<option value=\"\">Filtrar por turma</option>";
    turmas.forEach((turma) => {
      const option = document.createElement("option");
      option.value = turma.nome;
      option.textContent = turma.nome;
      turmaSelect.appendChild(option);
    });
    if (previousValue && turmas.some((turma) => turma.nome === previousValue)) {
      turmaSelect.value = previousValue;
    }
  }

  if (professorSelect) {
    const previousValue = professorSelect.value;
    const professores = getProntuarioProfessores();
    professorSelect.innerHTML = "<option value=\"\">Filtrar por professor</option>";
    professores.forEach((professor) => {
      const option = document.createElement("option");
      option.value = professor.id;
      option.textContent = `${professor.nome || professor.email} (${professor.role})`;
      professorSelect.appendChild(option);
    });
    if (previousValue && professores.some((professor) => professor.id === previousValue)) {
      professorSelect.value = previousValue;
    }
  }

  populateProntuarioAlunoOptions();
}

function populateProntuarioAlunoOptions() {
  const alunoSelect = document.getElementById("proAluno");
  if (!alunoSelect) return;

  const previousValue = alunoSelect.value;
  const alunos = getProntuarioAlunoCandidates()
    .map(({ id, data }) => ({
      id,
      nome: data.nome || id,
      turma: data.turma || ""
    }))
    .sort((a, b) => {
      const byName = String(a.nome).localeCompare(String(b.nome));
      if (byName !== 0) return byName;
      return String(a.turma).localeCompare(String(b.turma));
    });

    alunoSelect.innerHTML = "<option value=\"\">Selecione o aluno (titular)</option>";
    if (alunos.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Nenhum aluno encontrado";
      alunoSelect.appendChild(option);
      alunoSelect.value = "";
      return;
    }
  alunos.forEach((aluno) => {
    const option = document.createElement("option");
    option.value = aluno.nome;
    option.textContent = aluno.turma ? `${aluno.nome} - ${aluno.turma}` : aluno.nome;
    alunoSelect.appendChild(option);
  });

  if (previousValue && alunos.some((aluno) => aluno.nome === previousValue)) {
    alunoSelect.value = previousValue;
  }

  void updateProntuarioDocumentosPreview();
}

async function syncResponsibleUidFromEmail() {
  const emailField = document.getElementById("matRespEmail");
  const uidField = document.getElementById("matRespUid");
  if (!emailField || !uidField) return;

  const email = normalizeEmail(emailField.value);
  if (!email) {
    uidField.value = "";
    return;
  }

  const found = cachedUsers.find(({ data }) => normalizeEmail(data.email) === email);
  if (found) {
    uidField.value = found.id;
    return;
  }

  const snap = await getDocs(scopedCollectionQuery("usuarios", [where("email", "==", email), limit(1)]));
  uidField.value = snap.empty ? "" : snap.docs[0].id;
}

function normalizeSearch(value) {
  return normalizeEmail(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toDisplayWord(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function extractFirstName(fullName) {
  const normalized = String(fullName || "").trim();
  if (!normalized) return "";
  const first = normalized.split(/\s+/)[0] || "";
  return toDisplayWord(first);
}

function resolveUserFirstName(user) {
  const profileName = extractFirstName(currentProfile.nome || currentProfile.name || "");
  if (profileName) return profileName;

  const authName = extractFirstName(user?.displayName || "");
  if (authName) return authName;

  const emailPrefix = String(user?.email || "").split("@")[0] || "";
  const token = emailPrefix.split(/[._-]+/)[0] || emailPrefix;
  return toDisplayWord(token) || "Usuario";
}

function humanizeSchoolId(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveSchoolDisplayName() {
  if (isSuperUser()) return "Painel Superadmin";

  const profileName = (
    currentProfile.escola_nome ||
    currentProfile.school_name ||
    currentProfile.nome_escola ||
    ""
  ).trim();
  if (profileName) return profileName;

  const schoolId = currentSchoolId();
  if (!schoolId) return "Portal Escolar";

  return humanizeSchoolId(schoolId);
}

function updateSchoolHeaderName() {
  if (!schoolHeaderName) return;
  schoolHeaderName.textContent = resolveSchoolDisplayName();
  syncPlanningInstitution();
}

function updateSuperadminSummary() {
  const summarySchools = document.getElementById("summarySchools");
  const summarySchoolsActive = document.getElementById("summarySchoolsActive");
  const summaryDirectors = document.getElementById("summaryDirectors");
  const summaryDirectorsActive = document.getElementById("summaryDirectorsActive");
  const summaryStudents = document.getElementById("summaryStudents");
  const summaryEnrollments = document.getElementById("summaryEnrollments");
  if (summarySchools) summarySchools.textContent = `${cachedSchools.length}`;
  if (summarySchoolsActive) summarySchoolsActive.textContent = `${cachedSchools.filter(({ data }) => (data.status || "ativa") === "ativa").length}`;
  if (summaryDirectors) summaryDirectors.textContent = `${cachedDirectors.length}`;
  if (summaryDirectorsActive) summaryDirectorsActive.textContent = `${cachedDirectors.filter(({ data }) => (data.status || "ativo") === "ativo").length}`;
  if (summaryStudents) summaryStudents.textContent = `${cachedStudents.length}`;
  if (summaryEnrollments) summaryEnrollments.textContent = `${cachedEnrollments.length}`;

  const metricsList = document.getElementById("listSchoolMetrics");
  if (!metricsList) return;
  metricsList.innerHTML = "";
  if (!cachedSchools.length) {
    metricsList.innerHTML = "<p class=\"small\">Nenhuma escola cadastrada.</p>";
    const chart = document.getElementById("schoolChart");
    if (chart) chart.innerHTML = "<p class=\"small\">Nenhuma escola cadastrada.</p>";
    const ranking = document.getElementById("schoolRanking");
    if (ranking) ranking.innerHTML = "<p class=\"small\">Nenhuma escola cadastrada.</p>";
    return;
  }

  const cityFilter = normalizeSearch(document.getElementById("schoolCityFilter")?.value || "");
  const sortMetric = document.getElementById("schoolSortMetric")?.value || "total";
  const rows = cachedSchools
    .map(({ id, data }) => {
      const schoolId = data.escola_id || id;
      return {
        id: schoolId,
        name: data.nome || schoolId,
        status: data.status || "ativa",
        city: data.cidade || "-",
        students: cachedStudents.filter(({ data: student }) => student.escola_id === schoolId).length,
        enrollments: cachedEnrollments.filter(({ data: enrollment }) => enrollment.escola_id === schoolId).length,
        directors: cachedDirectors.filter(({ data: director }) => director.escola_id === schoolId).length
      };
    })
    .filter((row) => {
      if (!cityFilter) return true;
      return normalizeSearch(row.city).includes(cityFilter) || normalizeSearch(row.name).includes(cityFilter) || normalizeSearch(row.id).includes(cityFilter);
    })
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const sortedRows = [...rows].sort((a, b) => {
    if (sortMetric === "students") return b.students - a.students;
    if (sortMetric === "enrollments") return b.enrollments - a.enrollments;
    if (sortMetric === "directors") return b.directors - a.directors;
    return (b.students + b.enrollments + b.directors) - (a.students + a.enrollments + a.directors);
  });

  rows.forEach((row) => {
    metricsList.appendChild(
      renderItem(
        `${row.name}`,
        [
          `ID: ${row.id}`,
          `Cidade: ${row.city}`,
          `Status: ${row.status}`,
          `Alunos: ${row.students}`,
          `Matrículas: ${row.enrollments}`,
          `Diretores: ${row.directors}`
        ],
        null
      )
    );
  });

  const chart = document.getElementById("schoolChart");
  if (!chart) return;
  chart.innerHTML = "";
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.students, row.enrollments, row.directors]));
  sortedRows.forEach((row) => {
    const chartRow = document.createElement("div");
    chartRow.className = "school-chart-row";
    if (selectedSchoolId === row.id) {
      chartRow.style.borderColor = "var(--primary-light)";
      chartRow.style.boxShadow = "0 0 0 2px rgba(74, 155, 136, 0.18)";
    }
    chartRow.innerHTML = `
      <div class="school-chart-name">${row.name}</div>
      <div class="school-chart-bars">
        <div class="school-chart-bar-line">
          <div class="school-chart-bar-label">Alunos</div>
          <div class="school-chart-bar-wrap"><div class="school-chart-bar" style="width:${Math.round((row.students / maxValue) * 100)}%;"></div></div>
          <div class="school-chart-bar-value">${row.students}</div>
        </div>
        <div class="school-chart-bar-line">
          <div class="school-chart-bar-label">Matrículas</div>
          <div class="school-chart-bar-wrap"><div class="school-chart-bar" style="width:${Math.round((row.enrollments / maxValue) * 100)}%;"></div></div>
          <div class="school-chart-bar-value">${row.enrollments}</div>
        </div>
        <div class="school-chart-bar-line">
          <div class="school-chart-bar-label">Diretores</div>
          <div class="school-chart-bar-wrap"><div class="school-chart-bar" style="width:${Math.round((row.directors / maxValue) * 100)}%;"></div></div>
          <div class="school-chart-bar-value">${row.directors}</div>
        </div>
      </div>
      <div class="school-chart-value">Total: ${row.students + row.enrollments + row.directors}</div>
    `;
    chart.appendChild(chartRow);
  });

  const ranking = document.getElementById("schoolRanking");
  if (!ranking) return;
  ranking.innerHTML = "";
  const rankingRows = [...sortedRows]
    .map((row) => ({ ...row, score: row.students + row.enrollments + row.directors }))
    .sort((a, b) => b.score - a.score);

  rankingRows.forEach((row, index) => {
    const item = renderItem(
      `${index + 1}. ${row.name}`,
      [`ID: ${row.id}`, `Cidade: ${row.city}`, `Status: ${row.status}`],
      null
    );
    item.classList.add("school-ranking-item");
    if (selectedSchoolId === row.id) {
      item.style.borderColor = "var(--primary-light)";
    }
    const score = document.createElement("div");
    score.className = "school-ranking-score";
    score.textContent = `${row.score} pontos`;
    item.appendChild(score);
    ranking.appendChild(item);
  });
}

function renderSuperadminSchools() {
  const list = document.getElementById("listEscolas");
  if (!list) return;
  const search = normalizeSearch(document.getElementById("schoolSearch")?.value || "");
  list.innerHTML = "";
  const rows = cachedSchools
    .filter(({ id, data }) => {
      if (!search) return true;
      return normalizeSearch(`${data.nome || ""} ${data.escola_id || id} ${data.cidade || ""}`).includes(search);
    })
    .sort((a, b) => String(a.data.nome || a.id).localeCompare(String(b.data.nome || b.id)));

  if (!rows.length) {
    list.innerHTML = "<p class=\"small\">Nenhuma escola encontrada.</p>";
    updateSuperadminSummary();
    return;
  }

  rows.forEach(({ id, data }) => {
    const item = renderItem(
      `${data.nome || id}`,
      [`ID: ${data.escola_id || id}`, `Cidade: ${data.cidade || "-"}`, `Status: ${data.status || "ativa"}`],
      data.updated_at || data.created_at
    );
    item.onclick = () => setSelectedSchool(id, data);
    list.appendChild(item);
  });
  updateSuperadminSummary();
}

function renderSuperadminDirectors() {
  const list = document.getElementById("listDiretores");
  if (!list) return;
  const search = normalizeSearch(document.getElementById("directorSearch")?.value || "");
  list.innerHTML = "";
  const rows = cachedDirectors
    .filter(({ id, data }) => {
      if (!search) return true;
      return normalizeSearch(`${data.nome || ""} ${data.email || ""} ${data.escola_id || ""} ${id}`).includes(search);
    })
    .sort((a, b) => String(a.data.nome || a.id).localeCompare(String(b.data.nome || b.id)));

  if (!rows.length) {
    list.innerHTML = "<p class=\"small\">Nenhum diretor encontrado.</p>";
    updateSuperadminSummary();
    return;
  }

  rows.forEach(({ id, data }) => {
    const item = renderItem(
      `${data.nome || "Diretor"}`,
      [`Email: ${data.email || "-"}`, `Escola: ${data.escola_id || "-"}`, `Status: ${data.status || "ativo"}`],
      data.updated_at || data.created_at
    );
    item.onclick = () => setSelectedDirector(id, data);
    list.appendChild(item);
  });
  updateSuperadminSummary();
}

function setSchoolStatus(status) {
  const statusField = document.getElementById("schoolStatus");
  if (statusField) {
    statusField.value = status;
  }
}

function setDirectorStatusField(status) {
  const statusField = document.getElementById("directorStatus");
  if (statusField) {
    statusField.value = status;
  }
}

function formatDate(value) {
  if (!value) return "sem data";
  if (typeof value.toDate === "function") return value.toDate().toLocaleString("pt-BR");
  return String(value);
}

function normalizeCep(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 8);
}

function formatCep(value) {
  const cep = normalizeCep(value);
  if (cep.length !== 8) return cep;
  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}

function formatPhone(value) {
  const digits = normalizePhone(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}

function formatCpf(value) {
  const cpf = normalizeCpf(value);
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

async function buscarEnderecoPorCep() {
  const cepField = document.getElementById("matCep");
  if (!cepField) return;

  const cep = normalizeCep(cepField.value);
  if (cep.length !== 8) {
    alert("Informe um CEP valido com 8 digitos.");
    return;
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) {
    alert("Nao foi possivel consultar o CEP no momento.");
    return;
  }

  const data = await response.json();
  if (data.erro) {
    alert("CEP nao encontrado.");
    return;
  }

  cepField.value = formatCep(cep);
  document.getElementById("matLogradouro").value = data.logradouro || "";
  document.getElementById("matBairro").value = data.bairro || "";
  document.getElementById("matCidade").value = data.localidade || "";
  document.getElementById("matUf").value = (data.uf || "").toUpperCase();
  const numeroField = document.getElementById("matNumero");
  if (numeroField && !numeroField.value.trim()) {
    numeroField.focus();
  }
}

function money(n) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function financeAdjustCategories() {
  const tipoSelect = document.getElementById("finTipo");
  const categoriaSelect = document.getElementById("finCategoria");
  if (!(tipoSelect instanceof HTMLSelectElement) || !(categoriaSelect instanceof HTMLSelectElement)) return;

  const tipo = tipoSelect.value === "despesa" ? "despesa" : "receita";
  const previous = categoriaSelect.value;
  const categorias = FINANCE_CATEGORIES[tipo] || [];
  categoriaSelect.innerHTML = "";
  categorias.forEach((categoria) => {
    const option = document.createElement("option");
    option.value = categoria;
    option.textContent = categoria;
    categoriaSelect.appendChild(option);
  });
  if (previous && categorias.includes(previous)) {
    categoriaSelect.value = previous;
  }
}

function financeFormatDate(dateValue) {
  const value = String(dateValue || "").trim();
  if (!value) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return formatDate(value);
}

function financeNormalizeType(data = {}) {
  if (String(data.tipo_financeiro || "").trim() === "despesa") return "despesa";
  if (String(data.tipo_financeiro || "").trim() === "receita") return "receita";
  const tipoLegacy = String(data.tipo || "").trim().toLowerCase();
  return tipoLegacy === "pagar" ? "despesa" : "receita";
}

function financeNormalizeSortValue(row, field) {
  const data = row?.data || {};
  if (field === "data") {
    return String(data.data_lancamento || data.vencimento || "");
  }
  if (field === "descricao") {
    return String(data.descricao || "").toLowerCase();
  }
  if (field === "categoria") {
    return String(data.categoria || "").toLowerCase();
  }
  if (field === "tipo") {
    return financeNormalizeType(data);
  }
  if (field === "valor") {
    return Number(data.valor || 0);
  }
  return "";
}

function financeToggleSort(field) {
  const normalizedField = ["data", "descricao", "categoria", "tipo", "valor"].includes(field) ? field : "data";
  if (financeSortState.field === normalizedField) {
    financeSortState.dir = financeSortState.dir === "asc" ? "desc" : "asc";
  } else {
    financeSortState.field = normalizedField;
    financeSortState.dir = normalizedField === "data" || normalizedField === "valor" ? "desc" : "asc";
  }
}

function financeRefreshSortHeaderState() {
  document.querySelectorAll(".finance-sort-btn").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    const field = button.getAttribute("data-sort-field") || "";
    const isActive = field === financeSortState.field;
    button.classList.toggle("active", isActive);
    const direction = isActive ? (financeSortState.dir === "asc" ? " ↑" : " ↓") : "";
    const baseText = button.textContent?.replace(/\s[↑↓]$/, "") || "";
    button.textContent = `${baseText}${direction}`;
  });
}

function setFinanceEditMode(financeId) {
  editingFinanceId = financeId || null;
  const launchButton = document.getElementById("btnFinanceLancar");
  const cancelButton = document.getElementById("btnFinanceCancelar");
  if (launchButton instanceof HTMLButtonElement) {
    launchButton.textContent = editingFinanceId ? "Atualizar lancamento" : "Lancar no sistema";
  }
  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.classList.toggle("hidden", !editingFinanceId);
  }
}

function resetFinanceForm() {
  const tipoField = document.getElementById("finTipo");
  const descricaoField = document.getElementById("finDescricao");
  const valorField = document.getElementById("finValor");
  const dataField = document.getElementById("finData");
  const metodoField = document.getElementById("finMetodo");
  const statusField = document.getElementById("finStatus");
  const recorrenteField = document.getElementById("finRecorrente");

  if (tipoField instanceof HTMLSelectElement) tipoField.value = "receita";
  financeAdjustCategories();
  if (descricaoField instanceof HTMLInputElement) descricaoField.value = "";
  if (valorField instanceof HTMLInputElement) valorField.value = "";
  if (dataField instanceof HTMLInputElement) dataField.value = todayString();
  if (metodoField instanceof HTMLSelectElement) metodoField.value = "Boleto";
  if (statusField instanceof HTMLSelectElement) statusField.value = "pendente";
  if (recorrenteField instanceof HTMLInputElement) recorrenteField.checked = false;
  setFinanceEditMode(null);
}

function applyFinanceSectionMode() {
  const tipoField = document.getElementById("finTipo");
  if (tipoField instanceof HTMLSelectElement) {
    tipoField.disabled = false;
  }

  const filtroField = document.getElementById("financeFiltroTipo");
  if (filtroField instanceof HTMLSelectElement) {
    filtroField.disabled = false;
  }

  const panelsTitle = document.querySelectorAll(".finance-content-grid .finance-panel h4");
  if (panelsTitle[0] instanceof HTMLElement) {
    panelsTitle[0].textContent = "Nova Transacao";
  }
  if (panelsTitle[1] instanceof HTMLElement) {
    panelsTitle[1].textContent = "Historico de Lancamentos";
  }

  const receitasTitle = document.querySelector(".finance-card.receitas .title");
  if (receitasTitle instanceof HTMLElement) {
    receitasTitle.textContent = "Total Receitas";
  }

  const despesasCard = document.querySelector(".finance-card.despesas");
  if (despesasCard instanceof HTMLElement) {
    despesasCard.classList.remove("hidden");
  }

  const saldoCard = document.querySelector(".finance-card.saldo");
  if (saldoCard instanceof HTMLElement) {
    saldoCard.classList.remove("hidden");
  }

  financeAdjustCategories();
  renderFinanceDashboardAndTable(cachedFinanceTransactions);
}

window.applyFinanceSectionMode = applyFinanceSectionMode;

function renderFinanceDashboardAndTable(rows = []) {
  const rowsForSummary = rows;

  const receitas = rowsForSummary
    .filter((row) => financeNormalizeType(row.data) === "receita")
    .reduce((sum, row) => sum + Number(row.data?.valor || 0), 0);
  const despesas = rowsForSummary
    .filter((row) => financeNormalizeType(row.data) === "despesa")
    .reduce((sum, row) => sum + Number(row.data?.valor || 0), 0);
  const saldo = receitas - despesas;

  const receitasEl = document.getElementById("financeTotalReceitas");
  const despesasEl = document.getElementById("financeTotalDespesas");
  const saldoEl = document.getElementById("financeSaldoCaixa");
  if (receitasEl) receitasEl.textContent = money(receitas);
  if (despesasEl) despesasEl.textContent = money(despesas);
  if (saldoEl) {
    saldoEl.textContent = money(saldo);
    saldoEl.style.color = saldo >= 0 ? "var(--success)" : "var(--danger)";
  }

  const tbody = document.getElementById("financeTableBody");
  if (!(tbody instanceof HTMLElement)) return;
  const filtroSelecionado = document.getElementById("financeFiltroTipo")?.value || "todos";
  const filtro = filtroSelecionado;
  tbody.innerHTML = "";

  const sortedRows = [...rows].sort((a, b) => {
    const field = financeSortState.field;
    const dirFactor = financeSortState.dir === "asc" ? 1 : -1;
    const aValue = financeNormalizeSortValue(a, field);
    const bValue = financeNormalizeSortValue(b, field);
    if (typeof aValue === "number" && typeof bValue === "number") {
      if (aValue !== bValue) return (aValue - bValue) * dirFactor;
    } else {
      const compare = String(aValue).localeCompare(String(bValue));
      if (compare !== 0) return compare * dirFactor;
    }
    const aTs = a.data?.created_at?.toMillis?.() || 0;
    const bTs = b.data?.created_at?.toMillis?.() || 0;
    return bTs - aTs;
  });

  let visibleRows = 0;
  sortedRows.forEach((row) => {
    const type = financeNormalizeType(row.data);
    const cobrancaRef = String(row.data?.cobranca_ref || "").trim();
    if (filtro !== "todos" && filtro !== type) return;
    visibleRows += 1;

    const tr = document.createElement("tr");
    const descricao = escapeHtml(String(row.data?.descricao || "-").trim() || "-");
    const categoria = escapeHtml(String(row.data?.categoria || "-").trim() || "-");
    const valor = Number(row.data?.valor || 0);
    const dateLabel = financeFormatDate(row.data?.data_lancamento || row.data?.vencimento || "");

    tr.innerHTML = `
      <td>${dateLabel}</td>
      <td><strong>${descricao}</strong>${cobrancaRef ? `<br><small>ID cobranca: ${escapeHtml(cobrancaRef)}</small>` : ""}</td>
      <td><small>${categoria}</small></td>
      <td><span class="finance-badge ${type}">${type.toUpperCase()}</span></td>
      <td style="font-weight:700;color:${type === "receita" ? "var(--success)" : "var(--danger)"};">${type === "receita" ? "+" : "-"} ${money(valor)}</td>
      <td><button type="button" class="finance-edit-btn" data-finance-id="${escapeHtml(row.id)}">Editar</button><button type="button" class="finance-delete-btn" data-finance-id="${escapeHtml(row.id)}" data-cobranca-ref="${escapeHtml(cobrancaRef)}">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });

  if (!visibleRows) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">Nenhum lancamento encontrado.</td></tr>';
  }

  financeRefreshSortHeaderState();
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

function sanitizeFileName(fileName) {
  return String(fileName || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMatriculaDocumentosDownload(data) {
  const documentos = Array.isArray(data?.documentos_upload) ? data.documentos_upload : [];
  const arquivosDisponiveis = [];
  const botoes = documentos
    .map((documento, index) => {
      const nomeOriginal = String(documento?.nome || `documento-${index + 1}`);
      const nome = escapeHtml(nomeOriginal);
      const url = String(documento?.url || "").trim();
      const caminho = String(documento?.caminho || "").trim();
      if (!url) return nome;
      arquivosDisponiveis.push({ url, fileName: nomeOriginal });
      return `<div class="saved-doc-row"><span>${nome}</span><div class="saved-doc-actions"><button type="button" class="doc-view-btn" data-url="${escapeHtml(url)}" data-filename="${escapeHtml(nomeOriginal)}">Visualizar</button><button type="button" class="doc-download-btn" data-url="${escapeHtml(url)}" data-filename="${escapeHtml(nomeOriginal)}">Baixar</button><button type="button" class="doc-delete-btn" data-url="${escapeHtml(url)}" data-path="${escapeHtml(caminho)}" data-index="${index}" data-filename="${escapeHtml(nomeOriginal)}">Excluir</button></div></div>`;
    });

  const urlLegada = String(data?.documentos_url || "").trim();
  if (urlLegada) {
    arquivosDisponiveis.push({ url: urlLegada, fileName: "documento-legado" });
    botoes.push(`<div class="saved-doc-row"><span>documento-legado</span><div class="saved-doc-actions"><button type="button" class="doc-view-btn" data-url="${escapeHtml(urlLegada)}" data-filename="documento-legado">Visualizar</button><button type="button" class="doc-download-btn" data-url="${escapeHtml(urlLegada)}" data-filename="documento-legado">Baixar</button></div></div>`);
  }

  if (botoes.length === 0) {
    return "Documentos para download: nenhum";
  }

  const arquivosPayload = escapeHtml(encodeURIComponent(JSON.stringify(arquivosDisponiveis)));
  const botaoBaixarTodos = `<button type="button" class="doc-download-all-btn" data-files="${arquivosPayload}">Baixar todos os documentos</button>`;
  return `Documentos para download:<br>${botoes.map((botao) => `${botao}`).join("")}<div class="saved-doc-all-row">${botaoBaixarTodos}</div>`;
}

function formatDocumentosReadOnly(data, title = "Documentos da matrícula") {
  const documentos = Array.isArray(data) ? data : [];
  if (documentos.length === 0) {
    return `<div class="prontuario-doc-section prontuario-doc-section-matricula prontuario-doc-section-empty"><div class="prontuario-doc-section-title">${escapeHtml(title)}</div><div class="prontuario-doc-section-body">Nenhum documento importado.</div></div>`;
  }

  const arquivosDisponiveis = [];
  const botoes = documentos
    .map((documento, index) => {
      const nomeOriginal = String(documento?.nome || `documento-${index + 1}`);
      const nome = escapeHtml(nomeOriginal);
      const url = String(documento?.url || "").trim();
      const caminho = String(documento?.caminho || "").trim();
      if (!url) return nome;
      arquivosDisponiveis.push({ url, fileName: nomeOriginal });
      return `<div class="saved-doc-row"><span>${nome}</span><div class="saved-doc-actions"><button type="button" class="doc-view-btn" data-url="${escapeHtml(url)}" data-filename="${escapeHtml(nomeOriginal)}">Visualizar</button><button type="button" class="doc-download-btn" data-url="${escapeHtml(url)}" data-filename="${escapeHtml(nomeOriginal)}">Baixar</button></div></div>`;
    });

  const arquivosPayload = escapeHtml(encodeURIComponent(JSON.stringify(arquivosDisponiveis)));
  const botaoBaixarTodos = `<button type="button" class="doc-download-all-btn" data-files="${arquivosPayload}">Baixar todos os documentos</button>`;
  return `<div class="prontuario-doc-section prontuario-doc-section-matricula"><div class="prontuario-doc-section-title">${escapeHtml(title)}</div><div class="prontuario-doc-section-body">${botoes.map((botao) => `${botao}`).join("")}<div class="saved-doc-all-row">${botaoBaixarTodos}</div></div></div>`;
}

function formatProntuarioDocumentosUpload(data) {
  const documentos = Array.isArray(data?.documentos_upload) ? data.documentos_upload : [];
  if (documentos.length === 0) {
    return `<div class="prontuario-doc-section prontuario-doc-section-upload prontuario-doc-section-empty"><div class="prontuario-doc-section-title">Documentos anexados no prontuário</div><div class="prontuario-doc-section-body">Nenhum anexo adicionado.</div></div>`;
  }

  const arquivosDisponiveis = [];
  const botoes = documentos
    .map((documento, index) => {
      const nomeOriginal = String(documento?.nome || `documento-${index + 1}`);
      const nome = escapeHtml(nomeOriginal);
      const url = String(documento?.url || "").trim();
      const caminho = String(documento?.caminho || "").trim();
      if (!url) return nome;
      arquivosDisponiveis.push({ url, fileName: nomeOriginal });
      return `<div class="saved-doc-row saved-doc-row-upload"><span>${nome}</span><div class="saved-doc-actions"><button type="button" class="doc-view-btn" data-url="${escapeHtml(url)}" data-filename="${escapeHtml(nomeOriginal)}">Visualizar</button><button type="button" class="doc-download-btn" data-url="${escapeHtml(url)}" data-filename="${escapeHtml(nomeOriginal)}">Baixar</button><button type="button" class="doc-delete-btn" data-url="${escapeHtml(url)}" data-path="${escapeHtml(caminho)}" data-index="${index}" data-filename="${escapeHtml(nomeOriginal)}">Excluir</button></div></div>`;
    });

  const arquivosPayload = escapeHtml(encodeURIComponent(JSON.stringify(arquivosDisponiveis)));
  const botaoBaixarTodos = `<button type="button" class="doc-download-all-btn" data-files="${arquivosPayload}">Baixar todos os anexos</button>`;
  return `<div class="prontuario-doc-section prontuario-doc-section-upload"><div class="prontuario-doc-section-title">Documentos anexados no prontuário</div><div class="prontuario-doc-section-body">${botoes.map((botao) => `${botao}`).join("")}<div class="saved-doc-all-row">${botaoBaixarTodos}</div></div></div>`;
}

async function triggerDocumentDownload(url, fileName) {
  if (!url) return;
  const href = buildStorageServeUrl(url, fileName || getFileNameFromUrl(url), "download");
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.download = sanitizeFileName(fileName || getFileNameFromUrl(url) || "documento");
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function triggerLocalFileDownload(file, fileName) {
  if (!file) return;
  const objectUrl = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = sanitizeFileName(fileName || file.name || "documento");
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function ensureAltMedia(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.hostname.includes("firebasestorage.googleapis.com") || u.hostname.includes("firebasestorage.app")) {
      if (!u.searchParams.has("alt")) {
        u.searchParams.set("alt", "media");
      }
      return u.toString();
    }
  } catch (_) { /* não é URL absoluta, retorna original */ }
  return url;
}

function getFileNameFromUrl(url) {
  try {
    const path = decodeURIComponent(new URL(url).pathname || "");
    const fileName = path.split("/").pop() || "documento";
    return sanitizeFileName(fileName);
  } catch (_) {
    return "documento";
  }
}

function buildStorageServeUrl(url, fileName, mode = "inline") {
  const source = ensureAltMedia(url);
  const safeName = sanitizeFileName(fileName || getFileNameFromUrl(url) || "documento");
  return `${STORAGE_SERVE_FUNCTION_URL}?url=${encodeURIComponent(source)}&fileName=${encodeURIComponent(safeName)}&mode=${encodeURIComponent(mode)}`;
}

function openUrlInNewTab(url, fileName) {
  if (!url) return;
  window.open(buildStorageServeUrl(url, fileName, "inline"), "_blank", "noopener,noreferrer");
}

async function triggerLocalFileView(file) {
  if (!file) return;
  const objectUrl = URL.createObjectURL(file);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
}

function matriculaDocIdentity(file) {
  return `${String(file?.name || "").toLowerCase()}::${Number(file?.size || 0)}::${Number(file?.lastModified || 0)}`;
}

function syncMatriculaDocumentosInput() {
  const documentosInput = document.getElementById("matDocumentos");
  if (!documentosInput || typeof DataTransfer === "undefined") return;
  const dataTransfer = new DataTransfer();
  pendingMatriculaDocumentos.forEach((file) => dataTransfer.items.add(file));
  documentosInput.files = dataTransfer.files;
}

function addPendingMatriculaDocumentos(newFiles) {
  const existing = new Set(pendingMatriculaDocumentos.map((file) => matriculaDocIdentity(file)));
  newFiles.forEach((file) => {
    const identity = matriculaDocIdentity(file);
    if (existing.has(identity)) return;
    pendingMatriculaDocumentos.push(file);
    existing.add(identity);
  });
  syncMatriculaDocumentosInput();
}

function clearPendingMatriculaDocumentos() {
  pendingMatriculaDocumentos = [];
  syncMatriculaDocumentosInput();
}

function prontuarioDocIdentity(file) {
  return `${String(file?.name || "").toLowerCase()}::${Number(file?.size || 0)}::${Number(file?.lastModified || 0)}`;
}

function syncProntuarioDocumentosInput() {
  const documentosInput = document.getElementById("proDocumentos");
  if (!documentosInput || typeof DataTransfer === "undefined") return;
  const dataTransfer = new DataTransfer();
  pendingProntuarioDocumentos.forEach((file) => dataTransfer.items.add(file));
  documentosInput.files = dataTransfer.files;
}

function addPendingProntuarioDocumentos(newFiles) {
  const existing = new Set(pendingProntuarioDocumentos.map((file) => prontuarioDocIdentity(file)));
  newFiles.forEach((file) => {
    const identity = prontuarioDocIdentity(file);
    if (existing.has(identity)) return;
    pendingProntuarioDocumentos.push(file);
    existing.add(identity);
  });
  syncProntuarioDocumentosInput();
}

function clearPendingProntuarioDocumentos() {
  pendingProntuarioDocumentos = [];
  syncProntuarioDocumentosInput();
}

function resetProntuarioUploadProgress() {
  const wrap = document.getElementById("proUploadProgressWrap");
  const bar = document.getElementById("proUploadProgressBar");
  if (bar) bar.style.width = "0%";
  if (wrap) {
    wrap.classList.add("hidden");
    wrap.setAttribute("aria-hidden", "true");
  }
}

function setProntuarioUploadProgress(current, total, message) {
  const wrap = document.getElementById("proUploadProgressWrap");
  const bar = document.getElementById("proUploadProgressBar");
  const uploadStatus = document.getElementById("proUploadStatus");
  const safeTotal = Math.max(1, Number(total || 0));
  const safeCurrent = Math.min(safeTotal, Math.max(0, Number(current || 0)));
  const percent = Math.round((safeCurrent / safeTotal) * 100);

  if (wrap) {
    wrap.classList.remove("hidden");
    wrap.setAttribute("aria-hidden", "false");
  }
  if (bar) {
    bar.style.width = `${percent}%`;
  }
  if (uploadStatus && message) {
    uploadStatus.textContent = `${message} (${safeCurrent}/${safeTotal})`;
  }
}

function renderProntuarioSelectedDocs() {
  const selectedDocs = document.getElementById("proSelectedDocs");
  const documentosInput = document.getElementById("proDocumentos");
  if (!selectedDocs || !documentosInput) return;

  const files = pendingProntuarioDocumentos.length ? pendingProntuarioDocumentos : Array.from(documentosInput.files || []);
  if (files.length === 0) {
    selectedDocs.textContent = "Nenhum arquivo selecionado.";
    return;
  }

  const arquivosPayload = escapeHtml(
    encodeURIComponent(
      JSON.stringify(
        files.map((file) => ({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified
        }))
      )
    )
  );
  selectedDocs.innerHTML = `Arquivos selecionados (${files.length}):<br>${files
    .map((file, index) => {
      const nome = escapeHtml(file.name);
      const tamanho = Math.max(1, Math.round(file.size / 1024));
      return `<div class="selected-doc-row"><span>- ${nome} (${tamanho} KB)</span><div class="selected-doc-actions"><button type="button" class="selected-doc-view-btn" data-doc-index="${index}">Visualizar</button><button type="button" class="selected-doc-download-btn" data-doc-index="${index}">Baixar</button><button type="button" class="selected-doc-delete-btn" data-doc-index="${index}">Excluir</button></div></div>`;
    })
    .join("")}<button type="button" class="selected-doc-download-all-btn" data-docs="${arquivosPayload}">Baixar todos os selecionados</button>`;
}

function clearProntuarioForm() {
  ["proAluno", "proTipo", "proArquivo", "proObs"].forEach((fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) element.value = "";
  });
  const documentosInput = document.getElementById("proDocumentos");
  if (documentosInput) documentosInput.value = "";
  clearPendingProntuarioDocumentos();
  renderProntuarioSelectedDocs();
  resetProntuarioUploadProgress();
  const preview = document.getElementById("proDocumentosPreview");
  if (preview) preview.innerHTML = "<p class=\"small\">Selecione um aluno para ver os documentos já cadastrados.</p>";
}

function resetMatriculaUploadProgress() {
  const wrap = document.getElementById("matUploadProgressWrap");
  const bar = document.getElementById("matUploadProgressBar");
  if (bar) bar.style.width = "0%";
  if (wrap) {
    wrap.classList.add("hidden");
    wrap.setAttribute("aria-hidden", "true");
  }
}

function setMatriculaUploadProgress(current, total, message) {
  const wrap = document.getElementById("matUploadProgressWrap");
  const bar = document.getElementById("matUploadProgressBar");
  const uploadStatus = document.getElementById("matUploadStatus");
  const safeTotal = Math.max(1, Number(total || 0));
  const safeCurrent = Math.min(safeTotal, Math.max(0, Number(current || 0)));
  const percent = Math.round((safeCurrent / safeTotal) * 100);

  if (wrap) {
    wrap.classList.remove("hidden");
    wrap.setAttribute("aria-hidden", "false");
  }
  if (bar) {
    bar.style.width = `${percent}%`;
  }
  if (uploadStatus && message) {
    uploadStatus.textContent = `${message} (${safeCurrent}/${safeTotal})`;
  }
}

function setMatriculaEditMode(matriculaId) {
  editingMatriculaId = matriculaId || null;
  const saveButton = document.getElementById("btnMatricula");
  const cancelButton = document.getElementById("btnMatriculaCancelar");
  const uploadStatus = document.getElementById("matUploadStatus");
  if (saveButton) {
    saveButton.textContent = editingMatriculaId ? "Atualizar matricula" : "Salvar matricula";
  }
  if (cancelButton) {
    cancelButton.classList.toggle("hidden", !editingMatriculaId);
  }
  if (uploadStatus && editingMatriculaId) {
    uploadStatus.textContent = "Modo edicao ativo. Altere os campos e clique em Atualizar matricula.";
  }
}

function clearMatriculaForm() {
  [
    "matAluno",
    "matDataNascimento",
    "matResp",
    "matRespUid",
    "matRespEmail",
    "matRespCpf",
    "matRespTelefone",
    "matCep",
    "matLogradouro",
    "matNumero",
    "matComplemento",
    "matBairro",
    "matCidade",
    "matUf",
    "matReferencia",
    "matDocUrl"
  ].forEach((fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) element.value = "";
  });
  const turmaField = document.getElementById("matTurma");
  if (turmaField) turmaField.value = "";
  const contrato = document.getElementById("matContrato");
  if (contrato) contrato.checked = false;
  const documentosInput = document.getElementById("matDocumentos");
  const fotoInput = document.getElementById("matFotoAluno");
  if (documentosInput) documentosInput.value = "";
  if (fotoInput) fotoInput.value = "";
  clearPendingMatriculaDocumentos();
  renderMatriculaSelectedDocs();
  stopMatriculaCamera();
  capturedMatriculaPhotoFile = null;
  clearMatriculaPhotoPreview();
  resetMatriculaUploadProgress();
  setMatriculaEditMode(null);
}

async function loadMatriculaForEdit(matriculaId) {
  const snap = await getDoc(doc(db, "matriculas", matriculaId));
  if (!snap.exists()) {
    alert("Matricula nao encontrada para edicao.");
    return;
  }
  const data = snap.data() || {};
  document.getElementById("matAluno").value = data.aluno || "";
  document.getElementById("matDataNascimento").value = data.data_nascimento || "";
  document.getElementById("matResp").value = data.responsavel || "";
  document.getElementById("matTurma").value = data.turma || "";
  document.getElementById("matRespUid").value = data.responsavel_uid || "";
  document.getElementById("matRespEmail").value = data.responsavel_email || "";
  document.getElementById("matRespCpf").value = formatCpf(data.responsavel_cpf || "") || "";
  document.getElementById("matRespTelefone").value = data.responsavel_telefone || "";
  document.getElementById("matCep").value = formatCep(data.endereco?.cep || "") || "";
  document.getElementById("matLogradouro").value = data.endereco?.logradouro || "";
  document.getElementById("matNumero").value = data.endereco?.numero || "";
  document.getElementById("matComplemento").value = data.endereco?.complemento || "";
  document.getElementById("matBairro").value = data.endereco?.bairro || "";
  document.getElementById("matCidade").value = data.endereco?.cidade || "";
  document.getElementById("matUf").value = data.endereco?.uf || "";
  document.getElementById("matReferencia").value = data.endereco?.referencia || "";
  document.getElementById("matDocUrl").value = data.documentos_url || "";
  document.getElementById("matContrato").checked = !!data.contrato_assinado;
  clearPendingMatriculaDocumentos();
  renderMatriculaSelectedDocs();
  setMatriculaEditMode(matriculaId);
}

function renderMatriculaSelectedDocs() {
  const selectedDocs = document.getElementById("matSelectedDocs");
  const documentosInput = document.getElementById("matDocumentos");
  if (!selectedDocs || !documentosInput) return;

  const files = pendingMatriculaDocumentos.length ? pendingMatriculaDocumentos : Array.from(documentosInput.files || []);
  if (files.length === 0) {
    selectedDocs.textContent = "Nenhum arquivo selecionado.";
    return;
  }

  const arquivosPayload = escapeHtml(encodeURIComponent(JSON.stringify(files.map((file) => ({
    name: file.name,
    size: file.size,
    lastModified: file.lastModified
  })))));
  selectedDocs.innerHTML = `Arquivos selecionados (${files.length}):<br>${files
    .map((file, index) => {
      const nome = escapeHtml(file.name);
      const tamanho = Math.max(1, Math.round(file.size / 1024));
      return `<div class="selected-doc-row"><span>- ${nome} (${tamanho} KB)</span><div class="selected-doc-actions"><button type="button" class="selected-doc-view-btn" data-doc-index="${index}">Visualizar</button><button type="button" class="selected-doc-download-btn" data-doc-index="${index}">Baixar</button><button type="button" class="selected-doc-delete-btn" data-doc-index="${index}">Excluir</button></div></div>`;
    })
    .join("")}<button type="button" class="selected-doc-download-all-btn" data-docs="${arquivosPayload}">Baixar todos os selecionados</button>`;
}

function removePendingMatriculaDocumento(index) {
  if (index < 0 || index >= pendingMatriculaDocumentos.length) return;
  pendingMatriculaDocumentos.splice(index, 1);
  syncMatriculaDocumentosInput();
  renderMatriculaSelectedDocs();
}

async function deleteSavedMatriculaDocumento({ matriculaId, docIndex, filePath, aluno }) {
  if (!matriculaId && docIndex === undefined) return;
  if (!confirm("Excluir este documento?")) return;

  const matriculaRef = doc(db, "matriculas", matriculaId);
  const matriculaSnap = await getDoc(matriculaRef);
  if (!matriculaSnap.exists()) {
    alert("Matricula nao encontrada.");
    return;
  }

  const matriculaData = matriculaSnap.data();
  const documentos = Array.isArray(matriculaData.documentos_upload) ? [...matriculaData.documentos_upload] : [];
  const targetIndex = Number.isInteger(docIndex) ? docIndex : documentos.findIndex((item) => String(item?.caminho || "") === String(filePath || ""));
  if (targetIndex < 0 || targetIndex >= documentos.length) return;

  const [removedDoc] = documentos.splice(targetIndex, 1);
  if (removedDoc?.caminho) {
    try {
      const token = await auth.currentUser.getIdToken();
      const deleteResponse = await fetch(STORAGE_DELETE_FUNCTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ path: removedDoc.caminho, schoolId: currentSchoolId() || "" })
      });
      const deletePayload = await deleteResponse.json().catch(() => ({}));
      if (!deleteResponse.ok || !deletePayload.ok) {
        throw new Error(deletePayload.error || "Erro ao excluir o documento.");
      }
    } catch (error) {
      console.error(error);
    }
  }

  await setDoc(matriculaRef, { documentos_upload: documentos, updated_at: serverTimestamp(), updated_by: auth.currentUser.uid }, { merge: true });

  const alunoId = slugify(aluno || matriculaData.aluno || "");
  if (alunoId) {
    await setDoc(doc(db, "alunos", alunoId), { documentos_upload: documentos, updated_at: serverTimestamp(), updated_by: auth.currentUser.uid }, { merge: true });
  }
}

async function deleteSavedProntuarioDocumento({ prontuarioId, docIndex, filePath }) {
  if (!prontuarioId && docIndex === undefined) return;
  if (!confirm("Excluir este documento?")) return;

  const prontuarioRef = doc(db, "prontuarios", prontuarioId);
  const prontuarioSnap = await getDoc(prontuarioRef);
  if (!prontuarioSnap.exists()) {
    alert("Prontuario nao encontrado.");
    return;
  }

  const prontuarioData = prontuarioSnap.data();
  const documentos = Array.isArray(prontuarioData.documentos_upload) ? [...prontuarioData.documentos_upload] : [];
  const targetIndex = Number.isInteger(docIndex) ? docIndex : documentos.findIndex((item) => String(item?.caminho || "") === String(filePath || ""));
  if (targetIndex < 0 || targetIndex >= documentos.length) return;

  const [removedDoc] = documentos.splice(targetIndex, 1);
  if (removedDoc?.caminho) {
    try {
      const token = await auth.currentUser.getIdToken();
      const deleteResponse = await fetch(STORAGE_DELETE_FUNCTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ path: removedDoc.caminho, schoolId: currentSchoolId() || "" })
      });
      const deletePayload = await deleteResponse.json().catch(() => ({}));
      if (!deleteResponse.ok || !deletePayload.ok) {
        throw new Error(deletePayload.error || "Erro ao excluir o documento.");
      }
    } catch (error) {
      console.error(error);
    }
  }

  await setDoc(prontuarioRef, { documentos_upload: documentos, updated_at: serverTimestamp(), updated_by: auth.currentUser.uid }, { merge: true });
}

async function uploadMatriculaFile(file, { alunoSlug, folder }) {
  const schoolSegment = currentSchoolId() || "sem-escola";
  const safeName = sanitizeFileName(file?.name);
  const token = await auth.currentUser.getIdToken();
  const fileData = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo."));
    reader.readAsDataURL(file);
  });
  const response = await fetch(
    `${STORAGE_UPLOAD_FUNCTION_URL}?schoolId=${encodeURIComponent(schoolSegment)}&studentSlug=${encodeURIComponent(alunoSlug)}&folder=${encodeURIComponent(folder)}&fileName=${encodeURIComponent(safeName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fileData, contentType: file?.type || "application/octet-stream" })
    }
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Erro no upload do documento.");
  }
  return {
    nome: file?.name || safeName,
    url: payload.url,
    caminho: payload.path,
    tipo: file?.type || null,
    tamanho: file?.size || 0,
    uploaded_at: new Date().toISOString()
  };
}

function clearMatriculaPhotoPreview() {
  const preview = document.getElementById("matFotoPreview");
  if (capturedMatriculaPhotoPreviewUrl) {
    URL.revokeObjectURL(capturedMatriculaPhotoPreviewUrl);
    capturedMatriculaPhotoPreviewUrl = null;
  }
  if (preview) {
    preview.src = "";
    preview.classList.add("hidden");
  }
}

function resetCapturedMatriculaPhoto() {
  capturedMatriculaPhotoFile = null;
  clearMatriculaPhotoPreview();
  const uploadStatus = document.getElementById("matUploadStatus");
  if (uploadStatus) uploadStatus.textContent = "Foto removida. Capture novamente ou selecione um arquivo.";
}

function stopMatriculaCamera() {
  if (matriculaCameraStream) {
    matriculaCameraStream.getTracks().forEach((track) => track.stop());
    matriculaCameraStream = null;
  }
  const video = document.getElementById("matCameraVideo");
  const panel = document.getElementById("matCameraPanel");
  if (video) video.srcObject = null;
  if (panel) panel.classList.add("hidden");
}

async function openMatriculaCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Seu navegador nao suporta acesso a camera.");
    return;
  }
  try {
    stopMatriculaCamera();
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    matriculaCameraStream = stream;
    const video = document.getElementById("matCameraVideo");
    const panel = document.getElementById("matCameraPanel");
    if (video) {
      video.srcObject = stream;
      await video.play();
    }
    if (panel) panel.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    alert("Nao foi possivel abrir a camera. Verifique a permissao no navegador.");
  }
}

async function captureMatriculaPhotoFromCamera() {
  const video = document.getElementById("matCameraVideo");
  const canvas = document.getElementById("matCameraCanvas");
  const uploadStatus = document.getElementById("matUploadStatus");
  if (!video || !canvas || !matriculaCameraStream) {
    alert("Abra a camera antes de capturar a foto.");
    return;
  }

  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(video, 0, 0, width, height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) {
    alert("Falha ao capturar foto da camera.");
    return;
  }

  capturedMatriculaPhotoFile = new File([blob], `foto-aluno-${Date.now()}.jpg`, { type: "image/jpeg" });
  clearMatriculaPhotoPreview();
  const preview = document.getElementById("matFotoPreview");
  if (preview) {
    capturedMatriculaPhotoPreviewUrl = URL.createObjectURL(blob);
    preview.src = capturedMatriculaPhotoPreviewUrl;
    preview.classList.remove("hidden");
  }
  if (uploadStatus) uploadStatus.textContent = "Foto capturada pela camera.";
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
  const familyOnly = isFamilyOnlyRole();
  const superadminVisible = isSuperAdmin();

  // Mostrar/ocultar dashboard da família
  if (familyDashboard) {
    familyDashboard.classList.toggle("active", familyOnly);
  }

  if (familyOnly) {
    const allowedSections = new Set(["agenda", "mural", "chat", "galeria", "autorizacoes", "anamnese"]);
    document.querySelectorAll(".sidebar-nav .nav-section").forEach((section) => {
      let visibleItems = 0;
      section.querySelectorAll(".nav-item").forEach((item) => {
        const sectionName = item.getAttribute("data-section") || "";
        const allowed = allowedSections.has(sectionName);
        item.style.display = allowed ? "" : "none";
        if (allowed) visibleItems += 1;
      });
      section.style.display = visibleItems > 0 ? "" : "none";
    });
    // Abre a seção agenda por padrão
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    const agendaItem = document.querySelector('.nav-item[data-section="agenda"]');
    if (agendaItem) agendaItem.classList.add("active");
    if (typeof window.showSection === "function") window.showSection("agenda");
  } else {
    // Restaura todos os grupos do menu lateral
    document.querySelectorAll(".sidebar-nav .nav-section").forEach((section) => {
      section.style.display = "";
      section.querySelectorAll(".nav-item").forEach((item) => {
        item.style.display = "";
      });
    });

    // Para staff, manter a secao ativa definida pela navegacao lateral.
    const activeItem = document.querySelector(".nav-item.active");
    let activeSection = activeItem ? activeItem.getAttribute("data-section") : "agenda";

    // Evita carregar tela de superadmin para perfis nao-superadmin
    if (!superadminVisible && activeSection === "superadmin") {
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      const agendaItem = document.querySelector('.nav-item[data-section="agenda"]');
      if (agendaItem) {
        agendaItem.classList.add("active");
      }
      activeSection = "agenda";
    }

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
  document.querySelectorAll(".superadmin-nav-only").forEach((element) => {
    element.style.display = superadminVisible ? "block" : "none";
  });

  document.querySelectorAll(".card.superadmin-only").forEach((element) => {
    // Cards seguem a secao ativa; apenas escondemos quando nao e superadmin.
    if (!superadminVisible) {
      element.style.display = "none";
    }
  });

  applyAnamneseAccessLayout();
}

function setAgendaMode() {
  const modeTag = document.getElementById("agendaModeTag");
  const schoolIds = [
    "agendaAluno",
    "agendaTurma",
    "agendaData",
    "agendaResponsavelUid",
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
  statusTag.textContent = `Selecionada: ${data.aluno || "Aluno"} - ${agendaStatusLabel(data.status)}`;
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
  setAgendaStatusField("rascunho");
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
  setAgendaStatusField(data.status || "rascunho");
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
  payload.status = normalizeAgendaStatus(statusOverride || "rascunho");
  setAgendaStatusField(payload.status);

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
    window._currentProfileRole = currentProfile.role;
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
  window._currentProfileRole = currentProfile.role;
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
  const bodyLines = lines.map((line) => `<div class=\"line\">${line}</div>`).join("");
  div.innerHTML = `<strong>${entryTitle}</strong>${bodyLines}<p class=\"small\">${formatDate(dateValue)}</p>`;
  return div;
}

function renderFrequenciaAusencias(registros) {
  const ausentes = (Array.isArray(registros) ? registros : []).filter((registro) => !registro?.presente);
  if (!ausentes.length) {
    return "Nenhuma ausencia no dia.";
  }

  const anexos = ausentes
    .map((registro) => {
      const doc = registro?.documento_justificativa && typeof registro.documento_justificativa === "object"
        ? registro.documento_justificativa
        : null;
      const url = String(doc?.url || "").trim();
      if (!url) return null;
      const nomeArquivo = String(doc?.nome || `justificativa-${String(registro?.aluno_id || "aluno").trim() || "aluno"}`).trim();
      return {
        url,
        fileName: nomeArquivo || "justificativa-falta"
      };
    })
    .filter(Boolean);

  const anexosPayload = anexos.length
    ? escapeHtml(encodeURIComponent(JSON.stringify(anexos)))
    : "";
  const botaoBaixarTodos = anexos.length
    ? `<div class="saved-doc-all-row"><button type="button" class="doc-download-all-btn" data-files="${anexosPayload}">Baixar todos os anexos de justificativa</button></div>`
    : "";

  const linhasAusentes = ausentes
    .map((registro) => {
      const alunoNome = escapeHtml(String(registro?.aluno || "Aluno").trim() || "Aluno");
      const justificativa = escapeHtml(String(registro?.justificativa || "Sem justificativa").trim() || "Sem justificativa");
      const doc = registro?.documento_justificativa && typeof registro.documento_justificativa === "object"
        ? registro.documento_justificativa
        : null;
      const url = String(doc?.url || "").trim();
      const nomeArquivo = String(doc?.nome || `justificativa-${String(registro?.aluno_id || "aluno").trim() || "aluno"}`).trim();
      const actions = url
        ? `<span class=\"freq-doc-actions\"><button type=\"button\" class=\"doc-view-btn\" data-url=\"${escapeHtml(url)}\" data-filename=\"${escapeHtml(nomeArquivo)}\">Visualizar</button><button type=\"button\" class=\"doc-download-btn\" data-url=\"${escapeHtml(url)}\" data-filename=\"${escapeHtml(nomeArquivo)}\">Baixar</button></span>`
        : "<span class=\"small\">Sem anexo</span>";
      return `<div class=\"freq-ausencia-row\"><strong>${alunoNome}</strong>: ${justificativa} ${actions}</div>`;
    })
    .join("");

  return `${linhasAusentes}${botaoBaixarTodos}`;
}

function renderMatriculaItem(data, dateValue) {
  const div = document.createElement("div");
  div.className = "item item-matricula collapsed";
  const aluno = data.aluno || "aluno";
  const turma = data.turma || "-";
  const lgpdConsentimento = data.lgpd_consentimento || null;
  const lgpdEscopos = lgpdConsentimento?.escopos || {};
  const details = [
    `<span class=\"matricula-actions\"><button type=\"button\" class=\"matricula-edit-btn\">Editar</button><button type=\"button\" class=\"matricula-delete-btn\">Excluir</button></span>`,
    `Responsavel: ${data.responsavel || "-"}`,
    data.data_nascimento ? `Data de nascimento: ${formatIdadeAluno(data.data_nascimento)}` : "",
    `Responsavel vinculado: ${data.responsavel_nome || data.responsavel || "-"}`,
    `CPF do responsavel: ${formatCpf(data.responsavel_cpf || "") || "-"}`,
    `Telefone do responsavel: ${data.responsavel_telefone || "-"}`,
    lgpdConsentimento ? `LGPD: registrado em ${formatDate(lgpdConsentimento.registrado_em || lgpdConsentimento.created_at || null)}` : "LGPD: sem consentimento registrado",
    lgpdConsentimento ? `LGPD WhatsApp: ${consentLabel(lgpdEscopos.comunicacao_whatsapp)}` : "",
    lgpdConsentimento ? `LGPD Fotos semanais: ${consentLabel(lgpdEscopos.fotos_videos_semanais)}` : "",
    lgpdConsentimento ? `LGPD Eventos/redes: ${consentLabel(lgpdEscopos.fotos_videos_eventos_redes)}` : "",
    `Foto do aluno: ${data.foto_aluno?.url ? "enviada" : "nao enviada"}`,
    `Documentos anexados: ${Array.isArray(data.documentos_upload) ? data.documentos_upload.length : 0}`,
    formatMatriculaDocumentosDownload(data),
    `Endereco: ${(data.endereco?.logradouro || "-")}${data.endereco?.numero ? `, ${data.endereco.numero}` : ""} - ${data.endereco?.bairro || "-"}`,
    `Cidade/UF: ${data.endereco?.cidade || "-"}/${data.endereco?.uf || "-"} | CEP: ${formatCep(data.endereco?.cep || "") || "-"}`,
    `Contrato assinado: ${data.contrato_assinado ? "sim" : "nao"}`
  ];
  const bodyLines = details.filter(Boolean).map((line) => `<div class=\"line\">${line}</div>`).join("");
  div.innerHTML = `
    <div class=\"matricula-item-header\">
      <div class=\"matricula-item-title-wrap\">
        <strong>Matricula - ${aluno}</strong>
        <span class=\"matricula-item-meta\">Turma: ${turma}</span>
      </div>
      <button type=\"button\" class=\"matricula-toggle-btn\" aria-expanded=\"false\">Expandir</button>
    </div>
    <div class=\"matricula-item-details\">${bodyLines}<p class=\"small\">${formatDate(dateValue)}</p></div>
  `;
  return div;
}

function setLgpdEditMode(consentId) {
  editingLgpdConsentId = consentId || null;
  const saveButton = document.getElementById("btnLgpd");
  const cancelButton = document.getElementById("btnLgpdCancelar");
  const editBanner = document.getElementById("lgpdEditBanner");
  if (saveButton) {
    saveButton.textContent = editingLgpdConsentId ? "Atualizar consentimento LGPD" : "Registrar consentimento LGPD";
  }
  if (cancelButton) {
    cancelButton.classList.toggle("hidden", !editingLgpdConsentId);
  }
  if (editBanner) {
    editBanner.classList.toggle("hidden", !editingLgpdConsentId);
  }
}

function clearLgpdFormSelection() {
  const alunoSelect = document.getElementById("lgpdAluno");
  if (alunoSelect) alunoSelect.value = "";
  syncLgpdResponsavelFromAluno();
  [
    "lgpdScopeComunicacaoSim",
    "lgpdScopeComunicacaoNao",
    "lgpdScopeSemanalSim",
    "lgpdScopeSemanalNao",
    "lgpdScopeEventosSim",
    "lgpdScopeEventosNao"
  ].forEach((fieldId) => {
    const element = document.getElementById(fieldId);
    if (element instanceof HTMLInputElement) element.checked = false;
  });
}

function renderLgpdConsentItem(id, data) {
  const div = document.createElement("div");
  div.className = "item item-lgpd collapsed";
  div.dataset.lgpdConsentId = id;
  const escopos = data.escopos || {};
  const linhas = [
    `<span class="lgpd-actions"><button type="button" class="lgpd-edit-btn">Editar</button><button type="button" class="lgpd-delete-btn">Excluir</button></span>`,
    `Responsavel: ${data.responsavel || "-"}`,
    `1) Comunicacao via WhatsApp: ${consentLabel(escopos.comunicacao_whatsapp)}`,
    `2) Fotos/videos semanais: ${consentLabel(escopos.fotos_videos_semanais)}`,
    `3) Fotos/videos em eventos e redes: ${consentLabel(escopos.fotos_videos_eventos_redes)}`
  ];
  if (data.escopo) {
    linhas.push(`Escopo legado: ${data.escopo}`);
  }
  const bodyLines = linhas.filter(Boolean).map((line) => `<div class="line">${line}</div>`).join("");
  div.innerHTML = `
    <div class="lgpd-item-header">
      <div class="lgpd-item-title-wrap">
        <strong>LGPD - ${data.aluno || "aluno"}</strong>
        <span class="lgpd-item-meta">${formatDate(data.updated_at || data.created_at)}</span>
      </div>
      <button type="button" class="lgpd-toggle-btn" aria-expanded="false">Expandir</button>
    </div>
    <div class="lgpd-item-details">${bodyLines}<p class="small">${formatDate(data.updated_at || data.created_at)}</p></div>
  `;
  return div;
}

function loadLgpdConsentForEdit(consentId, data) {
  const alunoSelect = document.getElementById("lgpdAluno");
  if (alunoSelect) alunoSelect.value = data.aluno_id || "";
  syncLgpdResponsavelFromAluno();

  const responsavelInput = document.getElementById("lgpdResp");
  if (responsavelInput && data.responsavel) {
    responsavelInput.value = data.responsavel;
  }

  const escopos = data.escopos || {};
  const toggleIds = [
    ["lgpdScopeComunicacaoSim", "lgpdScopeComunicacaoNao", escopos.comunicacao_whatsapp],
    ["lgpdScopeSemanalSim", "lgpdScopeSemanalNao", escopos.fotos_videos_semanais],
    ["lgpdScopeEventosSim", "lgpdScopeEventosNao", escopos.fotos_videos_eventos_redes]
  ];
  toggleIds.forEach(([simId, naoId, value]) => {
    const sim = document.getElementById(simId);
    const nao = document.getElementById(naoId);
    if (sim instanceof HTMLInputElement) sim.checked = value === true;
    if (nao instanceof HTMLInputElement) nao.checked = value === false;
  });

  setLgpdEditMode(consentId);
}

async function deleteLgpdConsent(consentId, data) {
  if (!consentId) return;
  if (!confirm("Excluir este consentimento LGPD?")) return;

  await deleteDoc(doc(db, "lgpd_consentimentos", consentId));
  const studentMatch = cachedStudents.find(({ id }) => id === data?.aluno_id);
  const matriculaId = data?.matricula_id || resolveMatriculaIdForAluno(studentMatch, data?.aluno || "");
  if (matriculaId) {
    await setDoc(
      doc(db, "matriculas", matriculaId),
      withSchoolScope({
        lgpd_consentimento: deleteField(),
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }),
      { merge: true }
    );
  }
  await audit("delete", "lgpd_consentimentos");
  if (editingLgpdConsentId === consentId) {
    clearLgpdFormSelection();
    setLgpdEditMode(null);
  }
}

function renderProntuarioItem(data, dateValue) {
  const div = document.createElement("div");
  div.className = "item item-prontuario collapsed";
  const aluno = data.aluno || "aluno";
  const tipo = data.tipo_documento || "-";
  const totalDocumentos = Array.isArray(data.documentos_upload) ? data.documentos_upload.length : 0;
  const details = [
    `Tipo: ${tipo}`,
    `Arquivo: ${data.arquivo_url || "-"}`,
    formatDocumentosReadOnly(data.documentos_matricula, "Documentos importados na matrícula"),
    formatProntuarioDocumentosUpload(data)
  ];
  const bodyLines = details.map((line) => `<div class=\"line\">${line}</div>`).join("");
  div.innerHTML = `
    <div class=\"prontuario-item-header\">
      <div class=\"prontuario-item-title-wrap\">
        <strong>Prontuario - ${aluno}</strong>
        <span class=\"prontuario-item-meta\">Tipo: ${tipo} | Documentos: ${totalDocumentos}</span>
      </div>
      <button type=\"button\" class=\"prontuario-toggle-btn\" aria-expanded=\"false\">Expandir</button>
    </div>
    <div class=\"prontuario-item-details\">${bodyLines}<p class=\"small\">${formatDate(dateValue)}</p></div>
  `;
  return div;
}

function showOk(id) {
  const msg = document.getElementById(id);
  msg.style.display = "block";
  setTimeout(() => {
    msg.style.display = "none";
  }, 1800);
}

function normalizePhoneForWhatsApp(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 11 || digits.length === 10) return `55${digits}`;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function renderLgpdNoticeHtml(message) {
  return String(message || "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => {
      const tag = index === 0 ? "h3" : "p";
      return `<${tag}>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</${tag}>`;
    })
    .join("");
}

function openLgpdNoticeModal({ responsavel, phone }) {
  const overlay = document.getElementById("lgpdNoticeModal");
  const textArea = document.getElementById("lgpdNoticeText");
  const responsavelLabel = document.getElementById("lgpdNoticeResponsavel");
  const phoneLabel = document.getElementById("lgpdNoticePhone");
  const whatsappButton = document.getElementById("btnLgpdNoticeWhatsapp");
  if (!overlay || !textArea || !responsavelLabel || !phoneLabel || !whatsappButton) return;

  textArea.innerHTML = renderLgpdNoticeHtml(LGPD_NOTICE_MESSAGE);
  responsavelLabel.textContent = responsavel || "-";
  phoneLabel.textContent = phone || "-";
  whatsappButton.disabled = !phone;
  whatsappButton.dataset.phone = phone || "";
  whatsappButton.dataset.message = LGPD_NOTICE_MESSAGE;
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
}

function closeLgpdNoticeModal() {
  const overlay = document.getElementById("lgpdNoticeModal");
  if (!overlay) return;
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
}

function sendLgpdNoticeToWhatsapp() {
  const button = document.getElementById("btnLgpdNoticeWhatsapp");
  if (!button) return;
  const phone = normalizePhoneForWhatsApp(button.dataset.phone || "");
  const message = button.dataset.message || LGPD_NOTICE_MESSAGE;
  if (!phone) {
    alert("Nao foi encontrado um telefone valido do responsavel para abrir o WhatsApp.");
    return;
  }
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

function readRadioConsent(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  if (!(selected instanceof HTMLInputElement)) return null;
  if (selected.value === "sim") return true;
  if (selected.value === "nao") return false;
  return null;
}

function consentLabel(value) {
  if (value === true) return "SIM";
  if (value === false) return "NAO";
  return "nao informado";
}

function clearListeners() {
  detachListeners.forEach((off) => off());
  detachListeners = [];
}

function attachList(collectionName, containerId, draw, options = {}) {
  const list = document.getElementById(containerId);
  const orderedBy = options.orderByField || "created_at";
  const dedupeBy = typeof options.dedupeBy === "function" ? options.dedupeBy : null;
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
    const seenKeys = new Set();
    const rowsDeduped = dedupeBy
      ? docs.filter((row) => {
        const key = String(dedupeBy(row.data, row.id) || "").trim().toLowerCase();
        if (!key) return true;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      })
      : docs;
    const filterFn = typeof options.filter === "function" ? options.filter : null;
    const rows = filterFn ? rowsDeduped.filter((row) => filterFn(row.data)) : rowsDeduped;
    rows.forEach((row) => list.appendChild(draw(row.id, row.data)));
  });
  detachListeners.push(unsubscribe);
}

function attachUiHandlers() {
  document.getElementById("agendaData").value = todayString();
  document.getElementById("freqData").value = todayString();
  const financeDateField = document.getElementById("finData");
  if (financeDateField instanceof HTMLInputElement) {
    financeDateField.value = todayString();
  }
  populateDirectorSchoolOptions();
  populateAccUserOptions();
  populateProfessorOptions();
  populateFaixaEtariaOptions();
  populateMatriculaTurmaOptions();
  populatePlanTurmaOptions();
  populatePlanFaixaOptions();
  populateProntuarioFiltroOptions();
  populateLgpdAlunoOptions();
  populateBnccAlunoOptions();
  populateOcorrenciaAlunoOptions();
  populateFrequenciaTurmaOptions();
  populateChatTurmaFilterOptions();
  populateChatRecipientOptions();
  financeAdjustCategories();
  const activeSection = document.querySelector(".nav-item.active")?.getAttribute("data-section") || "caixa";
  applyFinanceSectionMode(activeSection);
  renderBnccMatriz();
  renderFrequenciaTurmaTable();
  setAgendaMode();
  applyRoleLayout();

  document.getElementById("finTipo")?.addEventListener("change", () => {
    financeAdjustCategories();
  });

  document.getElementById("financeFiltroTipo")?.addEventListener("change", () => {
    renderFinanceDashboardAndTable(cachedFinanceTransactions);
  });

  document.querySelectorAll(".finance-sort-btn").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const field = button.getAttribute("data-sort-field") || "data";
      financeToggleSort(field);
      renderFinanceDashboardAndTable(cachedFinanceTransactions);
    });
  });

  document.getElementById("btnFinanceCancelar")?.addEventListener("click", () => {
    resetFinanceForm();
  });

  const financeTableBody = document.getElementById("financeTableBody");
  if (financeTableBody && !financeTableBody.dataset.actionBinding) {
    financeTableBody.dataset.actionBinding = "true";
    financeTableBody.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const editButton = target.closest(".finance-edit-btn");
      if (editButton instanceof HTMLButtonElement) {
        const financeId = editButton.getAttribute("data-finance-id") || "";
        const financeRow = cachedFinanceTransactions.find((row) => row.id === financeId);
        if (!financeRow) return;

        const data = financeRow.data || {};
        const tipo = financeNormalizeType(data);
        const tipoField = document.getElementById("finTipo");
        const descricaoField = document.getElementById("finDescricao");
        const valorField = document.getElementById("finValor");
        const dataField = document.getElementById("finData");
        const metodoField = document.getElementById("finMetodo");
        const statusField = document.getElementById("finStatus");
        const recorrenteField = document.getElementById("finRecorrente");

        if (tipoField instanceof HTMLSelectElement) tipoField.value = tipo;
        financeAdjustCategories();
        const categoriaField = document.getElementById("finCategoria");
        if (categoriaField instanceof HTMLSelectElement) categoriaField.value = String(data.categoria || "").trim();
        if (descricaoField instanceof HTMLInputElement) descricaoField.value = String(data.descricao || "").trim();
        if (valorField instanceof HTMLInputElement) valorField.value = String(Number(data.valor || 0));
        if (dataField instanceof HTMLInputElement) dataField.value = String(data.data_lancamento || data.vencimento || "");
        if (metodoField instanceof HTMLSelectElement) metodoField.value = String(data.metodo || "Boleto");
        if (statusField instanceof HTMLSelectElement) statusField.value = String(data.status || "pendente");
        if (recorrenteField instanceof HTMLInputElement) recorrenteField.checked = Boolean(data.recorrente);
        setFinanceEditMode(financeId);
        return;
      }

      const deleteButton = target.closest(".finance-delete-btn");
      if (!(deleteButton instanceof HTMLButtonElement)) return;

      const financeId = deleteButton.getAttribute("data-finance-id") || "";
      const cobrancaRef = deleteButton.getAttribute("data-cobranca-ref") || "";
      if (!financeId) return;
      if (!confirm("Tem certeza que deseja remover este lancamento do caixa?")) return;

      await deleteDoc(doc(db, "fluxo_caixa", financeId));
      if (cobrancaRef) {
        try {
          await deleteDoc(doc(db, "cobrancas", cobrancaRef));
        } catch (error) {
          console.error(error);
        }
      }
      await audit("delete", "fluxo_caixa");
    });
  }

  document.getElementById("freqTurma")?.addEventListener("change", () => {
    renderFrequenciaTurmaTable();
  });

  document.getElementById("freqTurmaTableWrap")?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.classList.contains("freq-presente")) {
      const row = target.closest("tr");
      if (row instanceof HTMLTableRowElement) {
        updateFrequenciaRowState(row);
      }
      return;
    }

    if (target.classList.contains("freq-anexo") && target instanceof HTMLInputElement) {
      const row = target.closest("tr");
      if (!(row instanceof HTMLTableRowElement)) return;
      const label = row.querySelector(".freq-file-selected");
      if (!(label instanceof HTMLElement)) return;
      const file = target.files && target.files[0] ? target.files[0] : null;
      label.textContent = file ? file.name : "Nenhum arquivo selecionado.";
    }
  });

  document.getElementById("btnBuscarCep")?.addEventListener("click", async () => {
    await buscarEnderecoPorCep();
  });
  document.getElementById("btnAbrirCamera")?.addEventListener("click", async () => {
    await openMatriculaCamera();
  });
  document.getElementById("btnCapturarFoto")?.addEventListener("click", async () => {
    await captureMatriculaPhotoFromCamera();
  });
  document.getElementById("btnRepetirFoto")?.addEventListener("click", () => {
    resetCapturedMatriculaPhoto();
  });
  document.getElementById("btnFecharCamera")?.addEventListener("click", () => {
    stopMatriculaCamera();
  });
  document.getElementById("matFotoAluno")?.addEventListener("change", () => {
    if (document.getElementById("matFotoAluno")?.files?.length) {
      resetCapturedMatriculaPhoto();
    }
  });
  document.getElementById("matDocumentos")?.addEventListener("change", () => {
    const documentosInput = document.getElementById("matDocumentos");
    const novosArquivos = Array.from(documentosInput?.files || []);
    addPendingMatriculaDocumentos(novosArquivos);
    renderMatriculaSelectedDocs();
  });
  document.getElementById("matCep")?.addEventListener("input", (event) => {
    event.target.value = formatCep(event.target.value);
  });
  document.getElementById("matRespTelefone")?.addEventListener("input", (event) => {
    event.target.value = formatPhone(event.target.value);
  });
  document.getElementById("matRespTelefone")?.addEventListener("blur", (event) => {
    event.target.value = formatPhone(event.target.value);
  });
  document.getElementById("matRespCpf")?.addEventListener("input", (event) => {
    event.target.value = formatCpf(event.target.value);
  });
  document.getElementById("matRespCpf")?.addEventListener("blur", (event) => {
    event.target.value = formatCpf(event.target.value);
  });
  clearPendingMatriculaDocumentos();
  renderMatriculaSelectedDocs();
  clearPendingProntuarioDocumentos();
  renderProntuarioSelectedDocs();
  document.getElementById("btnMatriculaCancelar")?.addEventListener("click", () => {
    clearMatriculaForm();
  });
  document.getElementById("proDocumentos")?.addEventListener("change", () => {
    const documentosInput = document.getElementById("proDocumentos");
    const novosArquivos = Array.from(documentosInput?.files || []);
    addPendingProntuarioDocumentos(novosArquivos);
    renderProntuarioSelectedDocs();
  });
  document.getElementById("proTurmaFiltro")?.addEventListener("change", () => {
    populateProntuarioAlunoOptions();
  });
  document.getElementById("proProfessorFiltro")?.addEventListener("change", () => {
    populateProntuarioAlunoOptions();
  });
  document.getElementById("proAlunoBusca")?.addEventListener("input", () => {
    populateProntuarioAlunoOptions();
  });
  document.getElementById("proAluno")?.addEventListener("change", () => {
    void updateProntuarioDocumentosPreview();
  });
  document.getElementById("lgpdAluno")?.addEventListener("change", syncLgpdResponsavelFromAluno);
  document.getElementById("relAluno")?.addEventListener("change", syncBnccFromAluno);
  document.getElementById("chatTurmaFiltro")?.addEventListener("change", populateChatRecipientOptions);
  document.getElementById("relFaixa").onchange = () => {
    renderBnccMatriz();
  };
  const selectedDocsContainer = document.getElementById("matSelectedDocs");
  if (selectedDocsContainer && !selectedDocsContainer.dataset.downloadBinding) {
    selectedDocsContainer.dataset.downloadBinding = "true";
    selectedDocsContainer.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const allButton = target.closest(".selected-doc-download-all-btn");
      if (allButton instanceof HTMLButtonElement) {
        const docsRaw = allButton.getAttribute("data-docs") || "[]";
        try {
          const docs = JSON.parse(decodeURIComponent(docsRaw));
          for (const docItem of docs) {
            const match = pendingMatriculaDocumentos.find((file) =>
              file.name === docItem.name &&
              Number(file.size || 0) === Number(docItem.size || 0) &&
              Number(file.lastModified || 0) === Number(docItem.lastModified || 0)
            );
            if (match) {
              await triggerLocalFileDownload(match, match.name);
            }
          }
        } catch (error) {
          console.error(error);
        }
        return;
      }
      const viewButton = target.closest(".selected-doc-view-btn");
      if (viewButton instanceof HTMLButtonElement) {
        const index = Number(viewButton.getAttribute("data-doc-index"));
        const file = pendingMatriculaDocumentos[index];
        if (!file) return;
        await triggerLocalFileView(file);
        return;
      }
      const button = target.closest(".selected-doc-download-btn");
      if (!(button instanceof HTMLButtonElement)) return;
      const index = Number(button.getAttribute("data-doc-index"));
      const file = pendingMatriculaDocumentos[index];
      if (!file) return;
      await triggerLocalFileDownload(file, file.name);
      return;
    });
    selectedDocsContainer.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const deleteButton = target.closest(".selected-doc-delete-btn");
      if (!(deleteButton instanceof HTMLButtonElement)) return;
      const index = Number(deleteButton.getAttribute("data-doc-index"));
      removePendingMatriculaDocumento(index);
    });
  }
  const prontuarioSelectedDocsContainer = document.getElementById("proSelectedDocs");
  if (prontuarioSelectedDocsContainer && !prontuarioSelectedDocsContainer.dataset.downloadBinding) {
    prontuarioSelectedDocsContainer.dataset.downloadBinding = "true";
    prontuarioSelectedDocsContainer.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const allButton = target.closest(".selected-doc-download-all-btn");
      if (allButton instanceof HTMLButtonElement) {
        const docsRaw = allButton.getAttribute("data-docs") || "[]";
        try {
          const docs = JSON.parse(decodeURIComponent(docsRaw));
          for (const docItem of docs) {
            const match = pendingProntuarioDocumentos.find((file) =>
              file.name === docItem.name &&
              Number(file.size || 0) === Number(docItem.size || 0) &&
              Number(file.lastModified || 0) === Number(docItem.lastModified || 0)
            );
            if (match) {
              await triggerLocalFileDownload(match, match.name);
            }
          }
        } catch (error) {
          console.error(error);
        }
        return;
      }
      const viewButton = target.closest(".selected-doc-view-btn");
      if (viewButton instanceof HTMLButtonElement) {
        const index = Number(viewButton.getAttribute("data-doc-index"));
        const file = pendingProntuarioDocumentos[index];
        if (!file) return;
        await triggerLocalFileView(file);
        return;
      }
      const button = target.closest(".selected-doc-download-btn");
      if (!(button instanceof HTMLButtonElement)) return;
      const index = Number(button.getAttribute("data-doc-index"));
      const file = pendingProntuarioDocumentos[index];
      if (!file) return;
      await triggerLocalFileDownload(file, file.name);
      return;
    });
    prontuarioSelectedDocsContainer.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const deleteButton = target.closest(".selected-doc-delete-btn");
      if (!(deleteButton instanceof HTMLButtonElement)) return;
      const index = Number(deleteButton.getAttribute("data-doc-index"));
      if (index < 0 || index >= pendingProntuarioDocumentos.length) return;
      pendingProntuarioDocumentos.splice(index, 1);
      syncProntuarioDocumentosInput();
      renderProntuarioSelectedDocs();
    });
  }
  const prontuarioPreviewContainer = document.getElementById("proDocumentosPreview");
  if (prontuarioPreviewContainer && !prontuarioPreviewContainer.dataset.downloadBinding) {
    prontuarioPreviewContainer.dataset.downloadBinding = "true";
    prontuarioPreviewContainer.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const allButton = target.closest(".doc-download-all-btn");
      if (allButton instanceof HTMLElement) {
        const filesRaw = allButton.getAttribute("data-files") || "";
        try {
          const files = JSON.parse(decodeURIComponent(filesRaw));
          if (!Array.isArray(files) || files.length === 0) return;
          for (const file of files) {
            await triggerDocumentDownload(String(file?.url || ""), String(file?.fileName || "documento"));
          }
        } catch (error) {
          console.error(error);
          alert("Nao foi possivel baixar todos os documentos.");
        }
        return;
      }
      const viewButton = target.closest(".doc-view-btn");
      if (viewButton instanceof HTMLElement) {
        const url = viewButton.getAttribute("data-url") || "";
        const fileName = viewButton.getAttribute("data-filename") || getFileNameFromUrl(url);
        openUrlInNewTab(url, fileName);
        return;
      }
      const downloadButton = target.closest(".doc-download-btn");
      if (!(downloadButton instanceof HTMLElement)) return;
      const url = downloadButton.getAttribute("data-url") || "";
      const fileName = downloadButton.getAttribute("data-filename") || "documento";
      await triggerDocumentDownload(url, fileName);
    });
  }
  const listFrequencia = document.getElementById("listFrequencia");
  if (listFrequencia && !listFrequencia.dataset.downloadBinding) {
    listFrequencia.dataset.downloadBinding = "true";
    listFrequencia.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const allButton = target.closest(".doc-download-all-btn");
      if (allButton instanceof HTMLElement) {
        const filesRaw = allButton.getAttribute("data-files") || "";
        try {
          const files = JSON.parse(decodeURIComponent(filesRaw));
          if (!Array.isArray(files) || files.length === 0) return;
          for (const file of files) {
            await triggerDocumentDownload(String(file?.url || ""), String(file?.fileName || "documento"));
          }
        } catch (error) {
          console.error(error);
          alert("Nao foi possivel baixar todos os anexos de justificativa.");
        }
        return;
      }

      const viewButton = target.closest(".doc-view-btn");
      if (viewButton instanceof HTMLElement) {
        const url = viewButton.getAttribute("data-url") || "";
        const fileName = viewButton.getAttribute("data-filename") || getFileNameFromUrl(url);
        openUrlInNewTab(url, fileName);
        return;
      }

      const downloadButton = target.closest(".doc-download-btn");
      if (!(downloadButton instanceof HTMLElement)) return;
      const url = downloadButton.getAttribute("data-url") || "";
      const fileName = downloadButton.getAttribute("data-filename") || "documento";
      await triggerDocumentDownload(url, fileName);
    });
  }
  const listMatriculas = document.getElementById("listMatriculas");
  if (listMatriculas && !listMatriculas.dataset.downloadBinding) {
    listMatriculas.dataset.downloadBinding = "true";
    listMatriculas.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const matriculaToggleButton = target.closest(".matricula-toggle-btn");
      if (matriculaToggleButton instanceof HTMLElement) {
        const item = matriculaToggleButton.closest(".item");
        if (!(item instanceof HTMLElement)) return;
        const collapsed = item.classList.toggle("collapsed");
        matriculaToggleButton.textContent = collapsed ? "Expandir" : "Recolher";
        matriculaToggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
        return;
      }
      const matriculaEditButton = target.closest(".matricula-edit-btn");
      if (matriculaEditButton instanceof HTMLElement) {
        const item = matriculaEditButton.closest(".item");
        if (!(item instanceof HTMLElement)) return;
        const matriculaId = item.dataset.matriculaId || "";
        if (!matriculaId) return;
        await loadMatriculaForEdit(matriculaId);
        return;
      }
      const matriculaDeleteButton = target.closest(".matricula-delete-btn");
      if (matriculaDeleteButton instanceof HTMLElement) {
        const item = matriculaDeleteButton.closest(".item");
        if (!(item instanceof HTMLElement)) return;
        const matriculaId = item.dataset.matriculaId || "";
        if (!matriculaId) return;
        if (!confirm("Deseja excluir esta matricula?")) return;

        const snap = await getDoc(doc(db, "matriculas", matriculaId));
        if (!snap.exists()) return;
        const data = snap.data() || {};
        const docs = Array.isArray(data.documentos_upload) ? data.documentos_upload : [];
        for (const uploaded of docs) {
          if (!uploaded?.caminho) continue;
          try {
            const token = await auth.currentUser.getIdToken();
            await fetch(STORAGE_DELETE_FUNCTION_URL, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ path: uploaded.caminho, schoolId: currentSchoolId() || "" })
            });
          } catch (error) {
            console.error(error);
          }
        }
        if (data?.foto_aluno?.caminho) {
          try {
            const token = await auth.currentUser.getIdToken();
            await fetch(STORAGE_DELETE_FUNCTION_URL, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ path: data.foto_aluno.caminho, schoolId: currentSchoolId() || "" })
            });
          } catch (error) {
            console.error(error);
          }
        }

        await deleteDoc(doc(db, "matriculas", matriculaId));
        const alunoId = slugify(data.aluno || item.dataset.aluno || "");
        if (alunoId) {
          const alunoRef = doc(db, "alunos", alunoId);
          const alunoSnap = await getDoc(alunoRef);
          if (alunoSnap.exists() && alunoSnap.data()?.matricula_id === matriculaId) {
            await deleteDoc(alunoRef);
          }
        }
        if (editingMatriculaId === matriculaId) {
          clearMatriculaForm();
        }
        return;
      }
      const viewButton = target.closest(".doc-view-btn");
      if (viewButton instanceof HTMLElement) {
        const url = viewButton.getAttribute("data-url") || "";
        const fileName = viewButton.getAttribute("data-filename") || getFileNameFromUrl(url);
        openUrlInNewTab(url, fileName);
        return;
      }
      const deleteButton = target.closest(".doc-delete-btn");
      if (deleteButton instanceof HTMLElement) {
        const item = deleteButton.closest(".item");
        if (!(item instanceof HTMLElement)) return;
        try {
          await deleteSavedMatriculaDocumento({
            matriculaId: item.dataset.matriculaId || "",
            docIndex: Number(deleteButton.getAttribute("data-index")),
            filePath: deleteButton.getAttribute("data-path") || "",
            aluno: item.dataset.aluno || ""
          });
        } catch (error) {
          console.error(error);
          alert("Nao foi possivel excluir o documento.");
        }
        return;
      }
      const allButton = target.closest(".doc-download-all-btn");
      if (allButton instanceof HTMLElement) {
        const filesRaw = allButton.getAttribute("data-files") || "";
        try {
          const files = JSON.parse(decodeURIComponent(filesRaw));
          if (!Array.isArray(files) || files.length === 0) return;
          for (const file of files) {
            await triggerDocumentDownload(String(file?.url || ""), String(file?.fileName || "documento"));
          }
        } catch (error) {
          console.error(error);
          alert("Nao foi possivel baixar todos os documentos.");
        }
        return;
      }
      const button = target.closest(".doc-download-btn");
      if (!(button instanceof HTMLElement)) return;
      const url = button.getAttribute("data-url") || "";
      const fileName = button.getAttribute("data-filename") || "documento";
      await triggerDocumentDownload(url, fileName);
    });
  }
  const listProntuarios = document.getElementById("listProntuarios");
  if (listProntuarios && !listProntuarios.dataset.downloadBinding) {
    listProntuarios.dataset.downloadBinding = "true";
    listProntuarios.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const prontuarioToggleButton = target.closest(".prontuario-toggle-btn");
      if (prontuarioToggleButton instanceof HTMLElement) {
        const item = prontuarioToggleButton.closest(".item");
        if (!(item instanceof HTMLElement)) return;
        const collapsed = item.classList.toggle("collapsed");
        prontuarioToggleButton.textContent = collapsed ? "Expandir" : "Recolher";
        prontuarioToggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
        return;
      }
      const allButton = target.closest(".doc-download-all-btn");
      if (allButton instanceof HTMLElement) {
        const filesRaw = allButton.getAttribute("data-files") || "";
        try {
          const files = JSON.parse(decodeURIComponent(filesRaw));
          if (!Array.isArray(files) || files.length === 0) return;
          for (const file of files) {
            await triggerDocumentDownload(String(file?.url || ""), String(file?.fileName || "documento"));
          }
        } catch (error) {
          console.error(error);
          alert("Nao foi possivel baixar todos os documentos.");
        }
        return;
      }
      const viewButton = target.closest(".doc-view-btn");
      if (viewButton instanceof HTMLElement) {
        const url = viewButton.getAttribute("data-url") || "";
        const fileName = viewButton.getAttribute("data-filename") || getFileNameFromUrl(url);
        openUrlInNewTab(url, fileName);
        return;
      }
      const downloadButton = target.closest(".doc-download-btn");
      if (downloadButton instanceof HTMLElement) {
        const url = downloadButton.getAttribute("data-url") || "";
        const fileName = downloadButton.getAttribute("data-filename") || "documento";
        await triggerDocumentDownload(url, fileName);
        return;
      }
      const deleteButton = target.closest(".doc-delete-btn");
      if (deleteButton instanceof HTMLElement) {
        const item = deleteButton.closest(".item");
        if (!(item instanceof HTMLElement)) return;
        await deleteSavedProntuarioDocumento({
          prontuarioId: item.dataset.prontuarioId || "",
          docIndex: Number(deleteButton.getAttribute("data-index")),
          filePath: deleteButton.getAttribute("data-path") || ""
        });
      }
    });
  }
  const listChat = document.getElementById("listChat");
  if (listChat && !listChat.dataset.chatBinding) {
    listChat.dataset.chatBinding = "true";
    listChat.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const readButton = target.closest(".chat-read-btn");
      if (!(readButton instanceof HTMLButtonElement)) return;
      const chatMessageId = readButton.getAttribute("data-chat-id") || "";
      if (!chatMessageId) return;
      readButton.disabled = true;
      try {
        await markChatMessageAsRead(chatMessageId);
      } catch (error) {
        console.error(error);
        alert("Nao foi possivel confirmar leitura da mensagem.");
        readButton.disabled = false;
      }
    });
  }
  const listRelatoriosBncc = document.getElementById("listRelatoriosBncc");
  if (listRelatoriosBncc && !listRelatoriosBncc.dataset.bnccBinding) {
    listRelatoriosBncc.dataset.bnccBinding = "true";
    listRelatoriosBncc.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const editButton = target.closest(".bncc-edit-btn");
      if (editButton instanceof HTMLButtonElement) {
        const reportId = editButton.getAttribute("data-bncc-id") || "";
        if (!reportId) return;
        const snap = await getDoc(doc(db, "relatorios_bncc", reportId));
        if (!snap.exists()) return;
        loadBnccReportForEdit(reportId, snap.data() || {});
        return;
      }
      const deleteButton = target.closest(".bncc-delete-btn");
      if (deleteButton instanceof HTMLButtonElement) {
        const reportId = deleteButton.getAttribute("data-bncc-id") || "";
        if (!reportId) return;
        await deleteBnccReport(reportId);
      }
    });
  }
  const listAnamnese = document.getElementById("listAnamnese");
  if (listAnamnese && !listAnamnese.dataset.anamneseBinding) {
    listAnamnese.dataset.anamneseBinding = "true";
    listAnamnese.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const groupHeader = target.closest(".anamnese-group-header");
      if (groupHeader instanceof HTMLButtonElement) {
        const wrapper = groupHeader.closest(".anamnese-group");
        if (wrapper instanceof HTMLElement) {
          wrapper.classList.toggle("collapsed");
        }
        return;
      }

      const item = target.closest(".item");
      if (!(item instanceof HTMLElement)) return;
      const anamneseId = item.dataset.anamneseId || "";
      if (!anamneseId) return;

      const cached = getCachedAnamneseById(anamneseId);
      const loadData = async () => {
        if (cached) return cached.data || {};
        const snap = await getDoc(doc(db, "fichas_anamnese", anamneseId));
        return snap.exists() ? snap.data() || {} : null;
      };

      const editButton = target.closest(".anamnese-edit-btn");
      if (editButton instanceof HTMLButtonElement) {
        if (!isFamilyOnlyRole()) {
          alert("A edicao da anamnese e permitida apenas para o perfil Responsavel.");
          return;
        }
        selectedAnamneseId = anamneseId;
        const data = await loadData();
        if (!data) {
          alert("Anamnese nao encontrada para edicao.");
          return;
        }
        loadAnamneseForEdit(anamneseId, data);
        renderAnamneseList();
        return;
      }

      const viewButton = target.closest(".anamnese-view-btn");
      if (viewButton instanceof HTMLButtonElement) {
        selectedAnamneseId = anamneseId;
        const data = await loadData();
        if (!data) {
          alert("Anamnese nao encontrada para visualizacao.");
          return;
        }
        loadAnamneseForEdit(anamneseId, data);
        applyAnamneseAccessLayout();
        renderAnamneseList();
        return;
      }

      const printButton = target.closest(".anamnese-print-btn");
      if (printButton instanceof HTMLButtonElement) {
        selectedAnamneseId = anamneseId;
        const data = await loadData();
        if (!data) {
          alert("Anamnese nao encontrada para impressao.");
          return;
        }
        loadAnamneseForEdit(anamneseId, data);
        applyAnamneseAccessLayout();
        renderAnamneseList();
        printAnamneseForm();
        return;
      }

      const deleteButton = target.closest(".anamnese-delete-btn");
      if (deleteButton instanceof HTMLButtonElement) {
        await deleteAnamnese(anamneseId);
      }
    });
  }
  document.getElementById("anaFiltroNome")?.addEventListener("input", () => {
    renderAnamneseList();
  });
  document.getElementById("anaFiltroTurma")?.addEventListener("change", () => {
    renderAnamneseList();
  });
  document.getElementById("btnAnaFiltroLimpar")?.addEventListener("click", () => {
    const campoNome = document.getElementById("anaFiltroNome");
    const campoTurma = document.getElementById("anaFiltroTurma");
    if (campoNome) campoNome.value = "";
    if (campoTurma) campoTurma.value = "";
    renderAnamneseList();
  });
  document.getElementById("matCep")?.addEventListener("blur", async () => {
    const cepField = document.getElementById("matCep");
    if (!cepField) return;
    const cep = normalizeCep(cepField.value);
    cepField.value = formatCep(cep);
    if (cep.length === 8) {
      await buscarEnderecoPorCep();
    }
  });

  document.getElementById("agendaAluno").addEventListener("change", syncAgendaBinding);
  document.getElementById("agendaAluno").addEventListener("blur", syncAgendaBinding);
  document.getElementById("matRespEmail")?.addEventListener("change", syncResponsibleUidFromEmail);
  document.getElementById("matRespEmail")?.addEventListener("blur", syncResponsibleUidFromEmail);
  document.getElementById("accUserSelect")?.addEventListener("change", (event) => {
    const uidField = document.getElementById("accUid");
    if (uidField) uidField.value = event.target.value || "";
  });

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
    setAgendaStatusField("rascunho");
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
        status: selectedAgendaData.resposta_responsavel ? "corrigido" : "leitura_confirmada",
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
        status: "corrigido",
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
      autor_role: currentProfile.role || "",
      created_at: serverTimestamp()
    }));
    await audit("create", "mural_avisos");
    showOk("okMural");
  };

  document.getElementById("btnChat").onclick = async () => {
    const paraSelect = document.getElementById("chatPara");
    const msgField = document.getElementById("chatMsg");
    if (!(paraSelect instanceof HTMLSelectElement) || !(msgField instanceof HTMLTextAreaElement)) return;
    if (!paraSelect.value) {
      alert("Selecione o destinatario da mensagem.");
      return;
    }
    const mensagem = msgField.value.trim();
    if (!mensagem) {
      alert("Digite a mensagem antes de enviar.");
      return;
    }

    const option = paraSelect.options[paraSelect.selectedIndex];
    const scope = option?.dataset.scope || "";
    const paraUid = option?.dataset.uid || (scope === "uid" ? paraSelect.value : "");
    const paraRole = option?.dataset.role || (scope === "role" ? paraSelect.value : "");
    const paraLabel = option?.dataset.label || option?.textContent || paraSelect.value;

    await addDoc(collection(db, "chat_mensagens"), withSchoolScope({
      para: paraLabel,
      para_scope: scope || (paraRole ? "role" : "uid"),
      para_uid: paraUid || null,
      para_role: paraRole || null,
      mensagem,
      de_uid: auth.currentUser.uid,
      de_email: auth.currentUser.email,
      de_nome: currentProfile.nome || auth.currentUser.email || "",
      de_role: currentProfile.role || "",
      read_by: {
        [auth.currentUser.uid]: new Date().toISOString()
      },
      updated_at: serverTimestamp(),
      created_at: serverTimestamp()
    }));
    msgField.value = "";
    await audit("create", "chat_mensagens");
    showOk("okChat");
  };

  document.getElementById("btnGaleria").onclick = async () => {
    const galeriaSelect = document.getElementById("galeriaAluno");
    const selectedAlunoId = galeriaSelect.value.trim();
    const selectedAluno = cachedStudents.find(({ id }) => id === selectedAlunoId);
    await addDoc(collection(db, "galeria_fotos"), withSchoolScope({
      aluno_turma: galeriaSelect.options[galeriaSelect.selectedIndex]?.text || selectedAlunoId,
      aluno_id: selectedAlunoId || null,
      turma: selectedAluno?.data.turma || null,
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
    const alunoId = document.getElementById("relAluno").value.trim();
    const faixaEtaria = document.getElementById("relFaixa").value;
    const idade = document.getElementById("relIdade").value.trim();
    const periodo = document.getElementById("relPeriodo").value.trim();
    const professor = document.getElementById("relProfessor").value.trim();
    const parecerGlobal = document.getElementById("relParecerGlobal").value.trim();
    const alunoEntry = cachedStudents.find(({ id }) => id === alunoId);
    const alunoNome = alunoEntry?.data?.nome || alunoId;
    const turma = alunoEntry?.data?.turma || "";

    if (!alunoId) {
      alert("Selecione o aluno para salvar o relatorio BNCC.");
      return;
    }

    const objetivos = collectBnccObjetivos();

    const payload = withSchoolScope({
      aluno: alunoNome,
      aluno_id: alunoId,
      turma,
      faixa_etaria: faixaEtaria,
      idade,
      periodo_letivo: periodo,
      professor,
      parecer_global: parecerGlobal,
      objetivos,
      campo_bncc: `Matriz ${faixaEtaria}`,
      avaliacao: parecerGlobal || `${objetivos.length} objetivos avaliados`,
      autor: auth.currentUser.email,
      autor_uid: auth.currentUser.uid,
      updated_at: serverTimestamp(),
      updated_by: auth.currentUser.uid
    });

    if (editingBnccReportId) {
      await setDoc(
        doc(db, "relatorios_bncc", editingBnccReportId),
        payload,
        { merge: true }
      );
      await audit("update", "relatorios_bncc");
    } else {
      await addDoc(collection(db, "relatorios_bncc"), {
        ...payload,
        created_at: serverTimestamp()
      });
      await audit("create", "relatorios_bncc");
    }

    setBnccEditMode(null);
    showOk("okRel");
  };

  document.getElementById("btnRelatorioLimpar").onclick = () => {
    limparFormularioBncc();
  };

  document.getElementById("btnRelatorioCancelar")?.addEventListener("click", () => {
    limparFormularioBncc(false);
  });

  document.getElementById("btnRelatorioPrint").onclick = () => {
    const modeSelect = document.getElementById("bnccPrintMode");
    const mode = modeSelect instanceof HTMLSelectElement ? modeSelect.value : "auto";
    printBnccTableOnly(mode);
  };

  resetPlanningEditor();

  document.getElementById("btnPlanReset")?.addEventListener("click", () => {
    resetPlanningEditor();
  });

  document.getElementById("btnPlanPrint")?.addEventListener("click", () => {
    printPlanningEditor();
  });

  document.getElementById("btnPlan").onclick = async () => {
    updatePlanningTimestamp();
    const editor = getPlanningEditor();
    const titulo = getPlanningRoleText("title") || "Planejamento Pedagogico Anual";
    const instituicao = getPlanningRoleText("institution");
    const anoLetivo = getPlanningRoleText("year");
    const coordenador = getPlanningRoleText("coordinator");
    const temaNorteador = getPlanningRoleText("theme");
    await addDoc(collection(db, "planejamento_aulas"), withSchoolScope({
      turma: document.getElementById("planTurma").value.trim(),
      faixa_etaria: document.getElementById("planFaixa").value.trim(),
      atividades: getPlanningSummaryText(),
      titulo,
      instituicao,
      ano_letivo: anoLetivo,
      coordenador,
      tema_norteador: temaNorteador,
      conteudo_html: editor ? editor.innerHTML.trim() : "",
      atualizado_em_label: currentPlanningTimestampLabel(),
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }));
    await audit("create", "planejamento_aulas");
    showOk("okPlan");
  };

  initAnamneseStepper();
  applyAnamneseAccessLayout();

  document.getElementById("btnAnamnese").onclick = async () => {
    if (!isFamilyOnlyRole()) {
      alert("Somente o perfil Responsavel pode preencher/editar a anamnese.");
      return;
    }
    const payload = withSchoolScope(buildAnamnesePayload());
    if (editingAnamneseId) {
      await setDoc(
        doc(db, "fichas_anamnese", editingAnamneseId),
        {
          ...payload,
          updated_at: serverTimestamp(),
          updated_by: auth.currentUser.uid
        },
        { merge: true }
      );
      await audit("update", "fichas_anamnese");
    } else {
      await addDoc(collection(db, "fichas_anamnese"), {
        ...payload,
        created_at: serverTimestamp(),
        created_by: auth.currentUser.uid
      });
      await audit("create", "fichas_anamnese");
    }
    clearAnamneseForm();
    applyAnamneseAccessLayout();
    showOk("okAna");
  };

  document.getElementById("btnAnamneseCancelar")?.addEventListener("click", () => {
    clearAnamneseForm();
    applyAnamneseAccessLayout();
  });

  document.getElementById("btnAnamnesePrint")?.addEventListener("click", () => {
    printAnamneseForm();
  });

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
    const turma = String(document.getElementById("freqTurma")?.value || "").trim();
    const dataFrequencia = String(document.getElementById("freqData")?.value || "").trim();
    if (!turma) {
      alert("Selecione a turma para salvar a frequencia.");
      return;
    }
    if (!dataFrequencia) {
      alert("Informe a data da frequencia.");
      return;
    }

    const rows = Array.from(document.querySelectorAll("#freqTurmaTableWrap tbody tr[data-aluno-id]"));
    if (!rows.length) {
      alert("Nenhum aluno encontrado para salvar frequencia nesta turma.");
      return;
    }

    const button = document.getElementById("btnFrequencia");
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      button.textContent = "Salvando frequencia...";
    }

    const registros = [];
    const folderDataSegment = dataFrequencia.replace(/-/g, "");
    try {
      for (const row of rows) {
        if (!(row instanceof HTMLTableRowElement)) continue;
        const alunoId = String(row.dataset.alunoId || "").trim();
        const alunoNome = String(row.dataset.alunoNome || "").trim();
        const presenteInput = row.querySelector(".freq-presente");
        const justificativaInput = row.querySelector(".freq-justificativa");
        const anexoInput = row.querySelector(".freq-anexo");
        const presente = presenteInput instanceof HTMLInputElement ? presenteInput.checked : true;
        const justificativa = justificativaInput instanceof HTMLTextAreaElement ? String(justificativaInput.value || "").trim() : "";
        const arquivo = anexoInput instanceof HTMLInputElement && anexoInput.files && anexoInput.files[0] ? anexoInput.files[0] : null;

        let documentoJustificativa = null;
        if (!presente && arquivo) {
          documentoJustificativa = await uploadMatriculaFile(arquivo, {
            alunoSlug: slugify(alunoNome || alunoId || "aluno"),
            folder: `frequencia-${folderDataSegment}`
          });
        }

        registros.push({
          aluno_id: alunoId,
          aluno: alunoNome,
          presente,
          justificativa: presente ? "" : justificativa,
          documento_justificativa: presente ? null : documentoJustificativa,
          documentos_upload: presente || !documentoJustificativa ? [] : [documentoJustificativa]
        });
      }

      const totalAlunos = registros.length;
      const presentes = registros.filter((registro) => registro.presente).length;
      const ausentes = totalAlunos - presentes;

      await addDoc(collection(db, "frequencia"), withSchoolScope({
        data: dataFrequencia,
        turma,
        total_alunos: totalAlunos,
        presentes,
        ausentes,
        registros,
        created_at: serverTimestamp(),
        created_by: auth.currentUser.uid
      }));
      await audit("create", "frequencia");
      showOk("okFreq");
      renderFrequenciaTurmaTable();
    } finally {
      if (button instanceof HTMLButtonElement) {
        button.disabled = false;
        button.textContent = "Salvar frequencia";
      }
    }
  };

  document.getElementById("btnFinanceLancar").onclick = async () => {
    const tipo = document.getElementById("finTipo")?.value === "despesa" ? "despesa" : "receita";
    const descricao = String(document.getElementById("finDescricao")?.value || "").trim();
    const categoria = String(document.getElementById("finCategoria")?.value || "").trim();
    const valor = Number(document.getElementById("finValor")?.value || 0);
    const dataLancamento = String(document.getElementById("finData")?.value || "").trim();

    if (!descricao) {
      alert("Informe a descricao/nome do aluno.");
      return;
    }
    if (!categoria) {
      alert("Selecione a categoria escolar.");
      return;
    }
    if (!(valor > 0)) {
      alert("Informe um valor maior que zero.");
      return;
    }
    if (!dataLancamento) {
      alert("Informe a data do lancamento.");
      return;
    }

    const recorrente = Boolean(document.getElementById("finRecorrente")?.checked);
    const metodo = document.getElementById("finMetodo")?.value || "Boleto";
    const statusReceita = document.getElementById("finStatus")?.value || "pendente";
    const existingFinance = editingFinanceId ? cachedFinanceTransactions.find((row) => row.id === editingFinanceId) : null;
    let cobrancaRef = String(existingFinance?.data?.cobranca_ref || "").trim();

    if (tipo === "receita") {
      if (cobrancaRef) {
        await setDoc(doc(db, "cobrancas", cobrancaRef), withSchoolScope({
          aluno: descricao,
          valor,
          vencimento: dataLancamento,
          metodo,
          status: statusReceita,
          recorrente,
          categoria_origem: categoria,
          updated_at: serverTimestamp(),
          updated_by: auth.currentUser.uid
        }), { merge: true });
        await audit("update", "cobrancas");
      } else {
        const cobrancaDoc = await addDoc(collection(db, "cobrancas"), withSchoolScope({
          aluno: descricao,
          valor,
          vencimento: dataLancamento,
          metodo,
          status: statusReceita,
          recorrente,
          categoria_origem: categoria,
          created_at: serverTimestamp(),
          created_by: auth.currentUser.uid
        }));
        cobrancaRef = cobrancaDoc.id;
        await audit("create", "cobrancas");
      }

      await atualizarReguaPorStatusCobranca({
        cobrancaId: cobrancaRef,
        status: statusReceita,
        linkBoleto: ""
      });
      await audit("update", "regua_cobranca.auto_sync");
    } else if (cobrancaRef) {
      try {
        const reguaSnap = await getDocs(scopedCollectionQuery("regua_cobranca", [where("cobranca_ref", "==", cobrancaRef), limit(120)]));
        for (const docSnap of reguaSnap.docs) {
          await deleteDoc(doc(db, "regua_cobranca", docSnap.id));
        }
        if (!reguaSnap.empty) {
          await audit("delete", "regua_cobranca.auto_cleanup");
        }
        await deleteDoc(doc(db, "cobrancas", cobrancaRef));
        await audit("delete", "cobrancas");
      } catch (error) {
        console.error(error);
      }
      cobrancaRef = "";
    }

    const payload = withSchoolScope({
      tipo: tipo === "receita" ? "receber" : "pagar",
      tipo_financeiro: tipo,
      descricao,
      categoria,
      valor,
      data_lancamento: dataLancamento,
      vencimento: dataLancamento,
      numero_nota: "",
      metodo: tipo === "receita" ? metodo : "",
      status: tipo === "receita" ? statusReceita : "aberto",
      cobranca_ref: cobrancaRef || null,
      recorrente,
      updated_at: serverTimestamp(),
      updated_by: auth.currentUser.uid
    });

    if (editingFinanceId) {
      await setDoc(doc(db, "fluxo_caixa", editingFinanceId), payload, { merge: true });
      await audit("update", "fluxo_caixa");
    } else {
      await addDoc(collection(db, "fluxo_caixa"), {
        ...payload,
        created_at: serverTimestamp(),
        created_by: auth.currentUser.uid
      });
      await audit("create", "fluxo_caixa");
    }

    resetFinanceForm();
    showOk("okCaixa");
  };

  document.getElementById("btnRegua").onclick = async () => {
    const cobrancaRef = document.getElementById("reguaRef").value.trim();
    const canal = document.getElementById("reguaCanal").value;
    const linkBoleto = document.getElementById("reguaLink")?.value.trim() || "";

    if (!cobrancaRef) {
      alert("Informe o ID da cobranca para gerar a regua automatica.");
      return;
    }

    const button = document.getElementById("btnRegua");
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      button.textContent = "Gerando regua...";
    }

    try {
      await gerarReguaAutomaticaParaCobranca({ cobrancaId: cobrancaRef, canal, linkBoleto });
      await audit("create", "regua_cobranca.automatica");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Nao foi possivel gerar a regua automatica.");
      return;
    } finally {
      if (button instanceof HTMLButtonElement) {
        button.disabled = false;
        button.textContent = "Gerar regua automatica";
      }
    }

    showOk("okRegua");
  };

  document.getElementById("btnMatricula").onclick = async () => {
    const maxDocumentoSizeBytes = 20 * 1024 * 1024;
    const allowedDocumentoMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
    const allowedDocumentoExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const aluno = document.getElementById("matAluno").value.trim();
    const dataNascimento = document.getElementById("matDataNascimento").value.trim();
    const responsavel = document.getElementById("matResp").value.trim();
    const turma = document.getElementById("matTurma").value.trim();
    if (!aluno) {
      alert("Informe o nome do aluno.");
      return;
    }

    await syncResponsibleUidFromEmail();
    const responsavelUid = document.getElementById("matRespUid").value.trim();
    const responsavelEmail = document.getElementById("matRespEmail").value.trim();
    const responsavelCpf = normalizeCpf(document.getElementById("matRespCpf").value.trim());
    const responsavelTelefone = formatPhone(document.getElementById("matRespTelefone").value.trim());
    const uploadStatus = document.getElementById("matUploadStatus");
    const alunoSlug = slugify(aluno) || `aluno-${Date.now()}`;
    const documentosInput = document.getElementById("matDocumentos");
    const fotoInput = document.getElementById("matFotoAluno");
    const documentosFiles = pendingMatriculaDocumentos.length ? [...pendingMatriculaDocumentos] : Array.from(documentosInput?.files || []);
    const fotoFile = fotoInput?.files?.[0] || capturedMatriculaPhotoFile || null;
    const totalUploads = documentosFiles.length + (fotoFile ? 1 : 0);
    let uploadedCount = 0;

    const documentosTipoInvalido = documentosFiles.filter((file) => {
      const mimeType = String(file.type || "").toLowerCase();
      if (allowedDocumentoMimeTypes.has(mimeType)) return false;
      const fileName = String(file.name || "").toLowerCase();
      return !allowedDocumentoExtensions.some((ext) => fileName.endsWith(ext));
    });
    if (documentosTipoInvalido.length) {
      const nomes = documentosTipoInvalido.map((file) => file.name).join(", ");
      alert(`Somente arquivos PDF, JPG ou PNG sao permitidos. Ajuste: ${nomes}`);
      if (uploadStatus) uploadStatus.textContent = "";
      return;
    }

    const documentosAcimaDoLimite = documentosFiles.filter((file) => file.size > maxDocumentoSizeBytes);
    if (documentosAcimaDoLimite.length) {
      const nomes = documentosAcimaDoLimite.map((file) => file.name).join(", ");
      alert(`Cada documento deve ter no maximo 20 MB. Ajuste: ${nomes}`);
      if (uploadStatus) uploadStatus.textContent = "";
      return;
    }

    const uploadedDocs = [];
    let fotoAluno = null;

    if (uploadStatus) uploadStatus.textContent = "";
    resetMatriculaUploadProgress();

    try {
      if (totalUploads > 0) {
        setMatriculaUploadProgress(0, totalUploads, "Preparando envio");
      }

      for (const file of documentosFiles) {
        setMatriculaUploadProgress(uploadedCount, totalUploads, `Enviando documento: ${file.name}`);
        const docUpload = await uploadMatriculaFile(file, { alunoSlug, folder: "documentos" });
        uploadedDocs.push(docUpload);
        uploadedCount += 1;
        setMatriculaUploadProgress(uploadedCount, totalUploads, `Documento enviado: ${file.name}`);
      }

      if (fotoFile) {
        setMatriculaUploadProgress(uploadedCount, totalUploads, "Enviando foto do aluno");
        fotoAluno = await uploadMatriculaFile(fotoFile, { alunoSlug, folder: "foto" });
        uploadedCount += 1;
        setMatriculaUploadProgress(uploadedCount, totalUploads, "Foto enviada");
      }

      if (uploadStatus && totalUploads > 0) {
        uploadStatus.textContent = "Arquivos enviados com sucesso.";
      }
    } catch (error) {
      console.error(error);
      if (uploadStatus) {
        uploadStatus.textContent = `Falha no upload: ${error.message || "tente novamente."}`;
      }
      return;
    }

    const endereco = {
      cep: normalizeCep(document.getElementById("matCep").value),
      logradouro: document.getElementById("matLogradouro").value.trim(),
      numero: document.getElementById("matNumero").value.trim(),
      complemento: document.getElementById("matComplemento").value.trim(),
      bairro: document.getElementById("matBairro").value.trim(),
      cidade: document.getElementById("matCidade").value.trim(),
      uf: document.getElementById("matUf").value.trim().toUpperCase(),
      referencia: document.getElementById("matReferencia").value.trim()
    };

    const isEditing = !!editingMatriculaId;
    let matriculaId = editingMatriculaId;
    let documentosPayload = uploadedDocs;
    let fotoPayload = fotoAluno;
    if (isEditing) {
      const existingSnap = await getDoc(doc(db, "matriculas", editingMatriculaId));
      const existingData = existingSnap.exists() ? existingSnap.data() : {};
      const existingDocs = Array.isArray(existingData?.documentos_upload) ? existingData.documentos_upload : [];
      documentosPayload = [...existingDocs, ...uploadedDocs];
      fotoPayload = fotoAluno || existingData?.foto_aluno || null;
      await setDoc(doc(db, "matriculas", editingMatriculaId), withSchoolScope({
        aluno,
        data_nascimento: dataNascimento || null,
        responsavel,
        turma,
        responsavel_uid: responsavelUid || null,
        responsavel_email: responsavelEmail || null,
        responsavel_cpf: responsavelCpf || null,
        responsavel_telefone: responsavelTelefone || null,
        endereco,
        documentos_url: document.getElementById("matDocUrl").value.trim(),
        documentos_upload: documentosPayload,
        foto_aluno: fotoPayload,
        contrato_assinado: document.getElementById("matContrato").checked,
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }), { merge: true });
    } else {
      const matriculaRef = await addDoc(collection(db, "matriculas"), withSchoolScope({
        aluno,
        data_nascimento: dataNascimento || null,
        responsavel,
        turma,
        responsavel_uid: responsavelUid || null,
        responsavel_email: responsavelEmail || null,
        responsavel_cpf: responsavelCpf || null,
        responsavel_telefone: responsavelTelefone || null,
        endereco,
        documentos_url: document.getElementById("matDocUrl").value.trim(),
        documentos_upload: documentosPayload,
        foto_aluno: fotoPayload,
        contrato_assinado: document.getElementById("matContrato").checked,
        created_at: serverTimestamp(),
        created_by: auth.currentUser.uid
      }));
      matriculaId = matriculaRef.id;
    }

    await setDoc(
      doc(db, "alunos", slugify(aluno)),
      withSchoolScope({
        nome: aluno,
        data_nascimento: dataNascimento || null,
        turma,
        responsavel_nome: responsavel,
        responsavel_uid: responsavelUid || null,
        responsavel_email: responsavelEmail || null,
        responsavel_cpf: responsavelCpf || null,
        responsavel_telefone: responsavelTelefone || null,
        endereco_residencial: endereco,
        foto_url: fotoPayload?.url || null,
        documentos_upload: documentosPayload,
        matricula_id: matriculaId,
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }),
      { merge: true }
    );
    await audit(isEditing ? "update" : "create", "matriculas");
    await audit("update", "alunos.vinculo_responsavel");

    if (responsavelCpf && !responsavelUid) {
      try {
        const respResult = await criarResponsavelDeMatriculaFn({
          nome: responsavel || responsavelCpf,
          cpf: responsavelCpf,
          escolaId: currentSchoolId(),
          matriculaId
        });
        const novoUid = respResult.data?.uid || null;
        if (novoUid) {
          const cpfEmail = `${responsavelCpf}@responsavel.escola`;
          const updatePayload = { responsavel_uid: novoUid, responsavel_email: cpfEmail, updated_at: serverTimestamp(), updated_by: auth.currentUser.uid };
          await setDoc(doc(db, "matriculas", matriculaId), updatePayload, { merge: true });
          await setDoc(doc(db, "alunos", slugify(aluno)), { responsavel_uid: novoUid, responsavel_email: cpfEmail, updated_at: serverTimestamp(), updated_by: auth.currentUser.uid }, { merge: true });
        }
      } catch (respErr) {
        console.warn("Nao foi possivel criar usuario do responsavel:", respErr);
      }
    }

    clearMatriculaForm();
    showOk("okMat");
  };

  document.getElementById("btnProntuario").onclick = async () => {
    const aluno = document.getElementById("proAluno").value.trim();
    const tipoDocumento = document.getElementById("proTipo").value.trim();
    const arquivosUrlRaw = document.getElementById("proArquivo").value;
    const uploadStatus = document.getElementById("proUploadStatus");
    const documentosInput = document.getElementById("proDocumentos");
    const maxDocumentoSizeBytes = 20 * 1024 * 1024;
    const allowedDocumentoMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
    const allowedDocumentoExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const documentosFiles = pendingProntuarioDocumentos.length ? [...pendingProntuarioDocumentos] : Array.from(documentosInput?.files || []);

    const documentosTipoInvalido = documentosFiles.filter((file) => {
      const mimeType = String(file.type || "").toLowerCase();
      if (allowedDocumentoMimeTypes.has(mimeType)) return false;
      const fileName = String(file.name || "").toLowerCase();
      return !allowedDocumentoExtensions.some((ext) => fileName.endsWith(ext));
    });
    if (documentosTipoInvalido.length) {
      const nomes = documentosTipoInvalido.map((file) => file.name).join(", ");
      alert(`Somente arquivos PDF, JPG ou PNG sao permitidos. Ajuste: ${nomes}`);
      if (uploadStatus) uploadStatus.textContent = "";
      return;
    }

    const documentosAcimaDoLimite = documentosFiles.filter((file) => file.size > maxDocumentoSizeBytes);
    if (documentosAcimaDoLimite.length) {
      const nomes = documentosAcimaDoLimite.map((file) => file.name).join(", ");
      alert(`Cada documento deve ter no maximo 20 MB. Ajuste: ${nomes}`);
      if (uploadStatus) uploadStatus.textContent = "";
      return;
    }

    const { documentos: documentosViaUrl, invalidUrls } = parseProntuarioUrlDocumentos(arquivosUrlRaw);
    if (invalidUrls.length) {
      alert(`As URLs abaixo sao invalidas. Informe uma URL por linha (http/https): ${invalidUrls.join(", ")}`);
      if (uploadStatus) uploadStatus.textContent = "";
      return;
    }

    const uploadedDocs = [];
    if (uploadStatus) uploadStatus.textContent = "";
    resetProntuarioUploadProgress();

    const alunoMatricula = await findAlunoByNome(aluno);
    const documentosMatricula = Array.isArray(alunoMatricula?.data?.documentos_upload) ? alunoMatricula.data.documentos_upload : [];

    try {
      if (documentosFiles.length > 0) {
        setProntuarioUploadProgress(0, documentosFiles.length, "Preparando envio");
      }
      let uploadedCount = 0;
      const alunoSlug = slugify(aluno) || `aluno-${Date.now()}`;
      for (const file of documentosFiles) {
        setProntuarioUploadProgress(uploadedCount, documentosFiles.length, `Enviando documento: ${file.name}`);
        const docUpload = await uploadMatriculaFile(file, { alunoSlug, folder: "prontuarios" });
        uploadedDocs.push(docUpload);
        uploadedCount += 1;
        setProntuarioUploadProgress(uploadedCount, documentosFiles.length, `Documento enviado: ${file.name}`);
      }
      if (uploadStatus && documentosFiles.length > 0) {
        uploadStatus.textContent = "Arquivos enviados com sucesso.";
      }
    } catch (error) {
      console.error(error);
      if (uploadStatus) {
        uploadStatus.textContent = `Falha no upload: ${error.message || "tente novamente."}`;
      }
      return;
    }

    const alunoIdentity = slugify(aluno);
    const existingSnapshot = await getDocs(scopedCollectionQuery("prontuarios", [limit(200)]));
    const existingDocs = existingSnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() || {} }))
      .filter((entry) => slugify(entry.data?.aluno || "") === alunoIdentity)
      .sort((left, right) => {
        const leftRef = left.data?.updated_at || left.data?.created_at;
        const rightRef = right.data?.updated_at || right.data?.created_at;
        const leftTs = leftRef && typeof leftRef.toDate === "function" ? leftRef.toDate().getTime() : 0;
        const rightTs = rightRef && typeof rightRef.toDate === "function" ? rightRef.toDate().getTime() : 0;
        return rightTs - leftTs;
      });

    const latest = existingDocs[0] || null;
    const existingUploads = existingDocs.flatMap((entry) => Array.isArray(entry.data?.documentos_upload) ? entry.data.documentos_upload : []);
    const existingArquivoUrls = existingDocs.flatMap((entry) => {
      if (Array.isArray(entry.data?.arquivos_url)) return entry.data.arquivos_url;
      if (entry.data?.arquivo_url) return [entry.data.arquivo_url];
      return [];
    });
    const mergedArquivoUrls = Array.from(new Set([...existingArquivoUrls, ...documentosViaUrl.map((doc) => doc.url)]));
    const documentosPayload = mergeUniqueDocumentos([...existingUploads, ...uploadedDocs, ...documentosViaUrl]);

    if (latest?.id) {
      await setDoc(doc(db, "prontuarios", latest.id), withSchoolScope({
        aluno,
        tipo_documento: tipoDocumento || latest.data.tipo_documento || "",
        arquivo_url: mergedArquivoUrls[0] || latest.data.arquivo_url || "",
        arquivos_url: mergedArquivoUrls,
        documentos_matricula: mergeUniqueDocumentos([
          ...existingDocs.flatMap((entry) => Array.isArray(entry.data?.documentos_matricula) ? entry.data.documentos_matricula : []),
          ...documentosMatricula
        ]),
        documentos_upload: documentosPayload,
        observacao: document.getElementById("proObs").value.trim() || latest.data.observacao || "",
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }), { merge: true });
      const staleDocs = existingDocs.filter((entry) => entry.id !== latest.id);
      for (const stale of staleDocs) {
        await deleteDoc(doc(db, "prontuarios", stale.id));
      }
      await audit("update", "prontuarios");
    } else {
      await addDoc(collection(db, "prontuarios"), withSchoolScope({
        aluno,
        tipo_documento: tipoDocumento,
        arquivo_url: documentosViaUrl[0]?.url || "",
        arquivos_url: documentosViaUrl.map((doc) => doc.url),
        documentos_matricula: documentosMatricula,
        documentos_upload: documentosPayload,
        observacao: document.getElementById("proObs").value.trim(),
        created_at: serverTimestamp(),
        created_by: auth.currentUser.uid
      }));
      await audit("create", "prontuarios");
    }
    clearProntuarioForm();
    showOk("okPro");
  };

  const btnAcesso = document.getElementById("btnAcesso");
  if (btnAcesso instanceof HTMLButtonElement) btnAcesso.onclick = async () => {
    if (!isSuperUser() && !["superadmin", "admin", "direcao"].includes(currentProfile.role || "")) {
      alert("Somente direcao/admin pode alterar permissoes.");
      return;
    }
    const uid = document.getElementById("accUid").value.trim();
    if (!uid) {
      alert("Selecione um usuario na lista.");
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

  const btnUsuarioCriar = document.getElementById("btnUsuarioCriar");
  if (btnUsuarioCriar instanceof HTMLButtonElement) btnUsuarioCriar.onclick = async () => {
    if (!isSuperUser() && !["superadmin", "admin", "direcao"].includes(currentProfile.role || "")) {
      alert("Somente direcao/admin pode criar usuarios.");
      return;
    }

    const nome = document.getElementById("newUserName").value.trim();
    const email = document.getElementById("newUserEmail").value.trim();
    const role = document.getElementById("newUserRole").value;
    if (!nome || !email || !role) {
      alert("Informe nome, email e perfil para criar o usuario.");
      return;
    }

    const response = await criarUsuarioEscolaFn({
      nome,
      email,
      role,
      escolaId: document.getElementById("accEscola")?.value.trim() || currentSchoolId() || null,
      senhaTemporaria: document.getElementById("newUserPassword").value.trim() || null
    });
    const data = response.data || {};
    const generatedPassword = data.temporaryPassword || document.getElementById("newUserPassword").value.trim() || "-";

    document.getElementById("accUid").value = data.uid || "";
    document.getElementById("newUserPassword").value = generatedPassword === "-" ? "" : generatedPassword;
    document.getElementById("okUsuarioCriado").textContent = `Usuario criado: ${email} | Senha temporaria: ${generatedPassword}`;
    showOk("okUsuarioCriado");
  };

  document.getElementById("btnFaixaCriar").onclick = async () => {
    const nome = document.getElementById("faixaNome").value.trim();
    const descricao = document.getElementById("faixaDescricao").value.trim();
    if (!nome) {
      alert("Informe o nome da faixa etaria.");
      return;
    }
    const faixaId = slugify(nome) || `faixa-${Date.now()}`;
    await setDoc(doc(db, "faixas_etarias", faixaId), withSchoolScope({
      nome,
      descricao,
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    }), { merge: true });
    await audit("create", "faixas_etarias");
    document.getElementById("faixaNome").value = "";
    document.getElementById("faixaDescricao").value = "";
    showOk("okFaixa");
  };

  document.getElementById("btnTurma").onclick = async () => {
    await addDoc(collection(db, "turmas"), withSchoolScope({
      nome: document.getElementById("turmaNome").value.trim(),
      faixa_etaria: document.getElementById("turmaFaixa").value.trim(),
      faixa_etaria_id: document.getElementById("turmaFaixa").value.trim(),
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
    const alunoSelect = document.getElementById("lgpdAluno");
    const responsavelInput = document.getElementById("lgpdResp");
    const alunoId = alunoSelect?.value || "";
    const alunoEntry = cachedStudents.find(({ id }) => id === alunoId);
    const aluno = alunoEntry?.data?.nome || "";
    const responsavel = responsavelInput?.value.trim() || alunoEntry?.data?.responsavel_nome || alunoEntry?.data?.responsavel || "";
    const consentComunicacao = readRadioConsent("lgpdScopeComunicacao");
    const consentSemanal = readRadioConsent("lgpdScopeSemanal");
    const consentEventos = readRadioConsent("lgpdScopeEventos");

    if (!alunoId || !aluno || !responsavel) {
      alert("Selecione o aluno para preencher o responsavel legal automaticamente.");
      return;
    }

    if (consentComunicacao === null || consentSemanal === null || consentEventos === null) {
      alert("Marque SIM ou NAO para os 3 escopos do termo LGPD.");
      return;
    }

    const matriculaId = resolveMatriculaIdForAluno(alunoEntry, aluno);
    if (!matriculaId) {
      alert("Nao foi encontrada uma matricula vinculada para este aluno. O consentimento nao foi registrado.");
      return;
    }

    const consentPayload = {
      aluno,
      aluno_id: alunoId,
      matricula_id: matriculaId,
      responsavel,
      escopos: {
        comunicacao_whatsapp: consentComunicacao,
        fotos_videos_semanais: consentSemanal,
        fotos_videos_eventos_redes: consentEventos
      },
      termo_nome: "TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS DE MENORES (LGPD)",
      versao: "1.0",
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    };

    let consentRef;
    if (editingLgpdConsentId) {
      consentRef = doc(db, "lgpd_consentimentos", editingLgpdConsentId);
      await setDoc(
        consentRef,
        withSchoolScope({
          ...consentPayload,
          updated_at: serverTimestamp(),
          updated_by: auth.currentUser.uid
        }),
        { merge: true }
      );
    } else {
      consentRef = await addDoc(collection(db, "lgpd_consentimentos"), withSchoolScope(consentPayload));
    }
    await setDoc(
      doc(db, "matriculas", matriculaId),
      withSchoolScope({
        lgpd_consentimento: {
          consentimento_id: consentRef.id,
          aluno_id: alunoId,
          aluno,
          responsavel,
          escopos: consentPayload.escopos,
          termo_nome: consentPayload.termo_nome,
          versao: consentPayload.versao,
          registrado_em: serverTimestamp(),
          registrado_por: auth.currentUser.uid
        },
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }),
      { merge: true }
    );
    await audit("update", "matriculas.lgpd_consentimento");
    await audit(editingLgpdConsentId ? "update" : "create", "lgpd_consentimentos");
    openLgpdNoticeModal({
      responsavel,
      phone: String(alunoEntry?.data?.responsavel_telefone || alunoEntry?.data?.telefone_responsavel || "").trim()
    });
    clearLgpdFormSelection();
    setLgpdEditMode(null);
    showOk("okLgpd");
  };

  document.getElementById("btnLgpdCancelar")?.addEventListener("click", () => {
    clearLgpdFormSelection();
    setLgpdEditMode(null);
  });

  document.getElementById("closeLgpdNotice")?.addEventListener("click", closeLgpdNoticeModal);
  document.getElementById("btnLgpdNoticeFechar")?.addEventListener("click", closeLgpdNoticeModal);
  document.getElementById("btnLgpdNoticeWhatsapp")?.addEventListener("click", sendLgpdNoticeToWhatsapp);
  document.getElementById("lgpdNoticeModal")?.addEventListener("click", (event) => {
    if (event.target && event.target.id === "lgpdNoticeModal") {
      closeLgpdNoticeModal();
    }
  });

  const listLgpd = document.getElementById("listLgpd");
  if (listLgpd && !listLgpd.dataset.actionBinding) {
    listLgpd.dataset.actionBinding = "true";
    listLgpd.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const toggleButton = target.closest(".lgpd-toggle-btn");
      if (toggleButton instanceof HTMLElement) {
        const item = toggleButton.closest(".item");
        if (!(item instanceof HTMLElement)) return;
        const collapsed = item.classList.toggle("collapsed");
        toggleButton.textContent = collapsed ? "Expandir" : "Recolher";
        toggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
        return;
      }

      const editButton = target.closest(".lgpd-edit-btn");
      if (editButton instanceof HTMLElement) {
        const item = editButton.closest(".item");
        if (!(item instanceof HTMLElement)) return;
        const consentId = item.dataset.lgpdConsentId || "";
        if (!consentId) return;
        const snap = await getDoc(doc(db, "lgpd_consentimentos", consentId));
        if (!snap.exists()) {
          alert("Consentimento LGPD nao encontrado para edicao.");
          return;
        }
        loadLgpdConsentForEdit(consentId, snap.data() || {});
        return;
      }

      const deleteButton = target.closest(".lgpd-delete-btn");
      if (deleteButton instanceof HTMLElement) {
        const item = deleteButton.closest(".item");
        if (!(item instanceof HTMLElement)) return;
        const consentId = item.dataset.lgpdConsentId || "";
        if (!consentId) return;
        const snap = await getDoc(doc(db, "lgpd_consentimentos", consentId));
        if (!snap.exists()) {
          alert("Consentimento LGPD nao encontrado para exclusao.");
          return;
        }
        await deleteLgpdConsent(consentId, snap.data() || {});
      }
    });
  }

  document.getElementById("btnSchoolSave").onclick = async () => {
    if (!isSuperAdmin()) {
      alert("Acesso restrito ao superadmin.");
      return;
    }
    const schoolId = document.getElementById("schoolId").value.trim();
    const schoolName = document.getElementById("schoolName").value.trim();
    if (!schoolId || !schoolName) {
      alert("Informe o ID e o nome da escola.");
      return;
    }
    const existingSchool = await getDoc(doc(db, "escolas", schoolId));
    const payload = {
      escola_id: schoolId,
      nome: schoolName,
      cidade: document.getElementById("schoolCity").value.trim(),
      status: document.getElementById("schoolStatus").value,
      updated_at: serverTimestamp(),
      updated_by: auth.currentUser.uid
    };
    if (!existingSchool.exists()) {
      payload.created_at = serverTimestamp();
      payload.created_by = auth.currentUser.uid;
    }
    await setDoc(doc(db, "escolas", schoolId), payload, { merge: true });
    await audit(selectedSchoolId ? "update" : "create", "escolas");
    showOk("okSchool");
  };

  document.getElementById("btnSchoolClear").onclick = clearSchoolForm;
  document.getElementById("btnSchoolInactivate").onclick = async () => {
    if (!isSuperAdmin()) {
      alert("Acesso restrito ao superadmin.");
      return;
    }
    if (!document.getElementById("schoolId").value.trim()) {
      alert("Selecione ou informe uma escola.");
      return;
    }
    if (!confirm("Tem certeza que deseja inativar esta escola?")) {
      return;
    }
    setSchoolStatus("inativa");
    await document.getElementById("btnSchoolSave").onclick();
  };

  document.getElementById("btnDirectorCreate").onclick = async () => {
    if (!isSuperAdmin()) {
      alert("Acesso restrito ao superadmin.");
      return;
    }
    const payload = {
      uid: null,
      nome: document.getElementById("directorName").value.trim(),
      email: document.getElementById("directorEmail").value.trim(),
      escolaId: document.getElementById("directorSchoolId").value.trim(),
      senhaTemporaria: document.getElementById("directorTempPassword").value.trim() || null,
      status: document.getElementById("directorStatus").value
    };
    const response = await criarDiretorEscolaFn(payload);
    const data = response.data || {};
    document.getElementById("directorUid").value = data.uid || payload.uid || "";
    document.getElementById("directorTempPassword").value = data.temporaryPassword || payload.senhaTemporaria || "";
    document.getElementById("okDirector").textContent = `Diretor cadastrado com sucesso. Senha temporaria: ${data.temporaryPassword || payload.senhaTemporaria || "-"}`;
    showOk("okDirector");
  };

  document.getElementById("btnDirectorSave").onclick = async () => {
    if (!isSuperAdmin()) {
      alert("Acesso restrito ao superadmin.");
      return;
    }
    const uid = document.getElementById("directorUid").value.trim();
    if (!uid) {
      alert("Cadastre ou selecione um diretor para salvar alteracoes.");
      return;
    }
    await setDoc(
      doc(db, "usuarios", uid),
      {
        uid,
        nome: document.getElementById("directorName").value.trim(),
        email: document.getElementById("directorEmail").value.trim(),
        role: "direcao",
        escola_id: document.getElementById("directorSchoolId").value.trim(),
        status: document.getElementById("directorStatus").value,
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      },
      { merge: true }
    );
    await audit("update", "diretores");
    showOk("okDirector");
  };

  document.getElementById("btnDirectorClear").onclick = clearDirectorForm;
  document.getElementById("btnDirectorResetPassword").onclick = async () => {
    if (!isSuperAdmin()) {
      alert("Acesso restrito ao superadmin.");
      return;
    }
    const uid = document.getElementById("directorUid").value.trim();
    if (!uid) {
      alert("Cadastre ou selecione um diretor para redefinir a senha.");
      return;
    }
    const response = await resetDiretorSenhaFn({
      uid,
      password: document.getElementById("directorTempPassword").value.trim() || null
    });
    const data = response.data || {};
    document.getElementById("directorTempPassword").value = data.temporaryPassword || "";
    document.getElementById("okDirector").textContent = `Senha redefinida com sucesso. Nova senha: ${data.temporaryPassword || "-"}`;
    showOk("okDirector");
  };

  document.getElementById("btnDirectorToggleStatus").onclick = async () => {
    if (!isSuperAdmin()) {
      alert("Acesso restrito ao superadmin.");
      return;
    }
    const uid = document.getElementById("directorUid").value.trim();
    if (!uid) {
      alert("Cadastre ou selecione um diretor para alterar status.");
      return;
    }
    const nextStatus = document.getElementById("directorStatus").value === "ativo" ? "inativo" : "ativo";
    if (!confirm(`Tem certeza que deseja marcar este diretor como ${nextStatus}?`)) {
      return;
    }
    const response = await setDiretorStatusFn({ uid, status: nextStatus });
    const data = response.data || {};
    setDirectorStatusField(data.status || nextStatus);
    document.getElementById("okDirector").textContent = `Diretor ${data.status || nextStatus} com sucesso.`;
    showOk("okDirector");
  };

  document.getElementById("btnMigrarResponsaveisUsuarios")?.addEventListener("click", async () => {
    const statusEl = document.getElementById("statusMigrarResponsaveisUsuarios");
    const btn = document.getElementById("btnMigrarResponsaveisUsuarios");
    if (!confirm("Isso criará usuários de login para todos os responsáveis com CPF cadastrados. Continuar?")) return;
    btn.disabled = true;
    if (statusEl) statusEl.textContent = "Processando...";
    try {
      const result = await migrarResponsaveisUsuariosFn({});
      const d = result.data || {};
      if (statusEl) statusEl.textContent = `Concluído: ${d.created || 0} criado(s), ${d.skipped || 0} ignorado(s), ${d.errors?.length || 0} erro(s).`;
    } catch (err) {
      if (statusEl) statusEl.textContent = `Erro: ${err.message || err}`;
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("schoolSearch")?.addEventListener("input", renderSuperadminSchools);
  document.getElementById("directorSearch")?.addEventListener("input", renderSuperadminDirectors);

  document.getElementById("btnMigrarResponsaveis")?.addEventListener("click", async () => {
    const statusEl = document.getElementById("statusMigrarResponsaveis");
    const btn = document.getElementById("btnMigrarResponsaveis");
    if (!confirm("Isso criará usuários de login para todos os responsáveis com CPF cadastrados. Continuar?")) return;
    btn.disabled = true;
    if (statusEl) statusEl.textContent = "Processando...";
    try {
      const result = await migrarResponsaveisUsuariosFn({});
      const d = result.data || {};
      if (statusEl) statusEl.textContent = `Concluído: ${d.created || 0} criado(s), ${d.skipped || 0} ignorado(s), ${d.errors?.length || 0} erro(s).`;
    } catch (err) {
      if (statusEl) statusEl.textContent = `Erro: ${err.message || err}`;
    } finally {
      btn.disabled = false;
    }
  });
  document.getElementById("schoolCityFilter")?.addEventListener("input", updateSuperadminSummary);
  document.getElementById("schoolSortMetric")?.addEventListener("change", updateSuperadminSummary);
}

function attachLists() {
  if (!isFamilyOnlyRole()) {
    iniciarProcessadorReguaNoChat();
  }

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
    const isFamily = currentProfile.role === "responsavel";
    const docs = snap.docs
      .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }))
      .filter(({ data }) => !isFamily || (data.status && data.status !== "rascunho"))
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
          `Status: ${agendaStatusLabel(data.status)}`,
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

  const MURAL_ROLES_VISIVEIS = new Set(["professor", "direcao", "admin", "superadmin"]);
  attachList("mural_avisos", "listMural", (_, data) =>
    renderItem(data.titulo || "Aviso", [`Tipo: ${data.tipo || "-"}`, data.texto || "Sem texto"], data.created_at),
    isFamilyOnlyRole() ? { filter: (data) => MURAL_ROLES_VISIVEIS.has(data.autor_role) } : {}
  );

  const chatQuery = scopedCollectionQuery("chat_mensagens", [limit(120)]);
  const offChat = onSnapshot(chatQuery, (snap) => {
    const list = document.getElementById("listChat");
    if (!list) return;
    list.innerHTML = "";
    if (snap.empty) {
      list.innerHTML = "<p class=\"small\">Sem mensagens ainda.</p>";
      updateChatUnreadBadge([]);
      return;
    }
    const rows = snap.docs
      .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }))
      .filter((row) => canCurrentUserReadChatMessage(row.data))
      .sort((left, right) => {
        const leftValue = left.data.created_at;
        const rightValue = right.data.created_at;
        const leftTs = leftValue && typeof leftValue.toDate === "function" ? leftValue.toDate().getTime() : 0;
        const rightTs = rightValue && typeof rightValue.toDate === "function" ? rightValue.toDate().getTime() : 0;
        return rightTs - leftTs;
      });

    if (!rows.length) {
      list.innerHTML = "<p class=\"small\">Sem mensagens para o seu perfil.</p>";
      updateChatUnreadBadge([]);
      return;
    }
    updateChatUnreadBadge(rows);
    rows.forEach((row) => list.appendChild(renderChatMessageItem(row.id, row.data)));
  });
  detachListeners.push(offChat);

  const galeriaFilter = isFamilyOnlyRole() ? (() => {
    const childIds = new Set(cachedStudents.map(({ id }) => id));
    const childTurmas = new Set(cachedStudents.map(({ data }) => (data.turma || "").trim().toLowerCase()).filter(Boolean));
    return (data) => {
      if (data.aluno_id && childIds.has(data.aluno_id)) return true;
      if (data.turma && childTurmas.has((data.turma || "").trim().toLowerCase())) return true;
      return false;
    };
  })() : null;
  attachList("galeria_fotos", "listGaleria", (_, data) =>
    renderItem(
      `Galeria - ${data.aluno_turma || "sem turma"}`,
      [`URL: ${data.foto_url || "-"}`, `Legenda: ${data.legenda || "-"}`],
      data.created_at
    ),
    galeriaFilter ? { filter: galeriaFilter } : {}
  );
  attachList("autorizacoes_digitais", "listAutorizacoes", (_, data) =>
    renderItem(
      `Autorizacao - ${data.aluno || "sem aluno"}`,
      [`Tipo: ${data.tipo || "-"}`, `Terceiro: ${data.terceiro_autorizado || "-"}`],
      data.created_at
    )
  );

  const anamneseQuery = isFamilyOnlyRole()
    ? scopedCollectionQuery("fichas_anamnese", [where("responsavel_uid", "==", auth.currentUser.uid), limit(500)])
    : scopedCollectionQuery("fichas_anamnese", [limit(500)]);
  const offAnamnese = onSnapshot(anamneseQuery, (snap) => {
    cachedAnamneseRecords = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() || {} }));
    populateAnamneseTurmaFilterOptions();
    renderAnamneseList();
  });
  detachListeners.push(offAnamnese);

  if (!isFamilyOnlyRole()) {
  attachList("relatorios_bncc", "listRelatoriosBncc", (id, data) => renderBnccReportItem(id, data));
  attachList("planejamento_aulas", "listPlanejamento", (_, data) =>
    renderItem(
      `${data.titulo || `Planejamento - ${data.turma || "turma"}`}`,
      [
        `Turma: ${data.turma || "-"}`,
        `Faixa: ${data.faixa_etaria || "-"}`,
        `Tema: ${data.tema_norteador || "-"}`,
        data.atividades || "Sem atividades"
      ],
      data.created_at
    )
  );

  attachList("ocorrencias", "listOcorrencias", (_, data) =>
    renderItem(`Ocorrencia - ${data.aluno || "aluno"}`, [`Tipo: ${data.tipo || "-"}`, data.descricao || "Sem descricao"], data.created_at)
  );
  attachList("frequencia", "listFrequencia", (_, data) =>
    (() => {
      if (Array.isArray(data.registros) && data.registros.length) {
        const total = Number(data.total_alunos || data.registros.length || 0);
        const presentes = Number(data.presentes || data.registros.filter((registro) => Boolean(registro?.presente)).length || 0);
        const ausentes = Number(data.ausentes || Math.max(0, total - presentes));
        const anexosJustificativa = data.registros.filter((registro) => {
          const doc = registro?.documento_justificativa;
          return Boolean(doc && typeof doc === "object" && String(doc.url || "").trim());
        }).length;
        const detalhes = [
          `Data: ${data.data || "-"}`,
          `Presencas: ${presentes}/${total}`,
          `Ausencias: ${ausentes}`,
          `Anexos de justificativa: ${anexosJustificativa}`,
          renderFrequenciaAusencias(data.registros)
        ];
        return renderItem(`Frequencia - ${data.turma || "turma"}`, detalhes, data.created_at);
      }

      return renderItem(`Frequencia - ${data.aluno || "aluno"}`, [`Data: ${data.data || "-"}`, `Presente: ${data.presente ? "sim" : "nao"}`], data.created_at);
    })()
  );

  attachList("regua_cobranca", "listRegua", (_, data) =>
    renderItem(
      `Regua - ${data.etapa_label || "etapa"} | ref ${data.cobranca_ref || "-"}`,
      [`Canal: ${data.canal || "-"}`, `Envio: ${data.enviar_em || "-"}`, `Status: ${data.status || "-"}`, `Mensagem: ${data.mensagem || "-"}`],
      data.created_at
    )
  );

  const offFluxoFinanceiro = onSnapshot(scopedCollectionQuery("fluxo_caixa", [limit(500)]), (snap) => {
    cachedFinanceTransactions = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() || {} }));
    renderFinanceDashboardAndTable(cachedFinanceTransactions);
  });
  detachListeners.push(offFluxoFinanceiro);

  attachList("matriculas", "listMatriculas", (id, data) => {
    const item = renderMatriculaItem(data, data.created_at);
    item.dataset.matriculaId = id;
    item.dataset.aluno = data.aluno || "";
    return item;
  });
  attachList("alunos", "listAlunos", (_, data) =>
    renderItem(
      `Aluno - ${data.nome || "aluno"}`,
      [
        `Turma: ${data.turma || "-"}`,
        `Responsavel: ${data.responsavel_nome || "-"}`,
        `Email do responsavel: ${data.responsavel_email || "-"}`,
        `CPF do responsavel: ${formatCpf(data.responsavel_cpf || "") || "-"}`,
        `Telefone do responsavel: ${data.responsavel_telefone || "-"}`
      ],
      data.updated_at || data.created_at
    )
  );
  attachList("prontuarios", "listProntuarios", (id, data) => {
    const item = renderProntuarioItem(data, data.updated_at || data.created_at);
    item.dataset.prontuarioId = id || "";
    item.dataset.aluno = data.aluno || "";
    return item;
  }, { dedupeBy: (data) => slugify(data.aluno || "") });

  attachList(
    "usuarios",
    "listUsuarios",
    (id, data) => renderItem(`Usuario - ${data.email || id}`, [`Identificador: ${id}`, `Perfil: ${data.role || "-"}`], data.updated_at || data.created_at),
    { orderByField: "updated_at" }
  );
  } // end !isFamilyOnlyRole()
  const renderFaixasEtarias = () => {
    const list = document.getElementById("listFaixas");
    if (!list) return;
    list.innerHTML = "";
    const faixas = cachedFaixasEtarias
      .map(({ id, data }) => ({ id, nome: data.nome || id, descricao: data.descricao || "" }))
      .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
    if (faixas.length === 0) {
      list.innerHTML = "<p class=\"small\">Nenhuma faixa etaria cadastrada.</p>";
      return;
    }
    faixas.forEach(({ id, nome, descricao }) => {
      const item = renderItem(`Faixa - ${nome}`, descricao ? [descricao] : [], null);
      list.appendChild(item);
    });
  };
  renderFaixasEtarias();

  const offTurmas = onSnapshot(scopedCollectionQuery("turmas", [limit(100)]), (snap) => {
    cachedTurmas = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
    populateMatriculaTurmaOptions();
    populatePlanTurmaOptions();
    populateFrequenciaTurmaOptions();
    renderFrequenciaTurmaTable();
    populateProntuarioFiltroOptions();
    populateAnamneseTurmaFilterOptions();

    const list = document.getElementById("listTurmas");
    if (!list) return;
    list.innerHTML = "";
    if (snap.empty) {
      list.innerHTML = "<p class=\"small\">Sem registros ainda.</p>";
      return;
    }

    const docs = cachedTurmas
      .slice()
      .sort((left, right) => {
        const leftValue = left.data.created_at;
        const rightValue = right.data.created_at;
        const leftTs = leftValue && typeof leftValue.toDate === "function" ? leftValue.toDate().getTime() : 0;
        const rightTs = rightValue && typeof rightValue.toDate === "function" ? rightValue.toDate().getTime() : 0;
        return rightTs - leftTs;
      });

    docs.forEach(({ data }) => {
      list.appendChild(renderItem(
        `Turma - ${data.nome || "-"}`,
        [`Faixa: ${data.faixa_etaria || "-"}`, `Limite: ${data.limite_alunos || 0}`],
        data.created_at
      ));
    });
  });
  detachListeners.push(offTurmas);

  if (!isFamilyOnlyRole()) {
  attachList("portaria_retiradas", "listPortaria", (_, data) =>
    renderItem(
      `Retirada - ${data.aluno || "aluno"}`,
      [`Por: ${data.retirado_por || "-"}`, `RG: ${data.rg || "-"}`, `Parentesco: ${data.parentesco || "-"}`],
      data.created_at
    )
  );
  attachList("lgpd_consentimentos", "listLgpd", (id, data) => renderLgpdConsentItem(id, data));

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
  } // end !isFamilyOnlyRole() portaria/lgpd/financeiro

  if (isSuperUser()) {
    const offEscolas = onSnapshot(scopedCollectionQuery("escolas", [limit(100)]), (snap) => {
      cachedSchools = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
      populateDirectorSchoolOptions();
      renderSuperadminSchools();
    });
    detachListeners.push(offEscolas);
  }

  if (!isFamilyOnlyRole()) {
    const offDiretores = onSnapshot(scopedCollectionQuery("usuarios", [limit(200)]), (snap) => {
      cachedUsers = snap.docs
        .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
      cachedDirectors = cachedUsers
        .filter(({ data }) => data.role === "direcao");
      populateAccUserOptions();
      populateProfessorOptions();
      populateProntuarioFiltroOptions();
      renderSuperadminDirectors();
    });
    detachListeners.push(offDiretores);
  }

  const offFaixas = onSnapshot(scopedCollectionQuery("faixas_etarias", [limit(100)]), (snap) => {
    cachedFaixasEtarias = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
    populateFaixaEtariaOptions();
    populatePlanFaixaOptions();
    renderFaixasEtarias();
  });
  detachListeners.push(offFaixas);

  const alunosQuery = isFamilyOnlyRole()
    ? scopedCollectionQuery("alunos", [where("responsavel_uid", "==", auth.currentUser.uid), limit(20)])
    : scopedCollectionQuery("alunos", [limit(500)]);
  const offStudentsSummary = onSnapshot(alunosQuery, (snap) => {
    cachedStudents = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
    populateAgendaAlunoOptions();
    populateGaleriaAlunoOptions();
    populateBnccAlunoOptions();
    populateOcorrenciaAlunoOptions();
    populateFrequenciaTurmaOptions();
    renderFrequenciaTurmaTable();
    populateProntuarioAlunoOptions();
    populateLgpdAlunoOptions();
    populateChatTurmaFilterOptions();
    populateChatRecipientOptions();
    renderAnamneseList();
    updateSuperadminSummary();
  });
  detachListeners.push(offStudentsSummary);

  if (!isFamilyOnlyRole()) {
  const offEnrollmentsSummary = onSnapshot(scopedCollectionQuery("matriculas", [limit(500)]), (snap) => {
    cachedEnrollments = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
    updateSuperadminSummary();
  });
  detachListeners.push(offEnrollmentsSummary);
  } // end !isFamilyOnlyRole()
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

function resolveLoginEmail(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits}@responsavel.escola`;
  }
  return String(value || "").trim();
}

btnLogin.addEventListener("click", () => {
  const loginEmail = resolveLoginEmail(emailInput.value);
  signInWithEmailAndPassword(auth, loginEmail, passwordInput.value)
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
    stopMatriculaCamera();
    capturedMatriculaPhotoFile = null;
    clearMatriculaPhotoPreview();
    loginScreen.style.display = "flex";
    dashboardScreen.style.display = "none";
    if (schoolHeaderName) {
      schoolHeaderName.textContent = "Portal Escolar";
    }
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
      userDisplay.textContent = `Ola, ${resolveUserFirstName(user)}`;
    }
    if (userRole) {
      const schoolLabel = currentSchoolId() || "sem escola";
      userRole.textContent = `Perfil: ${currentProfile.role || "coordenacao"} | Escola: ${schoolLabel}`;
    }
    updateSchoolHeaderName();
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
