// Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBaSuFhNUeghfXEznYCHxYnagkjiojfO_M",
    authDomain: "helpdeskrpharmacy.firebaseapp.com",
    databaseURL: "https://helpdeskrpharmacy-default-rtdb.firebaseio.com",
    projectId: "helpdeskrpharmacy",
    storageBucket: "helpdeskrpharmacy.firebasestorage.app",
    messagingSenderId: "776189919696",
    appId: "1:776189919696:web:ab3be5e265dbfff8faf9d5",
    measurementId: "G-TL0ZQ9L17Q"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Cloudinary configuration
  var CLOUD_NAME = "dkwkdsnk7";
  var UPLOAD_PRESET = "Helpdesk_Rpharmacy";
  
  // --- Authentication ---
  var authContainer = document.getElementById("auth-container");
  var authBtn = document.getElementById("auth-btn");
  var authPassword = document.getElementById("auth-password");
  var addFileBtn = document.getElementById("add-file-btn");
  
  authBtn.addEventListener("click", function () {
    if (authPassword.value === "@Helpd3sk") {
      authContainer.style.display = "none";
      addFileBtn.style.display = "block";
      authPassword.value = "";
    } else {
      alert("Incorrect password. Please try again.");
    }
  });
  
  addFileBtn.addEventListener("click", function () {
    var fileUploadForm = document.getElementById("file-upload-form");
    fileUploadForm.style.display =
      fileUploadForm.style.display === "none" ? "block" : "none";
  });
  
  // --- Update Custom File Upload UI ---
  var fileInputElement = document.getElementById("fileInput");
  var fileNameSpan = document.getElementById("selected-file-name");
  fileInputElement.addEventListener("change", function () {
    if (fileInputElement.files && fileInputElement.files.length > 0) {
      fileNameSpan.textContent = fileInputElement.files[0].name;
    } else {
      fileNameSpan.textContent = "No file chosen";
    }
  });
  
  // --- Toggle Functions ---
  function toggleDropdown(bodyId, arrowId) {
    var body = document.getElementById(bodyId);
    var arrow = document.getElementById(arrowId);
    if (!body) return;
    if (body.style.display === "" || body.style.display === "none") {
      body.style.display = "block";
      if (arrow) arrow.textContent = "▲";
    } else {
      body.style.display = "none";
      if (arrow) arrow.textContent = "▼";
    }
  }
  
  function toggleSubTopics(containerId, arrowId) {
    var container = document.getElementById(containerId);
    var arrow = document.getElementById(arrowId);
    if (!container) return;
    if (container.style.display === "" || container.style.display === "none") {
      container.style.display = "block";
      if (arrow) arrow.textContent = "▲";
    } else {
      container.style.display = "none";
      if (arrow) arrow.textContent = "▼";
    }
  }
  
  // --- File Upload to Cloudinary & Save Metadata to Firebase ---
  function uploadFileToCloudinary(file) {
    console.log("Starting upload to Cloudinary for file:", file.name);
    // Use raw/upload endpoint for PDFs
    var url = "https://api.cloudinary.com/v1_1/" + CLOUD_NAME + "/raw/upload";
    var formData = new FormData();
    formData.append("file", file);
    // Set resource type explicitly for a raw file upload (PDF)
    formData.append("resource_type", "raw");
    
    // Custom Public ID: sanitize filename and remove its extension.
    var sanitizedName = file.name.replace(/\s+/g, "_").replace(/\.[^/.]+$/, "");
    // Append a timestamp (do not force '.pdf' so that Cloudinary handles it)
    var publicId = sanitizedName + "_" + Date.now();
    formData.append("public_id", publicId);
    
    formData.append("upload_preset", UPLOAD_PRESET);
  
    return fetch(url, { method: "POST", body: formData })
      .then(function (response) {
        console.log("Cloudinary response status:", response.status);
        return response.json();
      })
      .then(function (data) {
        console.log("Parsed Cloudinary response:", data);
        if (data.secure_url) {
          return data.secure_url;
        } else {
          throw new Error(data.error ? data.error.message : "Unknown error from Cloudinary");
        }
      })
      .catch(function (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw error;
      });
  }
  
  function uploadFile() {
    var fileInput = document.getElementById("fileInput");
    var fileTitle = document.getElementById("fileTitle").value;
    var file = fileInput.files[0];
    var moduleSelection = document.getElementById("module-dropdown").value; // Get the selected module
  
    if (!file || fileTitle === "") {
      alert("Please choose a file and provide a title.");
      return;
    }
  
    console.log("Uploading file:", file.name);
    uploadFileToCloudinary(file)
      .then(function (fileUrl) {
        console.log("File uploaded to Cloudinary. Secure URL:", fileUrl);
        var dbRef = firebase.database().ref("uploads");
        var newFileRef = dbRef.push();
        return newFileRef.set({
          title: fileTitle,
          fileName: file.name,
          fileUrl: fileUrl,
          module: moduleSelection, // Store the selected module (e.g., fs-PDF, pf-PDF)
          timestamp: Date.now(),
          approved: false
        });
      })
      .then(function () {
        alert("File metadata uploaded successfully! Awaiting approval.");
      })
      .catch(function (error) {
        console.error("Error in the upload process:", error);
        alert("Error uploading file. Please try again.");
      });
  }
  

  // --- Display Approved Uploads ---
function displayApprovedUploads() {
  var uploadsRef = firebase.database().ref("uploads");
  uploadsRef.orderByChild("approved").equalTo(true).on("value", function (snapshot) {
      var data = snapshot.val();

      // Clear existing approved items
      var containerIds = [
          "approved_wi_receivables",
          "approved_wi_payables",
          "approved_wi_purchasing",
          "approved_wi_general_ledger",
          "approved_wi_oracle_guides",
          "approved_sop_treasury",
          "approved_sop_payables",
          "approved_sop_receivables",
          "approved_sop_store_audit",
          "approved_sop_taxation",
          "approved_sop_general_ledger",
          "approved_fs_oracle_enhancement", 
          "approved_fs_sharepoint_pa", // Add fs-PDF
          "approved_pf_pdf"   // Add pf-PDF
      ];
      for (var i = 0; i < containerIds.length; i++) {
          var el = document.getElementById(containerIds[i]);
          if (el) {
              el.innerHTML = "";
          }
      }

      if (data) {
          for (var key in data) {
              if (data.hasOwnProperty(key)) {
                  var item = data[key];
                  var mod = item.module;
                  if (!mod) continue;

                  // Check for different modules and add files accordingly
                  if (mod === "Receivables") {
                      var container = document.getElementById("approved_wi_receivables");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                  } else if (mod === "Payables") {
                      var container = document.getElementById("approved_wi_payables");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                  } else if (mod === "Purchasing") {
                      var container = document.getElementById("approved_wi_purchasing");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                  } else if (mod === "General Ledger") {
                      var container = document.getElementById("approved_wi_general_ledger");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                  } else if (mod === "Oracle Guides") {
                      var container = document.getElementById("approved_wi_oracle_guides");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                  } else if (mod === "sop_treasury") {
                      var container = document.getElementById("approved_sop_treasury");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                    } else if (mod === "sop_payables") {
                      var container = document.getElementById("approved_sop_payables");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                    } else if (mod === "sop_receivables") {
                      var container = document.getElementById("approved_sop_receivables");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                    } else if (mod === "sop_store_audit") {
                      var container = document.getElementById("approved_sop_store_audit");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                    } else if (mod === "sop_taxation") {
                      var container = document.getElementById("approved_sop_taxation");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                    } else if (mod === "sop_general_ledger") {
                      var container = document.getElementById("approved_sop_general_ledger");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                  } else if (mod === "fs_oracle_enhancement") {  // Check for fs-PDF
                      var container = document.getElementById("approved_fs_oracle_enhancement");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                    } else if (mod === "fs_sharepoint_pa") {  // Check for fs-PDF
                      var container = document.getElementById("approved_fs_sharepoint_pa");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                  } else if (mod === "pf-PDF") {  // Check for pf-PDF
                      var container = document.getElementById("approved_pf_pdf");
                      if (container) {
                          var li = document.createElement("li");
                          li.innerHTML = '<a href="' + item.fileUrl + '" target="_blank">' + item.title + '</a>';
                          container.appendChild(li);
                      }
                  }
                  // Extend for additional modules if needed.
              }
          }
      }
  });
} 
  // Initialize the display of approved uploads on page load.
  displayApprovedUploads();
  
  // --- Search Functionality ---
  // This function filters approved file links based on the search term.
  // If a link matches, it automatically opens all parent containers so that the link is visible.
  function searchContent() {
    var term = document.getElementById("searchInput").value.toLowerCase();
    var approvedLinks = document.querySelectorAll(".pdf-list li a");
  
    var results = []; // Array to hold matching results
    var noMatch = []; // Array to hold non-matching results
  
    // Loop through each link and check if the text matches the search term
    for (var i = 0; i < approvedLinks.length; i++) {
      var link = approvedLinks[i];
      var text = link.textContent.toLowerCase();
  
      if (text.indexOf(term) > -1) {
        results.push(link.parentElement); // If match, add to results array
      } else {
        noMatch.push(link.parentElement); // If no match, add to noMatch array
      }
    }
  
    // Clear the parent containers for both matched and non-matched items
    var allLinks = document.querySelectorAll(".pdf-list li");
    for (var i = 0; i < allLinks.length; i++) {
      allLinks[i].style.display = "none"; // Hide all items initially
    }
  
    // Show matched results first
    for (var i = 0; i < results.length; i++) {
      results[i].style.display = ""; // Show matched results
    }
  
    // Show non-matched results (optional)
    for (var i = 0; i < noMatch.length; i++) {
      noMatch[i].style.display = ""; // Show non-matched results if needed
    }
  
    // Now we reorder the parent containers
    var container = document.getElementById("approved_" + mod.toLowerCase());
    // Insert the results at the top
    for (var i = 0; i < results.length; i++) {
      container.insertBefore(results[i], container.firstChild); // Move matching items to the top
    }
  }
  