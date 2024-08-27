// Firebase 모듈 import
import { database } from './firebaseConfig.js';
import { ref, push, get, query, orderByChild } from 'firebase/database';

document.addEventListener('DOMContentLoaded', function() {
    const scrollUpButton = document.getElementById('scrollUp');
    const scrollDownButton = document.getElementById('scrollDown');

    scrollUpButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    scrollDownButton.addEventListener('click', () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    // 초기 홈 페이지 로드
    loadHome();

    // 네비게이션 이벤트 리스너 추가
    document.querySelector('.nav-links').addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const page = e.target.getAttribute('href').slice(1);
            loadPage(page);
        }
    });
});

async function loadPage(page) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<p>Loading...</p>'; // 로딩 표시
    try {
        switch(page) {
            case 'home':
                await loadHome();
                break;
            case 'blog':
                await loadBlog();
                break;
            case 'qa':
                loadQA();
                break;
        }
    } catch (error) {
        console.error("페이지 로딩 중 오류 발생:", error);
        mainContent.innerHTML = '<p>페이지를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

async function loadHome() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<h1>최근 블로그 포스트</h1>';
    await loadBlogPosts(mainContent);
}

async function loadBlog() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<h1>BLOG</h1>';
    await loadBlogPosts(mainContent);
}

function loadQA() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<h1>Q&A</h1><p>Q&A 내용이 여기에 표시됩니다.</p>';
}

async function loadBlogPosts(container) {
    const postsRef = ref(database, 'posts');
    const postsQuery = query(postsRef, orderByChild('date'));
    
    try {
        const snapshot = await get(postsQuery);
        if (snapshot.exists()) {
            const posts = [];
            snapshot.forEach((childSnapshot) => {
                posts.unshift(childSnapshot.val());
            });
            displayBlogPosts(posts, container);
        } else {
            container.innerHTML += '<p>아직 작성된 블로그 포스트가 없습니다.</p>';
        }
    } catch (error) {
        console.error("블로그 포스트를 불러오는 중 오류 발생:", error);
        container.innerHTML += '<p>블로그 포스트를 불러오는 중 오류가 발생했습니다.</p>';
        throw error; // 에러를 상위로 전파
    }
}

function displayBlogPosts(posts, container) {
    posts.forEach(post => {
        container.innerHTML += `
            <div class="blog-post">
                <h2>${post.title}</h2>
                <p class="date">${new Date(post.date).toLocaleDateString()}</p>
                <p>${post.content}</p>
            </div>
        `;
    });
}

function openWriteForm() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="password-form">
            <input type="password" id="write-password" placeholder="비밀번호를 입력하세요">
            <button onclick="checkPassword()">확인</button>
        </div>
    `;
}

function checkPassword() {
    const password = document.getElementById('write-password').value;
    if (password === "your_secret_password") {  // 실제 비밀번호로 변경하세요
        openSettings();
    } else {
        alert("비밀번호가 올바르지 않습니다.");
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

async function submitBlogPost(e) {
    e.preventDefault();
    const title = document.getElementById('blog-title').value;
    const content = document.getElementById('blog-content').value;
    const date = new Date().toISOString();

    const post = { title, content, date };
    const postsRef = ref(database, 'posts');
    
    try {
        await push(postsRef, post);
        alert('블로그 글이 등록되었습니다.');
        await loadHome();
    } catch (error) {
        console.error("블로그 포스트 등록 중 오류 발생:", error);
        alert('블로그 글 등록에 실패했습니다. 다시 시도해주세요.');
    }
}

// 전역 스코프에서 함수들을 사용할 수 있도록 window 객체에 할당
window.openWriteForm = openWriteForm;
window.checkPassword = checkPassword;
window.loadHome = loadHome;
window.loadBlog = loadBlog;
window.loadQA = loadQA;
