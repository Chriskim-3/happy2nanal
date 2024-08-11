import * as templates from './templates.js';

// 임시 데이터 저장소 (실제 구현에서는 데이터베이스를 사용해야 합니다)
let studyContents = {};
let qnaPosts = {};
let notices = {};
let files = {};

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

function showStudyList(topic) {
    if (!studyContents[topic]) {
        studyContents[topic] = [];
    }
    document.getElementById('mainContent').innerHTML = templates.showStudyList(topic, studyContents[topic]);
}

function showStudyForm(topic) {
    document.getElementById('mainContent').innerHTML = templates.showStudyForm(topic);
}

function saveStudyContent(topic) {
    const title = document.getElementById('studyTitle').value;
    const content = document.getElementById('studyContent').value;
    const key = Date.now().toString();
    studyContents[topic].push({key, title, content, topic, date: new Date().toLocaleString()});
    showStudyList(topic);
}

function showQnAList() {
    document.getElementById('mainContent').innerHTML = templates.showQnAList(qnaPosts);
}

function showQnAForm() {
    document.getElementById('mainContent').innerHTML = templates.showQnAForm();
}

function savePost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('editor').value;
    const key = Date.now().toString();
    qnaPosts[key] = {title, content, date: new Date().toLocaleString()};
    showQnAList();
}

function showNoticeList() {
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

function saveNotice() {
    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    const key = Date.now().toString();
    notices[key] = {title, content, date: new Date().toLocaleString()};
    showNoticeList();
}

function showFileUpload() {
    document.getElementById('mainContent').innerHTML = templates.showFileUpload(files);
}

function showFileUploadForm() {
    document.getElementById('mainContent').innerHTML = templates.showFileUploadForm();
}

function uploadFile() {
    const title = document.getElementById('fileTitle').value;
    const content = document.getElementById('fileContent').value;
    const fileName = document.getElementById('fileInput').value.split('\\').pop();
    const key = Date.now().toString();
    files[key] = {title, content, fileName, date: new Date().toLocaleString()};
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
