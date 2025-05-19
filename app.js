  // app.js

  document.addEventListener("DOMContentLoaded", () => {
    // --- Firebase Configuration ---
    const firebaseConfig = {
      apiKey: "AIzaSyBaSuFhNUeghfXEznYCHxYnagkjiojfO_M",
      authDomain: "helpdeskrpharmacy.firebaseapp.com",
      databaseURL: "https://helpdeskrpharmacy-default-rtdb.firebaseio.com",
      projectId: "helpdeskrpharmacy",
      messagingSenderId: "776189919696",
      appId: "1:776189919696:web:ab3be5e265dbfff8faf9d5",
      measurementId: "G-TL0ZQ9L17Q",
    };


    window.uploadFile    = uploadFile;
    window.searchContent = searchContent;
    // Initialize Firebase safely
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      } else {
        firebase.app();
      }
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Firebase initialization error:", error);
      alert("Error initializing the application. Please check your connection and reload.");
      return;
    }

    // --- Constants ---
    const CLOUD_NAME    = "dkwkdsnk7";
    const UPLOAD_PRESET = "Helpdesk_Rpharmacy";

    const categoryMappings = {
      "Working Instructions": {
        Receivables: {
          Maintenance: "receivables-maintenance-body",
          "Operational Procedure": "receivables-operational-procedure-body"
        },
        Payables: {
          Maintenance: "payables-maintenance-body",
          "Operational Procedure": "payables-operational-procedure-body"
        },
        Purchasing: {
          Maintenance: "purchasing-maintenance-body",
          "Operational Procedure": "purchasing-operational-procedure-body"
        },
        "Fixed Asset": {
          Maintenance: "fixed-asset-maintenance-body",
          "Operational Procedure": "fixed-asset-operational-procedure-body"
        },
        "Cash Management": {
          Maintenance: "cash-management-maintenance-body",
          "Operational Procedure": "cash-management-operational-procedure-body"
        },
        Inventory: {
          Maintenance: "inventory-maintenance-body"
        },
        "HRMS Global": {
          Maintenance: "hrms-global-maintenance-body"
        },
        "General Ledger": {
          Maintenance: "general-ledger-maintenance-body",
          "Operational Procedure": "general-ledger-operational-procedure-body"
        },
        "Oracle Guides": "oracle-guides-body",
      },
      "Standard Operating Procedures": {
        Finance: {
          AR: "ar-body",
          AP: "ap-body",
          "Sales Audit": "sales-audit-body",
          "General Ledger": "general-ledger-body",
          "Inventory Control": "inventory-control-body",
          Tax: "tax-body",
        },
        Treasury: {
          "Check-run": "checkrun-body",
          "Bank Control": "bank-control-body",
          "Cash Flow": "cash-flow-body",
        },
        HR: {
          Payroll: "payroll-body",
          Timekeeping: "timekeeping-body",
        },
        IT: {
          Application: "application-body",
          Infra: "infra-body",
        },
      },
      "Functional Specifications": {
        Receivables: "fs_receivables-body",
        Payables: "fs_payables-body",
        "Cash Management": "fs_cash_management-body",
        "General Ledger": "fs_general_ledger-body",
        "Related Document": "fs_related_document-body",
      },
      "Process Flow": {
        Finance: "pf_finance-body",
        Treasury: "pf_treasury-body",
        HR: "pf_hr-body",
        IT: "pf_it-body",
      },
      "System Flow": {
        Receivables: "sf_receivables-body",
        Payables: "sf_payables-body",
        Purchasing: "sf_purchasing-body",
        "Fixed Asset": "sf_fixed_asset-body",
        "Cash Management": "sf_cash_management-body",
        "General Ledger": "sf_general_ledger-body",
      },
      "Templates": {
        Templates: "tl_templates",
      },
    };

    const listIdPrefixes = {
      "Working Instructions": "approved_wi_",
      "Standard Operating Procedures": "approved_sop_",
      "Functional Specifications": "approved_fs_",
      "Process Flow": "approved_pf_",
      "System Flow": "approved_sf_",
      "Templates": "approved_tl_",
    };

    const iconMap = {
      "Working Instructions": "Icons/information-pamphlet.png",
      "Standard Operating Procedures": "Icons/standard-operating-procedures.png",
      "Functional Specifications": "Icons/design-resources.png",
      "Process Flow": "Icons/workflow.png",
      "System Flow": "Icons/workflow.png",
      "Templates": "Icons/templates.png",
    };

    // Alias "Functional Specifications" to "Functional Specifications"
    categoryMappings["Functional Specifications"] = categoryMappings["Functional Specifications"];
    listIdPrefixes["Functional Specifications"]    = listIdPrefixes["Functional Specifications"];
    iconMap["Functional Specifications"]           = iconMap["Functional Specifications"];

    // --- State Variables ---
    let isAuthenticated = false;

    // --- UI Elements ---
    const getElement = id => document.getElementById(id);

    const profileIcon       = getElement("profile-icon");
    const loginModal        = getElement("login-modal");
    const loginCloseBtn     = loginModal?.querySelector(".modal-close");
    const loginEmail        = getElement("login-email");
    const loginPassword     = getElement("login-password");
    const loginErrorDiv     = getElement("login-error");
    const loginBtn          = getElement("login-btn");
    const logoutBtn         = getElement("logout-btn");
    const changePasswordBtn = getElement("change-password-btn");
    const userDisplay       = getElement("user-display");

    const viewArchivedBtn   = getElement("view-archived-btn");
    const addFileBtn        = getElement("add-file-btn");
    const adminLoginBtn     = getElement("admin-login-btn");

    const fileUploadModal   = getElement("file-upload-modal");
    const fileCloseBtn      = fileUploadModal?.querySelector(".modal-close");
    const fileInputElement  = getElement("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
      // wire the Upload button to your uploadFile() fn
      uploadBtn.addEventListener("click", uploadFile);
    const fileTitleInput    = getElement("fileTitle");
    const fileNameSpan      = getElement("selected-file-name");
    const archivedModal     = getElement("archived-modal");
    const archivedCloseBtn  = archivedModal?.querySelector(".modal-close");
    const archivedList      = getElement("archived-files-list");
    const moduleDropdown    = getElement("module-dropdown");
    const searchInput       = getElement("searchInput");
    const searchBtn         = getElement("searchBtn");

    // --- Safe Event Listener ---
  const addSafeEventListener = (el, ev, fn) => {
    if (el) el.addEventListener(ev, fn);  
  };

    // — Admin-only “Add Section” modal wiring —
    const addSectionBtn   = getElement("add-section-btn");
    const addSectionModal = getElement("add-section-modal");
    const addSectionClose = addSectionModal?.querySelector(".modal-close");

    addSafeEventListener(addSectionBtn,   "click", () => { addSectionModal.hidden = false; });
    addSafeEventListener(addSectionClose, "click", () => { addSectionModal.hidden = true; });

  addSafeEventListener(getElement("add-section-save"), "click", async () => {
    const mainSel = getElement("add-section-main");
    const nameIn  = getElement("add-section-name");
    const main    = mainSel.value;
    const name    = nameIn.value.trim();
    if (!name) return alert("Please enter a section name.");

    const slug   = slugify(name);
    const bodyId = `${slug}-body`;

    try {
      // Persist under customSections/<Main>/<slug>
      await firebase.database().ref(`customSections/${main}/${slug}`)
        .set({ name, bodyId });

      // Merge in-memory & rebuild
      categoryMappings[main][name] = bodyId;
      buildDynamicAccordion();
      buildModuleDropdown();
      displayApprovedUploads();

      alert(`Section “${name}” added under ${main}.`);
      addSectionModal.hidden = true;
      nameIn.value = "";
    } catch (err) {
      console.error("Error adding section:", err);
      alert("Could not add section: " + err.message);
    }
  });


    // --- Modal toggles ---
    addSafeEventListener(profileIcon,     "click", () => { loginModal.hidden = false; });
    addSafeEventListener(loginCloseBtn,   "click", () => { loginModal.hidden = true; });
    addSafeEventListener(addFileBtn,      "click", () => { fileUploadModal.hidden = false; });
    addSafeEventListener(fileCloseBtn,    "click", () => { fileUploadModal.hidden = true; });
    addSafeEventListener(searchBtn, "click", searchContent);
    addSafeEventListener(viewArchivedBtn, "click", () => {
      archivedModal.hidden = false;
      loadArchivedFiles();
    });
    addSafeEventListener(archivedCloseBtn,"click", () => { archivedModal.hidden = true; });
    addSafeEventListener(loginEmail, "keyup", e => {
      if (e.key === "Enter") loginBtn.click();
    });
    addSafeEventListener(loginPassword, "keyup", e => {
      if (e.key === "Enter") loginBtn.click();
    });

    // --- LOGIN / LOGOUT / RESET PASSWORD ---
    addSafeEventListener(loginBtn, "click", () => {
      const email = (loginEmail.value || "").trim();
      const pw    = loginPassword.value || "";
      loginErrorDiv.textContent = "";
      if (!email || !pw) {
        loginErrorDiv.textContent = "Please enter both email & password.";
        return;
      }
      firebase.auth()
    .signInWithEmailAndPassword(email, pw)
    .then(() => {
      alert("Login successful!");
      loginModal.hidden = true;
    })
    .catch(err => {
      let msg;
      switch (err.code) {
        case "auth/invalid-email":
        case "auth/user-disabled":
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-login-credentials":      // ← add this line
          msg = "Oops—email or password is incorrect. Please try again.";
          break;
        default:
          msg = "Login error: " + err.message;
      }
      loginErrorDiv.textContent = msg;
    });  

    });

    addSafeEventListener(logoutBtn, "click", () => {
      firebase.auth().signOut().then(() => {
        alert("You have been logged out.");
      });
    });

    // ===== REPLACE THIS BLOCK =====
    addSafeEventListener(changePasswordBtn, "click", async () => {
      const user = firebase.auth().currentUser;
      if (!user) {
        alert("You must be logged in to change your password.");
        return;
      }
    
      const currentPassword = prompt("Enter your current password:");
      if (!currentPassword) return;
    
      const newPassword = prompt("Enter your new password:");
      if (!newPassword) return;
    
      try {
        const cred = firebase.auth.EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await user.reauthenticateWithCredential(cred);
        await user.updatePassword(newPassword);
        alert("✅ Password updated successfully!");
      } catch (err) {
        console.error("Password change error:", err);
        alert("Error changing password: " + err.message);
      }
    });
    


    // --- ROLE BUTTON HANDLER ---
    addSafeEventListener(adminLoginBtn, "click", () => {
      window.location.href = "admin.html";
    });

    // --- Auth State Listener ---
    firebase.auth().onAuthStateChanged(user => {
      isAuthenticated = !!user;
      loginBtn.hidden          = isAuthenticated;
      logoutBtn.hidden         = !isAuthenticated;
      changePasswordBtn.hidden = !isAuthenticated;
      if (userDisplay) {
        userDisplay.textContent = isAuthenticated ? user.email : "";
      }
      displayApprovedUploads();
      applyRoleUI(user);
    });

    function applyRoleUI(user) {
      if (!user) {
        viewArchivedBtn.style.display = "none";
        addFileBtn.style.display      = "none";
        adminLoginBtn.style.display   = "none";
        document.querySelectorAll(".admin-only").forEach(el => {
          el.style.display = "none";
        });
        return;
      }
      
      firebase.database().ref(`users/${user.uid}`).once("value")
        .then(snapshot => {
          const roles = snapshot.val() || {};
          viewArchivedBtn.style.display = roles.uploader ? "inline-block" : "none";
          addFileBtn.style.display      = roles.uploader ? "inline-block" : "none";
          adminLoginBtn.style.display   = roles.admin    ? "inline-block" : "none";
          
          // Toggle admin-only elements based on admin role
          document.querySelectorAll(".admin-only").forEach(el => {
            el.style.display = roles.admin ? "inline-block" : "none";
          });
        })
        .catch(err => {
          console.error("Error fetching user roles:", err);
          viewArchivedBtn.style.display = addFileBtn.style.display = adminLoginBtn.style.display = "none";
          document.querySelectorAll(".admin-only").forEach(el => {
            el.style.display = "none";
          });
        });
    }

    // --- Helpers ---
    function slugify(text) {
      return text.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/_/g, '-')
                .replace(/[^\w\-]+/g, '');
    }

    // --- Build Accordion ---
    // Modify the buildDynamicAccordion function to add delete buttons

    function buildDynamicAccordion() {
      const container = getElement("dynamic-accordion");
      if (!container) {
        console.error("Dynamic accordion container not found!");
        return;
      }
      container.innerHTML = "";
    
      Object.entries(categoryMappings).forEach(([topLevel, mids]) => {
        const topSlug = slugify(topLevel);
        const card    = document.createElement("div");
        card.className = "dropdown-card";
        card.setAttribute("data-category", topLevel);
    
        // ─── Header ───────────────────────────────────────────────────────────
        const btn = document.createElement("div");
        btn.className = "dropdown-btn";
        btn.onclick   = () => toggleDropdown(`${topSlug}-body`, `arrow-${topSlug}`);
    
        const titleDiv = document.createElement("div");
        titleDiv.className = "card-title";
        const img = document.createElement("img");
        img.src       = iconMap[topLevel] || "Icons/default.png";
        img.alt       = topLevel;
        img.className = "topic-icon";
        titleDiv.appendChild(img);
        titleDiv.appendChild(
          Object.assign(document.createElement("span"), { textContent: topLevel })
        );
        btn.appendChild(titleDiv);
    
        const arrow = document.createElement("span");
        arrow.id         = `arrow-${topSlug}`;
        arrow.className  = "arrow";
        arrow.textContent = "▼";
        btn.appendChild(arrow);
    
        // ─── Body ─────────────────────────────────────────────────────────────
        const body = document.createElement("div");
        body.className = "dropdown-body";
        body.id        = `${topSlug}-body`;
        body.style.display = "none";
    
        Object.entries(mids).forEach(([midKey, midVal]) => {
          const midSlug = slugify(midKey);
    
          if (typeof midVal === "string") {
            // ─── Single-level ───────────────────────────────────────────────
            const subBtn = document.createElement("div");
            subBtn.className = "subtopic-btn";
    
            // unique IDs: topSlug + midSlug
            const subId   = `${topSlug}-${midSlug}-body`;
            const arrowId = `arrow-${topSlug}-${midSlug}`;
    
            subBtn.onclick = () => toggleSubTopics(subId, arrowId);
    
            const subBtnContent = document.createElement("div");
            subBtnContent.className = "subtopic-btn-content";
            subBtnContent.appendChild(
              Object.assign(document.createElement("span"), { textContent: midKey })
            );
            subBtn.appendChild(subBtnContent);
    
            // arrow with new namespace
            subBtn.appendChild(Object.assign(
              document.createElement("span"),
              { id: arrowId, className: "arrow", textContent: "▼" }
            ));
    
            const subBody = document.createElement("div");
            subBody.className = "subtopic-body";
            subBody.id        = subId;
            subBody.style.display = "none";
    
            const ul = document.createElement("ul");
            ul.id = listIdPrefixes[topLevel] + midKey.toLowerCase().replace(/\s+/g, "_");
            ul.className = "pdf-list";
            subBody.appendChild(ul);
    
            body.appendChild(subBtn);
            body.appendChild(subBody);
    
          } else {
            // ─── Two-level ─────────────────────────────────────────────────
            const subBtn = document.createElement("div");
            subBtn.className = "subtopic-btn";
    
            // namespace for the intermediate level
            const subParentId   = `${topSlug}-${midSlug}-body`;
            const subParentArrow= `arrow-${topSlug}-${midSlug}`;
    
            subBtn.onclick = () => toggleSubTopics(subParentId, subParentArrow);
    
            const subBtnContent = document.createElement("div");
            subBtnContent.className = "subtopic-btn-content";
            subBtnContent.appendChild(
              Object.assign(document.createElement("span"), { textContent: midKey })
            );
            subBtn.appendChild(subBtnContent);
    
            subBtn.appendChild(Object.assign(
              document.createElement("span"),
              { id: subParentArrow, className: "arrow", textContent: "▼" }
            ));
    
            const subBody = document.createElement("div");
            subBody.className = "subtopic-body";
            subBody.id        = subParentId;
            subBody.style.display = "none";
    
            // now each leaf under this midKey
            Object.entries(midVal).forEach(([leafKey, leafOrigId]) => {
              const leafSlug = slugify(leafKey);
    
              // fully-namespaced IDs
              const leafId    = `${topSlug}-${midSlug}-${leafSlug}-body`;
              const leafArrow = `arrow-${topSlug}-${midSlug}-${leafSlug}`;
    
              const leafBtn = document.createElement("div");
              leafBtn.className = "subtopic-btn";
              leafBtn.onclick  = () => toggleSubTopics(leafId, leafArrow);
    
              const leafBtnContent = document.createElement("div");
              leafBtnContent.className = "subtopic-btn-content";
              leafBtnContent.appendChild(
                Object.assign(document.createElement("span"), { textContent: leafKey })
              );
              leafBtn.appendChild(leafBtnContent);
    
              leafBtn.appendChild(Object.assign(
                document.createElement("span"),
                { id: leafArrow, className: "arrow", textContent: "▼" }
              ));
    
              const leafBody = document.createElement("div");
              leafBody.className = "subtopic-body";
              leafBody.id        = leafId;
              leafBody.style.display = "none";
    
              const leafUl = document.createElement("ul");
              leafUl.id        = `${listIdPrefixes[topLevel]}${midSlug}_${leafSlug}`;
              leafUl.className = "pdf-list";
              leafBody.appendChild(leafUl);
    
              subBody.appendChild(leafBtn);
              subBody.appendChild(leafBody);
            });
    
            body.appendChild(subBtn);
            body.appendChild(subBody);
          }
        });
    
        card.appendChild(btn);
        card.appendChild(body);
        container.appendChild(card);
      });
    }
    

    // --- Build Module Dropdown ---
    function buildModuleDropdown() {
      if (!moduleDropdown) {
        console.error("Module dropdown not found!");
        return;
      }
      moduleDropdown.innerHTML = "";

      Object.entries(categoryMappings).forEach(([topLevel, mids]) => {
        const optgroup = document.createElement("optgroup");
        optgroup.label = topLevel;

        Object.entries(mids).forEach(([midKey, midVal]) => {
          if (typeof midVal === "string") {
            const option = document.createElement("option");
            option.value = midKey;
            option.textContent = midKey;
            optgroup.appendChild(option);
          } else {
            Object.keys(midVal).forEach(leafKey => {
              const option = document.createElement("option");
              option.value = `${midKey}_${leafKey}`;
              option.textContent = `${midKey} → ${leafKey}`;
              optgroup.appendChild(option);
            });
          }
        });

        moduleDropdown.appendChild(optgroup);
      });
    }

    // --- Accordion toggles ---
    window.toggleDropdown = (bodyId, arrowId) => {
      const body  = getElement(bodyId);
      const arrow = getElement(arrowId);
      if (!body) return;
      const open = body.style.display === "block";
      body.style.display = open ? "none" : "block";
      if (arrow) arrow.textContent = open ? "▼" : "▲";
    };
    window.toggleSubTopics = (cId, aId) => {
      const c = getElement(cId);
      const a = getElement(aId);
      if (!c) return;
      const open = c.style.display === "block";
      c.style.display = open ? "none" : "block";
      if (a) a.textContent = open ? "▼" : "▲";
    };

    // --- Upload File ---
    function uploadFile() {
      if (!fileInputElement || !fileTitleInput || !moduleDropdown) {
        alert("Error: Upload form elements not found.");
        return;
      }
      if (!firebase.auth().currentUser) {
        alert("Please log in to upload files.");
        loginModal.hidden = false;
        return;
      }

      const selOpt = moduleDropdown.selectedOptions[0];
      if (!selOpt) {
        alert("Please select a module.");
        return;
      }
      const optgroup = selOpt.closest("optgroup");
      if (!optgroup) {
        alert("Invalid selection.");
        return;
      }

      let topLevel = optgroup.label;
      let subTopic = selOpt.value;
      const section = selOpt.textContent.trim();

      if (topLevel === "Working Instructions" && section.includes("→")) {
        const parts = section.split("→").map(p => p.trim());
        if (parts.length === 2) {
          subTopic = { module: parts[0], section: parts[1] };
        }
      }

      const file  = fileInputElement.files[0];
      const title = fileTitleInput.value.trim();
      if (!file) {
        alert("Please choose a file to upload.");
        return;
      }
      if (!title) {
        alert("Please enter a title for the file.");
        return;
      }

      const loader = getElement("upload-loader");
      if (loader) loader.style.display = "block";

      firebase.database().ref("uploads")
        .orderByChild("fileName").equalTo(file.name).once("value")
        .then(snapshot => {
          if (snapshot.exists()) throw new Error("duplicate-file");
          return firebase.database().ref("uploads")
            .orderByChild("title").equalTo(title).once("value");
        })
        .then(snapshot => {
          if (snapshot.exists()) throw new Error("duplicate-title");
          return uploadFileToCloudinary(file);
        })
        .then(url => {
          if (!url) throw new Error("Failed to get upload URL");
          return firebase.database().ref("uploads").push({
            title,
            fileName: file.name,
            fileUrl: url,
            topLevelTopic: topLevel,
            subTopic,
            timestamp: Date.now(),
            approved: false,
            archiveRequested: false,
            archived: false,
            uploaderUid: firebase.auth().currentUser.uid,
            uploaderEmail: firebase.auth().currentUser.email || "Unknown"
          });
        })
        .then(() => {
          alert("✅ File uploaded successfully! Awaiting approval.");
          fileInputElement.value = "";
          fileTitleInput.value = "";
          if (fileNameSpan) fileNameSpan.textContent = "No file chosen";
          fileUploadModal.hidden = true;
          if (loader) loader.style.display = "none";
          displayApprovedUploads();
        })
        .catch(err => {
          if (loader) loader.style.display = "none";
          if (err.message === "duplicate-file") {
            alert("🚫 That file name already exists in the system.");
          } else if (err.message === "duplicate-title") {
            alert(`🚫 A file titled "${title}" already exists. Please choose a different title.`);
          } else {
            console.error("Upload error:", err);
            alert("Upload failed: " + (err.message || "Unknown error"));
          }
        });
    }

    function uploadFileToCloudinary(file) {
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return Promise.reject(new Error("File size exceeds 10MB limit."));
      }
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("resource_type", "raw");
      const timestamp = Date.now();
      const publicId = file.name.replace(/\s+/g, "_").replace(/\.[^/.]+$/, "") + "_" + timestamp;
      formData.append("public_id", publicId);
      formData.append("upload_preset", UPLOAD_PRESET);

      return fetch(url, { method: "POST", body: formData })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then(data => {
          if (!data.secure_url) throw new Error(data.error?.message || "Error uploading to Cloudinary");
          return data.secure_url;
        })
        .catch(error => {
          console.error("Cloudinary upload error:", error);
          throw new Error("File upload service error: " + error.message);
        });
    }

    // --- Display Approved Uploads ---
    function addFileToList(list, upload, key) {
      if (!list) return;
      const li = document.createElement("li");
      const a  = document.createElement("a");
      a.href        = upload.fileUrl;
      a.target      = "_blank";
      a.textContent = upload.title;
      a.rel         = "noopener noreferrer";
      li.appendChild(a);

      if (isAuthenticated) {
        const btn = document.createElement("button");
        btn.textContent = "Archive";
        btn.className   = "archive-btn";
        btn.onclick     = e => {
          e.preventDefault();
          requestArchive(key, upload.title);
        };
        li.appendChild(btn);
      }

      list.appendChild(li);
    }

    function displayApprovedUploads() {
      firebase.database().ref("uploads")
        .orderByChild("approved").equalTo(true).once("value")
        .then(snapshot => {
          const uploads = snapshot.val() || {};
          document.querySelectorAll(".pdf-list").forEach(ul => ul.innerHTML = "");
    
          Object.entries(uploads).forEach(([key, upload]) => {
            if (upload.archived) return;
            const prefix = listIdPrefixes[upload.topLevelTopic]
                        || listIdPrefixes["Standard Operating Procedures"];
    
            let suffix;
            if (
              typeof upload.subTopic === "object" &&
              upload.subTopic.module &&
              upload.subTopic.section
            ) {
              // two-part (module/section) logic you already have…
              const m = upload.subTopic.module
                        .toLowerCase()
                        .replace(/\s+/g, "_");
              const s = upload.subTopic.section
                        .toLowerCase()
                        .replace(/\s+/g, "_");
              suffix = `${m}_${s}`;
    
            } else if (typeof upload.subTopic === "string") {
              // custom-section bodyId ends in “-body”?
              if (upload.subTopic.endsWith("-body")) {
                suffix = upload.subTopic
                  .replace(/-body$/, "")  // strip the “-body”
                  .replace(/-/g, "_");    // hyphens → underscores
              } else {
                // fallback for “normal” single-word topics
                suffix = upload.subTopic
                  .toLowerCase()
                  .replace(/\s+/g, "_");
              }
    
            } else {
              console.warn(`Invalid subTopic for ${key}`);
              suffix = "unknown";
            }
    
            const ul = document.getElementById(prefix + suffix);
            if (ul) addFileToList(ul, upload, key);
            else console.warn(`List not found: ${prefix+suffix} for "${upload.title}"`);
          });
        })
        .catch(err => console.error("Error fetching uploads:", err));
    }
    

    // --- Archive / Archived List / Search ---
    function requestArchive(key, title) {
      if (!isAuthenticated) {
        alert("Please log in to archive files.");
        loginModal.hidden = false;
        return;
      }
      if (!confirm(`Archive "${title}"?`)) return;
      firebase.database().ref(`uploads/${key}`)
        .update({ archiveRequested: true })
        .then(() => {
          alert("Archive request submitted.");
          displayApprovedUploads();
        })
        .catch(err => {
          console.error("Archive error:", err);
          alert("Error archiving: " + err.message);
        });
    }

    function loadArchivedFiles() {
      archivedList.innerHTML = "<li>Loading archived files...</li>";
      firebase.database().ref("uploads")
        .orderByChild("archived").equalTo(true)
        .once("value")
        .then(snapshot => {
          const data = snapshot.val();
          archivedList.innerHTML = "";
          if (!data) return archivedList.innerHTML = "<li>No archived files.</li>";
          const files = Object.values(data).sort((a,b) => (a.title||"").localeCompare(b.title||""));
          files.forEach(file => {
            const li = document.createElement("li");
            const a  = document.createElement("a");
            a.href        = file.fileUrl;
            a.target      = "_blank";
            a.textContent = file.title || "Untitled";
            const meta = document.createElement("span");
            meta.className = "file-meta";
            meta.textContent = ` - ${new Date(file.timestamp||0).toLocaleDateString()}`;
            li.appendChild(a);
            li.appendChild(meta);
            archivedList.appendChild(li);
          });
        })
        .catch(err => {
          console.error("Load archived error:", err);
          archivedList.innerHTML = "<li>Error loading archived files.</li>";
        });
    }

    function searchContent() {
      const raw = (searchInput.value || "").trim();
      const term = raw.toLowerCase();
      const usePct = raw.includes("%");
      const lis = document.querySelectorAll(".pdf-list li");
      const subs = document.querySelectorAll(".subtopic-body");
      const dds = document.querySelectorAll(".dropdown-body");
      const banner = getElement("no-results");

      if (!raw) {
        if (banner) banner.hidden = true;
        lis.forEach(li => li.style.display = "");
        subs.forEach(sb => sb.style.display = "none");
        dds.forEach(dd => dd.style.display = "none");
        return;
      }

      let found = false;
      lis.forEach(li => {
        const txt = li.textContent.trim().toLowerCase();
        const ok = usePct
          ? (() => {
              const p = raw.toLowerCase();
              if (p.startsWith("%") && p.endsWith("%")) return txt.includes(p.slice(1,-1));
              if (p.startsWith("%")) return txt.endsWith(p.slice(1));
              if (p.endsWith("%")) return txt.startsWith(p.slice(0,-1));
              return txt === p;
            })()
          : txt.includes(term);
        li.style.display = ok ? "" : "none";
        if (ok) found = true;
      });
      subs.forEach(sb => {
        const any = Array.from(sb.querySelectorAll("li")).some(li => li.style.display !== "none");
        sb.style.display = any ? "block" : "none";
      });
      dds.forEach(dd => {
        const any = Array.from(dd.querySelectorAll("li")).some(li => li.style.display !== "none");
        dd.style.display = any ? "block" : "none";
      });
      if (banner) banner.hidden = found;
    }

    addSafeEventListener(searchInput, "keyup", e => {
      if (e.key === "Enter") searchContent();
    });
    addSafeEventListener(searchBtn, "click", searchContent);
    addSafeEventListener(uploadBtn, "click", uploadFile);
    addSafeEventListener(fileInputElement, "change", () => {
      const f = fileInputElement.files[0];
      fileNameSpan.textContent = f ? f.name : "No file chosen";
    });

  // --- Load any saved custom sections & then initialize everything ---
  firebase.database().ref("customSections").once("value")
    .then(snapshot => {
      const custom = snapshot.val() || {};
      Object.entries(custom).forEach(([mainTopic, secs]) => {
        if (!categoryMappings[mainTopic]) return;
        Object.values(secs).forEach(({ name, bodyId }) => {
          categoryMappings[mainTopic][name] = bodyId;
        });
      });
    })
    .catch(console.error)
    .finally(() => {
      buildDynamicAccordion();
      buildModuleDropdown();
      displayApprovedUploads();
      console.log("App initialized successfully");
    });
  });

