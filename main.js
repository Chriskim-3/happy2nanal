// main.js
import { database } from './firebaseConfig.js';
import * as dataManager from './dataManager.js';
import * as templates from './templates.js';

// 홈페이지 소개
window.showContent = function(content) {
    document.getElementById('mainContent').innerHTML = templates.showContent(content);
};

// 학습 내용 관련 함수
window.showStudyList = function(topic) {
    const studyContents = dataManager.getFromLocalStorage('studyContents');
    document.getElementById('mainContent').innerHTML = templates.showStudyList(topic, studyContents);
};

window.showStudyForm = function(topic) {
    document.getElementById('mainContent').innerHTML = templates.showStudyForm(topic);
};

window.saveStudyContent = function(topic) {
    const title = document.getElementById('studyTitle').value;
    const content = document.getElementById('studyContent').value;
    if (title && content) {
        const studyContents = dataManager.getFromLocalStorage('studyContents');
        const updatedContents = dataManager.addStudyContent(studyContents, topic, title, content);
        dataManager.saveToLocalStorage('studyContents', updatedContents);
        showStudyList(topic);
    }
};

window.viewStudyContent = function(index) {
    const studyContents = dataManager.getFromLocalStorage('studyContents');
    const item = studyContents[index];
    document.getElementById('mainContent').innerHTML = templates.viewStudyContent(item, index);
};

window.editStudyContent = function(index) {
    const studyContents = dataManager.getFromLocalStorage('studyContents');
    const item = studyContents[index];
    document.getElementById('mainContent').innerHTML = templates.editStudyContent(item, index);
};

window.updateStudyContent = function(index) {
    const title = document.getElementById('studyTitle').value;
    const content = document.getElementById('studyContent').value;
    if (title && content) {
        const studyContents = dataManager.getFromLocalStorage('studyContents');
        const topic = studyContents[index].topic;
        const updatedContents = dataManager.updateStudyContent(studyContents, index, topic, title, content);
        dataManager.saveToLocalStorage('studyContents', updatedContents);
        viewStudyContent(index);
    }
};

window.deleteStudyContent = function(index) {
    if (confirm('정말로 이 학습 내용을 삭제하시겠습니까?')) {
        const studyContents = dataManager.getFromLocalStorage('studyContents');
        const topic = studyContents[index].topic;
        const updatedContents = dataManager.deleteStudyContent(studyContents, index);
        dataManager.saveToLocalStorage('studyContents', updatedContents);
        showStudyList(topic);
    }
};

// Q&A 관련 함수
window.showQnAList = function() {
    dataManager.fetchPostsFromFirebase().then(posts => {
        document.getElementById('mainContent').innerHTML = templates.showQnAList(posts);
    });
};

window.showQnAForm = function() {
    document.getElementById('mainContent').innerHTML = templates.showQnAForm();
};

window.savePost = function() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('editor').value;
    if (title && content) {
        dataManager.addPostToFirebase(title, content).then(() => {
            showQnAList();
        });
    }
};

window.viewPost = function(key) {
    dataManager.fetchPostsFromFirebase().then(posts => {
        const post = posts[key];
        document.getElementById('mainContent').innerHTML = templates.viewPost(post, key);
    });
};

window.editPost = function(key) {
    dataManager.fetchPostsFromFirebase().then(posts => {
        const post = posts[key];
        document.getElementById('mainContent').innerHTML = templates.editPost(post, key);
    });
};

window.updatePost = function(key) {
    const title = document.getElementById('editTitle').value;
    const content = document.getElementById('editEditor').value;
    if (title && content) {
        dataManager.updatePostInFirebase(key, title, content).then(() => {
            viewPost(key);
        });
    }
};

window.deletePost = function(key) {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        dataManager.deletePostFromFirebase(key).then(() => {
            showQnAList();
        });
    }
};

// 공지사항 관련 함수
window.showNoticeList = function() {
    const notices = dataManager.getFromLocalStorage('notices');
    document.getElementById('mainContent').innerHTML = templates.showNoticeList(notices);
};

window.showNoticePasswordForm = function() {
    document.getElementById('mainContent').innerHTML = templates.showNoticePasswordForm();
};

window.checkNoticePassword = function() {
    const password = document.getElementById('noticePassword').value;
    if (password === '369369') {
        showNoticeForm();
    } else {
        alert('비밀번호가 올바르지 않습니다.');
    }
};

window.showNoticeForm = function() {
    document.getElementById('mainContent').innerHTML = templates.showNoticeForm();
};

window.saveNotice = function() {
    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    if (title && content) {
        const notices = dataManager.getFromLocalStorage('notices');
        const updatedNotices = dataManager.addNotice(notices, title, content);
        dataManager.saveToLocalStorage('notices', updatedNotices);
        showNoticeList();
    } else {
        alert('제목과 내용을 모두 입력해주세요.');
    }
};

// 자료실 관련 함수
window.showFileUpload = function() {
    const files = dataManager.getFromLocalStorage('files');
    document.getElementById('mainContent').innerHTML = templates.showFileUpload(files);
};

window.showFileUploadForm = function() {
    document.getElementById('mainContent').innerHTML = templates.showFileUploadForm();
};

window.uploadFile = function() {
    const title = document.getElementById('fileTitle').value;
    const content = document.getElementById('fileContent').value;
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (title && content && file) {
        const files = dataManager.getFromLocalStorage('files');
        const updatedFiles = dataManager.addFile(files, title, content, file.name);
        dataManager.saveToLocalStorage('files', updatedFiles);
        showFileUpload();
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 메뉴 클릭 이벤트 리스너 등록
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const action = link.getAttribute('onclick');
            if (action) {
                eval(action);
            }
        });
    });
});
