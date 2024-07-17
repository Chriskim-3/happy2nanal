// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBtyjw-rPmCLoXK7O471upPawvJmp6jaWA",
    authDomain: "nanal-9e758.firebaseapp.com",
    projectId: "nanal-9e758",
    storageBucket: "nanal-9e758.appspot.com",
    messagingSenderId: "1073199749734",
    appId: "1:1073199749734:web:372da8e47d7366e1242ba7",
    measurementId: "G-L20RGTW4TC"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.getAnalytics(app);
const database = firebase.database();
