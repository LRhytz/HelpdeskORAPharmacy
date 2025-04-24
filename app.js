/* ===================================================
   app.js – full, self-contained source
   (with DOMContentLoaded guard, “peek” toggle,
    both legacy + new mappings, wildcard `%` search,
    and archived-view)
   =================================================== */
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
  
    /* ---------- peek-toggle ---------- */
    if (togglePwd && authPassword) {
      togglePwd.addEventListener("click", () => {
        const hidden = authPassword.type === "password";
        authPassword.type = hidden ? "text" : "password";
        togglePwd.classList.toggle("fa-eye");
        togglePwd.classList.toggle("fa-eye-slash");
      });
    }
  
    /* ---------- auth ---------- */
    if (authBtn) {
      authBtn.addEventListener("click", authenticate);
    }
    authPassword.addEventListener("keydown", e => {
      if (e.key === "Enter") authenticate();
    });
    function authenticate() {
      if (authPassword.value === "@Helpd3sk") {
        authContainer  .style.display = "none";
        addFileBtn     .style.display = "block";
        viewArchivedBtn.style.display = "block";
        authPassword.value = "";
        isAuthenticated = true;
        displayApprovedUploads();
      } else {
        alert("Incorrect password.");
      }
    }
  
    /* ---------- modals ---------- */
    addFileBtn      .addEventListener("click", () => fileModal.hidden    = false);
    modalClose      .addEventListener("click", () => fileModal.hidden    = true);
    fileModal       .addEventListener("click", e => { if (e.target === fileModal) fileModal.hidden = true; });
    viewArchivedBtn .addEventListener("click", () => {
      archivedModal.hidden = false;
      loadArchivedFiles();
    });
    archivedClose   .addEventListener("click", () => archivedModal.hidden = true);
    archivedModal   .addEventListener("click", e => { if (e.target === archivedModal) archivedModal.hidden = true; });
  
    /* ---------- file-input UI ---------- */
    const fileInputElement = document.getElementById("fileInput");
    const fileNameSpan     = document.getElementById("selected-file-name");
    fileInputElement.addEventListener("change", () => {
      fileNameSpan.textContent = fileInputElement.files.length
        ? fileInputElement.files[0].name
        : "No file chosen";
    });
  
    /* ========= ACCORDIONS (global) ========= */
    window.toggleDropdown = function(bodyId, arrowId) {
      const body  = document.getElementById(bodyId);
      const arrow = document.getElementById(arrowId);
      if (!body) return;
      const open = body.style.display === "block";
      body.style.display = open ? "none" : "block";
      if (arrow) arrow.textContent = open ? "▼" : "▲";
    };
    window.toggleSubTopics = function(containerId, arrowId) {
      const c = document.getElementById(containerId);
      const a = document.getElementById(arrowId);
      if (!c) return;
      const open = c.style.display === "block";
      c.style.display = open ? "none" : "block";
      if (a) a.textContent = open ? "▼" : "▲";
    };
  
    /* =========================================================
       UPLOAD → Cloudinary → Firebase
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
  
    window.uploadFile = function() {
      const file      = fileInputElement.files[0];
      const title     = document.getElementById("fileTitle").value.trim();
      const moduleSel = document.getElementById("module-dropdown").value;
      if (!file || !title) {
        return alert("Choose a file and title.");
      }
      uploadFileToCloudinary(file)
        .then(url => firebase.database().ref("uploads").push({
          title, fileName:file.name, fileUrl:url,
          module:moduleSel, timestamp:Date.now(),
          approved:false, archiveRequested:false, archived:false
        }))
        .then(() => {
          alert("Uploaded! Awaiting approval.");
          fileModal.hidden = true;
          fileInputElement.value = "";
          document.getElementById("fileTitle").value = "";
          fileNameSpan.textContent = "No file chosen";
        })
        .catch(err => {
          console.error(err);
          alert("Upload failed.");
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
      const map = {
        /* modern keys */
        "Receivables":       "approved_wi_receivables",
        "Payables":          "approved_wi_payables",
        "Purchasing":        "approved_wi_purchasing",
        "General Ledger":    "approved_wi_general_ledger",
        "Oracle Guides":     "approved_wi_oracle_guides",
        "Fixed Asset":       "approved_wi_fixed_asset",
        "Inventory":         "approved_wi_inventory",
        "HRMS Global":       "approved_wi_hrms_global",
        "sop_treasury":      "approved_sop_treasury",
        "sop_payables":      "approved_sop_payables",
        "sop_receivables":   "approved_sop_receivables",
        "sop_store_audit":   "approved_sop_store_audit",
        "sop_taxation":      "approved_sop_taxation",
        "sop_general_ledger":"approved_sop_general_ledger",
        "fs_oracle_enhancement":"approved_fs_oracle_enhancement",
        "fs_sharepoint_pa":  "approved_fs_sharepoint_pa",
        "pf-PDF":            "approved_pf_pdf",
        /* legacy seeds */
        "WorkingInstructions_Receivables":"approved_wi_receivables",
        "WorkingInstructions_Payables":   "approved_wi_payables",
        "WorkingInstructions_Purchasing": "approved_wi_purchasing",
        "WorkingInstructions_GeneralLedger":"approved_wi_general_ledger",
        "WorkingInstructions_OracleGuides":"approved_wi_oracle_guides",
        "FunctionalSpecifications_OracleEnhancements":"approved_fs_oracle_enhancement",
        "FunctionalSpecifications_SharepointPA":"approved_fs_sharepoint_pa",
        "ProcessFlow_PDF":"approved_pf_pdf"
      };
  
      firebase.database().ref("uploads").on("value", snap => {
        const data = snap.val();
        if (!data) return;
        // clear
        Object.values(map).forEach(ulId => {
          const ul = document.getElementById(ulId);
          if (ul) ul.innerHTML = "";
        });
        // append
        Object.entries(data).forEach(([key,it]) => {
          if (it.approved !== true || it.archived) return;
          let ulId = map[it.module];
          if (!ulId) {
            console.warn("No mapping:", it.module);
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
       ORACLE-STYLE % WILDCARD SEARCH SUPPORT
       ========================================================= */
    function wildcardMatch(text, pattern) {
      text    = text.toLowerCase();
      pattern = pattern.toLowerCase();
      const startsWithPct = pattern.startsWith('%');
      const endsWithPct   = pattern.endsWith('%');
      const core = pattern.replace(/^%+|%+$/g, '');
      if (startsWithPct && endsWithPct) {
        return core === '' ? true : text.includes(core);
      } else if (startsWithPct) {
        return text.endsWith(core);
      } else if (endsWithPct) {
        return text.startsWith(core);
      } else {
        return text === core;
      }
    }
  
    /* =========================================================
       SEARCH (global) with % support
       ========================================================= */
    window.searchContent = function() {
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
                      : title.toLowerCase().includes(term);
        li.style.display = match ? "" : "none";
        if (match) found = true;
      });
  
      subs.forEach(sb => {
        sb.style.display =
          Array.from(sb.querySelectorAll("li"))
               .some(li => li.style.display !== "none")
            ? "block" : "none";
      });
      dds.forEach(dd => {
        dd.style.display =
          Array.from(dd.querySelectorAll("li"))
               .some(li => li.style.display !== "none")
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
  