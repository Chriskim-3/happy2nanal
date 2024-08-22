import * as dataManager from './dataManager.js';
import * as templates from './templates.js';

// 메뉴 핸들러 객체
const menuHandlers = {
    showContent: function(content) {
        document.getElementById('mainContent').innerHTML = templates.showContent(content);
    },
    showStudyList: function(topic) {
        dataManager.fetchStudyContentsFromFirebase().then(contents => {
            const filteredContents = Object.entries(contents || {})
                .filter(([key, value]) => value.topic === topic)
                .map(([key, value]) => ({ ...value, key }));
            document.getElementById('mainContent').innerHTML = templates.showStudyList(topic, filteredContents);
        });
    },
    showQnAList: function() {
        dataManager.fetchPostsFromFirebase().then(posts => {
            document.getElementById('mainContent').innerHTML = templates.showQnAList(posts);
        });
    },
    showNoticeList: function() {
        dataManager.fetchNoticesFromFirebase().then(notices => {
            document.getElementById('mainContent').innerHTML = templates.showNoticeList(notices);
        });
    },
    showFileUpload: function() {
        dataManager.fetchFilesFromFirebase().then(files => {
            document.getElementById('mainContent').innerHTML = templates.showFileUpload(files);
        });
    }
};

// 이벤트 리스너 설정 함수
function setupEventListeners() {
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const action = link.getAttribute('data-action');
            const param = link.getAttribute('data-param');
            if (action && menuHandlers[action]) {
                menuHandlers[action](param);
            }
        });
    });
}

// 학습 내용 관련 함수
function showStudyForm(topic) {
    document.getElementById('mainContent').innerHTML = templates.showStudyForm(topic);
}

function saveStudyContent(topic) {
    const title = document.getElementById('studyTitle').value;
    const content = document.getElementById('studyContent').value;
    if (title && content) {
        dataManager.addStudyContentToFirebase(topic, title, content).then(() => {
            menuHandlers.showStudyList(topic);
        });
    }
}

function viewStudyContent(key) {
    dataManager.fetchStudyContentsFromFirebase().then(contents => {
        const item = contents[key];
        document.getElementById('mainContent').innerHTML = templates.viewStudyContent(item, key);
    });
}

function editStudyContent(key) {
    dataManager.fetchStudyContentsFromFirebase().then(contents => {
        const item = contents[key];
        document.getElementById('mainContent').innerHTML = templates.editStudyContent(item, key);
    });
}

function updateStudyContent(key) {
    const title = document.getElementById('studyTitle').value;
    const content = document.getElementById('studyContent').value;
    const topic = document.getElementById('studyTopic').value;
    if (title && content) {
        dataManager.updateStudyContentInFirebase(key, topic, title, content).then(() => {
            viewStudyContent(key);
        });
    }
}

function deleteStudyContent(key) {
    if (confirm('정말로 이 학습 내용을 삭제하시겠습니까?')) {
        dataManager.deleteStudyContentFromFirebase(key).then(() => {
            menuHandlers.showStudyList(document.getElementById('currentTopic').value);
        });
    }
}

// Q&A 관련 함수
function showQnAForm() {
    document.getElementById('mainContent').innerHTML = templates.showQnAForm();
}

function savePost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('editor').value;
    if (title && content) {
        dataManager.addPostToFirebase(title, content).then(() => {
            menuHandlers.showQnAList();
        });
    }
}

function viewPost(key) {
    dataManager.fetchPostsFromFirebase().then(posts => {
        const post = posts[key];
        document.getElementById('mainContent').innerHTML = templates.viewPost(post, key);
    });
}

function editPost(key) {
    dataManager.fetchPostsFromFirebase().then(posts => {
        const post = posts[key];
        document.getElementById('mainContent').innerHTML = templates.editPost(post, key);
    });
}

function updatePost(key) {
    const title = document.getElementById('editTitle').value;
    const content = document.getElementById('editEditor').value;
    if (title && content) {
        dataManager.updatePostInFirebase(key, title, content).then(() => {
            viewPost(key);
        });
    }
}

function deletePost(key) {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        dataManager.deletePostFromFirebase(key).then(() => {
            menuHandlers.showQnAList();
        });
    }
}

// 공지사항 관련 함수
function showNoticePasswordForm() {
    document.getElementById('mainContent').innerHTML = templates.showNoticePasswordForm();
}

function checkNoticePassword() {
    const password = document.getElementById('noticePassword').value;
    if (password === '369369') {
        showNoticeForm();
    } else {
        alert('비밀번호가 올바르지 않습니다.');
    }
}

function showNoticeForm() {
    document.getElementById('mainContent').innerHTML = templates.showNoticeForm();
}

function saveNotice() {
    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    if (title && content) {
        dataManager.addNoticeToFirebase(title, content).then(() => {
            menuHandlers.showNoticeList();
        });
    } else {
        alert('제목과 내용을 모두 입력해주세요.');
    }
}

// 자료실 관련 함수
function showFileUploadForm() {
    document.getElementById('mainContent').innerHTML = templates.showFileUploadForm();
}

function uploadFile() {
    const title = document.getElementById('fileTitle').value;
    const content = document.getElementById('fileContent').value;
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (title && content && file) {
        dataManager.addFileToFirebase(title, content, file.name).then(() => {
            menuHandlers.showFileUpload();
        });
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    menuHandlers.showContent('Welcome to Happy2Nanal');
});

// 필요한 함수들만 전역으로 노출
window.showStudyForm = showStudyForm;
window.saveStudyContent = saveStudyContent;
window.viewStudyContent = viewStudyContent;
window.editStudyContent = editStudyContent;
window.updateStudyContent = updateStudyContent;
window.deleteStudyContent = deleteStudyContent;
window.showQnAForm = showQnAForm;
window.savePost = savePost;
window.viewPost = viewPost;
window.editPost = editPost;
window.updatePost = updatePost;
window.deletePost = deletePost;
window.showNoticePasswordForm = showNoticePasswordForm;
window.checkNoticePassword = checkNoticePassword;
window.showNoticeForm = showNoticeForm;
window.saveNotice = saveNotice;
window.showFileUploadForm = showFileUploadForm;
window.uploadFile = uploadFile;
