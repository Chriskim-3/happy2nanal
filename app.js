import { database } from './firebaseConfig.js';
import { ref, push, onValue, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

document.addEventListener('DOMContentLoaded', function() {
    const scrollUpButton = document.getElementById('scrollUp');
    const scrollDownButton = document.getElementById('scrollDown');
    const mainContent = document.getElementById('main-content');

    scrollUpButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    scrollDownButton.addEventListener('click', function() {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    });

    // 초기 홈 페이지 로드
    loadHome();

    // 네비게이션 이벤트 리스너 추가
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
            mainContent.innerHTML = '<h1>Q&A</h1><p>Q&A 내용이 여기에 표시됩니다.</p>';
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
    mainContent.innerHTML = '<h1>BLOG</h1>';
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
                    <button onclick="deletePost('${post.id}')">삭제</button>
                </div>
            `;
        });
    }
}

function openSettings() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <h1>새 블로그 글 작성</h1>
        <form id="blog-form">
            <input type="text" id="blog-title" placeholder="제목" required>
            <textarea id="blog-content" placeholder="내용" required></textarea>
            <button type="submit">글 등록</button>
        </form>
    `;
    document.getElementById('blog-form').addEventListener('submit', submitBlogPost);
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
            loadHome();
        })
        .catch((error) => {
            console.error("Error adding post: ", error);
            alert('글 등록 중 오류가 발생했습니다.');
        });
}

function deletePost(postId) {
    if (confirm('정말로 이 글을 삭제하시겠습니까?')) {
        const postRef = ref(database, `posts/${postId}`);
        remove(postRef)
            .then(() => {
                alert('글이 삭제되었습니다.');
                loadHome();
            })
            .catch((error) => {
                console.error("Error removing post: ", error);
                alert('글 삭제 중 오류가 발생했습니다.');
            });
    }
}
