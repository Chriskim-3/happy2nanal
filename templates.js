// 날짜 포맷팅 함수
function formatDate(dateString) {
    if (!dateString) return '날짜 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function showContent(content) {
    let html = `<p>${content}</p>`;
    if (content === '이 홈페이지는 글쓰고, 올리고, 지울려고 만드는 사이트 입니다.') {
        html += '<img src="beach_omg.webp" alt="소개 이미지" class="intro-image">';
    }
    return html;
}

export function showStudyList(topic, studyContents) {
    let listHtml = `<h2 class="study-title">${topic} 학습 내용</h2>`;
    
    listHtml += '<ul id="studyList">';
    studyContents.forEach((item) => {
        listHtml += `
            <li data-action="viewStudyContent" data-key="${item.key}">
                <h3>${item.title}</h3>
                <div class="date-display">${formatDate(item.date)}</div>
            </li>`;
    });
    listHtml += '</ul>';

    listHtml += `
        <div class="search-container">
            <input type="text" id="studySearchInput" placeholder="검색...">
            <button data-action="searchStudy" data-topic="${topic}">검색</button>
        </div>
        <div class="button-container">
            <button data-action="showStudyForm" data-topic="${topic}">글쓰기</button>
        </div>
    `;

    return listHtml;
}

export function showStudyForm(topic) {
    return `
        <h3>${topic} 내용 추가</h3>
        <input type="text" id="studyTitle" placeholder="제목을 입력하세요">
        <textarea id="studyContent" placeholder="내용을 입력하세요..."></textarea>
        <input type="hidden" id="studyTopic" value="${topic}">
        <div class="button-container">
            <button data-action="saveStudyContent" data-topic="${topic}">저장</button>
        </div>
    `;
}

export function viewStudyContent(item, key) {
    return `
        <h2>${item.title}</h2>
        <div class="date-display">${formatDate(item.date)}</div>
        <div>${item.content}</div>
        <div class="button-container">
            <button data-action="editStudyContent" data-key="${key}">수정</button>
            <button data-action="deleteStudyContent" data-key="${key}">삭제</button>
            <button data-action="showStudyList" data-topic="${item.topic}">목록으로</button>
        </div>
    `;
}

export function editStudyContent(item, key) {
    return `
        <h3>학습 내용 수정</h3>
        <input type="text" id="studyTitle" value="${item.title}">
        <textarea id="studyContent">${item.content}</textarea>
        <input type="hidden" id="studyTopic" value="${item.topic}">
        <div class="button-container">
            <button data-action="updateStudyContent" data-key="${key}">업데이트</button>
            <button data-action="showStudyList" data-topic="${item.topic}">취소</button>
        </div>
    `;
}

export function showQnAList(posts) {
    let listHtml = '<h3>Q&A 목록</h3><ul id="postList">';
    for (let key in posts) {
        listHtml += `<li data-action="viewPost" data-key="${key}">${posts[key].title}</li>`;
    }
    listHtml += '</ul>';
    listHtml += '<div class="button-container"><button data-action="showQnAForm">글쓰기</button></div>';
    return listHtml;
}

export function showQnAForm() {
    return `
        <h3>Q&A 글쓰기</h3>
        <input type="text" id="postTitle" placeholder="제목을 입력하세요">
        <textarea id="editor" placeholder="여기에 글을 작성하세요..."></textarea>
        <div class="button-container">
            <button data-action="savePost">저장</button>
        </div>
    `;
}

export function viewPost(post, key) {
    return `
        <h3>${post.title}</h3>
        <div class="date-display">${formatDate(post.date)}</div>
        <p>${post.content}</p>
        <div class="button-container">
            <button data-action="editPost" data-key="${key}">수정</button>
            <button data-action="deletePost" data-key="${key}">삭제</button>
            <button data-action="showQnAList">목록으로</button>
        </div>
    `;
}

export function editPost(post, key) {
    return `
        <h3>게시글 수정</h3>
        <input type="text" id="editTitle" value="${post.title}">
        <textarea id="editEditor">${post.content}</textarea>
        <div class="button-container">
            <button data-action="updatePost" data-key="${key}">업데이트</button>
            <button data-action="showQnAList">취소</button>
        </div>
    `;
}

export function showNoticeList(notices) {
    let listHtml = '<h3>공지사항</h3><ul id="noticeList">';
    for (let key in notices) {
        listHtml += `<li data-action="viewNotice" data-key="${key}">${notices[key].title}</li>`;
    }
    listHtml += '</ul>';
    listHtml += `
        <div class="search-container">
            <input type="text" id="noticeSearchInput" placeholder="검색...">
            <button data-action="searchNotice">검색</button>
        </div>
        <div class="button-container">
            <button data-action="showNoticeForm">공지사항 작성</button>
        </div>
    `;
    return listHtml;
}

export function showNoticeForm() {
    return `
        <h3>공지사항 작성</h3>
        <input type="text" id="noticeTitle" placeholder="제목을 입력하세요">
        <textarea id="noticeContent" placeholder="내용을 입력하세요..."></textarea>
        <div class="button-container">
            <button data-action="saveNotice">저장</button>
        </div>
    `;
}

export function showFileUpload(files) {
    let listHtml = `
        <h3>자료실</h3>
        <div class="button-container">
            <button data-action="showFileUploadForm">파일 업로드</button>
        </div>
        <h3>업로드된 파일 목록</h3>
        <ul id="fileList">
    `;
    for (let key in files) {
        listHtml += `<li data-action="viewFile" data-key="${key}">${files[key].title}</li>`;
    }
    listHtml += '</ul>';
    return listHtml;
}

export function showFileUploadForm() {
    return `
        <h3>파일 업로드</h3>
        <input type="text" id="fileTitle" placeholder="제목을 입력하세요">
        <textarea id="fileContent" placeholder="내용을 입력하세요..."></textarea>
        <input type="file" id="fileInput">
        <div class="button-container">
            <button data-action="uploadFile">업로드</button>
        </div>
    `;
}

export function viewFile(file, key) {
    return `
        <h3>${file.title}</h3>
        <div class="date-display">${formatDate(file.date)}</div>
        <div class="file-download">
            <a href="#" data-action="downloadFile" data-filename="${file.fileName}">파일 다운로드</a>
        </div>
        <p>${file.content}</p>
        <div class="button-container">
            <button data-action="deleteFile" data-key="${key}">삭제</button>
            <button data-action="showFileUpload">목록으로</button>
        </div>
    `;
}