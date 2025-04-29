// app.js – full, self-contained source
// (with DOMContentLoaded guard, “peek” toggle,
//  wildcard `%` search, dynamic SOP sub-options,
//  and archived-view)
document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Firebase config ---------- */
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

  const CLOUD_NAME    = "dkwkdsnk7";
  const UPLOAD_PRESET = "Helpdesk_Rpharmacy";

  /* ===================================================
     subOptions: SOP → its valid subtitles
     =================================================== */
  const subOptions = {
    "Standard Operating Procedures": ["Finance","Treasury","HR","IT"],
    "Finance": [
      "AR","AP","Sales Audit","General Ledger","Inventory Control","Tax"
    ],
    "Treasury": [
      "Check-run","Bank Control","Cash Flow"
    ],
    "HR": [
      "Payroll","Timekeeping"
    ],
    "IT": [
      "Application","Infra"
    ]
  };

  /* ---- UI elements ---- */
  let isAuthenticated = false;
  const authContainer   = document.getElementById("auth-container");
  const authBtn         = document.getElementById("auth-btn");
  const authPassword    = document.getElementById("auth-password");
  const togglePwd       = document.getElementById("toggle-password");
  const addFileBtn      = document.getElementById("add-file-btn");
  const viewArchivedBtn = document.getElementById("view-archived-btn");
  const fileModal       = document.getElementById("file-upload-modal");
  const modalClose      = fileModal.querySelector(".modal-close");
  const archivedModal   = document.getElementById("archived-modal");
  const archivedClose   = archivedModal.querySelector(".modal-close");
  const archivedList    = document.getElementById("archived-files-list");
  const fileInput       = document.getElementById("fileInput");
  const fileNameSpan    = document.getElementById("selected-file-name");

  /* ---------- peek-toggle ---------- */
  togglePwd.addEventListener("click", () => {
    const hidden = authPassword.type === "password";
    authPassword.type = hidden ? "text" : "password";
    togglePwd.classList.toggle("fa-eye");
    togglePwd.classList.toggle("fa-eye-slash");
  });

  /* ---------- auth ---------- */
  authBtn.addEventListener("click", authenticate);
  authPassword.addEventListener("keydown", e => {
    if (e.key === "Enter") authenticate();
  });
  function authenticate() {
    if (authPassword.value === "@Helpd3sk") {
      authContainer.style.display    = "none";
      addFileBtn.style.display       = "block";
      viewArchivedBtn.style.display  = "block";
      authPassword.value             = "";
      isAuthenticated                = true;
      displayApprovedUploads();
    } else {
      alert("Incorrect password.");
    }
  }

  /* ---------- modals ---------- */
  addFileBtn.addEventListener("click",   () => fileModal.hidden  = false);
  modalClose.addEventListener("click",   () => fileModal.hidden  = true);
  fileModal.addEventListener("click", e => {
    if (e.target === fileModal) fileModal.hidden = true;
  });
  viewArchivedBtn.addEventListener("click", () => {
    archivedModal.hidden = false;
    loadArchivedFiles();
  });
  archivedClose.addEventListener("click",   () => archivedModal.hidden = true);
  archivedModal.addEventListener("click", e => {
    if (e.target === archivedModal) archivedModal.hidden = true;
  });

  /* ---------- file-input UI ---------- */
  fileInput.addEventListener("change", () => {
    fileNameSpan.textContent = fileInput.files.length
      ? fileInput.files[0].name
      : "No file chosen";
  });

  /* ========= ACCORDIONS (global) ========= */
  window.toggleDropdown = (bodyId, arrowId) => {
    const body  = document.getElementById(bodyId);
    const arrow = document.getElementById(arrowId);
    if (!body) return;
    const open = body.style.display === "block";
    body.style.display = open ? "none" : "block";
    arrow.textContent  = open ? "▼" : "▲";
  };
  window.toggleSubTopics = (containerId, arrowId) => {
    const c = document.getElementById(containerId);
    const a = document.getElementById(arrowId);
    if (!c) return;
    const open = c.style.display === "block";
    c.style.display = open ? "none" : "block";
    a.textContent   = open ? "▼" : "▲";
  };

  /* =========================================================
     UPLOAD → Cloudinary → Firebase
     ========================================================= */
  function uploadFileToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;
    const fd  = new FormData();
    fd.append("file", file);
    fd.append("resource_type", "raw");
    const publicId = file.name
      .replace(/\s+/g,"_")
      .replace(/\.[^/.]+$/,"")
      + "_" + Date.now();
    fd.append("public_id", publicId);
    fd.append("upload_preset", UPLOAD_PRESET);
    return fetch(url, { method:"POST", body:fd })
      .then(r => r.json())
      .then(d => {
        if (d.secure_url) return d.secure_url;
        throw new Error(d.error?.message || "Cloudinary error");
      });
  }

  window.uploadFile = () => {
    const file      = fileInput.files[0];
    const title     = document.getElementById("fileTitle").value.trim();
    const moduleSel = document.getElementById("module-dropdown");
    const newSub    = document.getElementById("new-subtitle").value.trim();

    if (!file || !title) {
      return alert("Choose a file and title.");
    }

    // 1) Detect mainTopic from the <optgroup>
    const selectedOpt = moduleSel.selectedOptions[0];
    const og          = selectedOpt.closest("optgroup");
    const mainTopic   = og?.label || "";

    // 2) Validate/inject newSub under that mainTopic, if any
    let subTopic = moduleSel.value;
    if (newSub) {
      if (!subOptions[mainTopic] || !subOptions[mainTopic].includes(newSub)) {
        return alert(`"${newSub}" is not valid under "${mainTopic}".`);
      }
      // inject into the dropdown if missing
      if (![...og.querySelectorAll("option")].some(o => o.value===newSub)) {
        const opt = document.createElement("option");
        opt.value       = newSub;
        opt.textContent = newSub;
        og.appendChild(opt);
      }
      subTopic = newSub;
    }

    // 3) Upload → save metadata
    uploadFileToCloudinary(file)
      .then(url => firebase.database().ref("uploads").push({
        title,
        fileName:         file.name,
        fileUrl:          url,
        mainTopic,        // optgroup label
        subTopic,         // chosen or newly injected
        timestamp:        Date.now(),
        approved:         false,
        archiveRequested: false,
        archived:         false
      }))
      .then(() => {
        alert("Uploaded! Awaiting approval.");
        fileModal.hidden                              = true;
        fileInput.value                               = "";
        document.getElementById("fileTitle").value    = "";
        document.getElementById("new-subtitle").value = "";
        fileNameSpan.textContent                      = "No file chosen";
      })
      .catch(err => {
        console.error(err);
        alert("Upload failed: " + err.message);
      });
  };

  /* =========================================================
     ARCHIVE REQUEST
     ========================================================= */
  function requestArchive(key, title) {
    if (!isAuthenticated) {
      return alert("Please log in first.");
    }
    if (!confirm(`Archive "${title}"?`)) return;
    firebase.database().ref("uploads/" + key)
      .update({ archiveRequested:true })
      .then(() => alert("Archive request sent."))
      .catch(e => {
        console.error(e);
        alert("Error requesting archive.");
      });
  }

  /* =========================================================
     DISPLAY APPROVED (and archive-buttons)
     ========================================================= */
  function displayApprovedUploads() {
    // base map for WI / FS / PF / SF
    const map = {
      // Working Instructions
      "Receivables":        "approved_wi_receivables",
      "Payables":           "approved_wi_payables",
      "Purchasing":         "approved_wi_purchasing",
      "General Ledger":     "approved_wi_general_ledger",
      "Oracle Guides":      "approved_wi_oracle_guides",
      "Fixed Asset":        "approved_wi_fixed_asset",
      "Inventory":          "approved_wi_inventory",
      "HRMS Global":        "approved_wi_hrms_global",
      // Functional Design Document
      "Functional Design Document": "approved_fs_oracle_enhancement",
      // Process Flow
      "Finance":            "approved_pf_finance",
      "Treasury":           "approved_pf_treasury",
      "HR":                 "approved_pf_hr",
      "IT":                 "approved_pf_it",
      // System Flow
      "Receivables":        "approved_sf_receivables",
      "Payables":           "approved_sf_payables",
      "Purchasing":         "approved_sf_purchasing",
      "Fixed Asset":        "approved_sf_fixed_asset",
      "Cash Management":    "approved_sf_cash_management",
      "General Ledger":     "approved_sf_general_ledger"
    };

    // helper to normalize keys → underscore IDs
    function normalize(s) {
      return s.toLowerCase().replace(/[\s\-]+/g,"_");
    }

    // SOP children mapping
    subOptions["Standard Operating Procedures"].forEach(parent => {
      (subOptions[parent]||[]).forEach(child => {
        map[child] = `approved_sop_${normalize(child)}`;
      });
    });

    // listen & render
    firebase.database().ref("uploads").on("value", snap => {
      const data = snap.val()||{};
      // clear
      Object.values(map).forEach(ulId => {
        const ul = document.getElementById(ulId);
        if (ul) ul.innerHTML = "";
      });
      // append entries
      Object.entries(data).forEach(([key,it]) => {
        if (!it.approved || it.archived) return;
        const ulId = map[it.subTopic];
        if (!ulId) return;
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
            btn.onclick     = () => requestArchive(key,it.title);
            li.appendChild(btn);
          }
        }
        ul.appendChild(li);
      });
    });
  }
  displayApprovedUploads();

  /* =========================================================
     ORACLE-STYLE % WILDCARD SEARCH SUPPORT
     ========================================================= */
  function wildcardMatch(text, pattern) {
    text    = text.toLowerCase();
    pattern = pattern.toLowerCase();
    const startsWithPct = pattern.startsWith('%');
    const endsWithPct   = pattern.endsWith('%');
    const core = pattern.replace(/^%+|%+$/g,'');
    if (startsWithPct && endsWithPct) {
      return core==='' ? true : text.includes(core);
    } else if (startsWithPct) {
      return text.endsWith(core);
    } else if (endsWithPct) {
      return text.startsWith(core);
    } else {
      return text===core;
    }
  }

  /* =========================================================
     SEARCH (global) with % support
     ========================================================= */
  window.searchContent = () => {
    const raw    = document.getElementById("searchInput").value.trim();
    const term   = raw.toLowerCase();
    const usePct = raw.includes('%');

    const lis    = document.querySelectorAll(".pdf-list li");
    const subs   = document.querySelectorAll(".subtopic-body");
    const dds    = document.querySelectorAll(".dropdown-body");
    const banner = document.getElementById("no-results");
    let found = false;

    if (!raw) {
      banner.hidden = true;
      lis.forEach(li => li.style.display = "");
      subs.forEach(sb => sb.style.display = "none");
      dds.forEach(dd => dd.style.display = "none");
      return;
    }

    lis.forEach(li => {
      const title = li.textContent.trim();
      const match = usePct
                    ? wildcardMatch(title, raw)
                    : title.includes(term);
      li.style.display = match ? "" : "none";
      if (match) found = true;
    });

    subs.forEach(sb => {
      sb.style.display =
        Array.from(sb.querySelectorAll("li"))
             .some(li => li.style.display!=="none")
          ? "block" : "none";
    });
    dds.forEach(dd => {
      dd.style.display =
        Array.from(dd.querySelectorAll("li"))
             .some(li => li.style.display!=="none")
          ? "block" : "none";
    });
    banner.hidden = found;
  };

  /* =========================================================
     LOAD ARCHIVED FILES (read-only)
     ========================================================= */
  function loadArchivedFiles() {
    archivedList.innerHTML = "";
    firebase.database().ref("uploads")
      .orderByChild("archived").equalTo(true)
      .once("value").then(snap => {
        const data = snap.val();
        if (!data) {
          const li = document.createElement("li");
          li.textContent = "No archived files.";
          archivedList.appendChild(li);
          return;
        }
        Object.values(data).forEach(it => {
          const li = document.createElement("li");
          li.innerHTML = `<a href="${it.fileUrl}" target="_blank">${it.title}</a>`;
          archivedList.appendChild(li);
        });
      })
      .catch(console.error);
  }
});
