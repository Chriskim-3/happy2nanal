import { database } from './firebaseConfig.js';
import { ref, push, onValue, remove, update, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

document.addEventListener('DOMContentLoaded', function() {
    const scrollUpButton = document.getElementById('scrollUp');
    const scrollDownButton = document.getElementById('scrollDown');
    const mainContent = document.getElementById('main-content');

    scrollUpButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    scrollDownButton.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

    loadHome();

    document.querySelector('nav').addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const page = e.target.getAttribute('href').slice(1);
            loadPage(page);
        }
    });
});

function loadPage(page) {
    const mainContent = document.getElementById('main-content');
    switch(page) {
        case 'home':
            loadHome();
            break;
        case 'blog':
            loadBlog();
            break;
        case 'qa':
            loadQA();
            break;
    }
}

function loadHome() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<h1>최근 블로그 포스트</h1>';
    loadBlogPosts(mainContent);
}

function loadBlog() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<h1>BLOG</h1><button onclick="openBlogPostForm()">작성</button>';
    loadBlogPosts(mainContent);
}

function loadBlogPosts(container) {
    const postsRef = ref(database, 'posts');
    onValue(postsRef, (snapshot) => {
        const posts = [];
        snapshot.forEach((childSnapshot) => {
            posts.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        displayBlogPosts(posts.reverse(), container);
    });
}

function displayBlogPosts(posts, container) {
    if (posts.length === 0) {
        container.innerHTML += '<p>아직 작성된 블로그 포스트가 없습니다.</p>';
    } else {
        posts.forEach(post => {
            container.innerHTML += `
                <div class="blog-post">
                    <h2>${post.title}</h2>
                    <p class="date">${post.date}</p>
                    <p>${post.content}</p>
                    <button onclick="editBlogPost('${post.id}')">수정</button>
                </div>
            `;
        });
    }
}

function openBlogPostForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    const formTitle = postId ? '블로그 글 수정' : '새 블로그 글 작성';
    mainContent.innerHTML = `
        <h1>${formTitle}</h1>
        <form id="blog-form">
            <input type="text" id="blog-title" placeholder="제목" required>
            <textarea id="blog-content" placeholder="내용" required></textarea>
            <button type="submit">${postId ? '수정' : '등록'}</button>
        </form>
    `;
    const form = document.getElementById('blog-form');
    if (postId) {
        // 기존 포스트 데이터 불러오기
        const postRef = ref(database, `posts/${postId}`);
        get(postRef).then((snapshot) => {
            const post = snapshot.val();
            document.getElementById('blog-title').value = post.title;
            document.getElementById('blog-content').value = post.content;
        });
        form.onsubmit = (e) => updateBlogPost(e, postId);
    } else {
        form.onsubmit = submitBlogPost;
    }
}

function submitBlogPost(e) {
    e.preventDefault();
    const title = document.getElementById('blog-title').value;
    const content = document.getElementById('blog-content').value;
    const date = new Date().toLocaleDateString();

    const post = { title, content, date };
    const postsRef = ref(database, 'posts');
    push(postsRef, post)
        .then(() => {
            alert('블로그 글이 등록되었습니다.');
            loadBlog();
        })
        .catch((error) => {
            console.error("Error adding post: ", error);
            alert('글 등록 중 오류가 발생했습니다.');
        });
}

function editBlogPost(postId) {
    const password = prompt("비밀번호를 입력하세요:");
    if (password === "1234") { // 실제 구현시 보안을 강화해야 합니다
        openBlogPostForm(postId);
    } else {
        alert("비밀번호가 올바르지 않습니다.");
    }
}

function updateBlogPost(e, postId) {
    e.preventDefault();
    const title = document.getElementById('blog-title').value;
    const content = document.getElementById('blog-content').value;

    const postRef = ref(database, `posts/${postId}`);
    update(postRef, { title, content })
        .then(() => {
            alert('블로그 글이 수정되었습니다.');
            loadBlog();
        })
        .catch((error) => {
            console.error("Error updating post: ", error);
            alert('글 수정 중 오류가 발생했습니다.');
        });
}

function loadQA() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <h1>Q&A</h1>
        <button onclick="openQAForm()">질문하기</button>
        <div id="qa-list"></div>
    `;
    loadQAPosts();
}

function loadQAPosts() {
    const qaListElement = document.getElementById('qa-list');
    const qaRef = ref(database, 'qa');
    onValue(qaRef, (snapshot) => {
        qaListElement.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const qaPost = childSnapshot.val();
            qaListElement.innerHTML += `
                <div class="qa-post">
                    <h3>${qaPost.title}</h3>
                    <p>작성자: ${qaPost.nickname}</p>
                    <p>${qaPost.content}</p>
                    <button onclick="editQAPost('${childSnapshot.key}')">수정/삭제</button>
                </div>
            `;
        });
    });
}

function openQAForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    const formTitle = postId ? 'Q&A 수정' : '새 Q&A 작성';
    mainContent.innerHTML = `
        <h1>${formTitle}</h1>
        <form id="qa-form">
            <input type="text" id="qa-title" placeholder="제목" required>
            <textarea id="qa-content" placeholder="내용" required></textarea>
            <input type="text" id="qa-nickname" placeholder="닉네임" required>
            <input type="password" id="qa-password" placeholder="비밀번호" required>
            <button type="submit">${postId ? '수정' : '등록'}</button>
            ${postId ? '<button type="button" onclick="deleteQAPost(\'' + postId + '\')">삭제</button>' : ''}
        </form>
    `;
    const form = document.getElementById('qa-form');
    if (postId) {
        // 기존 Q&A 데이터 불러오기
        const qaRef = ref(database, `qa/${postId}`);
        get(qaRef).then((snapshot) => {
            const qa = snapshot.val();
            document.getElementById('qa-title').value = qa.title;
            document.getElementById('qa-content').value = qa.content;
            document.getElementById('qa-nickname').value = qa.nickname;
        });
        form.onsubmit = (e) => updateQAPost(e, postId);
    } else {
        form.onsub