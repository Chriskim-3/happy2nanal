import { database } from './firebaseConfig.js';
import { ref, push, onValue, remove, update, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

document.addEventListener('DOMContentLoaded', function() {
    const scrollUpButton = document.getElementById('scrollUp');
    const scrollDownButton = document.getElementById('scrollDown');
    const mainContent = document.getElementById('main-content');
    const footer = document.getElementById('footer');

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

    // Footer visibility
    window.addEventListener('scroll', function() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            footer.style.display = 'block';
        } else {
            footer.style.display = 'none';
        }
    });

    // Back navigation
    window.addEventListener('popstate', function(event) {
        loadPage(event.state ? event.state.page : 'home');
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
    history.pushState({ page: page }, '', `#${page}`);
}

function loadHome() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<h1>최근 블로그 포스트</h1><hr>';
    loadBlogPosts(mainContent);
}

function loadBlog() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="blog-header">
            <h1>BLOG</h1>
            <button onclick="checkPasswordForBlogPost()">작성</button>
        </div>
        <hr>
    `;
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
                    <h2>${post.title} <span class="date">${post.date}</span></h2>
                    <div class="blog-content">${post.content}</div>
                    <div class="actions">
                        <button onclick="editBlogPost('${post.id}')">수정</button>
                    </div>
                </div>
            `;
        });
    }
}

function loadQA() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="qa-header">
            <h1>Q&A</h1>
            <div>
                <button onclick="openQAForm()">작성</button>
                <button onclick="checkPasswordForQAManagement()">관리</button>
            </div>
        </div>
        <hr>
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
                    <h3>${qaPost.title} <span class="date">${qaPost.date}</span></h3>
                    <p>작성자: ${qaPost.nickname}</p>
                    <p>${qaPost.content}</p>
                    <div class="actions">
                        <button onclick="editQAPost('${childSnapshot.key}')">수정</button>
                        <button onclick="deleteQAPost('${childSnapshot.key}')">삭제</button>
                    </div>
                </div>
            `;
        });
    });
}

function checkPasswordForQAManagement() {
    const password = prompt("관리자 비밀번호를 입력하세요:");
    if (password === "1234") { // 실제 구현시 보안을 강화해야 합니다
        manageQA();
    } else {
        alert("비밀번호가 올바르지 않습니다.");
    }
}

function manageQA() {
    const qaListElement = document.getElementById('qa-list');
    const qaRef = ref(database, 'qa');
    onValue(qaRef, (snapshot) => {
        qaListElement.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const qaPost = childSnapshot.val();
            qaListElement.innerHTML += `
                <div class="qa-post">
                    <input type="checkbox" id="${childSnapshot.key}">
                    <h3>${qaPost.title}</h3>
                    <p>작성자: ${qaPost.nickname}</p>
                    <p>비밀번호: <span class="password" style="display: none;">${qaPost.password}</span></p>
                    <button onclick="togglePassword('${childSnapshot.key}')">비밀번호 보기/숨기기</button>
                    <button onclick="editQAPost('${childSnapshot.key}')">수정</button>
                    <button onclick="deleteQAPost('${childSnapshot.key}')">삭제</button>
                </div>
            `;
        });
    });
}

function togglePassword(postId) {
    const passwordSpan = document.querySelector(`#${postId} + h3 + p + p .password`);
    passwordSpan.style.display = passwordSpan.style.display === 'none' ? 'inline' : 'none';
}

function checkPasswordForBlogPost() {
    const password = prompt("비밀번호를 입력하세요:");
    if (password === "1234") { // 실제 구현시 보안을 강화해야 합니다
        openBlogPostForm();
    } else {
        alert("비밀번호가 올바르지 않습니다.");
    }
}

function openBlogPostForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    const formTitle = postId ? '블로그 글 수정' : '새 블로그 글 작성';
    mainContent.innerHTML = `
        <h1>${formTitle}</h1>
        <form id="blog-form">
            <input type="text" id="blog-title" placeholder="제목" required>
            <div id="blog-editor" contenteditable="true"></div>
            <input type="file" id="blog-image" accept="image/*" multiple>
            <div class="form-buttons">
                <button type="submit">${postId ? '수정' : '등록'}</button>
                ${postId ? '<button type="button" onclick="deleteBlogPost(\'' + postId + '\')" class="delete-button">삭제</button>' : ''}
            </div>
        </form>
    `;
    const form = document.getElementById('blog-form');
    const editor = document.getElementById('blog-editor');
    const imageInput = document.getElementById('blog-image');

    imageInput.addEventListener('change', function(e) {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                editor.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    if (postId) {
        // 기존 포스트 데이터 불러오기
        const postRef = ref(database, `posts/${postId}`);
        get(postRef).then((snapshot) => {
            const post = snapshot.val();
            document.getElementById('blog-title').value = post.title;
            editor.innerHTML = post.content;
        });
        form.onsubmit = (e) => updateBlogPost(e, postId);
    } else {
        form.onsubmit = submitBlogPost;
    }
}

function submitBlogPost(e) {
    e.preventDefault();
    const title = document.getElementById('blog-title').value;
    const content = document.getElementById('blog-editor').innerHTML;
    const date = new Date().toLocaleDateString();

    const post = { title, content, date };
    saveBlogPost(post);
}

function saveBlogPost(post) {
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
    const content = document.getElementById('blog-editor').innerHTML;

    const post = { title, content };
    saveUpdatedBlogPost(postId, post);
}

function saveUpdatedBlogPost(postId, post) {
    const postRef = ref(database, `posts/${postId}`);
    update(postRef, post)
        .then(() => {
            alert('블로그 글이 수정되었습니다.');
            loadBlog();
        })
        .catch((error) => {
            console.error("Error updating post: ", error);
            alert('글 수정 중 오류가 발생했습니다.');
        });
}

function deleteBlogPost(postId) {
    if (confirm('정말로 이 블로그 글을 삭제하시겠습니까?')) {
        const postRef = ref(database, `posts/${postId}`);
        remove(postRef)
            .then(() => {
                alert('블로그 글이 삭제되었습니다.');
                loadBlog();
            })
            .catch((error) => {
                console.error("Error removing post: ", error);
                alert('글 삭제 중 오류가 발생했습니다.');
            });
    }
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
            <div class="form-buttons">
                <button type="submit">${postId ? '수정' : '등록'}</button>
                ${postId ? '<button type="button" onclick="deleteQAPost(\'' + postId + '\')" class="delete-button">삭제</button>' : ''}
            </div>
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
        form.onsubmit = submitQAPost;
    }
}

function submitQAPost(e) {
    e.preventDefault();
    const title = document.getElementById('qa-title').value;
    const content = document.getElementById('qa-content').value;
    const nickname = document.getElementById('qa-nickname').value;
    const password = document.getElementById('qa-password').value;
    const date = new Date().toLocaleDateString();

    if (!title || !content || !nickname || !password) {
        alert('모든 필드를 채워주세요.');
        return;
    }

    const qa = { title, content, nickname, password, date };
    const qaRef = ref(database, 'qa');
    push(qaRef, qa)
        .then(() => {
            alert('Q&A가 등록되었습니다.');
            loadQA();
        })
        .catch((error) => {
            console.error("Error adding Q&A: ", error);
            alert('Q&A 등록 중 오류가 발생했습니다.');
        });
}

function editQAPost(postId) {
    const password = prompt("비밀번호를 입력하세요:");
    const qaRef = ref(database, `qa/${postId}`);
    get(qaRef).then((snapshot) => {
        const qa = snapshot.val();
        if (password === qa.password) {
            openQAForm(postId);
        } else {
            alert("비밀번호가 올바르지 않습니다.");
        }
    });
}

function updateQAPost(e, postId) {
    e.preventDefault();
    const title = document.getElementById('qa-title').value;
    const content = document.getElementById('qa-content').value;
    const nickname = document.getElementById('qa-nickname').value;
    const password = document.getElementById('qa-password').value;

    if (!title || !content || !nickname || !password) {
        alert('모든 필드를 채워주세요.');
        return;
    }

    const qaRef = ref(database, `qa/${postId}`);
    update(qaRef, { title, content, nickname, password })
        .then(() => {
            alert('Q&A가 수정되었습니다.');
            loadQA();
        })
        .catch((error) => {
            console.error("Error updating Q&A: ", error);
            alert('Q&A 수정 중 오류가 발생했습니다.');
        });
}

function deleteQAPost(postId) {
    if (confirm('정말로 이 Q&A를 삭제하시겠습니까?')) {
        const qaRef = ref(database, `qa/${postId}`);
        remove(qaRef)
            .then(() => {
                alert('Q&A가 삭제되었습니다.');
                loadQA();
            })
            .catch((error) => {
                console.error("Error removing Q&A: ", error);
                alert('Q&A 삭제 중 오류가 발생했습니다.');
            });
    }
}

// 전역 스코프에 함수들을 노출
window.checkPasswordForBlogPost = checkPasswordForBlogPost;
window.openBlogPostForm = openBlogPostForm;
window.editBlogPost = editBlogPost;
window.deleteBlogPost = deleteBlogPost;
window.checkPasswordForQAManagement = checkPasswordForQAManagement;
window.manageQA = manageQA;
window.editQAPost = editQAPost;
window.deleteQAPost = deleteQAPost;
window.togglePassword = togglePassword;
window.openQAForm = openQAForm;