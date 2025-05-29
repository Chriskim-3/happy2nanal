import { database } from './firebaseConfig.js';
import { ref, push, onValue, remove, update, get, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
// Firebase Storage 모듈 추가
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';
import { app } from './firebaseConfig.js'; // Firebase app 인스턴스 가져오기 (storage 초기화용)

const storage = getStorage(app); // Firebase Storage 초기화

let quillBlog, quillQA, quillNotice; // Quill 인스턴스 전역 변수로 선언
let currentBlogViewMode = 'list'; // 블로그 초기 보기 모드

// 비밀번호 변수 (실제 서비스에서는 보안 강화 필요)
const ADMIN_PASSWORD = '111'; // 예시 비밀번호

// 캐러셀 이미지 및 텍스트 데이터
const carouselData = [
    {
        image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        title: 'Happy2Nanal',
        subtitle: '당신의 칼퇴를 응원합니다'
    },
    {
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        title: '생산성 향상을 위한 최고의 팁',
        subtitle: '똑똑하게 일하고 현명하게 퇴근하세요'
    },
    {
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0c766d10?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        title: '커뮤니티와 함께 성장하기',
        subtitle: '질문하고, 답변하고, 지식을 공유하세요'
    }
];
let currentSlideIndex = 0;
let carouselInterval;

document.addEventListener('DOMContentLoaded', function() {
    const scrollUpButton = document.getElementById('scrollUp');
    const scrollDownButton = document.getElementById('scrollDown');
    const footer = document.getElementById('footer');
    const navItems = document.querySelectorAll('.nav-item');

    // 스크롤 버튼 이벤트 리스너
    scrollUpButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    scrollDownButton.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

    // 초기 페이지 로드 (home)
    const initialPage = window.location.hash ? window.location.hash.slice(1) : 'home';
    loadPage(initialPage);
    loadSidebarPosts(); // 사이드바 포스트 로드

    // 네비게이션 클릭 이벤트
    document.querySelector('nav').addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.classList.contains('nav-item')) {
            e.preventDefault();
            navItems.forEach(item => item.classList.remove('active'));
            e.target.classList.add('active');
            const page = e.target.getAttribute('href').slice(1);
            loadPage(page);
        } else if (e.target.tagName === 'A' && e.target.classList.contains('logo-text')) { // 로고 클릭 시 home으로 이동
            e.preventDefault();
            navItems.forEach(item => item.classList.remove('active'));
            document.querySelector('.nav-item[href="#home"]').classList.add('active');
            loadPage('home');
        }
    });

    // 푸터 가시성
    window.addEventListener('scroll', function() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - footer.offsetHeight - 50) { // 여백 조정
            footer.style.display = 'block';
        } else {
            footer.style.display = 'none';
        }
    });

    // 뒤로가기/앞으로가기 버튼 처리
    window.addEventListener('popstate', function(event) {
        const page = event.state ? event.state.page : 'home';
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
        document.querySelector('.nav-item[href="#home"]').classList.add('active');
    }
});

function loadPage(page) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // 기존 내용 지우기

    // 모든 사이드바 섹션을 숨김
    document.querySelectorAll('.sidebar-section').forEach(section => section.classList.add('hidden'));

    // 보기 방식 토글 그룹 숨김 (블로그 페이지가 아니면)
    const blogViewToggleGroup = document.getElementById('blog-view-toggle-group');
    if (blogViewToggleGroup) { // 요소가 없을 수 있으므로 확인
        blogViewToggleGroup.classList.add('hidden');
    }

    // 캐러셀 자동 재생 정지 (홈 페이지가 아닐 때)
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }


    switch (page) {
        case 'home':
            mainContent.innerHTML = `
                <section class="home-section">
                    <div class="carousel-container">
                        </div>
                    <div class="welcome-text">
                        <h2 class="text-4xl font-bold text-gray-800 mb-6">Happy2Nanal과 함께하는 스마트한 직장 생활</h2>
                        <p class="text-lg text-gray-700 leading-relaxed mb-8">
                            업무 효율을 극대화하고 워라밸을 지키는 비법을 공유합니다.
                            함께 배우고 성장하며 '칼퇴'의 꿈을 이루세요!
                        </p>
                    </div>
                    <div class="home-cta">
                        <button class="create-post-button" onclick="loadPage('blog')">블로그 최신 글 보러가기</button>
                        <button class="create-post-button" onclick="loadPage('qa')">궁금한 점 질문하기</button>
                    </div>
                </section>
            `;
            // 홈에서는 특별히 사이드바를 표시하지 않음
            setupCarousel(); // 캐러셀 설정 및 시작
            break;
        case 'blog':
            mainContent.innerHTML = `
                <div class="blog-header">
                    <h2 class="section-title">BLOG</h2>
                    <div class="blog-view-toggle-group" id="blog-view-toggle-group">
                        <button id="nav-list-view-btn">리스트 보기</button>
                        <button id="nav-tile-view-btn">타일 보기</button>
                    </div>
                    <button id="create-blog-post-btn" class="create-post-button">글 작성</button>
                </div>
                <div id="blog-posts-container" class="py-4"></div>
            `;
            document.getElementById('create-blog-post-btn').addEventListener('click', openBlogPostForm);

            // 보기 방식 토글 버튼 이벤트 리스너 재등록 (요소 재생성으로 인해)
            document.getElementById('nav-list-view-btn').addEventListener('click', () => {
                currentBlogViewMode = 'list';
                document.getElementById('nav-list-view-btn').classList.add('active');
                document.getElementById('nav-tile-view-btn').classList.remove('active');
                loadBlogPosts();
            });

            document.getElementById('nav-tile-view-btn').addEventListener('click', () => {
                currentBlogViewMode = 'tile';
                document.getElementById('nav-tile-view-btn').classList.add('active');
                document.getElementById('nav-list-view-btn').classList.remove('active');
                loadBlogPosts();
            });

            // 현재 보기 모드에 따라 버튼 활성화
            if (currentBlogViewMode === 'list') {
                document.getElementById('nav-list-view-btn').classList.add('active');
            } else {
                document.getElementById('nav-tile-view-btn').classList.add('active');
            }

            loadBlogPosts();
            document.querySelector('.sidebar-section.blog-section').classList.remove('hidden'); // 사이드바 활성화
            blogViewToggleGroup && blogViewToggleGroup.classList.remove('hidden'); // 보기 방식 토글 표시
            break;
        case 'qa':
            mainContent.innerHTML = `
                <div class="qa-header">
                    <h2 class="section-title">Q&A</h2>
                    <button id="create-qa-post-btn" class="create-post-button">질문 작성</button>
                </div>
                <div id="qa-posts-container" class="py-4"></div>
            `;
            document.getElementById('create-qa-post-btn').addEventListener('click', openQAPostForm);
            loadQA();
            document.querySelector('.sidebar-section.qa-section').classList.remove('hidden'); // 사이드바 활성화
            break;
        case 'notice':
            mainContent.innerHTML = `
                <div class="notice-header">
                    <h2 class="section-title">공지사항</h2>
                    <button id="create-notice-post-btn" class="create-post-button">공지 작성</button>
                </div>
                <div id="notice-posts-container" class="py-4"></div>
            `;
            document.getElementById('create-notice-post-btn').addEventListener('click', openNoticePostForm);
            loadNotice();
            document.querySelector('.sidebar-section.notice-section').classList.remove('hidden'); // 사이드바 활성화
            break;
        default:
            loadPage('home'); // 존재하지 않는 페이지는 홈으로 리다이렉트
            history.replaceState({ page: 'home' }, '', '#home');
            break;
    }
    if (window.location.hash !== `#${page}`) {
        history.pushState({ page: page }, '', `#${page}`);
    }
}

// =====================================
// Home Page Carousel Functions
// =====================================
function setupCarousel() {
    const carouselContainer = document.querySelector('.carousel-container');
    if (!carouselContainer) return; // 캐러셀 컨테이너가 없으면 함수 종료

    carouselContainer.innerHTML = ''; // 기존 슬라이드 제거

    carouselData.forEach((data, index) => {
        const slide = document.createElement('div');
        slide.classList.add('carousel-slide');
        if (index === 0) {
            slide.classList.add('active');
        }
        slide.style.backgroundImage = `url('${data.image}')`;
        slide.innerHTML = `
            <div class="carousel-text-overlay">
                <h2>${data.title}</h2>
                <p>${data.subtitle}</p>
            </div>
        `;
        carouselContainer.appendChild(slide);
    });

    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('carousel-dots');
    carouselData.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) {
            dot.classList.add('active');
        }
        dot.dataset.index = index;
        dot.addEventListener('click', () => showSlide(index));
        dotsContainer.appendChild(dot);
    });
    carouselContainer.appendChild(dotsContainer);

    showSlide(currentSlideIndex); // 초기 슬라이드 표시
    startCarouselAutoPlay(); // 자동 재생 시작
}

function showSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');

    if (index >= slides.length) currentSlideIndex = 0;
    if (index < 0) currentSlideIndex = slides.length - 1;

    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    slides[currentSlideIndex].classList.add('active');
    dots[currentSlideIndex].classList.add('active');
}

function nextSlide() {
    currentSlideIndex++;
    if (currentSlideIndex >= carouselData.length) {
        currentSlideIndex = 0;
    }
    showSlide(currentSlideIndex);
}

function startCarouselAutoPlay() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    carouselInterval = setInterval(nextSlide, 5000); // 5초마다 슬라이드 변경
}


// =====================================
// Custom Modal / Prompt Functions (Async/Await)
// =====================================
function showCustomModal({ title, content, buttons = [{ text: '확인', value: 'confirm', className: 'confirm-button' }] }) {
    return new Promise(resolve => {
        const modalContainer = document.getElementById('custom-modal-container');
        modalContainer.innerHTML = '';

        const modal = document.createElement('div');
        modal.classList.add('custom-modal');
        modal.innerHTML = `
            <h3>${title}</h3>
            <p>${content}</p>
            <div class="custom-modal-buttons">
                ${buttons.map(btn => `<button class="${btn.className || 'confirm-button'}" data-value="${btn.value}">${btn.text}</button>`).join('')}
            </div>
            <button class="absolute" data-value="cancel">&times;</button>
        `;

        modalContainer.appendChild(modal);
        modalContainer.classList.remove('hidden');

        modal.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                modalContainer.classList.add('hidden');
                modalContainer.innerHTML = '';
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
        prompt.classList.add('custom-prompt');
        prompt.innerHTML = `
            <h3>${title}</h3>
            <p>${content}</p>
            <input type="${inputType}" placeholder="${placeholder}" id="custom-prompt-input">
            <div class="custom-prompt-buttons">
                <button class="cancel-button">${cancelText}</button>
                <button class="confirm-button">${confirmText}</button>
            </div>
            <button class="absolute" data-value="cancel">&times;</button>
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
// Quill Image Upload Handler
// =====================================
function imageHandler(quillInstance) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        if (file) {
            try {
                const storageReference = storageRef(storage, `images/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageReference, file);
                const downloadURL = await getDownloadURL(snapshot.ref);

                const range = quillInstance.getSelection();
                quillInstance.insertEmbed(range.index, 'image', downloadURL);
            } catch (error) {
                console.error("이미지 업로드 실패: ", error);
                showCustomModal({ title: '오류', content: '이미지 업로드에 실패했습니다.' });
            }
        }
    };
}


// =====================================
// Blog Functions
// =====================================
function loadBlogPosts() {
    const postsRef = ref(database, 'posts');
    onValue(postsRef, (snapshot) => {
        const posts = snapshot.val() || {};
        displayBlogPosts(posts, currentBlogViewMode);
    }, {
        onlyOnce: false
    });
}

function displayBlogPosts(posts, viewMode) {
    const postsContainer = document.getElementById('blog-posts-container');
    postsContainer.innerHTML = '';

    if (Object.keys(posts).length === 0) {
        postsContainer.innerHTML = '<p class="text-gray-600 text-center py-8">아직 블로그 게시글이 없습니다.</p>';
        return;
    }

    postsContainer.className = ''; // 기존 클래스 제거
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
                    <h3 class="post-title">${post.title}</h3>
                    <div class="post-summary">${post.content.replace(/<[^>]*>/g, '').substring(0, 150)}${post.content.replace(/<[^>]*>/g, '').length > 150 ? '...' : ''}</div>
                    <div class="post-meta">
                        <span>${post.author}</span>
                        <span>${post.date}</span>
                        <span>조회수: ${post.views || 0}</span>
                    </div>
                </div>
                <div class="post-management-buttons">
                    <button class="edit-button" onclick="window.showCustomPrompt({
                        title: '비밀번호 확인',
                        content: '게시글을 수정하려면 비밀번호를 입력하세요.',
                        inputType: 'password',
                        placeholder: '비밀번호'
                    }).then(password => window.checkPasswordForManagement('${postId}', password, 'blog', 'edit'))">✏️ 수정</button>
                    <button class="delete-button" onclick="window.showCustomPrompt({
                        title: '비밀번호 확인',
                        content: '게시글을 삭제하려면 비밀번호를 입력하세요.',
                        inputType: 'password',
                        placeholder: '비밀번호'
                    }).then(password => window.checkPasswordForManagement('${postId}', password, 'blog', 'delete'))">🗑️ 삭제</button>
                </div>
            `;
        } else { // tile view
            const imageUrlMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
            const thumbnailUrl = imageUrlMatch ? imageUrlMatch[1] : 'https://via.placeholder.com/400x200/F0F2F5/A0A0A0?text=No+Image'; // 기본 이미지 URL
            const summaryText = post.content.replace(/<[^>]*>/g, '');

            contentHTML = `
                <div class="post-thumbnail">
                    ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="Thumbnail">` : '<span class="text-gray-500">이미지 없음</span>'}
                </div>
                <div class="post-text-content" data-post-id="${postId}" data-post-type="blog">
                    <h3 class="post-title">${post.title}</h3>
                    <div class="post-summary">${summaryText.substring(0, 100)}${summaryText.length > 100 ? '...' : ''}</div>
                    <div class="post-meta">
                        <span>${post.author}</span>
                        <span>${post.date}</span>
                        <span>조회수: ${post.views || 0}</span>
                    </div>
                </div>
                <div class="post-management-buttons">
                    <button class="edit-button" onclick="window.showCustomPrompt({
                        title: '비밀번호 확인',
                        content: '게시글을 수정하려면 비밀번호를 입력하세요.',
                        inputType: 'password',
                        placeholder: '비밀번호'
                    }).then(password => window.checkPasswordForManagement('${postId}', password, 'blog', 'edit'))">✏️ 수정</button>
                    <button class="delete-button" onclick="window.showCustomPrompt({
                        title: '비밀번호 확인',
                        content: '게시글을 삭제하려면 비밀번호를 입력하세요.',
                        inputType: 'password',
                        placeholder: '비밀번호'
                    }).then(password => window.checkPasswordForManagement('${postId}', password, 'blog', 'delete'))">🗑️ 삭제</button>
                </div>
            `;
        }

        postElement.innerHTML = contentHTML;
        postsContainer.appendChild(postElement);

        postElement.querySelector('.post-title').addEventListener('click', () => {
            openBlogPostDetail(postId);
        });
        // 썸네일 클릭 시에도 상세 보기
        if (viewMode === 'tile' && postElement.querySelector('.post-thumbnail')) {
            postElement.querySelector('.post-thumbnail').addEventListener('click', () => {
                openBlogPostDetail(postId);
            });
        }
    });
}

async function openBlogPostForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">${postId ? '블로그 게시글 수정' : '블로그 게시글 작성'}</h2>
        <div class="bg-white p-8 rounded-xl shadow-lg">
            <div class="mb-4">
                <label for="blog-title">제목:</label>
                <input type="text" id="blog-title">
            </div>
            <div class="mb-4">
                <label for="blog-author">작성자:</label>
                <input type="text" id="blog-author">
            </div>
            <div class="mb-4">
                <label for="blog-password">비밀번호:</label>
                <input type="password" id="blog-password">
            </div>
            <div class="mb-6">
                <label for="blog-editor">내용:</label>
                <div id="blog-editor"></div>
            </div>
            <div class="flex items-center justify-between">
                <button id="save-blog-post-btn" class="save-button">저장</button>
                <button id="cancel-blog-post-btn" class="cancel-button">취소</button>
            </div>
        </div>
    `;

    quillBlog = new Quill('#blog-editor', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link', 'image'], // 이미지 버튼 포함
                    [{ 'align': [] }],
                    ['clean']
                ],
                handlers: {
                    image: () => imageHandler(quillBlog) // 이미지 핸들러 연결
                }
            }
        }
    });

    if (postId) {
        const postRef = ref(database, `posts/${postId}`);
        const snapshot = await get(postRef);
        const post = snapshot.val();
        if (post) {
            document.getElementById('blog-title').value = post.title || '';
            document.getElementById('blog-author').value = post.author || '';
            // 비밀번호 필드는 수정 시에도 입력받도록 유지 (값을 채우지 않음)
            if (quillBlog && post.content) {
                // Quill 에디터에 HTML 내용을 Delta 포맷으로 변환하여 로드
                quillBlog.setContents(quillBlog.clipboard.convert(post.content));
            } else {
                quillBlog.setContents([]);
            }
            document.getElementById('save-blog-post-btn').onclick = () => updateBlogPost(postId);
        } else {
            showCustomModal({ title: '오류', content: '수정할 게시글을 찾을 수 없습니다.' });
            loadPage('blog');
            return;
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
    const content = quillBlog.root.innerHTML;

    if (!title || !author || !password || !content || content.trim() === '<p><br></p>' || content.trim() === '') {
        showCustomModal({ title: '오류', content: '모든 필드를 채워주세요.' });
        return;
    }

    const newPostRef = push(ref(database, 'posts'));
    set(newPostRef, {
        title,
        author,
        password,
        content,
        date: new Date().toISOString().slice(0, 10),
        views: 0
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
    const passwordInput = document.getElementById('blog-password').value;
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

async function openBlogPostDetail(postId) {
    const postRef = ref(database, `posts/${postId}`);
    const snapshot = await get(postRef);
    const post = snapshot.val();

    if (post) {
        document.getElementById('modal-blog-title').innerText = post.title;
        document.getElementById('modal-blog-author').innerText = `작성자: ${post.author}`;
        document.getElementById('modal-blog-date').innerText = post.date;
        document.getElementById('modal-blog-content').innerHTML = post.content;

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
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">
                    <span>작성자: ${post.nickname}</span>
                    <span>${post.date}</span>
                </div>
            </div>
            <div class="post-management-buttons">
                <button class="edit-button" onclick="window.showCustomPrompt({
                    title: '비밀번호 확인',
                    content: '게시글을 수정하려면 비밀번호를 입력하세요.',
                    inputType: 'password',
                    placeholder: '비밀번호'
                }).then(password => window.checkPasswordForManagement('${postId}', password, 'qa', 'edit'))">✏️ 수정</button>
                <button class="delete-button" onclick="window.showCustomPrompt({
                    title: '비밀번호 확인',
                    content: '게시글을 삭제하려면 비밀번호를 입력하세요.',
                    inputType: 'password',
                    placeholder: '비밀번호'
                }).then(password => window.checkPasswordForManagement('${postId}', password, 'qa', 'delete'))">🗑️ 삭제</button>
            </div>
        `;
        qaPostsContainer.appendChild(postElement);

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
                <label for="qa-title">제목:</label>
                <input type="text" id="qa-title">
            </div>
            <div class="mb-4">
                <label for="qa-nickname">닉네임:</label>
                <input type="text" id="qa-nickname">
            </div>
            <div class="mb-4">
                <label for="qa-password">비밀번호:</label>
                <input type="password" id="qa-password">
            </div>
            <div class="mb-6">
                <label for="qa-editor">내용:</label>
                <div id="qa-editor"></div>
            </div>
            <div class="flex items-center justify-between">
                <button id="save-qa-post-btn" class="save-button">저장</button>
                <button id="cancel-qa-post-btn" class="cancel-button">취소</button>
            </div>
        </div>
    `;

    quillQA = new Quill('#qa-editor', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link', 'image'],
                    [{ 'align': [] }],
                    ['clean']
                ],
                handlers: {
                    image: () => imageHandler(quillQA)
                }
            }
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
    const passwordInput = document.getElementById('qa-password').value;
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
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">
                    <span>작성자: ${post.author}</span>
                    <span>${post.date}</span>
                </div>
            </div>
            <div class="post-management-buttons">
                <button class="edit-button" onclick="window.showCustomPrompt({
                    title: '비밀번호 확인',
                    content: '게시글을 수정하려면 비밀번호를 입력하세요.',
                    inputType: 'password',
                    placeholder: '비밀번호'
                }).then(password => window.checkPasswordForManagement('${postId}', password, 'notice', 'edit'))">✏️ 수정</button>
                <button class="delete-button" onclick="window.showCustomPrompt({
                    title: '비밀번호 확인',
                    content: '게시글을 삭제하려면 비밀번호를 입력하세요.',
                    inputType: 'password',
                    placeholder: '비밀번호'
                }).then(password => window.checkPasswordForManagement('${postId}', password, 'notice', 'delete'))">🗑️ 삭제</button>
            </div>
        `;
        noticePostsContainer.appendChild(postElement);

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
                <label for="notice-title">제목:</label>
                <input type="text" id="notice-title">
            </div>
            <div class="mb-4">
                <label for="notice-author">작성자:</label>
                <input type="text" id="notice-author">
            </div>
            <div class="mb-4">
                <label for="notice-password">비밀번호:</label>
                <input type="password" id="notice-password">
            </div>
            <div class="mb-6">
                <label for="notice-editor">내용:</label>
                <div id="notice-editor"></div>
            </div>
            <div class="flex items-center justify-between">
                <button id="save-notice-post-btn" class="save-button">저장</button>
                <button id="cancel-notice-post-btn" class="cancel-button">취소</button>
            </div>
        </div>
    `;

    quillNotice = new Quill('#notice-editor', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link', 'image'],
                    [{ 'align': [] }],
                    ['clean']
                ],
                handlers: {
                    image: () => imageHandler(quillNotice)
                }
            }
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
    const passwordInput = document.getElementById('notice-password').value;
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
// Common Password Check Function
// =====================================
async function checkPasswordForManagement(postId, password, type, action) {
    if (password === null) { // '취소'를 눌렀을 때
        return;
    }
    if (!password) {
        showCustomModal({ title: '오류', content: '비밀번호를 입력하세요.' });
        return;
    }

    if (password === ADMIN_PASSWORD) {
        if (type === 'blog') {
            if (action === 'edit') openBlogPostForm(postId);
            else if (action === 'delete') deleteBlogPost(postId);
        } else if (type === 'qa') {
            if (action === 'edit') openQAPostForm(postId);
            else if (action === 'delete') deleteQAPost(postId);
        } else if (type === 'notice') {
            if (action === 'edit') openNoticePostForm(postId);
            else if (action === 'delete') deleteNoticePost(postId);
        }
    } else {
        showCustomModal({ title: '오류', content: '비밀번호가 올바르지 않습니다.' });
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
        if (!latestNoticesContainer) return;
        latestNoticesContainer.innerHTML = '';
        if (Object.keys(notices).length === 0) {
            latestNoticesContainer.innerHTML = '<li class="text-gray-700">최신 공지가 없습니다.</li>';
        } else {
            const sortedNotices = Object.keys(notices).sort((a, b) => new Date(notices[b].date) - new Date(notices[a].date)).slice(0, 5);
            sortedNotices.forEach(postId => {
                latestNoticesContainer.appendChild(createSidebarPostElement(notices[postId], postId, 'notice'));
            });
        }
        // 공지 섹션은 항상 보이도록 hidden 클래스 제거
        document.querySelector('.sidebar-section.notice-section')?.classList.remove('hidden');
    });

    // 인기글 (블로그) 로드 (조회수 기준)
    const blogPostsRef = ref(database, 'posts');
    onValue(blogPostsRef, (snapshot) => {
        const posts = snapshot.val() || {};
        const popularPostsContainer = document.getElementById('popular-posts-sidebar');
        if (!popularPostsContainer) return;
        popularPostsContainer.innerHTML = '';
        if (Object.keys(posts).length === 0) {
            popularPostsContainer.innerHTML = '<li class="text-gray-700">인기글이 없습니다.</li>';
        } else {
            const sortedPosts = Object.keys(posts).sort((a, b) => (posts[b].views || 0) - (posts[a].views || 0)).slice(0, 5);
            sortedPosts.forEach(postId => {
                popularPostsContainer.appendChild(createSidebarPostElement(posts[postId], postId, 'blog'));
            });
        }
         // 블로그 섹션은 항상 보이도록 hidden 클래스 제거
        document.querySelector('.sidebar-section.blog-section')?.classList.remove('hidden');
    });

    // 최신 글 (블로그) 로드 (날짜 기준)
    onValue(blogPostsRef, (snapshot) => {
        const posts = snapshot.val() || {};
        const latestPostsContainer = document.getElementById('latest-posts-sidebar');
        if (!latestPostsContainer) return;
        latestPostsContainer.innerHTML = '';
        if (Object.keys(posts).length === 0) {
            latestPostsContainer.innerHTML = '<li class="text-gray-700">최신 글이 없습니다.</li>';
        } else {
            const sortedPosts = Object.keys(posts).sort((a, b) => new Date(posts[b].date) - new Date(posts[a].date)).slice(0, 5);
            sortedPosts.forEach(postId => {
                latestPostsContainer.appendChild(createSidebarPostElement(posts[postId], postId, 'blog'));
            });
        }
        // 블로그 섹션은 항상 보이도록 hidden 클래스 제거
        document.querySelector('.sidebar-section.blog-section')?.classList.remove('hidden');
    });

     // 최신 Q&A 로드
    const qaRef = ref(database, 'qa');
    onValue(qaRef, (snapshot) => {
        const qaPosts = snapshot.val() || {};
        const latestQAPostsContainer = document.getElementById('latest-qa-sidebar');
        if (!latestQAPostsContainer) return;
        latestQAPostsContainer.innerHTML = '';
        if (Object.keys(qaPosts).length === 0) {
            latestQAPostsContainer.innerHTML = '<li class="text-gray-700">최신 Q&A가 없습니다.</li>';
        } else {
            const sortedQAPosts = Object.keys(qaPosts).sort((a, b) => new Date(qaPosts[b].date) - new Date(qaPosts[a].date)).slice(0, 5);
            sortedQAPosts.forEach(postId => {
                latestQAPostsContainer.appendChild(createSidebarPostElement(qaPosts[postId], postId, 'qa'));
            });
        }
        // Q&A 섹션은 항상 보이도록 hidden 클래스 제거
        document.querySelector('.sidebar-section.qa-section')?.classList.remove('hidden');
    });
}

function createSidebarPostElement(post, postId, type) {
    const li = document.createElement('li');
    // 사이드바 목록에서는 제목만 표시하고 클릭하면 해당 상세 모달을 띄우도록
    li.innerHTML = `
        <a href="javascript:void(0);" onclick="window.open${type.charAt(0).toUpperCase() + type.slice(1)}Detail('${postId}')">${post.title}</a>
    `;
    return li;
}

// 전역 스코프에 함수들을 노출 (HTML에서 직접 호출할 수 있도록)
window.showCustomModal = showCustomModal;
window.showCustomPrompt = showCustomPrompt;
window.checkPasswordForManagement = checkPasswordForManagement; // 통합된 비밀번호 확인 함수
window.openBlogPostForm = openBlogPostForm;
window.deleteBlogPost = deleteBlogPost;
window.openBlogPostDetail = openBlogPostDetail;
window.openQAPostForm = openQAPostForm;
window.deleteQAPost = deleteQAPost;
window.openQADetail = openQADetail;
window.openNoticePostForm = openNoticePostForm;
window.deleteNoticePost = deleteNoticePost;
window.openNoticeDetail = openNoticeDetail;
window.loadPage = loadPage;
