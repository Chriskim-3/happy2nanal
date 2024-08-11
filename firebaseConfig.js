// firebaseConfig.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtyjw-rPmCLoXK7O471upPawvJmp6jaWA",
  authDomain: "nanal-9e758.firebaseapp.com",
  databaseURL: "https://nanal-9e758-default-rtdb.firebaseio.com",
  projectId: "nanal-9e758",
  storageBucket: "nanal-9e758.appspot.com",
  messagingSenderId: "1073199749734",
  appId: "1:1073199749734:web:372da8e47d7366e1242ba7",
  measurementId: "G-L20RGTW4TC"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    console.error('Firebase initialization error', error);
  }
  app = firebase.app(); // 이미 초기화된 앱이 있다면 그것을 사용
}

const analytics = getAnalytics(app);
const database = getDatabase(app);

export { app, analytics, database };
