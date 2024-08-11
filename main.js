// main.js
import * as templates from './templates.js';
import * as dataManager from './dataManager.js';

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
            window.showQnAList();
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
            window.viewPost(key);
        });
    }
};

window.deletePost = function(key) {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        dataManager.deletePostFromFirebase(key).then(() => {
            window.showQnAList();
        });
    }
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
        window.showStudyList(topic);
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
        window.viewStudyContent(index);
    }
};

window.deleteStudyContent = function(index) {
    if (confirm('정말로 이 학습 내용을 삭제하시겠습니까?')) {
        const studyContents = dataManager.getFromLocalStorage('studyContents');
        const topic = studyContents[index].topic;
        const updatedContents = dataManager.deleteStudyContent(studyContents, index);
        window.showStudyList(topic);
    }
};

// 기타 필요한 함수들...

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
