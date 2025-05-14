  // admin.js
  document.addEventListener("DOMContentLoaded", () => {
    // — Initialize Firebase (same config as in app.js) —
    const firebaseConfig = {
      apiKey: "AIzaSyBaSuFhNUeghfXEznYCHxYnagkjiojfO_M",
      authDomain: "helpdeskrpharmacy.firebaseapp.com",
      databaseURL: "https://helpdeskrpharmacy-default-rtdb.firebaseio.com",
      projectId: "helpdeskrpharmacy",
      messagingSenderId: "776189919696",
      appId: "1:776189919696:web:ab3be5e265dbfff8faf9d5",
      measurementId: "G-TL0ZQ9L17Q"
    };
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    } else {
      firebase.app();
    }

    // — Auth guard & role check —
    firebase.auth().onAuthStateChanged(user => {
      if (!user) return window.location = "index.html";
      firebase.database()
        .ref("users/" + user.uid + "/admin")
        .once("value")
        .then(snap => {
          if (!snap.val()) throw "not-admin";
          loadApprovals();
          loadArchives();
        })
        .catch(() => window.location = "index.html");
    });

    // — Build one approval/archive card —
    function buildCard(it, key, type) {
      let modulePath;
      if (typeof it.subTopic === "object" && it.subTopic !== null) {
        modulePath = [
          it.topLevelTopic,
          it.subTopic.module,
          it.subTopic.section
        ].join(" › ");
      } else {
        modulePath = [ it.topLevelTopic, it.midLevelTopic, it.subTopic ]
          .filter(Boolean).join(" › ");
      }

      const card = document.createElement("div");
      card.className = "approval-card";
      card.innerHTML = `
        <div class="approval-title">${it.title}</div>
        <div class="approval-module">Module: ${modulePath}</div>
        <a class="approval-file-link" href="${it.fileUrl}" target="_blank">View File</a>
      `;

      const yes = document.createElement("button");
      const no  = document.createElement("button");
      yes.className = "approve-btn";
      no.className  = "reject-btn";

      if (type === "approval") {
        yes.textContent = "Approve";
        yes.onclick     = () => approveFile(key);
        no.textContent  = "Reject";
        no.onclick      = () => rejectFile(key);
      } else {
        yes.textContent = "Archive";
        yes.onclick     = () => approveArchive(key);
        no.textContent  = "Reject";
        no.onclick      = () => rejectArchive(key);
      }

      card.append(yes, no);
      return card;
    }

    // — Load pending approvals (skip any already rejected) —
    function loadApprovals() {
      firebase.database()
        .ref("uploads")
        .orderByChild("approved")
        .equalTo(false)
        .once("value", snap => {
          const box = document.getElementById("pending-approvals");
          box.innerHTML = "";
          const data = snap.val() || {};

          Object.entries(data).forEach(([key, it]) => {
            if (it.archiveRequested) return;  // not in approval stream
            if (it.rejected)        return;  // skip rejects
            box.appendChild(buildCard(it, key, "approval"));
          });

          if (!box.hasChildNodes()) {
            box.innerHTML = "<div class='no-pending'>No pending approvals.</div>";
          }
        }, err => console.error("loadApprovals:", err));
    }

    // — Load pending archive-requests —
    function loadArchives() {
      firebase.database()
        .ref("uploads")
        .orderByChild("archiveRequested")
        .equalTo(true)
        .once("value", snap => {
          const box = document.getElementById("pending-archives");
          box.innerHTML = "";
          const data = snap.val() || {};

          Object.entries(data).forEach(([key, it]) => {
            box.appendChild(buildCard(it, key, "archive"));
          });

          if (!box.hasChildNodes()) {
            box.innerHTML = "<div class='no-pending'>No archive requests.</div>";
          }
        }, err => console.error("loadArchives:", err));
    }

    // — Approve / Reject handlers —
    function approveFile(key) {
      firebase.database().ref("uploads/" + key)
        .update({ approved: true })
        .then(refreshIfEmpty)
        .catch(err => console.error("approveFile failed:", err));
    }
    function rejectFile(key) {
      firebase.database().ref("uploads/" + key)
        .update({ rejected: true })
        .then(refreshIfEmpty)
        .catch(err => console.error("rejectFile failed:", err));
    }
    function approveArchive(key) {
      firebase.database().ref("uploads/" + key)
        .update({ archived: true, archiveDate: Date.now(), archiveRequested: null })
        .then(refreshIfEmpty)
        .catch(err => console.error("approveArchive failed:", err));
    }
    function rejectArchive(key) {
      firebase.database().ref("uploads/" + key)
        .update({ archiveRequested: null })
        .then(refreshIfEmpty)
        .catch(err => console.error("rejectArchive failed:", err));
    }

    // — If both lists are empty, bounce back to index —
    function refreshIfEmpty() {
      const hasApprovals = !!document.querySelector("#pending-approvals .approval-card");
      const hasArchives  = !!document.querySelector("#pending-archives  .approval-card");
      if (hasApprovals || hasArchives) {
        loadApprovals();
        loadArchives();
      } else {
        window.location = "index.html";
      }
    }

    // — View Archived Modal toggle —
    document.getElementById("toggle-archived-btn")
      .addEventListener("click", () => {
        document.getElementById("archived-modal").style.display = "flex";
        loadArchivedFiles();
      });

    // — Load the “Archived Files” list inside admin modal —
    function loadArchivedFiles() {
      firebase.database().ref("uploads")
        .orderByChild("archived")
        .equalTo(true)
        .once("value", snap => {
          const box = document.getElementById("archived-files");
          box.innerHTML = "";
          const data = snap.val() || {};

          Object.entries(data).forEach(([key, it]) => {
            // reuse the same modulePath logic here
            const modulePath = (typeof it.subTopic === "object" && it.subTopic !== null)
              ? [ it.topLevelTopic, it.subTopic.module, it.subTopic.section ].join(" › ")
              : [ it.topLevelTopic, it.midLevelTopic, it.subTopic ]
                  .filter(Boolean).join(" › ");

            const card = document.createElement("div");
            card.className = "approval-card fade-in";
            card.innerHTML = `
              <div class="approval-title">${it.title}</div>
              <div class="approval-module">Module: ${modulePath}</div>
              <div class="approval-module">Archived on: ${new Date(it.archiveDate).toLocaleDateString()}</div>
              <a class="approval-file-link" href="${it.fileUrl}" target="_blank">View File</a>
            `;
            const restore = document.createElement("button");
            restore.textContent = "Restore";
            restore.className  = "approve-btn";
            restore.onclick    = () => restoreFile(key);
            card.appendChild(restore);
            box.appendChild(card);
          });
        }, err => console.error("loadArchivedFiles:", err));
    }

    function restoreFile(key) {
      if (!confirm("Restore this file back to its topic?")) return;
      firebase.database().ref("uploads/" + key)
        .update({ archived: false, archiveDate: null })
        .then(() => {
          document.getElementById("archived-modal").style.display = "none";
          loadApprovals();
          loadArchives();
        })
        .catch(err => console.error("restoreFile failed:", err));
    }
  });
