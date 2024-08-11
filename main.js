// main.js
import * as templates from './templates.js';
import * as dataManager from './dataManager.js';

window.showQnAList = function() {
    dataManager.fetchPostsFromFirebase().then(posts => {
        let listHtml = '<h3>Q&A 목록</h3><ul id="postList">';
        for (let key in posts) {
            listHtml += templates.createPostElement(posts[key], key).outerHTML;
        }
        listHtml += '</ul>';
        document.getElementById('mainContent').innerHTML = listHtml;
    });
}

window.showQnAForm = function() {
    document.getElementById('mainContent').innerHTML = templates.createPostForm();
}

window.savePost = function() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('editor').value;
    if (title && content) {
        dataManager.addPostToFirebase(title, content).then(() => {
            showQnAList();
        });
    }
}

window.viewPost = function(key) {
    dataManager.fetchPostsFromFirebase().then(posts => {
        const post = posts[key];
        document.getElementById('mainContent').innerHTML = templates.createPostView(post, key);
    });
}

window.editPost = function(key) {
    // 구현...
}

window.updatePost = function(key) {
    // 구현...
}

window.deletePost = function(key) {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        dataManager.deletePostFromFirebase(key).then(() => {
            showQnAList();
        });
    }
}

// 다른 필요한 함수들 구현...

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 초기화 코드...
});
