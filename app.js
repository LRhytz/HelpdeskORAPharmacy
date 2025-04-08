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

// Google API Client configuration
const CLIENT_ID = "1059066470727-1tgtdmv41p4584japq7hte1t5euuh7gt.apps.googleusercontent.com"; // Replace with your Client ID
const API_KEY = 'AIzaSyAam6YiJoJJ5e00vt-8PGSeGocJ_OLzgZw'; // Replace with your API Key
const SCOPES = 'https://www.googleapis.com/auth/drive.file'; // Google Drive API scope

let gapiInited = false;
let gisInited = false;

// Load Google API and initialize OAuth client
function loadGapi() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(() => {
        gapiInited = true;
        checkAuth();
    });
}

// Check if the user is authorized
function checkAuth() {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
}

// Update UI based on sign-in status
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        console.log("User is signed in");
        // Enable the upload button
        document.getElementById("add-file-btn").style.display = "block";
    } else {
        console.log("User is not signed in");
        // Trigger sign-in process
        gapi.auth2.getAuthInstance().signIn();
    }
}

// Handle file upload to Google Drive
function uploadFileToDrive() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please choose a file to upload.");
        return;
    }

    const fileMetadata = {
        'name': file.name,
        'mimeType': file.type
    };

    const media = {
        mimeType: file.type,
        body: file
    };

    const request = gapi.client.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    });

    request.execute(function(response) {
        if (response.id) {
            alert('File uploaded successfully!');
            // You can add further functionality to store file metadata in Firebase Realtime Database.
        } else {
            alert('Error uploading file.');
        }
    });
}

// Call the Google API to initialize and sign in
loadGapi();


