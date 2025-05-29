import { database } from './firebaseConfig.js';
import { ref, push, onValue, remove, update, get, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

let quillBlog, quillQA, quillNotice; // Quill 인스턴스 전역 변수로 선언
let currentBlogViewMode = 'list'; // 블로그 초기 보기 모드

document.addEventListener('DOMContentLoaded', function() {
    const scrollUpButton = document.getElementById('scrollUp');
    const scrollDownButton = document.getElementById('scrollDown');
    const footer = document.getElementById('footer');
    const navItems = document.querySelectorAll('.nav-item');

    // 스크롤 버튼 이벤트 리스너
    scrollUpButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    scrollDownButton.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

    // 초기 페이지 로드 (blog)
    // URL 해시값에 따라 초기 페이지 로드
    const initialPage = window.location.hash ? window.location.hash.slice(1) : 'blog';
    loadPage(initialPage);
    loadSidebarPosts(); // 사이드바 포스트 로드

    // 네비게이션 클릭 이벤트
    document.querySelector('nav').addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.classList.contains('nav-item')) { // 클래스 확인 추가
            e.preventDefault();
            navItems.forEach(item => item.classList.remove('active'));
            e.target.classList.add('active');
            const page = e.target.getAttribute('href').slice(1);
            loadPage(page);
        }
    });

    // 푸터 가시성
    window.addEventListener('scroll', function() {
        // 뷰포트 높이 + 스크롤된 높이가 문서 전체 높이 - 푸터 높이보다 크거나 같을 때 푸터 표시
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - footer.offsetHeight) {
            footer.style.display = 'block';
        } else {
            footer.style.display = 'none';
        }
    });

    // 뒤로가기/앞으로가기 버튼 처리
    window.addEventListener('popstate', function(event) {
        const page = event.state ? event.state.page : 'blog';
        navItems.forEach(item => item.classList.remove('active'));
        const activeNavItem = document.querySelector(`.nav-item[href="#${page}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        loadPage(page);
    });

    // 초기 로드 시 active 클래스 추가
    const initialNavItem = document.querySelector(`.nav-item[href="#${initialPage}"]`);
    if (initialNavItem) {
        initialNavItem.classList.add('active');
    } else {
        // 기본값 'blog'를 active로 설정 (만약 초기 해시가 없거나 유효하지 않을 경우)
        document.querySelector('.nav-item[href="#blog"]').classList.add('active');
    }


    // 보기 방식 토글 버튼 이벤트 리스너
    document.getElementById('nav-list-view-btn').addEventListener('click', () => {
        currentBlogViewMode = 'list';
        document.getElementById('nav-list-view-btn').classList.add('active');
        document.getElementById('nav-tile-view-btn').classList.remove('active');
        loadBlogPosts(); // 현재 보기 모드로 다시 로드
    });

    document.getElementById('nav-tile-view-btn').addEventListener('click', () => {
        currentBlogViewMode = 'tile';
        document.getElementById('nav-tile-view-btn').classList.add('active');
        document.getElementById('nav-list-view-btn').classList.remove('active');
        loadBlogPosts(); // 현재 보기 모드로 다시 로드
    });
});

function loadPage(page) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // 기존 내용 지우기

    // 모든 사이드바 섹션을 숨김
    document.querySelectorAll('.sidebar-section').forEach(section => section.classList.add('hidden'));
    document.getElementById('calendar-info-section').classList.add('hidden'); // 달력 숨김

    // 보기 방식 토글 그룹 숨김 (블로그 페이지가 아니면)
    document.getElementById('blog-view-toggle-group').classList.add('hidden');

    switch (page) {
        case 'blog':
            mainContent.innerHTML = `
                <div class="blog-header flex justify-between items-center mb-6">
                    <h2 class="text-4xl font-bold text-gray-800">BLOG</h2>
                    <button id="create-blog-post-btn" class="create-post-button">글 작성</button>
                </div>
                <div id="blog-posts-container" class="py-4"></div>
            `;
            document.getElementById('create-blog-post-btn').addEventListener('click', openBlogPostForm);
            loadBlogPosts(); // 게시글 로드
            document.querySelectorAll('.blog-section').forEach(section => section.classList.remove('hidden'));
            document.getElementById('blog-view-toggle-group').classList.remove('hidden'); // 블로그 페이지에서만 보기 방식 토글 표시
            // 초기 보기 모드에 따라 버튼 활성화
            if (currentBlogViewMode === 'list') {
                document.getElementById('nav-list-view-btn').classList.add('active');
                document.getElementById('nav-tile-view-btn').classList.remove('active');
            } else { // tile view
                document.getElementById('nav-tile-view-btn').classList.add('active');
                document.getElementById('nav-list-view-btn').classList.remove('active');
            }
            break;
        case 'qa':
            mainContent.innerHTML = `
                <div class="qa-header flex justify-between items-center mb-6">
                    <h2 class="text-4xl font-bold text-gray-800">Q&A</h2>
                    <button id="create-qa-post-btn" class="create-post-button">질문 작성</button>
                </div>
                <div id="qa-posts-container" class="py-4"></div>
            `;
            document.getElementById('create-qa-post-btn').addEventListener('click', openQAPostForm);
            loadQA(); // Q&A 로드
            document.getElementById('calendar-info-section').classList.remove('hidden'); // Q&A 페이지에서 달력 표시
            break;
        case 'notice':
            mainContent.innerHTML = `
                <div class="notice-header flex justify-between items-center mb-6">
                    <h2 class="text-4xl font-bold text-gray-800">공지사항</h2>
                    <button id="create-notice-post-btn" class="create-post-button">공지 작성</button>
                </div>
                <div id="notice-posts-container" class="py-4"></div>
            `;
            document.getElementById('create-notice-post-btn').addEventListener('click', openNoticePostForm);
            loadNotice(); // 공지사항 로드
            document.querySelector('.sidebar-section.notice-section').classList.remove('hidden'); // 공지사항 섹션 표시
            break;
        default:
            // 존재하지 않는 페이지는 블로그로 리다이렉트
            loadPage('blog');
            history.replaceState({ page: 'blog' }, '', '#blog');
            break;
    }
    // 페이지 로드 시에만 history pushState 호출
    if (window.location.hash !== `#${page}`) {
        history.pushState({ page: page }, '', `#${page}`);
    }
}

// =====================================
// Custom Modal / Prompt Functions (Async/Await)
// =====================================

function showCustomModal({ title, content, buttons = [{ text: '확인', value: 'confirm', className: 'confirm-button' }] }) {
    return new Promise(resolve => {
        const modalContainer = document.getElementById('custom-modal-container');
        modalContainer.innerHTML = ''; // Clear previous modals

        const modal = document.createElement('div');
        modal.classList.add('custom-modal', 'bg-white', 'p-8', 'rounded-xl', 'shadow-2xl', 'relative', 'max-w-md', 'mx-auto');
        modal.innerHTML = `
            <h3 class="text-2xl font-bold text-gray-900 mb-4">${title}</h3>
            <p class="text-gray-700 mb-6">${content}</p>
            <div class="custom-modal-buttons flex justify-end space-x-3">
                ${buttons.map(btn => `<button class="${btn.className || 'btn-secondary'} px-4 py-2 rounded-md font-medium text-sm hover:opacity-80 transition-opacity" data-value="${btn.value}">${btn.text}</button>`).join('')}
            </div>
            <button class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl" data-value="cancel">&times;</button>
        `;

        modalContainer.appendChild(modal);
        modalContainer.classList.remove('hidden'); // Show container

        modal.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                modalContainer.classList.add('hidden'); // Hide container
                modalContainer.innerHTML = ''; // Clean up
                resolve(button.dataset.value);
            });
        });
    });
}

function showCustomPrompt({ title, content, inputType = 'text', placeholder = '', confirmText = '확인', cancelText = '취소' }) {
    return new Promise(resolve => {
        const modalContainer = document.getElementById('custom-modal-container');
        modalContainer.innerHTML = '';

        const prompt = document.createElement('div');
        prompt.classList.add('custom-prompt', 'bg-white', 'p-8', 'rounded-xl', 'shadow-2xl', 'relative', 'max-w-md', 'mx-auto');
        prompt.innerHTML = `
            <h3 class="text-2xl font-bold text-gray-900 mb-4">${title}</h3>
            <p class="text-gray-700 mb-4">${content}</p>
            <input type="${inputType}" class="w-full p-3 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="${placeholder}" id="custom-prompt-input">
            <div class="custom-prompt-buttons flex justify-end space-x-3">
                <button class="cancel-button bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-400 transition-colors duration-200">${cancelText}</button>
                <button class="confirm-button bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors duration-200">${confirmText}</button>
            </div>
            <button class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl" data-value="cancel">&times;</button>
        `;

        modalContainer.appendChild(prompt);
        modalContainer.classList.remove('hidden');

        const input = document.getElementById('custom-prompt-input');
        const confirmBtn = prompt.querySelector('.confirm-button');
        const cancelBtn = prompt.querySelector('.cancel-button');
        const closeBtn = prompt.querySelector('[data-value="cancel"]');

        const cleanup = (value) => {
            modalContainer.classList.add('hidden');
            modalContainer.innerHTML = '';
            resolve(value);
        };

        confirmBtn.addEventListener('click', () => cleanup(input.value));
        cancelBtn.addEventListener('click', () => cleanup(null));
        closeBtn.addEventListener('click', () => cleanup(null));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        });

        input.focus();
    });
}

// =====================================
// Blog Functions
// =====================================

function loadBlogPosts() {
    const postsRef = ref(database, 'posts');
    onValue(postsRef, (snapshot) => {
        const posts = snapshot.val() || {};
        displayBlogPosts(posts, currentBlogViewMode); // 현재 보기 모드를 전달
    }, {
        onlyOnce: false // 실시간 업데이트를 위해 false
    });
}

function displayBlogPosts(posts, viewMode) {
    const postsContainer = document.getElementById('blog-posts-container');
    postsContainer.innerHTML = '';

    if (Object.keys(posts).length === 0) {
        postsContainer.innerHTML = '<p class="text-gray-600 text-center py-8">아직 블로그 게시글이 없습니다.</p>';
        return;
    }

    postsContainer.className = '';
    postsContainer.classList.add('py-4');
    if (viewMode === 'list') {
        postsContainer.classList.add('blog-list-view');
    } else { // tile view
        postsContainer.classList.add('blog-tile-view');
    }

    Object.keys(posts).reverse().forEach(postId => {
        const post = posts[postId];
        const postElement = document.createElement('div');
        postElement.classList.add('blog-post-item');

        let contentHTML;
        if (viewMode === 'list') {
            contentHTML = `
                <div class="post-text-content" data-post-id="${postId}" data-post-type="blog">
                    <h3 class="post-title cursor-pointer">${post.title}</h3>
                    <div class="post-summary">${post.content.replace(/<[^>]*>/g, '').substring(0, 150)}${post.content.replace(/<[^>]*>/g, '').length > 150 ? '...' : ''}</div>
                    <div class="post-meta">
                        <span>${post.author}</span>
                        <span>${post.date}</span>
                    </div>
                </div>
                <div class="post-management-buttons flex items-center mt-4">
                    <button class="edit-button" onclick="window.showCustomPrompt({
                        title: '비밀번호 확인',
                        content: '게시글을 수정하려면 비밀번호를 입력하세요.',
                        inputType: 'password',
                        placeholder: '비밀번호'
                    }).then(password => window.checkPasswordForBlogPost('${postId}', password, 'edit'))">✏️ 수정</button>
                    <button class="delete-button" onclick="window.showCustomPrompt({
                        title: '비밀번호 확인',
                        content: '게시글을 삭제하려면 비밀번호를 입력하세요.',
                        inputType: 'password',
                        placeholder: '비밀번호'
                    }).then(password => window.checkPasswordForBlogPost('${postId}', password, 'delete'))">🗑️ 삭제</button>
                </div>
            `;
        } else { // tile view
            const imageUrlMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
            const thumbnailUrl = imageUrlMatch ? imageUrlMatch[1] : '';
            const summaryText = post.content.replace(/<[^>]*>/g, '');

            contentHTML = `
                <div class="post-thumbnail">
                    ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="Thumbnail">` : '<span>No Image</span>'}
                </div>
                <div class="post-text-content" data-post-id="${postId}" data-post-type="blog">
                    <h3 class="post-title cursor-pointer">${post.title}</h3>
                    <div class="post-summary">${summaryText.substring(0, 100)}${summaryText.length > 100 ? '...' : ''}</div>
                    <div class="post-meta">
                        <span>${post.author}</span>
                        <span>${post.date}</span>
                    </div>
                </div>
                <div class="post-management-buttons flex items-center justify-end p-4">
                    <button class="edit-button" onclick="window.showCustomPrompt({
                        title: '비밀번호 확인',
                        content: '게시글을 수정하려면 비밀번호를 입력하세요.',
                        inputType: 'password',
                        placeholder: '비밀번호'
                    }).then(password => window.checkPasswordForBlogPost('${postId}', password, 'edit'))">✏️ 수정</button>
                    <button class="delete-button" onclick="window.showCustomPrompt({
                        title: '비밀번호 확인',
                        content: '게시글을 삭제하려면 비밀번호를 입력하세요.',
                        inputType: 'password',
                        placeholder: '비밀번호'
                    }).then(password => window.checkPasswordForBlogPost('${postId}', password, 'delete'))">🗑️ 삭제</button>
                </div>
            `;
        }

        postElement.innerHTML = contentHTML;
        postsContainer.appendChild(postElement);

        // 제목 클릭 이벤트 리스너 추가
        postElement.querySelector('.post-title').addEventListener('click', () => {
            openBlogPostDetail(postId);
        });
    });
}

async function openBlogPostForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">${postId ? '블로그 게시글 수정' : '블로그 게시글 작성'}</h2>
        <div class="bg-white p-8 rounded-xl shadow-lg">
            <div class="mb-4">
                <label for="blog-title" class="block text-gray-700 text-sm font-bold mb-2">제목:</label>
                <input type="text" id="blog-title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-4">
                <label for="blog-author" class="block text-gray-700 text-sm font-bold mb-2">작성자:</label>
                <input type="text" id="blog-author" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-4">
                <label for="blog-password" class="block text-gray-700 text-sm font-bold mb-2">비밀번호:</label>
                <input type="password" id="blog-password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-6">
                <label for="blog-editor" class="block text-gray-700 text-sm font-bold mb-2">내용:</label>
                <div id="blog-editor"></div>
            </div>
            <div class="flex items-center justify-between">
                <button id="save-blog-post-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">저장</button>
                <button id="cancel-blog-post-btn" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">취소</button>
            </div>
        </div>
    `;

    quillBlog = new Quill('#blog-editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image'],
                [{ 'align': [] }],
                ['clean']
            ]
        }
    });

    if (postId) {
        const postRef = ref(database, `posts/${postId}`);
        const snapshot = await get(postRef);
        const post = snapshot.val();
        if (post) {
            document.getElementById('blog-title').value = post.title || ''; // null 또는 undefined 방지
            document.getElementById('blog-author').value = post.author || ''; // null 또는 undefined 방지
            // Quill 에디터에 내용 설정 (HTML 형식)
            if (quillBlog && post.content) {
                quillBlog.setContents(quillBlog.clipboard.convert(post.content));
            } else {
                quillBlog.setContents([]); // 내용이 없으면 빈 상태로 설정
            }
            document.getElementById('save-blog-post-btn').onclick = () => updateBlogPost(postId);
        } else {
             // 게시글이 없는 경우 알림 및 페이지 이동
            showCustomModal({ title: '오류', content: '수정할 게시글을 찾을 수 없습니다.' });
            loadPage('blog');
            return; // 함수 종료
        }
    } else {
        document.getElementById('save-blog-post-btn').onclick = saveBlogPost;
    }

    document.getElementById('cancel-blog-post-btn').onclick = () => loadPage('blog');
}

function saveBlogPost() {
    const title = document.getElementById('blog-title').value;
    const author = document.getElementById('blog-author').value;
    const password = document.getElementById('blog-password').value;
    const content = quillBlog.root.innerHTML; // Quill 에디터의 HTML 내용 가져오기

    if (!title || !author || !password || !content || content.trim() === '<p><br></p>' || content.trim() === '') { // 내용이 비어있는 경우도 체크 강화
        showCustomModal({ title: '오류', content: '모든 필드를 채워주세요.' });
        return;
    }

    const newPostRef = push(ref(database, 'posts'));
    set(newPostRef, {
        title,
        author,
        password, // 비밀번호 저장 (실제 서비스에서는 해싱 필요)
        content,
        date: new Date().toISOString().slice(0, 10), //YYYY-MM-DD
        views: 0 // 초기 조회수
    })
    .then(() => {
        showCustomModal({ title: '성공', content: '블로그 게시글이 성공적으로 저장되었습니다!' });
        loadPage('blog');
    })
    .catch((error) => {
        console.error("블로그 게시글 저장 중 오류 발생: ", error);
        showCustomModal({ title: '오류', content: '블로그 게시글 저장에 실패했습니다.' });
    });
}

async function updateBlogPost(postId) {
    const title = document.getElementById('blog-title').value;
    const author = document.getElementById('blog-author').value;
    const passwordInput = document.getElementById('blog-password').value; // 수정 시에도 비밀번호 입력
    const content = quillBlog.root.innerHTML;

    if (!title || !author || !passwordInput || !content || content.trim() === '<p><br></p>' || content.trim() === '') {
        showCustomModal({ title: '오류', content: '모든 필드를 채워주세요.' });
        return;
    }

    const postRef = ref(database, `posts/${postId}`);
    const snapshot = await get(postRef);
    const post = snapshot.val();

    if (!post || post.password !== passwordInput) {
        showCustomModal({ title: '오류', content: '비밀번호가 올바르지 않습니다.' });
        return;
    }

    update(postRef, { title, author, content })
        .then(() => {
            showCustomModal({ title: '성공', content: '블로그 게시글이 성공적으로 수정되었습니다!' });
            loadPage('blog');
        })
        .catch((error) => {
            console.error("블로그 게시글 수정 중 오류 발생: ", error);
            showCustomModal({ title: '오류', content: '블로그 게시글 수정에 실패했습니다.' });
        });
}

async function deleteBlogPost(postId) {
    const confirmDelete = await showCustomModal({
        title: '삭제 확인',
        content: '정말로 이 블로그 게시글을 삭제하시겠습니까?',
        buttons: [
            { text: '삭제', value: 'delete', className: 'btn-danger' },
            { text: '취소', value: 'cancel', className: 'btn-secondary' }
        ]
    });

    if (confirmDelete === 'delete') {
        const postRef = ref(database, `posts/${postId}`);
        remove(postRef)
            .then(() => {
                showCustomModal({ title: '성공', content: '블로그 게시글이 성공적으로 삭제되었습니다!' });
                loadPage('blog');
            })
            .catch((error) => {
                console.error("블로그 게시글 삭제 중 오류 발생: ", error);
                showCustomModal({ title: '오류', content: '블로그 게시글 삭제에 실패했습니다.' });
            });
    }
}

async function checkPasswordForBlogPost(postId, password, action) {
    // 하드코딩된 비밀번호 111로 변경
    const correctPassword = '111';

    if (password === null) { // '취소'를 눌렀을 때
        return;
    }
    if (!password) {
        showCustomModal({ title: '오류', content: '비밀번호를 입력하세요.' });
        return;
    }

    if (password === correctPassword) { // 입력된 비밀번호가 111이면
        if (action === 'edit') {
            openBlogPostForm(postId);
        } else if (action === 'delete') {
            deleteBlogPost(postId);
        }
    } else {
        showCustomModal({ title: '오류', content: '비밀번호가 올바르지 않습니다.' });
    }
}

async function openBlogPostDetail(postId) {
    const postRef = ref(database, `posts/${postId}`);
    const snapshot = await get(postRef);
    const post = snapshot.val();

    if (post) {
        document.getElementById('modal-blog-title').innerText = post.title;
        document.getElementById('modal-blog-author').innerText = `작성자: ${post.author}`;
        document.getElementById('modal-blog-date').innerText = post.date;
        document.getElementById('modal-blog-content').innerHTML = post.content; // HTML 그대로 렌더링

        // 조회수 증가
        const currentViews = post.views ? post.views + 1 : 1;
        update(postRef, { views: currentViews });

        document.getElementById('blog-detail-modal').classList.remove('hidden');

        document.getElementById('close-blog-detail').onclick = () => {
            document.getElementById('blog-detail-modal').classList.add('hidden');
        };
    } else {
        showCustomModal({ title: '오류', content: '게시글을 찾을 수 없습니다.' });
    }
}

// =====================================
// Q&A Functions
// =====================================

function loadQA() {
    const qaRef = ref(database, 'qa');
    onValue(qaRef, (snapshot) => {
        const qaPosts = snapshot.val() || {};
        displayQAPosts(qaPosts);
    }, {
        onlyOnce: false
    });
}

function displayQAPosts(qaPosts) {
    const qaPostsContainer = document.getElementById('qa-posts-container');
    if (!qaPostsContainer) return;

    qaPostsContainer.innerHTML = '';

    if (Object.keys(qaPosts).length === 0) {
        qaPostsContainer.innerHTML = '<p class="text-gray-600 text-center py-8">아직 Q&A 게시글이 없습니다.</p>';
        return;
    }

    Object.keys(qaPosts).reverse().forEach(postId => {
        const post = qaPosts[postId];
        const postElement = document.createElement('div');
        postElement.classList.add('qa-list-item');

        postElement.innerHTML = `
            <div class="post-text-content" data-post-id="${postId}" data-post-type="qa">
                <h3 class="post-title cursor-pointer">${post.title}</h3>
                <div class="post-meta">
                    <span>작성자: ${post.nickname}</span>
                    <span>${post.date}</span>
                </div>
            </div>
            <div class="post-management-buttons flex items-center justify-end p-4">
                <button class="edit-button" onclick="window.showCustomPrompt({
                    title: '비밀번호 확인',
                    content: '게시글을 수정하려면 비밀번호를 입력하세요.',
                    inputType: 'password',
                    placeholder: '비밀번호'
                }).then(password => window.checkPasswordForQAManagement('${postId}', password, 'edit'))">✏️ 수정</button>
                <button class="delete-button" onclick="window.showCustomPrompt({
                    title: '비밀번호 확인',
                    content: '게시글을 삭제하려면 비밀번호를 입력하세요.',
                    inputType: 'password',
                    placeholder: '비밀번호'
                }).then(password => window.checkPasswordForQAManagement('${postId}', password, 'delete'))">🗑️ 삭제</button>
            </div>
        `;
        qaPostsContainer.appendChild(postElement);

        // 제목 클릭 이벤트 리스너 추가
        postElement.querySelector('.post-title').addEventListener('click', () => {
            openQADetail(postId);
        });
    });
}

async function openQAPostForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">${postId ? 'Q&A 수정' : 'Q&A 작성'}</h2>
        <div class="bg-white p-8 rounded-xl shadow-lg">
            <div class="mb-4">
                <label for="qa-title" class="block text-gray-700 text-sm font-bold mb-2">제목:</label>
                <input type="text" id="qa-title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-4">
                <label for="qa-nickname" class="block text-gray-700 text-sm font-bold mb-2">닉네임:</label>
                <input type="text" id="qa-nickname" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-4">
                <label for="qa-password" class="block text-gray-700 text-sm font-bold mb-2">비밀번호:</label>
                <input type="password" id="qa-password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-6">
                <label for="qa-editor" class="block text-gray-700 text-sm font-bold mb-2">내용:</label>
                <div id="qa-editor"></div>
            </div>
            <div class="flex items-center justify-between">
                <button id="save-qa-post-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">저장</button>
                <button id="cancel-qa-post-btn" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">취소</button>
            </div>
        </div>
    `;

    quillQA = new Quill('#qa-editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image'],
                [{ 'align': [] }],
                ['clean']
            ]
        }
    });

    if (postId) {
        const postRef = ref(database, `qa/${postId}`);
        const snapshot = await get(postRef);
        const post = snapshot.val();
        if (post) {
            document.getElementById('qa-title').value = post.title || '';
            document.getElementById('qa-nickname').value = post.nickname || '';
            if (quillQA && post.content) {
                quillQA.setContents(quillQA.clipboard.convert(post.content));
            } else {
                quillQA.setContents([]);
            }
            document.getElementById('save-qa-post-btn').onclick = () => updateQAPost(postId);
        } else {
            showCustomModal({ title: '오류', content: '수정할 Q&A 게시글을 찾을 수 없습니다.' });
            loadPage('qa');
            return;
        }
    } else {
        document.getElementById('save-qa-post-btn').onclick = saveQAPost;
    }

    document.getElementById('cancel-qa-post-btn').onclick = () => loadPage('qa');
}

function saveQAPost() {
    const title = document.getElementById('qa-title').value;
    const nickname = document.getElementById('qa-nickname').value;
    const password = document.getElementById('qa-password').value;
    const content = quillQA.root.innerHTML;

    if (!title || !nickname || !password || !content || content.trim() === '<p><br></p>' || content.trim() === '') {
        showCustomModal({ title: '오류', content: '모든 필드를 채워주세요.' });
        return;
    }

    const newPostRef = push(ref(database, 'qa'));
    set(newPostRef, {
        title,
        nickname,
        password,
        content,
        date: new Date().toISOString().slice(0, 10)
    })
    .then(() => {
        showCustomModal({ title: '성공', content: 'Q&A 게시글이 성공적으로 저장되었습니다!' });
        loadPage('qa');
    })
    .catch((error) => {
        console.error("Q&A 게시글 저장 중 오류 발생: ", error);
        showCustomModal({ title: '오류', content: 'Q&A 게시글 저장에 실패했습니다.' });
    });
}

async function updateQAPost(postId) {
    const title = document.getElementById('qa-title').value;
    const nickname = document.getElementById('qa-nickname').value;
    const passwordInput = document.getElementById('qa-password').value; // 수정 시에도 비밀번호 입력
    const content = quillQA.root.innerHTML;

    if (!title || !nickname || !passwordInput || !content || content.trim() === '<p><br></p>' || content.trim() === '') {
        showCustomModal({ title: '오류', content: '모든 필드를 채워주세요.' });
        return;
    }

    const postRef = ref(database, `qa/${postId}`);
    const snapshot = await get(postRef);
    const post = snapshot.val();

    if (!post || post.password !== passwordInput) {
        showCustomModal({ title: '오류', content: '비밀번호가 올바르지 않습니다.' });
        return;
    }

    update(postRef, { title, nickname, content })
        .then(() => {
            showCustomModal({ title: '성공', content: 'Q&A 게시글이 성공적으로 수정되었습니다!' });
            loadPage('qa');
        })
        .catch((error) => {
            console.error("Q&A 게시글 수정 중 오류 발생: ", error);
            showCustomModal({ title: '오류', content: 'Q&A 게시글 수정에 실패했습니다.' });
        });
}

async function deleteQAPost(postId) {
    const confirmDelete = await showCustomModal({
        title: '삭제 확인',
        content: '정말로 이 Q&A 게시글을 삭제하시겠습니까?',
        buttons: [
            { text: '삭제', value: 'delete', className: 'btn-danger' },
            { text: '취소', value: 'cancel', className: 'btn-secondary' }
        ]
    });

    if (confirmDelete === 'delete') {
        const postRef = ref(database, `qa/${postId}`);
        remove(postRef)
            .then(() => {
                showCustomModal({ title: '성공', content: 'Q&A 게시글이 성공적으로 삭제되었습니다!' });
                loadPage('qa');
            })
            .catch((error) => {
                console.error("Q&A 게시글 삭제 중 오류 발생: ", error);
                showCustomModal({ title: '오류', content: 'Q&A 게시글 삭제에 실패했습니다.' });
            });
    }
}

async function checkPasswordForQAManagement(postId, password, action) {
    // 하드코딩된 비밀번호 111로 변경
    const correctPassword = '111';

    if (password === null) {
        return;
    }
    if (!password) {
        showCustomModal({ title: '오류', content: '비밀번호를 입력하세요.' });
        return;
    }

    if (password === correctPassword) { // 입력된 비밀번호가 111이면
        if (action === 'edit') {
            openQAPostForm(postId);
        } else if (action === 'delete') {
            deleteQAPost(postId);
        }
    } else {
        showCustomModal({ title: '오류', content: '비밀번호가 올바르지 않습니다.' });
    }
}

async function openQADetail(postId) {
    const postRef = ref(database, `qa/${postId}`);
    const snapshot = await get(postRef);
    const post = snapshot.val();

    if (post) {
        document.getElementById('modal-blog-title').innerText = post.title;
        document.getElementById('modal-blog-author').innerText = `작성자: ${post.nickname}`;
        document.getElementById('modal-blog-date').innerText = post.date;
        document.getElementById('modal-blog-content').innerHTML = post.content;

        document.getElementById('blog-detail-modal').classList.remove('hidden');

        document.getElementById('close-blog-detail').onclick = () => {
            document.getElementById('blog-detail-modal').classList.add('hidden');
        };
    } else {
        showCustomModal({ title: '오류', content: 'Q&A 게시글을 찾을 수 없습니다.' });
    }
}

// =====================================
// Notice Functions
// =====================================

function loadNotice() {
    const noticeRef = ref(database, 'notice');
    onValue(noticeRef, (snapshot) => {
        const noticePosts = snapshot.val() || {};
        displayNoticePosts(noticePosts);
    }, {
        onlyOnce: false
    });
}

function displayNoticePosts(noticePosts) {
    const noticePostsContainer = document.getElementById('notice-posts-container');
    if (!noticePostsContainer) return;

    noticePostsContainer.innerHTML = '';

    if (Object.keys(noticePosts).length === 0) {
        noticePostsContainer.innerHTML = '<p class="text-gray-600 text-center py-8">아직 공지사항 게시글이 없습니다.</p>';
        return;
    }

    Object.keys(noticePosts).reverse().forEach(postId => {
        const post = noticePosts[postId];
        const postElement = document.createElement('div');
        postElement.classList.add('notice-list-item');

        postElement.innerHTML = `
            <div class="post-text-content" data-post-id="${postId}" data-post-type="notice">
                <h3 class="post-title cursor-pointer">${post.title}</h3>
                <div class="post-meta">
                    <span>작성자: ${post.author}</span>
                    <span>${post.date}</span>
                </div>
            </div>
            <div class="post-management-buttons flex items-center justify-end p-4">
                <button class="edit-button" onclick="window.showCustomPrompt({
                    title: '비밀번호 확인',
                    content: '게시글을 수정하려면 비밀번호를 입력하세요.',
                    inputType: 'password',
                    placeholder: '비밀번호'
                }).then(password => window.checkPasswordForNoticeManagement('${postId}', password, 'edit'))">✏️ 수정</button>
                <button class="delete-button" onclick="window.showCustomPrompt({
                    title: '비밀번호 확인',
                    content: '게시글을 삭제하려면 비밀번호를 입력하세요.',
                    inputType: 'password',
                    placeholder: '비밀번호'
                }).then(password => window.checkPasswordForNoticeManagement('${postId}', password, 'delete'))">🗑️ 삭제</button>
            </div>
        `;
        noticePostsContainer.appendChild(postElement);

        // 제목 클릭 이벤트 리스너 추가
        postElement.querySelector('.post-title').addEventListener('click', () => {
            openNoticeDetail(postId);
        });
    });
}

async function openNoticePostForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">${postId ? '공지사항 수정' : '공지사항 작성'}</h2>
        <div class="bg-white p-8 rounded-xl shadow-lg">
            <div class="mb-4">
                <label for="notice-title" class="block text-gray-700 text-sm font-bold mb-2">제목:</label>
                <input type="text" id="notice-title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-4">
                <label for="notice-author" class="block text-gray-700 text-sm font-bold mb-2">작성자:</label>
                <input type="text" id="notice-author" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-4">
                <label for="notice-password" class="block text-gray-700 text-sm font-bold mb-2">비밀번호:</label>
                <input type="password" id="notice-password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-6">
                <label for="notice-editor" class="block text-gray-700 text-sm font-bold mb-2">내용:</label>
                <div id="notice-editor"></div>
            </div>
            <div class="flex items-center justify-between">
                <button id="save-notice-post-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">저장</button>
                <button id="cancel-notice-post-btn" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">취소</button>
            </div>
        </div>
    `;

    quillNotice = new Quill('#notice-editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image'],
                [{ 'align': [] }],
                ['clean']
            ]
        }
    });

    if (postId) {
        const postRef = ref(database, `notice/${postId}`);
        const snapshot = await get(postRef);
        const post = snapshot.val();
        if (post) {
            document.getElementById('notice-title').value = post.title || '';
            document.getElementById('notice-author').value = post.author || '';
            if (quillNotice && post.content) {
                quillNotice.setContents(quillNotice.clipboard.convert(post.content));
            } else {
                quillNotice.setContents([]);
            }
            document.getElementById('save-notice-post-btn').onclick = () => updateNoticePost(postId);
        } else {
            showCustomModal({ title: '오류', content: '수정할 공지사항 게시글을 찾을 수 없습니다.' });
            loadPage('notice');
            return;
        }
    } else {
        document.getElementById('save-notice-post-btn').onclick = saveNoticePost;
    }

    document.getElementById('cancel-notice-post-btn').onclick = () => loadPage('notice');
}

function saveNoticePost() {
    const title = document.getElementById('notice-title').value;
    const author = document.getElementById('notice-author').value;
    const password = document.getElementById('notice-password').value;
    const content = quillNotice.root.innerHTML;

    if (!title || !author || !password || !content || content.trim() === '<p><br></p>' || content.trim() === '') {
        showCustomModal({ title: '오류', content: '모든 필드를 채워주세요.' });
        return;
    }

    const newPostRef = push(ref(database, 'notice'));
    set(newPostRef, {
        title,
        author,
        password,
        content,
        date: new Date().toISOString().slice(0, 10)
    })
    .then(() => {
        showCustomModal({ title: '성공', content: '공지사항 게시글이 성공적으로 저장되었습니다!' });
        loadPage('notice');
    })
    .catch((error) => {
        console.error("공지사항 게시글 저장 중 오류 발생: ", error);
        showCustomModal({ title: '오류', content: '공지사항 게시글 저장에 실패했습니다.' });
    });
}

async function updateNoticePost(postId) {
    const title = document.getElementById('notice-title').value;
    const author = document.getElementById('notice-author').value;
    const passwordInput = document.getElementById('notice-password').value; // 수정 시에도 비밀번호 입력
    const content = quillNotice.root.innerHTML;

    if (!title || !author || !passwordInput || !content || content.trim() === '<p><br></p>' || content.trim() === '') {
        showCustomModal({ title: '오류', content: '모든 필드를 채워주세요.' });
        return;
    }

    const postRef = ref(database, `notice/${postId}`);
    const snapshot = await get(postRef);
    const post = snapshot.val();

    if (!post || post.password !== passwordInput) {
        showCustomModal({ title: '오류', content: '비밀번호가 올바르지 않습니다.' });
        return;
    }

    update(postRef, { title, author, content })
        .then(() => {
            showCustomModal({ title: '성공', content: '공지사항 게시글이 성공적으로 수정되었습니다!' });
            loadPage('notice');
        })
        .catch((error) => {
            console.error("공지사항 게시글 수정 중 오류 발생: ", error);
            showCustomModal({ title: '오류', content: '공지사항 게시글 수정에 실패했습니다.' });
        });
}

async function deleteNoticePost(postId) {
    const confirmDelete = await showCustomModal({
        title: '삭제 확인',
        content: '정말로 이 공지사항 게시글을 삭제하시겠습니까?',
        buttons: [
            { text: '삭제', value: 'delete', className: 'btn-danger' },
            { text: '취소', value: 'cancel', className: 'btn-secondary' }
        ]
    });

    if (confirmDelete === 'delete') {
        const postRef = ref(database, `notice/${postId}`);
        remove(postRef)
            .then(() => {
                showCustomModal({ title: '성공', content: '공지사항 게시글이 성공적으로 삭제되었습니다!' });
                loadPage('notice');
            })
            .catch((error) => {
                console.error("공지사항 게시글 삭제 중 오류 발생: ", error);
                showCustomModal({ title: '오류', content: '공지사항 게시글 삭제에 실패했습니다.' });
            });
    }
}

async function checkPasswordForNoticeManagement(postId, password, action) {
    // 하드코딩된 비밀번호 111로 변경
    const correctPassword = '111';

    if (password === null) {
        return;
    }
    if (!password) {
        showCustomModal({ title: '오류', content: '비밀번호를 입력하세요.' });
        return;
    }

    if (password === correctPassword) { // 입력된 비밀번호가 111이면
        if (action === 'edit') {
            openNoticePostForm(postId);
        } else if (action === 'delete') {
            deleteNoticePost(postId);
        }
    } else {
        showCustomModal({ title: '오류', content: '비밀번호가 올바르지 않습니다.' });
    }
}

async function openNoticeDetail(postId) {
    const postRef = ref(database, `notice/${postId}`);
    const snapshot = await get(postRef);
    const post = snapshot.val();

    if (post) {
        document.getElementById('modal-blog-title').innerText = post.title;
        document.getElementById('modal-blog-author').innerText = `작성자: ${post.author}`;
        document.getElementById('modal-blog-date').innerText = post.date;
        document.getElementById('modal-blog-content').innerHTML = post.content;

        document.getElementById('blog-detail-modal').classList.remove('hidden');

        document.getElementById('close-blog-detail').onclick = () => {
            document.getElementById('blog-detail-modal').classList.add('hidden');
        };
    } else {
        showCustomModal({ title: '오류', content: '공지사항 게시글을 찾을 수 없습니다.' });
    }
}

// =====================================
// Sidebar Functions
// =====================================

function loadSidebarPosts() {
    // 최신 공지 로드
    const noticeRef = ref(database, 'notice');
    onValue(noticeRef, (snapshot) => {
        const notices = snapshot.val() || {};
        const latestNoticesContainer = document.getElementById('latest-notices-sidebar');
        if (!latestNoticesContainer) return; // 요소가 없는 경우 함수 종료
        latestNoticesContainer.innerHTML = '';
        if (Object.keys(notices).length === 0) {
            latestNoticesContainer.innerHTML = '<li class="text-gray-700">최신 공지가 없습니다.</li>';
        } else {
            const sortedNotices = Object.keys(notices).sort((a, b) => new Date(notices[b].date) - new Date(notices[a].date)).slice(0, 5); // 최신 5개
            sortedNotices.forEach(postId => {
                latestNoticesContainer.appendChild(createSidebarPostElement(notices[postId], postId, 'notice'));
            });
        }
    }, {
        onlyOnce: false
    });

    // 인기글 (블로그) 로드 (조회수 기준)
    const blogPostsRef = ref(database, 'posts');
    onValue(blogPostsRef, (snapshot) => {
        const posts = snapshot.val() || {};
        const popularPostsContainer = document.getElementById('popular-posts-sidebar');
        if (!popularPostsContainer) return; // 요소가 없는 경우 함수 종료
        popularPostsContainer.innerHTML = '';
        if (Object.keys(posts).length === 0) {
            popularPostsContainer.innerHTML = '<li class="text-gray-700">인기글이 없습니다.</li>';
        } else {
            const sortedPosts = Object.keys(posts).sort((a, b) => (posts[b].views || 0) - (posts[a].views || 0)).slice(0, 5); // 조회수 높은 5개
            sortedPosts.forEach(postId => {
                popularPostsContainer.appendChild(createSidebarPostElement(posts[postId], postId, 'blog'));
            });
        }
    }, {
        onlyOnce: false
    });

    // 최신 글 (블로그) 로드 (날짜 기준)
    onValue(blogPostsRef, (snapshot) => {
        const posts = snapshot.val() || {};
        const latestPostsContainer = document.getElementById('latest-posts-sidebar');
        if (!latestPostsContainer) return; // 요소가 없는 경우 함수 종료
        latestPostsContainer.innerHTML = '';
        if (Object.keys(posts).length === 0) {
            latestPostsContainer.innerHTML = '<li class="text-gray-700">최신 글이 없습니다.</li>';
        } else {
            const sortedPosts = Object.keys(posts).sort((a, b) => new Date(posts[b].date) - new Date(posts[a].date)).slice(0, 5); // 최신 5개
            sortedPosts.forEach(postId => {
                latestPostsContainer.appendChild(createSidebarPostElement(posts[postId], postId, 'blog'));
            });
        }
    }, {
        onlyOnce: false
    });
}

function createSidebarPostElement(post, postId, type) {
    const li = document.createElement('li');
    li.innerHTML = `
        <a href="#${type}-detail/${postId}">${post.title}</a>
        <span class="post-date">${post.date}</span>
    `;
    li.addEventListener('click', (e) => {
        e.preventDefault();
        // 사이드바에서는 바로 상세 보기 모달을 띄우도록 비밀번호 확인 없이 변경
        // (요청에 따라 사이드바 클릭 시에는 비밀번호 확인 없이 상세 보기)
        if (type === 'blog') {
            openBlogPostDetail(postId);
        } else if (type === 'qa') {
            openQADetail(postId);
        } else if (type === 'notice') {
            openNoticeDetail(postId);
        }
    });
    return li;
}

// =====================================
// Calendar Functions (Q&A 페이지에서만 보임)
// =====================================
let currentMonth, currentYear;

function generateCalendar(month, year) {
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthYearSpan = document.getElementById('currentMonthYear');
    if (!calendarDays || !currentMonthYearSpan) return; // 요소가 없는 경우 함수 종료

    calendarDays.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0: Sunday, 1: Monday, ...

    currentMonthYearSpan.textContent = `${year}.${(month + 1).toString().padStart(2, '0')}`;

    // 이전 달의 빈 칸 채우기
    for (let i = 0; i < startDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('p-2', 'text-center', 'text-gray-400');
        calendarDays.appendChild(emptyDiv);
    }

    // 현재 달의 날짜 채우기
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('p-2', 'text-center', 'rounded-md', 'cursor-pointer', 'hover:bg-blue-200', 'transition-colors');

        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.classList.add('bg-blue-500', 'text-white', 'font-bold');
        }
        dayDiv.textContent = i;
        dayDiv.addEventListener('click', () => {
            // 날짜 클릭 시 이벤트 (예: 해당 날짜의 게시물 필터링)
            showCustomModal({ title: '달력 날짜', content: `${year}.${month + 1}.${i} 날짜를 클릭했습니다.` });
        });
        calendarDays.appendChild(dayDiv);
    }
}

// 초기 달력 생성 (현재 날짜 기준)
// DOMContentLoaded에서 호출되므로, 해당 요소들이 존재하는지 체크
if (document.getElementById('calendar-days')) {
    const initialToday = new Date();
    currentMonth = initialToday.getMonth();
    currentYear = initialToday.getFullYear();
    generateCalendar(currentMonth, currentYear);

    // 달력 이전/다음 달 버튼 이벤트 리스너
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });
}


// 전역 스코프에 함수들을 노출 (HTML에서 직접 호출할 수 있도록)
window.showCustomModal = showCustomModal;
window.showCustomPrompt = showCustomPrompt;
window.checkPasswordForBlogPost = checkPasswordForBlogPost;
window.openBlogPostForm = openBlogPostForm;
window.deleteBlogPost = deleteBlogPost;
window.openBlogPostDetail = openBlogPostDetail;

window.checkPasswordForQAManagement = checkPasswordForQAManagement;
window.openQAPostForm = openQAPostForm;
window.deleteQAPost = deleteQAPost;
window.openQADetail = openQADetail;

window.checkPasswordForNoticeManagement = checkPasswordForNoticeManagement;
window.openNoticePostForm = openNoticePostForm;
window.deleteNoticePost = deleteNoticePost;
window.openNoticeDetail = openNoticeDetail;

window.loadPage = loadPage; // 네비게이션에서 호출을 위해 노출
