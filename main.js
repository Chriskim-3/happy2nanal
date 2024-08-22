import * as templates from './templates.js';
import { database } from './firebase-config.js';
import { ref, push, set, get, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Firebase 레퍼런스 설정
const studyContentsRef = ref(database, 'studyContents');
const qnaPostsRef = ref(database, 'qnaPosts');
const noticesRef = ref(database, 'notices');
const filesRef = ref(database, 'files');

function openNav() {
    document.getElementById("sidebar").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("sidebar").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
}

function showHomePage() {
    document.getElementById('mainContent').innerHTML = `
        <h2>Welcome to Happy2Nanal</h2>
        <p>당신의 칼퇴를 응원합니다!</p>
        <img src="beach_img.webp" alt="Beach Image" style="max-width: 100%; height: auto;">
    `;
}

function showContent(content) {
    document.getElementById('mainContent').innerHTML = templates.showContent(content);
}

async function showStudyList(topic) {
    const topicRef = ref(database, `studyContents/${topic}`);
    const snapshot = await get(topicRef);
    const studyContents = snapshot.val() || {};
    document.getElementById('mainContent').innerHTML = templates.showStudyList(topic, Object.values(studyContents));
}

function showStudyForm(topic) {
    document.getElementById('mainContent').innerHTML = templates.showStudyForm(topic);
}

async function saveStudyContent(topic) {
    const title = document.getElementById('studyTitle').value;
    const content = document.getElementById('studyContent').value;
    const newStudyRef = push(ref(database, `studyContents/${topic}`));
    await set(newStudyRef, {
        title,
        content,
        topic,
        date: new Date().toLocaleString()
    });
    showStudyList(topic);
}

async function showQnAList() {
    const snapshot = await get(qnaPostsRef);
    const qnaPosts = snapshot.val() || {};
    document.getElementById('mainContent').innerHTML = templates.showQnAList(qnaPosts);
}

function showQnAForm() {
    document.getElementById('mainContent').innerHTML = templates.showQnAForm();
}

async function savePost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('editor').value;
    const newPostRef = push(qnaPostsRef);
    await set(newPostRef, {
        title,
        content,
        date: new Date().toLocaleString()
    });
    showQnAList();
}

async function showNoticeList() {
    const snapshot = await get(noticesRef);
    const notices = snapshot.val() || {};
    document.getElementById('mainContent').innerHTML = templates.showNoticeList(notices);
}

function showNoticePasswordForm() {
    document.getElementById('mainContent').innerHTML = templates.showNoticePasswordForm();
}

function checkNoticePassword() {
    const password = document.getElementById('noticePassword').value;
    if (password === "admin") { // 실제 구현에서는 더 안전한 인증 방식을 사용해야 합니다
        showNoticeForm();
    } else {
        alert("비밀번호가 올바르지 않습니다.");
    }
}

function showNoticeForm() {
    document.getElementById('mainContent').innerHTML = templates.showNoticeForm();
}

async function saveNotice() {
    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    const newNoticeRef = push(noticesRef);
    await set(newNoticeRef, {
        title,
        content,
        date: new Date().toLocaleString()
    });
    showNoticeList();
}

async function showFileUpload() {
    const snapshot = await get(filesRef);
    const files = snapshot.val() || {};
    document.getElementById('mainContent').innerHTML = templates.showFileUpload(files);
}

function showFileUploadForm() {
    document.getElementById('mainContent').innerHTML = templates.showFileUploadForm();
}

async function uploadFile() {
    const title = document.getElementById('fileTitle').value;
    const content = document.getElementById('fileContent').value;
    const fileName = document.getElementById('fileInput').value.split('\\').pop();
    const newFileRef = push(filesRef);
    await set(newFileRef, {
        title,
        content,
        fileName,
        date: new Date().toLocaleString()
    });
    showFileUpload();
}

// 초기 페이지 로드 시 홈페이지 표시
window.onload = showHomePage;

// 전역 스코프에 함수들을 할당
window.openNav = openNav;
window.closeNav = closeNav;
window.showHomePage = showHomePage;
window.showContent = showContent;
window.showStudyList = showStudyList;
window.showStudyForm = showStudyForm;
window.saveStudyContent = saveStudyContent;
window.showQnAList = showQnAList;
window.showQnAForm = showQnAForm;
window.savePost = savePost;
window.showNoticeList = showNoticeList;
window.showNoticePasswordForm = showNoticePasswordForm;
window.checkNoticePassword = checkNoticePassword;
window.showNoticeForm = showNoticeForm;
window.saveNotice = saveNotice;
window.showFileUpload = showFileUpload;
window.showFileUploadForm = showFileUploadForm;
window.uploadFile = uploadFile;
