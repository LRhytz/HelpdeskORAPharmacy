// Firebase configuration
const firebaseConfig = {
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

// Cloudinary configuration (replace these with your actual values)
const CLOUD_NAME = "dkwkdsnk7";  
const UPLOAD_PRESET = "Helpdesk_Rpharmacy";

// -- Authentication for "Add File" functionality --
const authContainer = document.getElementById("auth-container");
const authBtn = document.getElementById("auth-btn");
const authPassword = document.getElementById("auth-password");
const addFileBtn = document.getElementById("add-file-btn");

authBtn.addEventListener("click", function() {
    // Example: correct password is "secret"
    if (authPassword.value === "secret") {
        authContainer.style.display = "none";
        addFileBtn.style.display = "block";
        authPassword.value = "";
    } else {
        alert("Incorrect password. Please try again.");
    }
});

// -- Toggle the file upload form when "Add File" is clicked --
addFileBtn.addEventListener("click", function() {
    const fileUploadForm = document.getElementById("file-upload-form");
    if (fileUploadForm.style.display === "none") {
        fileUploadForm.style.display = "block";
    } else {
        fileUploadForm.style.display = "none";
    }
});

// -- Update the custom file upload UI with the selected filename --
const fileInputElement = document.getElementById('fileInput');
const fileNameSpan = document.getElementById('selected-file-name');
fileInputElement.addEventListener('change', function() {
    if (fileInputElement.files && fileInputElement.files.length > 0) {
        fileNameSpan.textContent = fileInputElement.files[0].name;
    } else {
        fileNameSpan.textContent = "No file chosen";
    }
});

/**
 * Uploads the file to Cloudinary and returns a Promise that resolves with the secure URL.
 */
function uploadFileToCloudinary(file) {
    console.log("Starting upload to Cloudinary for file:", file.name);
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    return fetch(url, {
        method: "POST",
        body: formData
    })
    .then(response => {
        console.log("Cloudinary response status:", response.status);
        return response.json();
    })
    .then(data => {
        console.log("Parsed Cloudinary response:", data);
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error(data.error ? data.error.message : "Unknown error from Cloudinary");
        }
    })
    .catch(error => {
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    });
}

/**
 * Main upload function.
 * It uploads the file to Cloudinary, then stores the file metadata (including the Cloudinary URL) in Firebase Realtime Database.
 */
function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const fileTitle = document.getElementById("fileTitle").value;
    const file = fileInput.files[0];

    if (!file || fileTitle === "") {
        alert("Please choose a file and provide a title.");
        return;
    }

    console.log("Uploading file:", file.name);
    
    // Upload file to Cloudinary first
    uploadFileToCloudinary(file)
        .then(fileUrl => {
            console.log("File uploaded to Cloudinary, secure URL:", fileUrl);
            // Store metadata in Firebase Realtime Database
            const dbRef = firebase.database().ref("uploads");
            const newFileRef = dbRef.push();
            newFileRef.set({
                title: fileTitle,
                fileName: file.name,
                fileUrl: fileUrl,
                timestamp: Date.now(),
                approved: false
            })
            .then(() => {
                alert("File metadata uploaded successfully! Awaiting approval.");
            })
            .catch(error => {
                console.error("Error uploading metadata:", error);
                alert("Error uploading file metadata. Please try again.");
            });
        })
        .catch(error => {
            alert("Error uploading file. Please try again.");
        });
}
