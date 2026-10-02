/* ==========================================================================
   GENAI HUB - CLASS PORTAL SCRIPT WITH SUPABASE DATABASE & STORAGE INTEGRATION
   Admin Credentials: Username RA2531243010075 | Password Dksettan1@
   ========================================================================== */

// Official Class Student Roster Mapping
const STUDENT_ROSTER = {
  "RA2531243010052": "GAGAN PRAMOD",
  "RA2531243010053": "NAVANEETH S",
  "RA2531243010054": "AKSHAI M",
  "RA2531243010055": "ANKITHA ROSE LUIZ",
  "RA2531243010056": "ANISH D",
  "RA2531243010057": "NIDHIN PHILIP",
  "RA2531243010058": "KAVIN R",
  "RA2531243010059": "MUHAMMED RAZI T C",
  "RA2531243010060": "SANA RASSALUDEEN",
  "RA2531243010061": "MADHAV HARIKIRHSNAN",
  "RA2531243010062": "Hitesh Jaikumar Gaikwad",
  "RA2531243010063": "ABHINAV B SEKHAR",
  "RA2531243010064": "Aravind Manickam",
  "RA2531243010065": "Akhil Krishna",
  "RA2531243010066": "PRIYANSHU SINGH",
  "RA2531243010067": "SAYOOJ MP",
  "RA2531243010068": "Muhammad Hisham",
  "RA2531243010069": "SURYA KIRAN K V",
  "RA2531243010070": "ABDULLA NOOH MUNEER",
  "RA2531243010071": "SALMANUL FARIS",
  "RA2531243010072": "HISHAM RAHMAN",
  "RA2531243010073": "Salahuddin A",
  "RA2531243010074": "MOHAMMEDH FARHAN A",
  "RA2531243010075": "DEVAKISHORE S",
  "RA2531243010076": "AVIN N",
  "RA2531243010077": "MOHAMMED LUKMAN A",
  "RA2531243010078": "ISHWARYA A",
  "RA2531243010079": "MUHHAMED ZEHAN M",
  "RA2531243010080": "Muhammad Asrar",
  "RA2531243010081": "Tanya niranjal",
  "RA2531243010082": "Abdul Raheem",
  "RA2531243010083": "KR Sreehari",
  "RA2531243010084": "Santhosh S",
  "RA2531243010085": "Balaji",
  "RA2531243010086": "Harsh Raj",
  "RA2531243010087": "Senthil Babu"
};

const DEFAULT_ANNOUNCEMENTS = [
  "📢 CT1 & CT2 timetables released! Check Question Papers section",
  "🚀 Assignment submission deadline extended to Friday",
  "💡 Welcome to GenAI Hub Class Portal!"
];

// Supabase Global Client Reference
let supabaseClient = null;

// Application State
let appState = {
  userRole: 'student', // 'student' or 'admin'
  currentUserReg: '',
  currentUserName: '',
  currentView: 'home',
  activeCategory: 'Question Papers',
  generalSubjectFilter: 'all',
  qpSubjectFilter: 'all',
  qpExamFilter: 'all',
  announcements: DEFAULT_ANNOUNCEMENTS,
  resources: [],
  selectedFileForUpload: null
};

// Default Supabase Credentials
const DEFAULT_SB_KEY = "sb_publishable_eF-Z817fVN1OyMS0w0VZdw_Vuo92B4H";

// ==========================================================================
// INITIALIZATION & SUPABASE CONNECTION
// ==========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  initSupabaseClient();

  // Load announcements
  const savedAnnounce = localStorage.getItem("genai_announcements_list");
  if (savedAnnounce) {
    try { appState.announcements = JSON.parse(savedAnnounce); }
    catch(e) { appState.announcements = DEFAULT_ANNOUNCEMENTS; }
  } else {
    appState.announcements = DEFAULT_ANNOUNCEMENTS;
    localStorage.setItem("genai_announcements_list", JSON.stringify(DEFAULT_ANNOUNCEMENTS));
  }
  updateAnnouncementUI();

  // Load resources from Supabase if connected, else from localStorage
  await loadResources();

  // Check login session
  const savedReg = localStorage.getItem("genai_user_reg");
  const savedRole = localStorage.getItem("genai_user_role");
  const savedName = localStorage.getItem("genai_user_name");

  if (savedReg && (savedRole === 'admin' || checkRegisterWhitelist(savedReg))) {
    const cleanReg = sanitizeRegNo(savedReg);
    appState.currentUserReg = cleanReg;
    appState.userRole = savedRole || 'student';
    appState.currentUserName = savedName || getStudentName(cleanReg);
    showDashboard();
  }

  if (window.lucide) lucide.createIcons();
});

function initSupabaseClient() {
  const url = localStorage.getItem("genai_sb_url");
  const key = localStorage.getItem("genai_sb_key") || DEFAULT_SB_KEY;
  const statusEl = document.getElementById("sbConnectionStatus");

  if (url && key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(url, key);
      if (statusEl) {
        statusEl.textContent = "Connected to Supabase Backend";
        statusEl.style.color = "#34d399";
      }
    } catch(e) {
      console.warn("Supabase init error:", e);
    }
  } else if (!url && statusEl) {
    statusEl.textContent = "Awaiting Supabase Project URL";
    statusEl.style.color = "#fbbf24";
  }
}

async function loadResources() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        appState.resources = data;
        return;
      }
    } catch(e) {
      console.warn("Could not fetch from Supabase, fallback to local:", e);
    }
  }

  // Fallback to local storage
  const savedResources = localStorage.getItem("genai_resources_v5");
  if (savedResources) {
    try { appState.resources = JSON.parse(savedResources); }
    catch(e) { appState.resources = []; }
  } else {
    appState.resources = [];
  }
}

function sanitizeRegNo(regNo) {
  if (!regNo) return "";
  return regNo.replace(/\s+/g, '').toUpperCase();
}

function getStudentName(regNo) {
  const clean = sanitizeRegNo(regNo);
  if (STUDENT_ROSTER[clean]) return STUDENT_ROSTER[clean];
  return "Student";
}

// ==========================================================================
// RESTRICTED WHITELIST VALIDATION & ADMIN LOGIN
// Allowed Range: RA2531243010052 to RA2531243010087
// Admin Credentials: Username RA2531243010075 | Password Dksettan1@
// ==========================================================================

function checkRegisterWhitelist(regNo) {
  const clean = sanitizeRegNo(regNo);
  const match = clean.match(/^RA(\d+)$/);
  if (!match) return false;

  const numStr = match[1];
  try {
    const val = BigInt(numStr);
    const min = BigInt("2531243010052");
    const max = BigInt("2531243010087");
    return val >= min && val <= max;
  } catch (e) {
    return false;
  }
}

function setLoginRole(role) {
  appState.userRole = role;
  const studentTab = document.getElementById("tabStudent");
  const adminTab = document.getElementById("tabAdmin");
  const passGroup = document.getElementById("passwordFieldGroup");
  const regLabel = document.getElementById("regInputLabel");
  const loginBtnText = document.getElementById("loginBtnText");

  if (role === 'admin') {
    studentTab.classList.remove("active");
    adminTab.classList.add("active");
    passGroup.classList.remove("hidden");
    regLabel.textContent = "Admin Register Number";
    loginBtnText.textContent = "Enter Admin Panel";
  } else {
    adminTab.classList.remove("active");
    studentTab.classList.add("active");
    passGroup.classList.add("hidden");
    regLabel.textContent = "Enter Register Number";
    loginBtnText.textContent = "Enter Portal";
  }
}

function handleLogin(e) {
  e.preventDefault();
  const rawInput = document.getElementById("regNumberInput").value;
  const cleanReg = sanitizeRegNo(rawInput);
  const passInput = document.getElementById("adminPassInput").value;

  if (appState.userRole === 'admin') {
    if (cleanReg === 'RA2531243010075' && passInput === 'Dksettan1@') {
      appState.currentUserReg = cleanReg;
      appState.currentUserName = "DEVAKISHORE S (Admin)";
      localStorage.setItem("genai_user_reg", cleanReg);
      localStorage.setItem("genai_user_name", appState.currentUserName);
      localStorage.setItem("genai_user_role", 'admin');
      showDashboard();
    } else {
      alert("Invalid Admin Credentials!\nAdmin Username: RA2531243010075\nPassword: Dksettan1@");
    }
    return;
  }

  if (checkRegisterWhitelist(cleanReg)) {
    appState.currentUserReg = cleanReg;
    appState.currentUserName = getStudentName(cleanReg);
    localStorage.setItem("genai_user_reg", cleanReg);
    localStorage.setItem("genai_user_name", appState.currentUserName);
    localStorage.setItem("genai_user_role", 'student');
    showDashboard();
  } else {
    alert(`Access Restricted! Register Number "${cleanReg}" is not in the allowed class roster (RA2531243010052 to RA2531243010087).`);
  }
}

function handleLogout() {
  localStorage.removeItem("genai_user_reg");
  localStorage.removeItem("genai_user_role");
  localStorage.removeItem("genai_user_name");
  appState.currentUserReg = '';
  appState.currentUserName = '';
  document.getElementById("dashboardSection").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
}

// ==========================================================================
// VIEW SWITCHER & DASHBOARD LOGIC
// ==========================================================================

function showDashboard() {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("dashboardSection").classList.remove("hidden");

  document.getElementById("welcomeRegNo").textContent = appState.currentUserReg;
  document.getElementById("welcomeName").textContent = appState.currentUserName;

  document.getElementById("displayRegNo").textContent = appState.currentUserReg;
  document.getElementById("displayRole").textContent = appState.userRole === 'admin' ? 'Class Administrator' : appState.currentUserName;
  document.getElementById("userAvatar").textContent = appState.currentUserName ? appState.currentUserName.charAt(0) : 'A';

  const navBadge = document.getElementById("navRoleBadge");
  if (appState.userRole === 'admin') {
    navBadge.innerHTML = `<i data-lucide="shield-check" class="text-amber"></i> Admin Panel`;
    document.getElementById("welcomeSubText").textContent = "Admin Mode active. Manage announcements, upload question papers (CT1, CT2, Model), notes, or assignments to Supabase.";
  } else {
    navBadge.innerHTML = `<i data-lucide="award"></i> Class Portal`;
    document.getElementById("welcomeSubText").textContent = "Select an option below to view question papers, assignments, or notes.";
  }

  const uploadBtn = document.getElementById("adminUploadBtn");
  const announceBtn = document.getElementById("adminAnnounceBtn");

  if (appState.userRole === 'admin') {
    uploadBtn.classList.remove("hidden");
    announceBtn.classList.remove("hidden");
  } else {
    uploadBtn.classList.add("hidden");
    announceBtn.classList.add("hidden");
  }

  updateCategoryCounts();
  showMainHomeView();

  if (window.lucide) lucide.createIcons();
}

function showMainHomeView() {
  appState.currentView = 'home';
  document.getElementById("mainHomeView").classList.remove("hidden");
  document.getElementById("questionPapersView").classList.add("hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openQuestionPapersPage() {
  appState.currentView = 'questionPapers';
  document.getElementById("mainHomeView").classList.add("hidden");
  document.getElementById("questionPapersView").classList.remove("hidden");

  document.getElementById("qpSubjectSelect").value = "all";
  document.getElementById("qpExamSelect").value = "all";
  appState.qpSubjectFilter = "all";
  appState.qpExamFilter = "all";

  renderQuestionPapersPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) lucide.createIcons();
}

function updateCategoryCounts() {
  const qp = appState.resources.filter(r => r.category === 'Question Papers').length;
  const assign = appState.resources.filter(r => r.category === 'Assignments').length;
  const notes = appState.resources.filter(r => r.category === 'Notes').length;

  document.getElementById("countQP").textContent = `${qp} Available`;
  document.getElementById("countAssign").textContent = `${assign} Available`;
  document.getElementById("countNotes").textContent = `${notes} Available`;
}

// ==========================================================================
// QUESTION PAPERS FILTERING LOGIC
// ==========================================================================

function handleQPFilterChange() {
  appState.qpSubjectFilter = document.getElementById("qpSubjectSelect").value;
  appState.qpExamFilter = document.getElementById("qpExamSelect").value;
  renderQuestionPapersPage();
}

function resetQPFilters() {
  document.getElementById("qpSubjectSelect").value = "all";
  document.getElementById("qpExamSelect").value = "all";
  appState.qpSubjectFilter = "all";
  appState.qpExamFilter = "all";
  renderQuestionPapersPage();
}

function renderQuestionPapersPage() {
  const heading = document.getElementById("qpFilterHeading");
  const countBadge = document.getElementById("qpResultCount");
  const grid = document.getElementById("qpResourceGrid");

  let filtered = appState.resources.filter(r => r.category === 'Question Papers');

  if (appState.qpSubjectFilter !== 'all') {
    filtered = filtered.filter(r => r.subject === appState.qpSubjectFilter);
  }

  if (appState.qpExamFilter !== 'all') {
    filtered = filtered.filter(r => r.exam === appState.qpExamFilter);
  }

  let headingText = "Question Papers";
  if (appState.qpSubjectFilter !== 'all') headingText = `${appState.qpSubjectFilter}`;
  if (appState.qpExamFilter !== 'all') headingText += ` (${appState.qpExamFilter})`;
  heading.textContent = headingText;

  countBadge.textContent = `${filtered.length} Paper${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i data-lucide="folder-open" class="empty-icon"></i>
        <h3>Nothing here yet</h3>
        <p>No question papers uploaded yet. Files will appear here after the admin uploads them.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="resource-card glass-card qp-border">
      <div class="card-top">
        <div class="icon-wrapper qp-theme">
          <i data-lucide="file-question"></i>
        </div>
        <div style="text-align:right;">
          <span class="subject-badge text-coral" style="display:block; font-size:0.75rem; font-weight:700;">${item.subject}</span>
          <span style="font-size:0.72rem; color:var(--accent-gold); font-weight:600;">${item.exam || 'Exam Paper'}</span>
        </div>
      </div>

      <h3 class="card-title">${item.title}</h3>
      <p class="card-desc">${item.description || 'Question paper file.'}</p>

      <div class="card-meta">
        <span><i data-lucide="calendar" class="mini-icon"></i> ${item.date}</span>
        <span>&bull;</span>
        <span><i data-lucide="hard-drive" class="mini-icon"></i> ${item.size}</span>
      </div>

      <div class="card-actions">
        <button class="btn btn-emerald btn-sm ${appState.userRole === 'admin' ? '' : 'btn-full'}" onclick="downloadFile('${item.id}', '${item.file_url || ''}', '${item.title}')">
          <i data-lucide="download"></i> Download PDF
        </button>
        ${appState.userRole === 'admin' ? `
          <button class="btn btn-outline-danger btn-sm" title="Delete Resource" onclick="deleteResource('${item.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

// ==========================================================================
// GENERAL CATEGORY SECTION (For Notes & Assignments)
// ==========================================================================

function selectCategory(categoryName) {
  if (categoryName === 'Question Papers') {
    openQuestionPapersPage();
    return;
  }

  appState.activeCategory = categoryName;
  appState.generalSubjectFilter = 'all';
  document.getElementById("generalSubjectSelect").value = 'all';

  renderGeneralResources();

  document.getElementById("generalResourceSection").classList.remove("hidden");
  document.getElementById("generalResourceSection").scrollIntoView({ behavior: 'smooth' });
}

function handleGeneralSubjectChange() {
  appState.generalSubjectFilter = document.getElementById("generalSubjectSelect").value;
  renderGeneralResources();
}

function renderGeneralResources() {
  const heading = document.getElementById("generalCategoryHeading");
  const countBadge = document.getElementById("generalResultCount");
  const grid = document.getElementById("generalResourceGrid");

  let filtered = appState.resources.filter(r => r.category === appState.activeCategory);

  if (appState.generalSubjectFilter !== 'all') {
    filtered = filtered.filter(r => r.subject === appState.generalSubjectFilter);
  }

  let headingText = appState.activeCategory;
  if (appState.generalSubjectFilter !== 'all') headingText += ` - ${appState.generalSubjectFilter}`;
  heading.textContent = headingText;

  countBadge.textContent = `${filtered.length} Available`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i data-lucide="folder-open" class="empty-icon"></i>
        <h3>Nothing here yet</h3>
        <p>No ${appState.activeCategory.toLowerCase()} uploaded yet. Files will appear here after the admin uploads them.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="resource-card glass-card">
      <div class="card-top">
        <div class="icon-wrapper icon-note">
          <i data-lucide="file"></i>
        </div>
        <span class="subject-badge text-amber">${item.subject || item.category}</span>
      </div>
      <h3 class="card-title">${item.title}</h3>
      <p class="card-desc">${item.description || 'Resource file.'}</p>
      <div class="card-meta">
        <span><i data-lucide="calendar" class="mini-icon"></i> ${item.date}</span>
        <span>&bull;</span>
        <span><i data-lucide="hard-drive" class="mini-icon"></i> ${item.size}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-emerald btn-sm ${appState.userRole === 'admin' ? '' : 'btn-full'}" onclick="downloadFile('${item.id}', '${item.file_url || ''}', '${item.title}')">
          <i data-lucide="download"></i> Download
        </button>
        ${appState.userRole === 'admin' ? `
          <button class="btn btn-outline-danger btn-sm" title="Delete Resource" onclick="deleteResource('${item.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function hideGeneralResources() {
  document.getElementById("generalResourceSection").classList.add("hidden");
}

function downloadFile(id, file_url, title) {
  if (file_url && file_url.startsWith('http')) {
    window.open(file_url, '_blank');
    return;
  }

  const blobText = `%PDF-1.4\nUploaded File Download for ${title}\nGenAI Hub Class Portal`;
  const blob = new Blob([blobText], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function deleteResource(resourceId) {
  if (!confirm("Are you sure you want to delete this resource?")) return;

  if (supabaseClient) {
    try {
      await supabaseClient.from('resources').delete().eq('id', resourceId);
    } catch(e) {
      console.warn("Supabase delete error:", e);
    }
  }

  appState.resources = appState.resources.filter(r => r.id !== resourceId);
  localStorage.setItem("genai_resources_v5", JSON.stringify(appState.resources));

  updateCategoryCounts();
  if (appState.currentView === 'questionPapers') {
    renderQuestionPapersPage();
  } else {
    renderGeneralResources();
  }
}

// ==========================================================================
// SUPABASE MODAL LOGIC
// ==========================================================================

function openSupabaseModal() {
  document.getElementById("sbUrlInput").value = localStorage.getItem("genai_sb_url") || '';
  document.getElementById("sbKeyInput").value = localStorage.getItem("genai_sb_key") || DEFAULT_SB_KEY;
  document.getElementById("supabaseModal").classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function closeSupabaseModal() {
  document.getElementById("supabaseModal").classList.add("hidden");
}

async function saveSupabaseSettings() {
  const url = document.getElementById("sbUrlInput").value.trim();
  const key = document.getElementById("sbKeyInput").value.trim() || DEFAULT_SB_KEY;
  localStorage.setItem("genai_sb_url", url);
  localStorage.setItem("genai_sb_key", key);

  initSupabaseClient();
  await loadResources();

  closeSupabaseModal();
  updateCategoryCounts();
  alert("Supabase credentials saved! Connected to your online database and storage.");
}

// ==========================================================================
// MULTIPLE ANNOUNCEMENTS MANAGEMENT LOGIC
// ==========================================================================

function updateAnnouncementUI() {
  const el = document.getElementById("announcementText");
  const banner = document.getElementById("announcementBanner");
  if (!el) return;

  if (!appState.announcements || appState.announcements.length === 0) {
    if (banner) banner.classList.add("hidden");
    return;
  }

  if (banner) banner.classList.remove("hidden");
  const combinedText = appState.announcements.map(msg => `<span>${msg}</span>`).join('<span style="margin: 0 20px; color: var(--accent-gold); font-weight:700;">&bull;</span>');
  el.innerHTML = combinedText;
}

function dismissBanner() {
  document.getElementById("announcementBanner").classList.add("hidden");
}

function openAnnouncementModal() {
  renderAnnouncementManager();
  document.getElementById("announcementModal").classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function closeAnnouncementModal() {
  document.getElementById("announcementModal").classList.add("hidden");
}

function renderAnnouncementManager() {
  const container = document.getElementById("announcementManagerList");
  if (!container) return;

  if (!appState.announcements || appState.announcements.length === 0) {
    container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-dim); text-align:center; padding:10px;">No announcements posted yet.</p>`;
    return;
  }

  container.innerHTML = appState.announcements.map((text, idx) => `
    <div class="announcement-item-card">
      <p>${text}</p>
      <button class="btn btn-outline-danger btn-sm" title="Delete Announcement" onclick="deleteAnnouncement(${idx})">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function deleteAnnouncement(index) {
  appState.announcements.splice(index, 1);
  localStorage.setItem("genai_announcements_list", JSON.stringify(appState.announcements));
  renderAnnouncementManager();
  updateAnnouncementUI();
}

function handlePostNewAnnouncement(e) {
  e.preventDefault();
  const input = document.getElementById("newAnnouncementInput");
  const text = input.value.trim();
  if (!text) return;

  appState.announcements.unshift(text);
  localStorage.setItem("genai_announcements_list", JSON.stringify(appState.announcements));

  input.value = "";
  renderAnnouncementManager();
  updateAnnouncementUI();
  alert("New class announcement added!");
}

// ==========================================================================
// ADMIN UPLOADS (SUPABASE & LOCAL SUPPORT)
// ==========================================================================

function openUploadModal() {
  document.getElementById("uploadModal").classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function closeUploadModal() {
  document.getElementById("uploadModal").classList.add("hidden");
  document.getElementById("uploadForm").reset();
  document.getElementById("dropzoneFileName").textContent = "Click to select PDF or drag file here";
  appState.selectedFileForUpload = null;
}

function toggleAdminExamField(category) {
  const group = document.getElementById("adminExamGroup");
  if (category === 'Question Papers') group.classList.remove("hidden");
  else group.classList.add("hidden");
}

function handleFileSelect(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    appState.selectedFileForUpload = file;
    document.getElementById("dropzoneFileName").textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  }
}

async function handleUploadSubmit(e) {
  e.preventDefault();
  const category = document.getElementById("upCategory").value;
  const subject = document.getElementById("upSubject").value;
  const exam = document.getElementById("upExam").value;
  const title = document.getElementById("upTitle").value.trim();
  const description = document.getElementById("upDescription").value.trim();

  let file_url = "#";
  const resId = "res-" + Date.now();
  const sizeText = appState.selectedFileForUpload ? (appState.selectedFileForUpload.size / 1024 / 1024).toFixed(1) + " MB" : "2.4 MB";
  const dateText = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (supabaseClient && appState.selectedFileForUpload) {
    const file = appState.selectedFileForUpload;
    const filePath = `uploads/${Date.now()}_${file.name}`;
    try {
      const { data: uploadData, error: uploadErr } = await supabaseClient.storage.from('class-files').upload(filePath, file);
      if (!uploadErr) {
        const { data: urlData } = supabaseClient.storage.from('class-files').getPublicUrl(filePath);
        if (urlData) file_url = urlData.publicUrl;
      }
    } catch(err) {
      console.warn("Supabase Storage Upload Warning:", err);
    }
  }

  const newResource = {
    id: resId,
    title: title,
    category: category,
    subject: subject,
    exam: exam,
    description: description || `${category} file for ${subject}.`,
    file_url: file_url,
    date: dateText,
    size: sizeText
  };

  if (supabaseClient) {
    try {
      await supabaseClient.from('resources').insert([newResource]);
    } catch(err) {
      console.warn("Supabase DB Insert Warning:", err);
    }
  }

  appState.resources.unshift(newResource);
  localStorage.setItem("genai_resources_v5", JSON.stringify(appState.resources));

  closeUploadModal();
  updateCategoryCounts();

  if (appState.currentView === 'questionPapers') {
    renderQuestionPapersPage();
  } else {
    selectCategory(category);
  }

  alert(`Successfully uploaded "${title}" under ${category} (${subject} - ${exam})! It is now live for all students.`);
}
