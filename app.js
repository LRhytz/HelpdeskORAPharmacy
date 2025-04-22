/* ===================================================
   app.js – full, self‑contained source
   (with “peek” toggle for auth password)
   =================================================== */

/* ---------- Firebase configuration ---------- */
var firebaseConfig = {
  apiKey:            "AIzaSyBaSuFhNUeghfXEznYCHxYnagkjiojfO_M",
  authDomain:        "helpdeskrpharmacy.firebaseapp.com",
  databaseURL:       "https://helpdeskrpharmacy-default-rtdb.firebaseio.com",
  projectId:         "helpdeskrpharmacy",
  storageBucket:     "helpdeskrpharmacy.firebasestorage.app",
  messagingSenderId: "776189919696",
  appId:             "1:776189919696:web:ab3be5e265dbfff8faf9d5",
  measurementId:     "G-TL0ZQ9L17Q"
};
firebase.initializeApp(firebaseConfig);

/* ---------- Cloudinary ---------- */
const CLOUD_NAME    = "dkwkdsnk7";
const UPLOAD_PRESET = "Helpdesk_Rpharmacy";

/* ---------- Auth / modal ---------- */
let isAuthenticated = false;
const authContainer = document.getElementById("auth-container");
const authBtn       = document.getElementById("auth-btn");
const authPassword  = document.getElementById("auth-password");
const addFileBtn    = document.getElementById("add-file-btn");
// peek toggle icon (needs <i id="toggle-password" class="fas fa-eye"></i> next to password input)
const togglePwd     = document.getElementById("toggle-password");

const fileModal     = document.getElementById("file-upload-modal");
const modalClose    = document.querySelector("#file-upload-modal .modal-close");

/* ---------- “peek” password toggle ---------- */
if (togglePwd && authPassword) {
  togglePwd.addEventListener("click", () => {
    const isHidden = authPassword.type === "password";
    authPassword.type = isHidden ? "text" : "password";
    togglePwd.classList.toggle("fa-eye");
    togglePwd.classList.toggle("fa-eye-slash");
  });
}

/* ---------- Authentication ---------- */
authBtn.addEventListener("click", authenticate);
authPassword.addEventListener("keydown", e => {
  if (e.key === "Enter") authenticate();
});

function authenticate() {
  if (authPassword.value === "@Helpd3sk") {
    authContainer.style.display = "none";
    addFileBtn.style.display    = "block";
    authPassword.value          = "";
    isAuthenticated             = true;
    displayApprovedUploads();   // show Archive buttons
  } else {
    alert("Incorrect password. Please try again.");
  }
}

/* ---------- Modal open / close ---------- */
addFileBtn.addEventListener("click",     () => fileModal.hidden = false);
modalClose .addEventListener("click",    () => fileModal.hidden = true);
fileModal  .addEventListener("click", e => {
  if (e.target === fileModal) fileModal.hidden = true;
});

/* ---------- File‑input UI ---------- */
const fileInputElement = document.getElementById("fileInput");
const fileNameSpan     = document.getElementById("selected-file-name");
fileInputElement.addEventListener("change", () => {
  fileNameSpan.textContent = fileInputElement.files.length
    ? fileInputElement.files[0].name
    : "No file chosen";
});

/* ---------- Accordion helpers ---------- */
function toggleDropdown(bodyId, arrowId) {
  const body  = document.getElementById(bodyId);
  const arrow = document.getElementById(arrowId);
  if (!body) return;
  const open = body.style.display === "block";
  body.style.display = open ? "none" : "block";
  if (arrow) arrow.textContent = open ? "▼" : "▲";
}
function toggleSubTopics(containerId, arrowId) {
  const c = document.getElementById(containerId);
  const a = document.getElementById(arrowId);
  if (!c) return;
  const open = c.style.display === "block";
  c.style.display = open ? "none" : "block";
  if (a) a.textContent = open ? "▼" : "▲";
}

/* =========================================================
   Upload to Cloudinary  +  push metadata to Firebase
   ========================================================= */
function uploadFileToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;
  const fd  = new FormData();
  fd.append("file", file);
  fd.append("resource_type", "raw");
  const id = file.name.replace(/\s+/g,"_").replace(/\.[^/.]+$/,"") + "_" + Date.now();
  fd.append("public_id", id);
  fd.append("upload_preset", UPLOAD_PRESET);

  return fetch(url, { method:"POST", body:fd })
    .then(r => r.json())
    .then(d => {
      if (d.secure_url) return d.secure_url;
      throw new Error(d.error?.message || "Cloudinary error");
    });
}
function uploadFile() {
  const file      = fileInputElement.files[0];
  const title     = document.getElementById("fileTitle").value.trim();
  const moduleSel = document.getElementById("module-dropdown").value;
  if (!file || !title) {
    alert("Choose a file and enter a title.");
    return;
  }

  uploadFileToCloudinary(file)
    .then(url => firebase.database().ref("uploads").push({
      title,
      fileName:         file.name,
      fileUrl:          url,
      module:           moduleSel,
      timestamp:        Date.now(),
      approved:         false,
      archiveRequested: false,
      archived:         false
    }))
    .then(() => {
      alert("File uploaded! Awaiting approval.");
      fileModal.hidden = true;
      fileInputElement.value = "";
      document.getElementById("fileTitle").value = "";
      fileNameSpan.textContent = "No file chosen";
    })
    .catch(err => {
      console.error(err);
      alert("Upload failed.");
    });
}

/* =========================================================
   ARCHIVE REQUEST WORKFLOW
   ========================================================= */
function requestArchive(key, title) {
  if (!isAuthenticated) {
    alert("Please log‑in first.");
    return;
  }
  if (!confirm(`Are you sure you want to archive “${title}”?`)) return;

  firebase.database().ref("uploads/" + key)
    .update({ archiveRequested: true })
    .then(() => alert("Archive request sent to admin."))
    .catch(e => {
      console.error(e);
      alert("Error requesting archive.");
    });
}

/* =========================================================
   Render approved uploads  (+ Archive button)
   ========================================================= */
function displayApprovedUploads() {
  const map = {
    /* Working Instructions */
    "Receivables":           "approved_wi_receivables",
    "Payables":              "approved_wi_payables",
    "Purchasing":            "approved_wi_purchasing",
    "General Ledger":        "approved_wi_general_ledger",
    "Oracle Guides":         "approved_wi_oracle_guides",
    "Fixed Asset":           "approved_wi_fixed_asset",  
    "Inventory":             "approved_wi_inventory",  
    "HRMS Global":           "approved_wi_hrms_global", 


    /* SOP */
    "sop_treasury":          "approved_sop_treasury",
    "sop_payables":          "approved_sop_payables",
    "sop_receivables":       "approved_sop_receivables",
    "sop_store_audit":       "approved_sop_store_audit",
    "sop_taxation":          "approved_sop_taxation",
    "sop_general_ledger":    "approved_sop_general_ledger",

    /* Functional Specs */
    "fs_oracle_enhancement": "approved_fs_oracle_enhancement",
    "fs_sharepoint_pa":      "approved_fs_sharepoint_pa",

    /* Process Flow */
    "pf-PDF":                "approved_pf_pdf"
  };

  firebase.database().ref("uploads").on("value", snap => {
    const data = snap.val();
    if (!data) return;

    // Clear all target lists first
    Object.values(map).forEach(ulId => {
      const ul = document.getElementById(ulId);
      if (ul) ul.innerHTML = "";
    });

    Object.entries(data).forEach(([key, it]) => {
      if (it.approved !== true) return;
      if (it.archived  === true) return;

      const ulId = map[it.module];
      if (!ulId) {
        console.warn("No UL mapping for module:", it.module, "key:", key);
        return;
      }
      const ul = document.getElementById(ulId);
      if (!ul) return;

      const li = document.createElement("li");
      li.innerHTML = `<a href="${it.fileUrl}" target="_blank">${it.title}</a>`;

      if (isAuthenticated) {
        if (it.archiveRequested) {
          li.innerHTML += ' <em style="color:#888">(archive pending)</em>';
        } else {
          const btn = document.createElement("button");
          btn.textContent = "Archive";
          btn.className   = "archive-btn";
          btn.onclick     = () => requestArchive(key, it.title);
          li.appendChild(btn);
        }
      }

      ul.appendChild(li);
    });
  });
}
displayApprovedUploads();

/* =========================================================
   Search
   ========================================================= */
function searchContent() {
  const term   = document.getElementById("searchInput").value.toLowerCase();
  const lis    = document.querySelectorAll(".pdf-list li");
  const subs   = document.querySelectorAll(".subtopic-body");
  const dds    = document.querySelectorAll(".dropdown-body");
  const banner = document.getElementById("no-results");
  let   found  = false;

  if (!term) {
    banner.hidden = true;
    lis.forEach(li => li.style.display = "");
    subs.forEach(sb => sb.style.display = "none");
    dds.forEach(dd => dd.style.display = "none");
    return;
  }

  lis.forEach(li => {
    const match = li.textContent.toLowerCase().includes(term);
    li.style.display = match ? "" : "none";
    if (match) found = true;
  });
  subs.forEach(sb => {
    sb.style.display = Array.from(sb.querySelectorAll("li"))
                          .some(li => li.style.display !== "none")
                       ? "block" : "none";
  });
  dds.forEach(dd => {
    dd.style.display = Array.from(dd.querySelectorAll("li"))
                          .some(li => li.style.display !== "none")
                       ? "block" : "none";
  });
  banner.hidden = found;
}
