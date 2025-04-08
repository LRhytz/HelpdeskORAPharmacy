// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    databaseURL: "YOUR_DATABASE_URL", // Make sure this points to your Firebase Realtime Database
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// -- Authentication for "Add File" functionality --
const authContainer = document.getElementById("auth-container");
const authBtn = document.getElementById("auth-btn");
const authPassword = document.getElementById("auth-password");
const addFileBtn = document.getElementById("add-file-btn");

// When the user clicks "Enter" in the auth container:
authBtn.addEventListener("click", function() {
    // Example: correct password is "secret" (case-sensitive)
    if (authPassword.value === "secret") {
        // Hide the authentication container
        authContainer.style.display = "none";
        // Show the "Add File" button
        addFileBtn.style.display = "block";
        // Optionally clear the password input
        authPassword.value = "";
    } else {
        alert("Incorrect password. Please try again.");
    }
});

// -- Toggle the file upload form when "Add File" is clicked --
addFileBtn.addEventListener("click", function() {
    const fileUploadForm = document.getElementById("file-upload-form");
    // Toggle the visibility of the file upload form
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

// -- Handle the file upload process and store metadata in Realtime Database --
function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const fileTitle = document.getElementById("fileTitle").value;
    const file = fileInput.files[0];

    // Check for file and title
    if (!file || fileTitle === "") {
        alert("Please choose a file and provide a title.");
        return;
    }

    // Example: Store file on a different server and get its URL
    const fileUrl = "https://your-external-host.com/path/to/your/file.pdf"; // URL of the hosted file

    // Store metadata in Firebase Realtime Database
    const dbRef = firebase.database().ref('uploads'); // Reference to the uploads node
    const newFileRef = dbRef.push(); // Create a new unique ID for the file
    newFileRef.set({
        title: fileTitle,
        fileName: file.name,
        fileUrl: fileUrl,  // Store the file URL (this is hosted elsewhere)
        timestamp: Date.now()
    }).then(() => {
        alert("File metadata uploaded successfully!");
    }).catch((error) => {
        console.error("Error uploading metadata:", error);
        alert("Error uploading file metadata. Please try again.");
    });
}
