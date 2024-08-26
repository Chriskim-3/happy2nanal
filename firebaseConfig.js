import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// enableIndexedDbPersistence 부분을 제거하거나 주석 처리합니다.
// 이 기능이 필요하다면 별도로 구현해야 합니다.

export { app, analytics, database };
