import * as dataManager from './dataManager.js';
import * as templates from './templates.js';

// 메뉴 핸들러 객체
const menuHandlers = {
    showContent: function(content) {
        renderContent(templates.showContent(content));
    },
    showStudyList: async function(topic) {
        try {
            const contents = await dataManager.fetchStudyContentsFromFirebase();
            const filteredContents = Object.entries(contents || {})
                .filter(([key, value]) => value.topic === topic)
                .map(([key, value]) => ({ ...value, key }));
            renderContent(templates.showStudyList(topic, filteredContents));
        } catch (error) {
            handleError('학습 목록을 불러오는 중 오류가 발생했습니다.', error);
        }
    },
    showQnAList: async function() {
        try {
            const posts = await dataManager.fetchPostsFromFirebase();
            renderContent(templates.showQnAList(posts));
        } catch (error) {
            handleError('Q&A 목록을 불러오는 중 오류가 발생했습니다.', error);
        }
    },
    showNoticeList: async function() {
        try {
            const notices = await dataManager.fetchNoticesFromFirebase();
            renderContent(templates.showNoticeList(notices));
        } catch (error) {
            handleError('공지사항 목록을 불러오는 중 오류가 발생했습니다.', error);
        }
    },
    showFileUpload: async function() {
        try {
            const files = await dataManager.fetchFilesFromFirebase();
            renderContent(templates.showFileUpload(files));
        } catch (error) {
            handleError('파일 목록을 불러오는 중 오류가 발생했습니다.', error);
        }
    },
    showHomePage: function() {
        renderContent(`
            <h2>Welcome to Happy2Nanal</h2>
            <p>당신의 칼퇴를 응원합니다!</p>
            <img src="beach_img.webp" alt="Beach Image" style="max-width: 100%; height: auto;">
        `);
    }
};

function renderContent(content) {
    document.getElementById('mainContent').innerHTML = content;
}

function handleError(message, error) {
    console.error(message, error);
    alert(message);
}

function openNav() {
    document.getElementById("sidebar").style.width = "250px";
}

function closeNav() {
    document.getElementById("sidebar").style.width = "0";
}

// 이벤트 위임을 사용한 이벤트 처리
function handleEvent(event) {
    const target = event.target;
    if (target.matches('[data-action]')) {
        const action = target.dataset.action;
        const handler = eventHandlers[action];
        if (handler) {
            handler(target.dataset);
        }
    }
}

// 이벤트 핸들러 객체
const eventHandlers = {
    showStudyForm: (data) => renderContent(templates.showStudyForm(data.topic)),
    saveStudyContent: async (data) => {
        const title = document.getElementById('studyTitle').value;
        const content = document.getElementById('studyContent').value;
        if (title && content) {
            try {
                await dataManager.addStudyContentToFirebase(data.topic, title, content);
                menuHandlers.showStudyList(data.topic);
            } catch (error) {
                handleError('학습 내용 저장 중 오류가 발생했습니다.', error);
            }
        }
    },
    viewStudyContent: async (data) => {
        try {
            const contents = await dataManager.fetchStudyContentsFromFirebase();
            renderContent(templates.viewStudyContent(contents[data.key], data.key));
        } catch (error) {
            handleError('학습 내용을 불러오는 중 오류가 발생했습니다.', error);
        }
    },
    editStudyContent: async (data) => {
        try {
            const contents = await dataManager.fetchStudyContentsFromFirebase();
            renderContent(templates.editStudyContent(contents[data.key], data.key));
        } catch (error) {
            handleError('학습 내용을 불러오는 중 오류가 발생했습니다.', error);
        }
    },
    updateStudyContent: async (data) => {
        const title = document.getElementById('studyTitle').value;
        const content = document.getElementById('studyContent').value;
        const topic = document.getElementById('studyTopic').value;
        if (title && content) {
            try {
                await dataManager.updateStudyContentInFirebase(data.key, topic, title, content);
                eventHandlers.viewStudyContent(data);
            } catch (error) {
                handleError('학습 내용 업데이트 중 오류가 발생했습니다.', error);
            }
        }
    },
    deleteStudyContent: async (data) => {
        if (confirm('정말로 이 학습 내용을 삭제하시겠습니까?')) {
            try {
                await dataManager.deleteStudyContentFromFirebase(data.key);
                menuHandlers.showStudyList(document.getElementById('currentTopic').value);
            } catch (error) {
                handleError('학습 내용 삭제 중 오류가 발생했습니다.', error);
            }
        }
    },
    showQnAForm: () => renderContent(templates.showQnAForm()),
    savePost: async () => {
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('editor').value;
        if (title && content) {
            try {
                await dataManager.addPostToFirebase(title, content);
                menuHandlers.showQnAList();
            } catch (error) {
                handleError('게시글 저장 중 오류가 발생했습니다.', error);
            }
        }
    },
    viewPost: async (data) => {
        try {
            const posts = await dataManager.fetchPostsFromFirebase();
            renderContent(templates.viewPost(posts[data.key], data.key));
        } catch (error) {
            handleError('게시글을 불러오는 중 오류가 발생했습니다.', error);
        }
    },
    editPost: async (data) => {
        try {
            const posts = await dataManager.fetchPostsFromFirebase();
            renderContent(templates.editPost(posts[data.key], data.key));
        } catch (error) {
            handleError('게시글을 불러오는 중 오류가 발생했습니다.', error);
        }
    },
    updatePost: async (data) => {
        const title = document.getElementById('editTitle').value;
        const content = document.getElementById('editEditor').value;
        if (title && content) {
            try {
                await dataManager.updatePostInFirebase(data.key, title, content);
                eventHandlers.viewPost(data);
            } catch (error) {
                handleError('게시글 업데이트 중 오류가 발생했습니다.', error);
            }
        }
    },
    deletePost: async (data) => {
        if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            try {
                await dataManager.deletePostFromFirebase(data.key);
                menuHandlers.showQnAList();
            } catch (error) {
                handleError('게시글 삭제 중 오류가 발생했습니다.', error);
            }
        }
    },
    showNoticeForm: () => renderContent(templates.showNoticeForm()),
    saveNotice: async () => {
        const title = document.getElementById('noticeTitle').value;
        const content = document.getElementById('noticeContent').value;
        if (title && content) {
            try {
                await dataManager.addNoticeToFirebase(title, content);
                menuHandlers.showNoticeList();
            } catch (error) {
                handleError('공지사항 저장 중 오류가 발생했습니다.', error);
            }
        } else {
            alert('제목과 내용을 모두 입력해주세요.');
        }
    },
    showFileUploadForm: () => renderContent(templates.showFileUploadForm()),
    uploadFile: async () => {
        const title = document.getElementById('fileTitle').value;
        const content = document.getElementById('fileContent').value;
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        if (title && content && file) {
            try {
                await dataManager.addFileToFirebase(title, content, file.name);
                menuHandlers.showFileUpload();
            } catch (error) {
                handleError('파일 업로드 중 오류가 발생했습니다.', error);
            }
        }
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', handleEvent);
    menuHandlers.showHomePage();
});

// 전역 스코프에 필요한 함수들만 노출
window.openNav = openNav;
window.closeNav = closeNav;
