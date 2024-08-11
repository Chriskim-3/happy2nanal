import * as templates from './templates.js';

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
    // 여기에 학습 목록을 표시하는 로직을 구현합니다.
    // templates.showStudyList 함수를 사용하세요.
}

function showQnAList() {
    // 여기에 Q&A 목록을 표시하는 로직을 구현합니다.
    // templates.showQnAList 함수를 사용하세요.
}

function showNoticeList() {
    // 여기에 공지사항 목록을 표시하는 로직을 구현합니다.
    // templates.showNoticeList 함수를 사용하세요.
}

function showFileUpload() {
    // 여기에 파일 업로드 목록을 표시하는 로직을 구현합니다.
    // templates.showFileUpload 함수를 사용하세요.
}

// 초기 페이지 로드 시 홈페이지 표시
window.onload = showHomePage;

// 전역 스코프에 함수들을 할당
window.openNav = openNav;
window.closeNav = closeNav;
window.showHomePage = showHomePage;
window.showContent = showContent;
window.showStudyList = showStudyList;
window.showQnAList = showQnAList;
window.showNoticeList = showNoticeList;
window.showFileUpload = showFileUpload;
