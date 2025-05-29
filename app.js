import { database } from './firebaseConfig.js';
import { ref, push, onValue, remove, update, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

let currentViewMode = 'list'; // 'list' 또는 'tile'
let currentPage = ''; // 현재 로드된 페이지 (blog, qa, notice)

// OpenWeatherMap API 키 (실제 서비스에서는 서버 사이드에서 관리하는 것이 더 안전합니다)
const WEATHER_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // 여기에 실제 API 키를 넣어주세요
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

document.addEventListener('DOMContentLoaded', function() {
    const scrollUpButton = document.getElementById('scrollUp');
    const scrollDownButton = document.getElementById('scrollDown');
    const footer = document.getElementById('footer');
    const blogDetailModal = document.getElementById('blog-detail-modal');
    const closeBlogDetailButton = document.getElementById('close-blog-detail');
    const navListViewBtn = document.getElementById('nav-list-view-btn');
    const navTileViewBtn = document.getElementById('nav-tile-view-btn');
    const globalSearchInput = document.getElementById('global-search-input');

    // 스크롤 버튼 이벤트
    scrollUpButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    scrollDownButton.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

    // 블로그 상세 모달 닫기
    closeBlogDetailButton.addEventListener('click', () => {
        blogDetailModal.classList.add('hidden');
    });
    blogDetailModal.addEventListener('click', (e) => {
        if (e.target === blogDetailModal) {
            blogDetailModal.classList.add('hidden');
        }
    });

    // 초기 페이지 로드 (blog)
    loadPage('blog');
    loadSidebarPosts(); // 사이드바 포스트 로드

    // 내비게이션 클릭 이벤트
    document.querySelector('nav').addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.classList.contains('nav-item')) {
            e.preventDefault();
            const page = e.target.getAttribute('href').slice(1);
            loadPage(page);
        }
    });

    // 푸터 가시성
    window.addEventListener('scroll', function() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - footer.offsetHeight) {
            footer.style.display = 'block';
        } else {
            footer.style.display = 'none';
        }
    });

    // 뒤로가기/앞으로가기
    window.addEventListener('popstate', function(event) {
        loadPage(event.state ? event.state.page : 'blog');
    });

    // 보기 방식 버튼 이벤트 리스너 (내비게이션 바에 위치)
    if (navListViewBtn) {
        navListViewBtn.addEventListener('click', () => setViewMode('list'));
    }
    if (navTileViewBtn) {
        navTileViewBtn.addEventListener('click', () => setViewMode('tile'));
    }

    // 통합 검색 입력 이벤트
    globalSearchInput.addEventListener('input', (e) => {
        searchPosts(e.target.value, currentPage); // 현재 활성화된 페이지에 따라 검색
    });

    // 날씨 정보 로드
    fetchWeather();
});

// --- 공통 유틸리티 함수 ---

// 커스텀 모달 함수
async function showCustomModal(message, type = 'alert') {
    return new Promise((resolve) => {
        const modalContainer = document.getElementById('custom-modal-container');
        modalContainer.innerHTML = `
            <div class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div class="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
                    <p class="text-lg text-gray-800 mb-6 text-center">${message}</p>
                    <div class="flex justify-center space-x-4">
                        ${type === 'confirm' ? `
                            <button id="modal-cancel" class="btn btn-secondary text-sm">취소</button>
                            <button id="modal-ok" class="btn btn-primary text-sm">확인</button>
                        ` : `
                            <button id="modal-ok" class="btn btn-primary text-sm">확인</button>
                        `}
                    </div>
                </div>
            </div>
        `;
        modalContainer.classList.remove('hidden');

        const okButton = modalContainer.querySelector('#modal-ok');
        const cancelButton = modalContainer.querySelector('#modal-cancel');

        okButton.addEventListener('click', () => {
            modalContainer.innerHTML = ''; // 모달 제거
            modalContainer.classList.add('hidden');
            resolve(true);
        });

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                modalContainer.innerHTML = ''; // 모달 제거
                modalContainer.classList.add('hidden');
                resolve(false);
            });
        }
    });
}

// 커스텀 프롬프트 함수
async function showCustomPrompt(message) {
    return new Promise((resolve) => {
        const modalContainer = document.getElementById('custom-modal-container');
        modalContainer.innerHTML = `
            <div class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div class="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
                    <p class="text-lg text-gray-800 mb-4 text-center">${message}</p>
                    <input type="password" id="prompt-input" class="w-full p-3 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <div class="flex justify-center space-x-4">
                        <button id="prompt-cancel" class="btn btn-secondary text-sm">취소</button>
                        <button id="prompt-ok" class="btn btn-primary text-sm">확인</button>
                    </div>
                </div>
            </div>
        `;
        modalContainer.classList.remove('hidden');

        const promptInput = modalContainer.querySelector('#prompt-input');
        const okButton = modalContainer.querySelector('#prompt-ok');
        const cancelButton = modalContainer.querySelector('#prompt-cancel');

        promptInput.focus();

        okButton.addEventListener('click', () => {
            modalContainer.innerHTML = '';
            modalContainer.classList.add('hidden');
            resolve(promptInput.value);
        });

        cancelButton.addEventListener('click', () => {
            modalContainer.innerHTML = '';
            modalContainer.classList.add('hidden');
            resolve(null);
        });

        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                okButton.click();
            }
        });
    });
}

// HTML 태그 제거 및 텍스트 요약 함수
function getPlainTextSummary(htmlContent, maxLength = 200) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    let text = tempDiv.textContent || tempDiv.innerText || '';
    text = text.replace(/\s+/g, ' ').trim(); // 연속된 공백 제거 및 앞뒤 공백 제거
    if (text.length > maxLength) {
        text = text.substring(0, maxLength) + '...';
    }
    return text;
}

// 현재 페이지 상태 업데이트 및 네비게이션 활성화/비활성화
function updateNavActiveState(pageId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNavItem = document.querySelector(`.nav-item[href="#${pageId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    const blogViewToggleGroup = document.getElementById('blog-view-toggle-group');
    if (pageId === 'blog') {
        blogViewToggleGroup.classList.remove('hidden');
    } else {
        blogViewToggleGroup.classList.add('hidden');
    }

    // 날씨 정보 섹션 가시성 (공지사항 페이지에서만 표시)
    const weatherInfoSection = document.getElementById('weather-info-section');
    if (pageId === 'notice') {
        weatherInfoSection.classList.remove('hidden');
    } else {
        weatherInfoSection.classList.add('hidden');
    }
}

// --- 페이지 로드 함수 ---

function loadPage(page) {
    currentPage = page; // 현재 페이지 상태 업데이트
    const mainContent = document.getElementById('main-content');
    updateNavActiveState(page); // 네비게이션 활성화 상태 업데이트
    // 통합 검색창 비우기
    document.getElementById('global-search-input').value = '';

    switch(page) {
        case 'blog':
            loadBlog();
            break;
        case 'qa':
            loadQA();
            break;
        case 'notice':
            loadNotice();
            break;
        default:
            loadBlog(); // 기본 페이지를 blog로 설정
            break;
    }
    history.pushState({ page: page }, '', `#${page}`);
}

// --- BLOG 관련 함수 ---

function loadBlog() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-center mb-6 blog-header">
            <h1 class="text-3xl font-bold text-gray-800">BLOG</h1>
            <div class="flex items-center space-x-3 mt-4 sm:mt-0">
                <button onclick="checkPasswordForBlogPost()" class="btn btn-primary whitespace-nowrap text-sm">새 글 작성</button>
            </div>
        </div>
        <hr class="my-6 border-gray-200">
        <div id="blog-posts-container" class="space-y-8 ${currentViewMode === 'tile' ? 'tile-view' : ''}"></div>
    `;
    loadBlogPosts(document.getElementById('blog-posts-container'));

    // 보기 방식 버튼 활성화 상태 동기화
    updateViewModeButtons();

    // 블로그 페이지 로드 시, 검색창 이벤트 리스너를 다시 연결 (페이지 새로고침 시 필요)
    document.getElementById('global-search-input').removeEventListener('input', (e) => searchPosts(e.target.value, 'blog'));
    document.getElementById('global-search-input').addEventListener('input', (e) => searchPosts(e.target.value, 'blog'));
}

function updateViewModeButtons() {
    const navListViewBtn = document.getElementById('nav-list-view-btn');
    const navTileViewBtn = document.getElementById('nav-tile-view-btn');

    if (navListViewBtn && navTileViewBtn) {
        if (currentViewMode === 'list') {
            navListViewBtn.classList.add('active');
            navTileViewBtn.classList.remove('active');
        } else {
            navTileViewBtn.classList.add('active');
            navListViewBtn.classList.remove('active');
        }
    }
}

function setViewMode(mode) {
    currentViewMode = mode;
    const container = document.getElementById('blog-posts-container');
    if (container) { // 블로그 페이지일 때만 적용
        if (mode === 'list') {
            container.classList.remove('tile-view');
        } else {
            container.classList.add('tile-view');
        }
    }
    updateViewModeButtons(); // 메뉴바의 버튼 상태 업데이트
    // 현재 검색어 유지하면서 다시 로드
    const currentSearchInput = document.getElementById('global-search-input');
    const currentSearchTerm = currentSearchInput ? currentSearchInput.value : '';
    loadBlogPosts(document.getElementById('blog-posts-container'), currentSearchTerm);
}

function loadBlogPosts(container, searchTerm = '') {
    const postsRef = ref(database, 'posts');
    onValue(postsRef, (snapshot) => {
        let posts = [];
        snapshot.forEach((childSnapshot) => {
            posts.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        posts.sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신순 정렬

        // 검색 필터링
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            posts = posts.filter(post =>
                post.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                (post.content && getPlainTextSummary(post.content, 1000).toLowerCase().includes(lowerCaseSearchTerm)) // 본문 검색
            );
        }
        displayBlogPosts(posts, container);
    });
}

function displayBlogPosts(posts, container) {
    container.innerHTML = '';
    if (posts.length === 0) {
        container.innerHTML += '<p class="text-gray-600 text-center py-10">아직 작성된 블로그 포스트가 없습니다.</p>';
        return;
    }

    posts.forEach(post => {
        const summary = getPlainTextSummary(post.content, 150); // 본문 150자 요약
        container.innerHTML += `
            <div class="blog-post p-6">
                <h2 class="text-2xl font-semibold text-gray-800 mb-2">
                    <a href="#" onclick="showBlogPostDetail('${post.id}')" class="text-gray-800 hover:text-blue-600">${post.title}</a>
                </h2>
                <div class="meta-info flex justify-between items-center text-gray-500 text-sm mb-4">
                    <span class="author font-medium text-gray-700">작성자: ${post.author || '익명'}</span>
                    <span class="date">${post.date}</span>
                </div>
                <div class="post-summary text-gray-700 leading-relaxed mb-4">${summary}</div>
                <div class="flex justify-end actions space-x-2">
                    <button onclick="showBlogPostDetail('${post.id}')" class="icon-btn text-lg" title="더 보기"><i class="fas fa-eye"></i></button>
                    <button onclick="editBlogPost('${post.id}')" class="icon-btn primary text-lg" title="수정"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteBlogPost('${post.id}')" class="icon-btn danger text-lg" title="삭제"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    });
}

async function showBlogPostDetail(postId) {
    const postRef = ref(database, `posts/${postId}`);
    try {
        const snapshot = await get(postRef);
        if (snapshot.exists()) {
            const post = snapshot.val();
            document.getElementById('modal-blog-title').textContent = post.title;
            document.getElementById('modal-blog-author').textContent = `작성자: ${post.author || '익명'}`;
            document.getElementById('modal-blog-date').textContent = post.date;
            document.getElementById('modal-blog-content').innerHTML = post.content;
            document.getElementById('blog-detail-modal').classList.remove('hidden');
        } else {
            await showCustomModal('게시물을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error("Error loading blog post detail: ", error);
        await showCustomModal('게시물 상세 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

async function checkPasswordForBlogPost() {
    const password = await showCustomPrompt("비밀번호를 입력하세요:");
    if (password === "1234") { // 실제 구현시 보안을 강화해야 합니다
        openBlogPostForm();
    } else if (password !== null) {
        await showCustomModal("비밀번호가 올바르지 않습니다.");
    }
}

function openBlogPostForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    const formTitle = postId ? '블로그 글 수정' : '새 블로그 글 작성';
    mainContent.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">${formTitle}</h1>
        <form id="blog-form" class="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <input type="text" id="blog-title" placeholder="제목" required class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base">
            <input type="text" id="blog-author" placeholder="작성자 닉네임" required class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base">
            <div id="blog-editor" contenteditable="true" class="w-full min-h-[300px] p-3 border border-gray-300 rounded-md mb-4 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"></div>
            <input type="file" id="blog-image" accept="image/*" multiple class="w-full p-3 border border-gray-300 rounded-md mb-6 bg-gray-50 text-sm">
            <div class="flex justify-end space-x-3 form-buttons">
                <button type="submit" class="btn btn-primary text-sm">${postId ? '수정' : '등록'}</button>
                ${postId ? '<button type="button" onclick="deleteBlogPost(\'' + postId + '\')" class="btn btn-danger text-sm">삭제</button>' : ''}
            </div>
        </form>
    `;
    const form = document.getElementById('blog-form');
    const editor = document.getElementById('blog-editor');
    const imageInput = document.getElementById('blog-image');
    const authorInput = document.getElementById('blog-author');

    imageInput.addEventListener('change', function(e) {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.classList.add('max-w-full', 'h-auto', 'rounded-md', 'my-2'); // Tailwind classes for images
                editor.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    if (postId) {
        const postRef = ref(database, `posts/${postId}`);
        get(postRef).then((snapshot) => {
            const post = snapshot.val();
            document.getElementById('blog-title').value = post.title;
            authorInput.value = post.author || '';
            editor.innerHTML = post.content;
        });
        form.onsubmit = (e) => updateBlogPost(e, postId);
    } else {
        form.onsubmit = submitBlogPost;
    }
}

async function submitBlogPost(e) {
    e.preventDefault();
    const title = document.getElementById('blog-title').value;
    const author = document.getElementById('blog-author').value;
    const content = document.getElementById('blog-editor').innerHTML;
    const date = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/ /g, '-').slice(0, -1);

    if (!title || !author || !content) {
        await showCustomModal('모든 필드를 채워주세요.');
        return;
    }

    const post = { title, author, content, date };
    saveBlogPost(post);
}

async function saveBlogPost(post) {
    const postsRef = ref(database, 'posts');
    try {
        await push(postsRef, post);
        await showCustomModal('블로그 글이 등록되었습니다.');
        loadBlog();
    } catch (error) {
        console.error("Error adding post: ", error);
        await showCustomModal('글 등록 중 오류가 발생했습니다.');
    }
}

async function editBlogPost(postId) {
    const password = await showCustomPrompt("비밀번호를 입력하세요:");
    if (password === "1234") {
        openBlogPostForm(postId);
    } else if (password !== null) {
        await showCustomModal("비밀번호가 올바르지 않습니다.");
    }
}

async function updateBlogPost(e, postId) {
    e.preventDefault();
    const title = document.getElementById('blog-title').value;
    const author = document.getElementById('blog-author').value;
    const content = document.getElementById('blog-editor').innerHTML;

    if (!title || !author || !content) {
        await showCustomModal('모든 필드를 채워주세요.');
        return;
    }

    const post = { title, author, content };
    const postRef = ref(database, `posts/${postId}`);
    try {
        await update(postRef, post);
        await showCustomModal('블로그 글이 수정되었습니다.');
        loadBlog();
    } catch (error) {
        console.error("Error updating post: ", error);
        await showCustomModal('글 수정 중 오류가 발생했습니다.');
    }
}

async function deleteBlogPost(postId) {
    const confirmed = await showCustomModal('정말로 이 블로그 글을 삭제하시겠습니까?', 'confirm');
    if (confirmed) {
        const password = await showCustomPrompt("비밀번호를 입력하세요:");
        if (password === "1234") { // 관리자 비밀번호 확인
            const postRef = ref(database, `posts/${postId}`);
            try {
                await remove(postRef);
                await showCustomModal('블로그 글이 삭제되었습니다.');
                loadBlog();
            } catch (error) {
                console.error("Error removing post: ", error);
                await showCustomModal('글 삭제 중 오류가 발생했습니다.');
            }
        } else if (password !== null) {
            await showCustomModal("비밀번호가 올바르지 않습니다.");
        }
    }
}

// --- Q&A 관련 함수 ---

function loadQA() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-center mb-6 qa-header">
            <h1 class="text-3xl font-bold text-gray-800">Q&A</h1>
            <div class="flex items-center space-x-3 mt-4 sm:mt-0">
                <button onclick="openQAForm()" class="btn btn-primary whitespace-nowrap text-sm">새 질문</button>
                <button onclick="checkPasswordForQAManagement()" class="btn btn-secondary whitespace-nowrap text-sm">관리</button>
            </div>
        </div>
        <hr class="my-6 border-gray-200">
        <div id="qa-list" class="space-y-8"></div>
    `;
    loadQAPosts();
    // Q&A 페이지 로드 시, 검색창 이벤트 리스너를 다시 연결
    document.getElementById('global-search-input').removeEventListener('input', (e) => searchPosts(e.target.value, 'qa'));
    document.getElementById('global-search-input').addEventListener('input', (e) => searchPosts(e.target.value, 'qa'));
}

function loadQAPosts(searchTerm = '') {
    const qaListElement = document.getElementById('qa-list');
    const qaRef = ref(database, 'qa');
    onValue(qaRef, (snapshot) => {
        let qaPosts = [];
        snapshot.forEach((childSnapshot) => {
            qaPosts.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        qaPosts.sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신순 정렬

        // 검색 필터링
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            qaPosts = qaPosts.filter(post =>
                post.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                (post.content && post.content.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }
        displayQAPosts(qaPosts, qaListElement);
    });
}

function displayQAPosts(qaPosts, container) {
    container.innerHTML = '';
    if (qaPosts.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-center py-10">아직 작성된 Q&A가 없습니다.</p>';
        return;
    }
    qaPosts.forEach((qaPost) => {
        const summary = getPlainTextSummary(qaPost.content, 150); // 본문 150자 요약
        container.innerHTML += `
            <div class="qa-post p-6">
                <h3 class="text-2xl font-semibold text-gray-800 mb-2">${qaPost.title}</h3>
                <div class="meta-info flex justify-between items-center text-gray-500 text-sm mb-4">
                    <span class="author font-medium text-gray-700">작성자: ${qaPost.nickname}</span>
                    <span class="date">${qaPost.date}</span>
                </div>
                <p class="post-summary text-gray-700 leading-relaxed mb-4">${summary}</p>
                <div class="flex justify-end space-x-2 actions">
                    <button onclick="editQAPost('${qaPost.id}')" class="icon-btn primary text-lg" title="수정"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteQAPost('${qaPost.id}')" class="icon-btn danger text-lg" title="삭제"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    });
}

async function checkPasswordForQAManagement() {
    const password = await showCustomPrompt("관리자 비밀번호를 입력하세요:");
    if (password === "1234") { // 실제 구현시 보안을 강화해야 합니다
        manageQA();
    } else if (password !== null) {
        await showCustomModal("비밀번호가 올바르지 않습니다.");
    }
}

function manageQA() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Q&A 관리</h1>
        <hr class="my-6 border-gray-200">
        <div id="qa-management-list" class="space-y-8"></div>
    `;
    const qaManagementListElement = document.getElementById('qa-management-list');
    const qaRef = ref(database, 'qa');
    onValue(qaRef, (snapshot) => {
        qaManagementListElement.innerHTML = '';
        if (!snapshot.exists()) {
            qaManagementListElement.innerHTML = '<p class="text-gray-600 text-center py-10">아직 작성된 Q&A가 없습니다.</p>';
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const qaPost = childSnapshot.val();
            qaManagementListElement.innerHTML += `
                <div class="qa-post p-6">
                    <h3 class="text-2xl font-semibold text-gray-800 mb-2">${qaPost.title}</h3>
                    <div class="meta-info flex justify-between items-center text-gray-500 text-sm mb-4">
                        <span class="author font-medium text-gray-700">작성자: ${qaPost.nickname}</span>
                        <span class="date">${qaPost.date}</span>
                    </div>
                    <p class="text-gray-700 leading-relaxed mb-6">비밀번호: <span class="password hidden font-mono text-gray-900">${qaPost.password}</span></p>
                    <div class="flex justify-end space-x-2 actions">
                        <button onclick="togglePassword(this)" class="btn btn-secondary btn-toggle-password text-sm">비밀번호 보기</button>
                        <button onclick="editQAPost('${childSnapshot.key}')" class="icon-btn primary text-lg" title="수정"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteQAPost('${childSnapshot.key}')" class="icon-btn danger text-lg" title="삭제"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
        });
    });
}

function togglePassword(buttonElement) {
    const passwordSpan = buttonElement.closest('.qa-post').querySelector('.password');
    if (passwordSpan.classList.contains('hidden')) {
        passwordSpan.classList.remove('hidden');
        buttonElement.textContent = '비밀번호 숨기기';
    } else {
        passwordSpan.classList.add('hidden');
        buttonElement.textContent = '비밀번호 보기';
    }
}

function openQAForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    const formTitle = postId ? 'Q&A 수정' : '새 Q&A 작성';
    mainContent.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">${formTitle}</h1>
        <form id="qa-form" class="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <input type="text" id="qa-title" placeholder="제목" required class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base">
            <textarea id="qa-content" placeholder="내용" required class="w-full min-h-[150px] p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"></textarea>
            <input type="text" id="qa-nickname" placeholder="닉네임" required class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base">
            <input type="password" id="qa-password" placeholder="비밀번호" required class="w-full p-3 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base">
            <div class="flex justify-end space-x-3 form-buttons">
                <button type="submit" class="btn btn-primary text-sm">${postId ? '수정' : '등록'}</button>
                ${postId ? '<button type="button" onclick="deleteQAPost(\'' + postId + '\')" class="btn btn-danger text-sm">삭제</button>' : ''}
            </div>
        </form>
    `;
    const form = document.getElementById('qa-form');
    if (postId) {
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

async function submitQAPost(e) {
    e.preventDefault();
    const title = document.getElementById('qa-title').value;
    const content = document.getElementById('qa-content').value;
    const nickname = document.getElementById('qa-nickname').value;
    const password = document.getElementById('qa-password').value;
    const date = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/ /g, '-').slice(0, -1);

    if (!title || !content || !nickname || !password) {
        await showCustomModal('모든 필드를 채워주세요.');
        return;
    }

    const qa = { title, content, nickname, password, date };
    const qaRef = ref(database, 'qa');
    try {
        await push(qaRef, qa);
        await showCustomModal('Q&A가 등록되었습니다.');
        loadQA();
    } catch (error) {
        console.error("Error adding Q&A: ", error);
        await showCustomModal('Q&A 등록 중 오류가 발생했습니다.');
    }
}

async function editQAPost(postId) {
    const password = await showCustomPrompt("비밀번호를 입력하세요:");
    if (password === null) return;
    const qaRef = ref(database, `qa/${postId}`);
    try {
        const snapshot = await get(qaRef);
        const qa = snapshot.val();
        if (password === qa.password) {
            openQAForm(postId);
        } else {
            await showCustomModal("비밀번호가 올바르지 않습니다.");
        }
    } catch (error) {
        console.error("Error getting Q&A for edit: ", error);
        await showCustomModal('Q&A 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

async function updateQAPost(e, postId) {
    e.preventDefault();
    const title = document.getElementById('qa-title').value;
    const content = document.getElementById('qa-content').value;
    const nickname = document.getElementById('qa-nickname').value;
    const password = document.getElementById('qa-password').value; // 업데이트 시에도 비밀번호 필요

    if (!title || !content || !nickname || !password) {
        await showCustomModal('모든 필드를 채워주세요.');
        return;
    }

    const qaRef = ref(database, `qa/${postId}`);
    try {
        await update(qaRef, { title, content, nickname, password });
        await showCustomModal('Q&A가 수정되었습니다.');
        loadQA();
    } catch (error) {
        console.error("Error updating Q&A: ", error);
        await showCustomModal('Q&A 수정 중 오류가 발생했습니다.');
    }
}

async function deleteQAPost(postId) {
    const confirmed = await showCustomModal('정말로 이 Q&A를 삭제하시겠습니까?', 'confirm');
    if (confirmed) {
        const password = await showCustomPrompt("비밀번호를 입력하세요:");
        if (password === null) return;
        const qaRef = ref(database, `qa/${postId}`);
        try {
            const snapshot = await get(qaRef);
            const qa = snapshot.val();
            if (password === qa.password) {
                await remove(qaRef);
                await showCustomModal('Q&A가 삭제되었습니다.');
                loadQA();
            } else {
                await showCustomModal("비밀번호가 올바르지 않습니다.");
            }
        } catch (error) {
            console.error("Error removing Q&A: ", error);
            await showCustomModal('Q&A 삭제 중 오류가 발생했습니다.');
        }
    }
}

// --- 공지사항 관련 함수 ---

function loadNotice() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-center mb-6 notice-header">
            <h1 class="text-3xl font-bold text-gray-800">공지사항</h1>
            <div class="flex items-center space-x-3 mt-4 sm:mt-0">
                <button onclick="checkPasswordForNotice()" class="btn btn-primary whitespace-nowrap text-sm">새 공지 작성</button>
            </div>
        </div>
        <hr class="my-6 border-gray-200">
        <div id="notice-list" class="space-y-8"></div>
    `;
    loadNoticePosts();
    // 공지사항 페이지 로드 시, 검색창 이벤트 리스너를 다시 연결
    document.getElementById('global-search-input').removeEventListener('input', (e) => searchPosts(e.target.value, 'notice'));
    document.getElementById('global-search-input').addEventListener('input', (e) => searchPosts(e.target.value, 'notice'));
}

function loadNoticePosts(searchTerm = '') {
    const noticeListElement = document.getElementById('notice-list');
    const noticeRef = ref(database, 'notice');
    onValue(noticeRef, (snapshot) => {
        let noticePosts = [];
        snapshot.forEach((childSnapshot) => {
            noticePosts.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        noticePosts.sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신순 정렬

        // 검색 필터링
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            noticePosts = noticePosts.filter(post =>
                post.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                (post.content && getPlainTextSummary(post.content, 1000).toLowerCase().includes(lowerCaseSearchTerm))
            );
        }
        displayNoticePosts(noticePosts, noticeListElement);
    });
}

function displayNoticePosts(noticePosts, container) {
    container.innerHTML = '';
    if (noticePosts.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-center py-10">아직 작성된 공지사항이 없습니다.</p>';
        return;
    }
    noticePosts.forEach(post => {
        const summary = getPlainTextSummary(post.content, 150);
        container.innerHTML += `
            <div class="notice-post p-6">
                <h3 class="text-2xl font-semibold text-gray-800 mb-2">${post.title}</h3>
                <div class="meta-info flex justify-between items-center text-gray-500 text-sm mb-4">
                    <span class="author font-medium text-gray-700">작성자: ${post.author || '관리자'}</span>
                    <span class="date">${post.date}</span>
                </div>
                <p class="post-summary text-gray-700 leading-relaxed mb-4">${summary}</p>
                <div class="flex justify-end actions space-x-2">
                    <button onclick="showNoticeDetail('${post.id}')" class="icon-btn text-lg" title="더 보기"><i class="fas fa-eye"></i></button>
                    <button onclick="editNoticePost('${post.id}')" class="icon-btn primary text-lg" title="수정"><i class="fas fa-edit"></i></button>
                </div>
            </div>
        `;
    });
}

async function showNoticeDetail(noticeId) {
    const noticeRef = ref(database, `notice/${noticeId}`);
    try {
        const snapshot = await get(noticeRef);
        if (snapshot.exists()) {
            const post = snapshot.val();
            // 재사용을 위해 blog-detail-modal 사용
            document.getElementById('modal-blog-title').textContent = post.title;
            document.getElementById('modal-blog-author').textContent = `작성자: ${post.author || '관리자'}`;
            document.getElementById('modal-blog-date').textContent = post.date;
            document.getElementById('modal-blog-content').innerHTML = post.content;
            document.getElementById('blog-detail-modal').classList.remove('hidden');
        } else {
            await showCustomModal('공지사항을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error("Error loading notice detail: ", error);
        await showCustomModal('공지사항 상세 정보를 불러오는 중 오류가 발생했습니다.');
    }
}


async function checkPasswordForNotice() {
    const password = await showCustomPrompt("관리자 비밀번호를 입력하세요:");
    if (password === "1234") { // 실제 구현시 보안을 강화해야 합니다
        openNoticeForm();
    } else if (password !== null) {
        await showCustomModal("비밀번호가 올바르지 않습니다.");
    }
}

function openNoticeForm(noticeId = null) {
    const mainContent = document.getElementById('main-content');
    const formTitle = noticeId ? '공지사항 수정' : '새 공지사항 작성';
    mainContent.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">${formTitle}</h1>
        <form id="notice-form" class="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <input type="text" id="notice-title" placeholder="제목" required class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base">
            <input type="text" id="notice-author" placeholder="작성자 닉네임" value="관리자" required class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base" readonly>
            <div id="notice-editor" contenteditable="true" class="w-full min-h-[300px] p-3 border border-gray-300 rounded-md mb-4 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"></div>
            <input type="file" id="notice-image" accept="image/*" multiple class="w-full p-3 border border-gray-300 rounded-md mb-6 bg-gray-50 text-sm">
            <div class="flex justify-end space-x-3 form-buttons">
                <button type="submit" class="btn btn-primary text-sm">${noticeId ? '수정' : '등록'}</button>
                ${noticeId ? '<button type="button" onclick="deleteNoticePost(\'' + noticeId + '\')" class="btn btn-danger text-sm">삭제</button>' : ''}
            </div>
        </form>
    `;
    const form = document.getElementById('notice-form');
    const editor = document.getElementById('notice-editor');
    const imageInput = document.getElementById('notice-image');
    const authorInput = document.getElementById('notice-author');

    imageInput.addEventListener('change', function(e) {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.classList.add('max-w-full', 'h-auto', 'rounded-md', 'my-2');
                editor.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    if (noticeId) {
        const noticeRef = ref(database, `notice/${noticeId}`);
        get(noticeRef).then((snapshot) => {
            const post = snapshot.val();
            document.getElementById('notice-title').value = post.title;
            authorInput.value = post.author || '관리자';
            editor.innerHTML = post.content;
        });
        form.onsubmit = (e) => updateNoticePost(e, noticeId);
    } else {
        form.onsubmit = submitNoticePost;
    }
}

async function submitNoticePost(e) {
    e.preventDefault();
    const title = document.getElementById('notice-title').value;
    const author = document.getElementById('notice-author').value;
    const content = document.getElementById('notice-editor').innerHTML;
    const date = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/ /g, '-').slice(0, -1);

    if (!title || !author || !content) {
        await showCustomModal('모든 필드를 채워주세요.');
        return;
    }

    const post = { title, author, content, date };
    const noticeRef = ref(database, 'notice');
    try {
        await push(noticeRef, post);
        await showCustomModal('공지사항이 등록되었습니다.');
        loadNotice();
        loadSidebarPosts(); // 공지사항 등록 시 사이드바 업데이트
    } catch (error) {
        console.error("Error adding notice: ", error);
        await showCustomModal('공지사항 등록 중 오류가 발생했습니다.');
    }
}

async function editNoticePost(noticeId) {
    const password = await showCustomPrompt("관리자 비밀번호를 입력하세요:");
    if (password === "1234") { // 실제 구현시 보안을 강화해야 합니다
        openNoticeForm(noticeId);
    } else if (password !== null) {
        await showCustomModal("비밀번호가 올바르지 않습니다.");
    }
}

async function updateNoticePost(e, noticeId) {
    e.preventDefault();
    const title = document.getElementById('notice-title').value;
    const author = document.getElementById('notice-author').value;
    const content = document.getElementById('notice-editor').innerHTML;

    if (!title || !author || !content) {
        await showCustomModal('모든 필드를 채워주세요.');
        return;
    }

    const post = { title, author, content };
    const noticeRef = ref(database, `notice/${noticeId}`);
    try {
        await update(noticeRef, post);
        await showCustomModal('공지사항이 수정되었습니다.');
        loadNotice();
        loadSidebarPosts(); // 공지사항 수정 시 사이드바 업데이트
    } catch (error) {
        console.error("Error updating notice: ", error);
        await showCustomModal('공지사항 수정 중 오류가 발생했습니다.');
    }
}

async function deleteNoticePost(noticeId) {
    const confirmed = await showCustomModal('정말로 이 공지사항을 삭제하시겠습니까?', 'confirm');
    if (confirmed) {
        const password = await showCustomPrompt("관리자 비밀번호를 입력하세요:");
        if (password === "1234") { // 관리자 비밀번호 확인
            const noticeRef = ref(database, `notice/${noticeId}`);
            try {
                await remove(noticeRef);
                await showCustomModal('공지사항이 삭제되었습니다.');
                loadNotice();
                loadSidebarPosts(); // 공지사항 삭제 시 사이드바 업데이트
            } catch (error) {
                console.error("Error removing notice: ", error);
                await showCustomModal('공지사항 삭제 중 오류가 발생했습니다.');
            }
        } else if (password !== null) {
            await showCustomModal("비밀번호가 올바르지 않습니다.");
        }
    }
}

// --- 사이드바 관련 함수 ---

function loadSidebarPosts() {
    // 최신 블로그 글 (가장 최근 5개)
    const postsRef = ref(database, 'posts');
    onValue(postsRef, (snapshot) => {
        const posts = [];
        snapshot.forEach((childSnapshot) => {
            posts.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        const latestPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        displaySidebarPosts(latestPosts, 'latest-posts-sidebar', 'blog');
    });

    // 인기 블로그 글 (임시: 현재는 최신 글과 동일하게 처리. 실제 인기글 로직 필요)
    const popularPostsRef = ref(database, 'posts'); // 인기글은 조회수나 추천수 등 실제 로직 필요
    onValue(popularPostsRef, (snapshot) => {
        const posts = [];
        snapshot.forEach((childSnapshot) => {
            posts.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        const popularPosts = posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5); // 임시
        displaySidebarPosts(popularPosts, 'popular-posts-sidebar', 'blog');
    });

    // 최신 공지 (가장 최근 2개)
    const noticesRef = ref(database, 'notice');
    onValue(noticesRef, (snapshot) => {
        const notices = [];
        snapshot.forEach((childSnapshot) => {
            notices.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        const latestNotices = notices.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2);
        displaySidebarPosts(latestNotices, 'latest-notices-sidebar', 'notice');
    });
}

function displaySidebarPosts(posts, elementId, type) {
    const sidebarElement = document.getElementById(elementId);
    sidebarElement.innerHTML = '';

    if (posts.length === 0) {
        let message = '';
        if (elementId === 'popular-posts-sidebar') message = '인기글';
        else if (elementId === 'latest-posts-sidebar') message = '최신 글';
        else if (elementId === 'latest-notices-sidebar') message = '최신 공지';
        sidebarElement.innerHTML = `<li class="text-gray-700">아직 ${message}이 없습니다.</li>`;
    } else {
        posts.forEach(post => {
            const listItem = document.createElement('li');
            listItem.className = 'pb-2 border-b border-gray-100 last:border-b-0 last:pb-0';
            // 클릭 시 해당 상세 보기 함수 호출
            let clickHandler = '';
            if (type === 'blog') {
                clickHandler = `showBlogPostDetail('${post.id}')`;
            } else if (type === 'notice') {
                clickHandler = `showNoticeDetail('${post.id}')`;
            }

            listItem.innerHTML = `
                <a href="#" onclick="${clickHandler}" class="text-gray-700 hover:underline text-base font-medium block">
                    ${post.title}
                </a>
                <span class="block text-gray-500 text-sm mt-1">${post.date}</span>
            `;
            sidebarElement.appendChild(listItem);
        });
    }
}


// --- 검색 기능 공통 함수 ---
function searchPosts(searchTerm, type) {
    if (type === 'blog') {
        const container = document.getElementById('blog-posts-container');
        loadBlogPosts(container, searchTerm);
    } else if (type === 'qa') {
        const container = document.getElementById('qa-list');
        loadQAPosts(searchTerm);
    } else if (type === 'notice') {
        const container = document.getElementById('notice-list');
        loadNoticePosts(searchTerm);
    }
}

// --- 날씨 정보 가져오기 ---
async function fetchWeather() {
    const weatherDataElement = document.getElementById('weather-data');
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
        weatherDataElement.innerHTML = '<p class="text-red-500">날씨 API 키를 설정해주세요.</p>';
        return;
    }

    // 서울의 위도, 경도
    const lat = 37.5665;
    const lon = 126.9780;
    const url = `${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`; // 섭씨, 한국어

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`날씨 정보를 가져오는데 실패했습니다: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Weather Data:", data); // 데이터 확인

        const weatherDescription = data.weather[0].description;
        const temp = data.main.temp;
        const feelsLike = data.main.feels_like;
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const cityName = data.name;

        weatherDataElement.innerHTML = `
            <h4 class="text-xl font-semibold mb-2">${cityName}</h4>
            <img src="${iconUrl}" alt="${weatherDescription}" class="mx-auto w-20 h-20">
            <p class="text-3xl font-bold">${temp}°C</p>
            <p class="text-lg">체감온도: ${feelsLike}°C</p>
            <p class="text-base mt-2">${weatherDescription}</p>
        `;
    } catch (error) {
        console.error("날씨 정보를 가져오는 중 오류 발생:", error);
        weatherDataElement.innerHTML = '<p class="text-red-500">날씨 정보를 가져올 수 없습니다.</p>';
    }
}


// --- 전역 스코프에 함수 노출 (직접 호출하는 경우) ---
window.checkPasswordForBlogPost = checkPasswordForBlogPost;
window.openBlogPostForm = openBlogPostForm;
window.editBlogPost = editBlogPost;
window.deleteBlogPost = deleteBlogPost;
window.showBlogPostDetail = showBlogPostDetail;

window.checkPasswordForQAManagement = checkPasswordForQAManagement;
window.manageQA = manageQA;
window.editQAPost = editQAPost;
window.deleteQAPost = deleteQAPost;
window.togglePassword = togglePassword;
window.openQAForm = openQAForm;

window.checkPasswordForNotice = checkPasswordForNotice;
window.openNoticeForm = openNoticeForm;
window.editNoticePost = editNoticePost;
window.deleteNoticePost = deleteNoticePost;
window.showNoticeDetail = showNoticeDetail;
