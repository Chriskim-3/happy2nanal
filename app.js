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
    const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
    displayBlogPosts(posts, mainContent);
}

function loadBlog() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<h1>BLOG</h1>';
    const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
    displayBlogPosts(posts, mainContent);
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
    const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
    posts.unshift(post);
    localStorage.setItem('blogPosts', JSON.stringify(posts));

    alert('블로그 글이 등록되었습니다.');
    loadHome();
}
