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
  setDoc
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
const SUPERUSER_EMAIL = "julio.bitaraes.mail@gmail.com";
const STORAGE_UPLOAD_FUNCTION_URL = "https://uploadmatriculadocumento-ry5gli47hq-rj.a.run.app";
const STORAGE_DELETE_FUNCTION_URL = "https://deletematriculadocumento-ry5gli47hq-rj.a.run.app";

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
      return `<div class="saved-doc-row"><span>${nome}</span><div class="saved-doc-actions"><button type="button" class="doc-view-btn" data-url="${escapeHtml(url)}">Visualizar</button><button type="button" class="doc-download-btn" data-url="${escapeHtml(url)}" data-filename="${escapeHtml(nomeOriginal)}">Baixar</button><button type="button" class="doc-delete-btn" data-url="${escapeHtml(url)}" data-path="${escapeHtml(caminho)}" data-index="${index}" data-filename="${escapeHtml(nomeOriginal)}">Excluir</button></div></div>`;
    });

  const urlLegada = String(data?.documentos_url || "").trim();
  if (urlLegada) {
    arquivosDisponiveis.push({ url: urlLegada, fileName: "documento-legado" });
    botoes.push(`<div class="saved-doc-row"><span>documento-legado</span><div class="saved-doc-actions"><button type="button" class="doc-view-btn" data-url="${escapeHtml(urlLegada)}">Visualizar</button><button type="button" class="doc-download-btn" data-url="${escapeHtml(urlLegada)}" data-filename="documento-legado">Baixar</button></div></div>`);
  }

  if (botoes.length === 0) {
    return "Documentos para download: nenhum";
  }

  const arquivosPayload = escapeHtml(encodeURIComponent(JSON.stringify(arquivosDisponiveis)));
  const botaoBaixarTodos = `<button type="button" class="doc-download-all-btn" data-files="${arquivosPayload}">Baixar todos os documentos</button>`;
  return `Documentos para download:<br>${botoes.map((botao) => `${botao}`).join("")}<div class="saved-doc-all-row">${botaoBaixarTodos}</div>`;
}

async function triggerDocumentDownload(url, fileName) {
  if (!url) return;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha no download: ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = sanitizeFileName(fileName || "documento");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    console.error(error);
    window.open(url, "_blank", "noopener,noreferrer");
  }
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

function openUrlInNewTab(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
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
  const cards = Array.from(mainGrid.querySelectorAll(":scope > .card"));
  const familyOnly = isFamilyOnlyRole();
  const superadminVisible = isSuperAdmin();
  
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
    let activeSection = activeItem ? activeItem.getAttribute("data-section") : "agenda";

    // Evita carregar tela de superadmin para perfis nao-superadmin
    // quando esse item ficou ativo em uma sessao anterior.
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
  populateDirectorSchoolOptions();
  populateAccUserOptions();
  populateProfessorOptions();
  populateFaixaEtariaOptions();
  populateMatriculaTurmaOptions();
  setAgendaMode();
  applyRoleLayout();

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
  clearPendingMatriculaDocumentos();
  renderMatriculaSelectedDocs();
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
  const listMatriculas = document.getElementById("listMatriculas");
  if (listMatriculas && !listMatriculas.dataset.downloadBinding) {
    listMatriculas.dataset.downloadBinding = "true";
    listMatriculas.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const viewButton = target.closest(".doc-view-btn");
      if (viewButton instanceof HTMLElement) {
        const url = viewButton.getAttribute("data-url") || "";
        openUrlInNewTab(url);
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
    const maxDocumentoSizeBytes = 20 * 1024 * 1024;
    const allowedDocumentoMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
    const allowedDocumentoExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const aluno = document.getElementById("matAluno").value.trim();
    const responsavel = document.getElementById("matResp").value.trim();
    const turma = document.getElementById("matTurma").value.trim();
    if (!aluno) {
      alert("Informe o nome do aluno.");
      return;
    }

    await syncResponsibleUidFromEmail();
    const responsavelUid = document.getElementById("matRespUid").value.trim();
    const responsavelEmail = document.getElementById("matRespEmail").value.trim();
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
    const matriculaRef = await addDoc(collection(db, "matriculas"), withSchoolScope({
      aluno,
      responsavel,
      turma,
      responsavel_uid: responsavelUid || null,
      responsavel_email: responsavelEmail || null,
      endereco,
      documentos_url: document.getElementById("matDocUrl").value.trim(),
      documentos_upload: uploadedDocs,
      foto_aluno: fotoAluno,
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
        endereco_residencial: endereco,
        foto_url: fotoAluno?.url || null,
        documentos_upload: uploadedDocs,
        matricula_id: matriculaRef.id,
        updated_at: serverTimestamp(),
        updated_by: auth.currentUser.uid
      }),
      { merge: true }
    );
    await audit("create", "matriculas");
    await audit("update", "alunos.vinculo_responsavel");
    stopMatriculaCamera();
    capturedMatriculaPhotoFile = null;
    clearMatriculaPhotoPreview();
    if (documentosInput) documentosInput.value = "";
    clearPendingMatriculaDocumentos();
    if (fotoInput) fotoInput.value = "";
    resetMatriculaUploadProgress();
    renderMatriculaSelectedDocs();
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

  document.getElementById("btnUsuarioCriar").onclick = async () => {
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

  document.getElementById("schoolSearch")?.addEventListener("input", renderSuperadminSchools);
  document.getElementById("directorSearch")?.addEventListener("input", renderSuperadminDirectors);
  document.getElementById("schoolCityFilter")?.addEventListener("input", updateSuperadminSummary);
  document.getElementById("schoolSortMetric")?.addEventListener("change", updateSuperadminSummary);
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

  attachList("matriculas", "listMatriculas", (id, data) => {
    const item = renderItem(
      `Matricula - ${data.aluno || "aluno"}`,
      [
        `Responsavel: ${data.responsavel || "-"}`,
        `Responsavel vinculado: ${data.responsavel_nome || data.responsavel || "-"}`,
        `Turma: ${data.turma || "-"}`,
        `Foto do aluno: ${data.foto_aluno?.url ? "enviada" : "nao enviada"}`,
        `Documentos anexados: ${Array.isArray(data.documentos_upload) ? data.documentos_upload.length : 0}`,
        formatMatriculaDocumentosDownload(data),
        `Endereco: ${(data.endereco?.logradouro || "-")}${data.endereco?.numero ? `, ${data.endereco.numero}` : ""} - ${data.endereco?.bairro || "-"}`,
        `Cidade/UF: ${data.endereco?.cidade || "-"}/${data.endereco?.uf || "-"} | CEP: ${formatCep(data.endereco?.cep || "") || "-"}`,
        `Contrato assinado: ${data.contrato_assinado ? "sim" : "nao"}`
      ],
      data.created_at
    );
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
        `Email do responsavel: ${data.responsavel_email || "-"}`
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
    (id, data) => renderItem(`Usuario - ${data.email || id}`, [`Identificador: ${id}`, `Perfil: ${data.role || "-"}`], data.updated_at || data.created_at),
    { orderByField: "updated_at" }
  );
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

  if (isSuperUser()) {
    const offEscolas = onSnapshot(scopedCollectionQuery("escolas", [limit(100)]), (snap) => {
      cachedSchools = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
      populateDirectorSchoolOptions();
      renderSuperadminSchools();
    });
    detachListeners.push(offEscolas);
  }

  const offDiretores = onSnapshot(scopedCollectionQuery("usuarios", [limit(200)]), (snap) => {
    cachedUsers = snap.docs
      .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
    cachedDirectors = cachedUsers
      .filter(({ data }) => data.role === "direcao");
    populateAccUserOptions();
    populateProfessorOptions();
    renderSuperadminDirectors();
  });
  detachListeners.push(offDiretores);

  const offFaixas = onSnapshot(scopedCollectionQuery("faixas_etarias", [limit(100)]), (snap) => {
    cachedFaixasEtarias = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
    populateFaixaEtariaOptions();
    renderFaixasEtarias();
  });
  detachListeners.push(offFaixas);

  const offStudentsSummary = onSnapshot(scopedCollectionQuery("alunos", [limit(500)]), (snap) => {
    cachedStudents = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
    updateSuperadminSummary();
  });
  detachListeners.push(offStudentsSummary);

  const offEnrollmentsSummary = onSnapshot(scopedCollectionQuery("matriculas", [limit(500)]), (snap) => {
    cachedEnrollments = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
    updateSuperadminSummary();
  });
  detachListeners.push(offEnrollmentsSummary);
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
