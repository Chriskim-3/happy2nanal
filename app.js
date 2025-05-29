import { database } from './firebaseConfig.js';
import { ref, push, onValue, remove, update, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

document.addEventListener('DOMContentLoaded', function() {
    const scrollUpButton = document.getElementById('scrollUp');
    const scrollDownButton = document.getElementById('scrollDown');
    const footer = document.getElementById('footer');

    scrollUpButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    scrollDownButton.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

    loadHome();
    loadSidebarPosts(); // 사이드바 포스트 로드

    document.querySelector('nav').addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const page = e.target.getAttribute('href').slice(1);
            loadPage(page);
        }
    });

    // Footer visibility
    window.addEventListener('scroll', function() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - footer.offsetHeight) {
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

// 커스텀 모달 함수
function showCustomModal(message, type = 'alert', callback = null) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    modalContainer.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <p class="text-lg text-gray-800 mb-6">${message}</p>
            <div class="flex justify-end space-x-4">
                ${type === 'confirm' ? `
                    <button id="modal-cancel" class="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">취소</button>
                    <button id="modal-ok" class="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">확인</button>
                ` : `
                    <button id="modal-ok" class="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">확인</button>
                `}
            </div>
        </div>
    `;
    document.body.appendChild(modalContainer);

    return new Promise((resolve) => {
        const okButton = modalContainer.querySelector('#modal-ok');
        const cancelButton = modalContainer.querySelector('#modal-cancel');

        okButton.addEventListener('click', () => {
            modalContainer.remove();
            resolve(true);
            if (callback) callback(true);
        });

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                modalContainer.remove();
                resolve(false);
                if (callback) callback(false);
            });
        }
    });
}

// 커스텀 프롬프트 함수
function showCustomPrompt(message, callback) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    modalContainer.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <p class="text-lg text-gray-800 mb-4">${message}</p>
            <input type="password" id="prompt-input" class="w-full p-3 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <div class="flex justify-end space-x-4">
                <button id="prompt-cancel" class="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">취소</button>
                <button id="prompt-ok" class="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">확인</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalContainer);

    const promptInput = modalContainer.querySelector('#prompt-input');
    const okButton = modalContainer.querySelector('#prompt-ok');
    const cancelButton = modalContainer.querySelector('#prompt-cancel');

    promptInput.focus();

    okButton.addEventListener('click', () => {
        modalContainer.remove();
        callback(promptInput.value);
    });

    cancelButton.addEventListener('click', () => {
        modalContainer.remove();
        callback(null);
    });

    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            okButton.click();
        }
    });
}


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
    mainContent.innerHTML = '<h1 class="text-3xl font-bold text-gray-800 mb-6">최근 블로그 포스트</h1><hr class="my-6 border-gray-200">';
    loadBlogPosts(mainContent);
}

function loadBlog() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="flex justify-between items-center mb-6 blog-header">
            <h1 class="text-3xl font-bold text-gray-800">BLOG</h1>
            <button onclick="checkPasswordForBlogPost()" class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">새 글 작성</button>
        </div>
        <hr class="my-6 border-gray-200">
        <div id="blog-posts-container" class="space-y-8"></div>
    `;
    loadBlogPosts(document.getElementById('blog-posts-container'));
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
    container.innerHTML = ''; // 기존 내용을 지우고 다시 그립니다.
    if (posts.length === 0) {
        container.innerHTML += '<p class="text-gray-600 text-center py-10">아직 작성된 블로그 포스트가 없습니다.</p>';
    } else {
        posts.forEach(post => {
            container.innerHTML += `
                <div class="blog-post bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h2 class="text-2xl font-semibold text-gray-800 mb-2">${post.title}</h2>
                    <div class="meta-info flex justify-between items-center text-gray-500 text-sm mb-4">
                        <span class="author font-medium text-gray-700">작성자: ${post.author || '익명'}</span>
                        <span class="date">${post.date}</span>
                    </div>
                    <div class="blog-content text-gray-700 leading-relaxed mb-6">${post.content}</div>
                    <div class="flex justify-end actions">
                        <button onclick="editBlogPost('${post.id}')" class="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">수정</button>
                    </div>
                </div>
            `;
        });
    }
}

function loadQA() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="flex justify-between items-center mb-6 qa-header">
            <h1 class="text-3xl font-bold text-gray-800">Q&A</h1>
            <div class="flex space-x-3">
                <button onclick="openQAForm()" class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">새 질문</button>
                <button onclick="checkPasswordForQAManagement()" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">관리</button>
            </div>
        </div>
        <hr class="my-6 border-gray-200">
        <div id="qa-list" class="space-y-8"></div>
    `;
    loadQAPosts();
}

function loadQAPosts() {
    const qaListElement = document.getElementById('qa-list');
    const qaRef = ref(database, 'qa');
    onValue(qaRef, (snapshot) => {
        qaListElement.innerHTML = '';
        if (!snapshot.exists()) {
            qaListElement.innerHTML = '<p class="text-gray-600 text-center py-10">아직 작성된 Q&A가 없습니다.</p>';
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const qaPost = childSnapshot.val();
            qaListElement.innerHTML += `
                <div class="qa-post bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 class="text-2xl font-semibold text-gray-800 mb-2">${qaPost.title}</h3>
                    <div class="meta-info flex justify-between items-center text-gray-500 text-sm mb-4">
                        <span class="author font-medium text-gray-700">작성자: ${qaPost.nickname}</span>
                        <span class="date">${qaPost.date}</span>
                    </div>
                    <p class="text-gray-700 leading-relaxed mb-6">${qaPost.content}</p>
                    <div class="flex justify-end space-x-3 actions">
                        <button onclick="editQAPost('${childSnapshot.key}')" class="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">수정</button>
                        <button onclick="deleteQAPost('${childSnapshot.key}')" class="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">삭제</button>
                    </div>
                </div>
            `;
        });
    });
}

async function checkPasswordForQAManagement() {
    showCustomPrompt("관리자 비밀번호를 입력하세요:", async (password) => {
        if (password === "1234") { // 실제 구현시 보안을 강화해야 합니다
            manageQA();
        } else if (password !== null) { // 취소 버튼이 아닌 경우에만 메시지 표시
            await showCustomModal("비밀번호가 올바르지 않습니다.");
        }
    });
}

function manageQA() {
    const qaListElement = document.getElementById('qa-list');
    const qaRef = ref(database, 'qa');
    onValue(qaRef, (snapshot) => {
        qaListElement.innerHTML = '';
        if (!snapshot.exists()) {
            qaListElement.innerHTML = '<p class="text-gray-600 text-center py-10">아직 작성된 Q&A가 없습니다.</p>';
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const qaPost = childSnapshot.val();
            qaListElement.innerHTML += `
                <div class="qa-post bg-white p-8 rounded-xl shadow-md">
                    <h3 class="text-2xl font-semibold text-gray-800 mb-2">${qaPost.title}</h3>
                    <div class="meta-info flex justify-between items-center text-gray-500 text-sm mb-4">
                        <span class="author font-medium text-gray-700">작성자: ${qaPost.nickname}</span>
                        <span class="date">${qaPost.date}</span>
                    </div>
                    <p class="text-gray-700 leading-relaxed mb-6">비밀번호: <span class="password hidden">${qaPost.password}</span></p>
                    <div class="flex justify-end space-x-3 actions">
                        <button onclick="togglePassword(this)" class="px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">비밀번호 보기</button>
                        <button onclick="editQAPost('${childSnapshot.key}')" class="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">수정</button>
                        <button onclick="deleteQAPost('${childSnapshot.key}')" class="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">삭제</button>
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

async function checkPasswordForBlogPost() {
    showCustomPrompt("비밀번호를 입력하세요:", async (password) => {
        if (password === "1234") { // 실제 구현시 보안을 강화해야 합니다
            openBlogPostForm();
        } else if (password !== null) {
            await showCustomModal("비밀번호가 올바르지 않습니다.");
        }
    });
}

function openBlogPostForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    const formTitle = postId ? '블로그 글 수정' : '새 블로그 글 작성';
    mainContent.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">${formTitle}</h1>
        <form id="blog-form" class="bg-white p-8 rounded-xl shadow-md">
            <input type="text" id="blog-title" placeholder="제목" required class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <input type="text" id="blog-author" placeholder="작성자 닉네임" required class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <div id="blog-editor" contenteditable="true" class="w-full min-h-[300px] p-3 border border-gray-300 rounded-md mb-4 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"></div>
            <input type="file" id="blog-image" accept="image/*" multiple class="w-full p-3 border border-gray-300 rounded-md mb-6 bg-gray-50">
            <div class="flex justify-end space-x-3 form-buttons">
                <button type="submit" class="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">${postId ? '수정' : '등록'}</button>
                ${postId ? '<button type="button" onclick="deleteBlogPost(\'' + postId + '\')" class="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors delete-button">삭제</button>' : ''}
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
        // 기존 포스트 데이터 불러오기
        const postRef = ref(database, `posts/${postId}`);
        get(postRef).then((snapshot) => {
            const post = snapshot.val();
            document.getElementById('blog-title').value = post.title;
            authorInput.value = post.author || ''; // 작성자 정보 로드
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
    const author = document.getElementById('blog-author').value; // 작성자 정보 가져오기
    const content = document.getElementById('blog-editor').innerHTML;
    const date = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/ /g, '-').slice(0, -1); //YYYY-MM-DD 형식

    if (!title || !author || !content) {
        await showCustomModal('모든 필드를 채워주세요.');
        return;
    }

    const post = { title, author, content, date }; // author 추가
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
    showCustomPrompt("비밀번호를 입력하세요:", async (password) => {
        if (password === "1234") { // 실제 구현시 보안을 강화해야 합니다
            openBlogPostForm(postId);
        } else if (password !== null) {
            await showCustomModal("비밀번호가 올바르지 않습니다.");
        }
    });
}

async function updateBlogPost(e, postId) {
    e.preventDefault();
    const title = document.getElementById('blog-title').value;
    const author = document.getElementById('blog-author').value; // 작성자 정보 가져오기
    const content = document.getElementById('blog-editor').innerHTML;

    if (!title || !author || !content) {
        await showCustomModal('모든 필드를 채워주세요.');
        return;
    }

    const post = { title, author, content }; // author 추가
    saveUpdatedBlogPost(postId, post);
}

async function saveUpdatedBlogPost(postId, post) {
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
        const postRef = ref(database, `posts/${postId}`);
        try {
            await remove(postRef);
            await showCustomModal('블로그 글이 삭제되었습니다.');
            loadBlog();
        } catch (error) {
            console.error("Error removing post: ", error);
            await showCustomModal('글 삭제 중 오류가 발생했습니다.');
        }
    }
}

function openQAForm(postId = null) {
    const mainContent = document.getElementById('main-content');
    const formTitle = postId ? 'Q&A 수정' : '새 Q&A 작성';
    mainContent.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">${formTitle}</h1>
        <form id="qa-form" class="bg-white p-8 rounded-xl shadow-md">
            <input type="text" id="qa-title" placeholder="제목" required class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <textarea id="qa-content" placeholder="내용" required class="w-full min-h-[150px] p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
            <input type="text" id="qa-nickname" placeholder="닉네임" required class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <input type="password" id="qa-password" placeholder="비밀번호" required class="w-full p-3 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <div class="flex justify-end space-x-3 form-buttons">
                <button type="submit" class="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">${postId ? '수정' : '등록'}</button>
                ${postId ? '<button type="button" onclick="deleteQAPost(\'' + postId + '\')" class="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors delete-button">삭제</button>' : ''}
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

async function submitQAPost(e) {
    e.preventDefault();
    const title = document.getElementById('qa-title').value;
    const content = document.getElementById('qa-content').value;
    const nickname = document.getElementById('qa-nickname').value;
    const password = document.getElementById('qa-password').value;
    const date = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/ /g, '-').slice(0, -1); //YYYY-MM-DD 형식

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
    showCustomPrompt("비밀번호를 입력하세요:", async (password) => {
        if (password === null) return; // 취소 버튼 클릭 시
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
    });
}

async function updateQAPost(e, postId) {
    e.preventDefault();
    const title = document.getElementById('qa-title').value;
    const content = document.getElementById('qa-content').value;
    const nickname = document.getElementById('qa-nickname').value;
    const password = document.getElementById('qa-password').value;

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
        const qaRef = ref(database, `qa/${postId}`);
        try {
            await remove(qaRef);
            await showCustomModal('Q&A가 삭제되었습니다.');
            loadQA();
        } catch (error) {
            console.error("Error removing Q&A: ", error);
            await showCustomModal('Q&A 삭제 중 오류가 발생했습니다.');
        }
    }
}

// 사이드바 포스트 로드 함수
function loadSidebarPosts() {
    const postsRef = ref(database, 'posts');
    onValue(postsRef, (snapshot) => {
        const posts = [];
        snapshot.forEach((childSnapshot) => {
            posts.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        // 최신 글 (가장 최근 5개)
        const latestPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        displaySidebarPosts(latestPosts, 'latest-posts-sidebar');

        // 인기 글 (임시: 현재는 최신 글과 동일하게 처리. 실제 인기글 로직 필요)
        // 실제 인기글은 조회수, 좋아요 수 등을 기반으로 해야 합니다.
        const popularPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5); // 임시
        displaySidebarPosts(popularPosts, 'popular-posts-sidebar');
    });
}

function displaySidebarPosts(posts, elementId) {
    const sidebarElement = document.getElementById(elementId);
    sidebarElement.innerHTML = ''; // 기존 내용 삭제

    if (posts.length === 0) {
        sidebarElement.innerHTML = `<li class="text-gray-700">아직 ${elementId === 'popular-posts-sidebar' ? '인기글' : '최신 글'}이 없습니다.</li>`;
    } else {
        posts.forEach(post => {
            const listItem = document.createElement('li');
            listItem.className = 'pb-2 border-b border-gray-100 last:border-b-0 last:pb-0'; // 각 항목 하단에 구분선
            listItem.innerHTML = `
                <a href="#blog" onclick="loadBlogPostDetail('${post.id}')" class="text-blue-600 hover:underline text-base font-medium block">
                    ${post.title}
                </a>
                <span class="block text-gray-500 text-sm mt-1">${post.date}</span>
            `;
            sidebarElement.appendChild(listItem);
        });
    }
}

// 사이드바에서 블로그 글 클릭 시 해당 글로 이동하는 함수 (현재는 loadBlog()로 이동)
function loadBlogPostDetail(postId) {
    // 실제로는 해당 postId에 해당하는 블로그 글 상세 페이지를 로드해야 합니다.
    // 여기서는 간단히 블로그 목록 페이지로 이동하고, 사용자가 직접 해당 글을 찾도록 합니다.
    // 더 나은 사용자 경험을 위해서는 상세 페이지 구현이 필요합니다.
    loadPage('blog');
    // TODO: postId를 기반으로 특정 블로그 포스트를 스크롤하거나 강조하는 로직 추가
}


// 전역 스코프에 함수들을 노출 (HTML에서 직접 호출하기 위함)
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
window.loadBlogPostDetail = loadBlogPostDetail; // 사이드바 링크를 위해 추가
