// Firebase 모듈 import
import { database } from './firebaseConfig.js';
import { ref, push, get, query, orderByChild } from 'firebase/database';

// 모든 함수들을 객체로 감싸서 export
const app = {
    async loadPage(page) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<p>Loading...</p>'; // 로딩 표시
        try {
            switch(page) {
                case 'home':
                    await this.loadHome();
                    break;
                case 'blog':
                    await this.loadBlog();
                    break;
                case 'qa':
                    this.loadQA();
                    break;
            }
        } catch (error) {
            console.error("페이지 로딩 중 오류 발생:", error);
            mainContent.innerHTML = '<p>페이지를 불러오는 중 오류가 발생했습니다.</p>';
        }
    },

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
