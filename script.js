function openNav(side) {
    document.getElementById(side + "Sidebar").style.width = "250px";
    document.getElementById("main").style.marginLeft = side === 'left' ? "250px" : "0";
    document.getElementById("main").style.marginRight = side === 'right' ? "250px" : "0";
}

function closeNav(side) {
    document.getElementById(side + "Sidebar").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
    document.getElementById("main").style.marginRight = "0";
}

function showContent(content) {
    let html = `<h2>${content}</h2>`;
    
    if (content === '홈페이지 소개') {
        html += `<p>이 홈페이지는 글도 쓰고, 이것저것 올리고, 맘대로 지울려고 만드는 사이트 입니다.</p>`;
    } else {
        html += `
            <div class="post-content">
                <h3>새 글 작성</h3>
                <textarea id="newPost" rows="4" cols="50"></textarea>
                <br>
                <button onclick="savePost('${content}')">저장</button>
            </div>
            <div id="posts-${content.replace(/\s+/g, '-')}"></div>
        `;
        loadPosts(content);
    }
    
    document.getElementById('mainContent').innerHTML = html;
}

function savePost(category) {
    const postContent = document.getElementById('newPost').value;
    if (postContent.trim() === '') return;
    
    let posts = JSON.parse(localStorage.getItem(category) || '[]');
    posts.push(postContent);
    localStorage.setItem(category, JSON.stringify(posts));
    
    document.getElementById('newPost').value = '';
    loadPosts(category);
}

function loadPosts(category) {
    const posts = JSON.parse(localStorage.getItem(category) || '[]');
    let html = '<h3>게시물 목록</h3>';
    posts.forEach((post, index) => {
        html += `
            <div class="post-content">
                <p>${post}</p>
                <button onclick="deletePost('${category}', ${index})">삭제</button>
            </div>
        `;
    });
    document.getElementById(`posts-${category.replace(/\s+/g, '-')}`).innerHTML = html;
}

function deletePost(category, index) {
    let posts = JSON.parse(localStorage.getItem(category) || '[]');
    posts.splice(index, 1);
    localStorage.setItem(category, JSON.stringify(posts));
    loadPosts(category);
}

function showHomePage() {
    document.getElementById('mainContent').innerHTML = `
        <h2>Welcome to Happy2Nanal</h2>
        <p>당신의 칼퇴를 응원합니다!</p>
        <img src="beach_img.webp" alt="Beach Image" style="max-width: 100%; height: auto;">
    `;
}

// 초기 페이지 로드 시 홈페이지 표시
window.onload = showHomePage;
