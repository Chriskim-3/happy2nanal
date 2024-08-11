export function showContent(content) {
    let html = `<p>${content}</p>`;
    if (content === '이 홈페이지는 글쓰고, 올리고, 지울려고 만드는 사이트 입니다.') {
        html += '<img src="20240803_172504.jpg" alt="소개 이미지" class="intro-image">';
    }
    return html;
}

export function showStudyList(topic, studyContents) {
    let listHtml = `<h2 class="study-title">${topic} 학습 내용</h2>`;
    
    listHtml += '<ul id="studyList">';
    studyContents.forEach((item) => {
        listHtml += `
            <li onclick="viewStudyContent('${item.key}')">
                <h3>${item.title}</h3>
                <div class="date-display">${item.date || '날짜 없음'}</div>
            </li>`;
    });
    listHtml += '</ul>';

    listHtml += `
        <div class="search-container">
            <input type="text" id="studySearchInput" placeholder="검색...">
            <button onclick="searchStudy('${topic}')">검색</button>
        </div>
        <div class="button-container">
            <button onclick="showStudyForm('${topic}')">글쓰기</button>
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
            <button onclick="saveStudyContent('${topic}')">저장</button>
        </div>
    `;
}

export function viewStudyContent(item, key) {
    return `
        <h2>${item.title}</h2>
        <div class="date-display">${item.date || '날짜 없음'}</div>
        <div>${item.content}</div>
        <div class="button-container">
            <button onclick="editStudyContent('${key}')">수정</button>
            <button onclick="deleteStudyContent('${key}')">삭제</button>
            <button onclick="showStudyList('${item.topic}')">목록으로</button>
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
            <button onclick="updateStudyContent('${key}')">업데이트</button>
            <button onclick="showStudyList('${item.topic}')">취소</button>
        </div>
    `;
}

export function showQnAList(posts) {
    let listHtml = '<h3>Q&A 목록</h3><ul id="postList">';
    for (let key in posts) {
        listHtml += `<li onclick="viewPost('${key}')">${posts[key].title}</li>`;
    }
    listHtml += '</ul>';
    listHtml += '<div class="button-container"><button onclick="showQnAForm()">글쓰기</button></div>';
    return listHtml;
}

export function showQnAForm() {
    return `
        <h3>Q&A 글쓰기</h3>
        <input type="text" id="postTitle" placeholder="제목을 입력하세요">
        <textarea id="editor" placeholder="여기에 글을 작성하세요..."></textarea>
        <div class="button-container">
            <button onclick="savePost()">저장</button>
        </div>
    `;
}

export function viewPost(post, key) {
    return `
        <h3>${post.title}</h3>
        <div class="date-display">${post.date || '날짜 없음'}</div>
        <p>${post.content}</p>
        <div class="button-container">
            <button onclick="editPost('${key}')">수정</button>
            <button onclick="deletePost('${key}')">삭제</button>
            <button onclick="showQnAList()">목록으로</button>
        </div>
    `;
}

export function editPost(post, key) {
    return `
        <h3>게시글 수정</h3>
        <input type="text" id="editTitle" value="${post.title}">
        <textarea id="editEditor">${post.content}</textarea>
        <div class="button-container">
            <button onclick="updatePost('${key}')">업데이트</button>
            <button onclick="showQnAList()">취소</button>
        </div>
    `;
}

export function showNoticeList(notices) {
    let listHtml = '<h3>공지사항</h3><ul id="noticeList">';
    for (let key in notices) {
        listHtml += `<li onclick="viewNotice('${key}')">${notices[key].title}</li>`;
    }
    listHtml += '</ul>';
    listHtml += `
        <div class="search-container">
            <input type="text" id="noticeSearchInput" placeholder="검색...">
            <button onclick="searchNotice()">검색</button>
        </div>
        <div class="button-container">
            <button onclick="showNoticePasswordForm()">공지사항 작성</button>
        </div>
    `;
    return listHtml;
}

export function showNoticePasswordForm() {
    return `
        <h3>비밀번호 입력</h3>
        <input type="password" id="noticePassword" placeholder="비밀번호를 입력하세요">
        <div class="button-container">
            <button onclick="checkNoticePassword()">확인</button>
        </div>
    `;
}

export function showNoticeForm() {
    return `
        <h3>공지사항 작성</h3>
        <input type="text" id="noticeTitle" placeholder="제목을 입력하세요">
        <textarea id="noticeContent" placeholder="내용을 입력하세요..."></textarea>
        <div class="button-container">
            <button onclick="saveNotice()">저장</button>
        </div>
    `;
}

export function showFileUpload(files) {
    let listHtml = `
        <h3>자료실</h3>
        <div class="button-container">
            <button onclick="showFileUploadForm()">파일 업로드</button>
        </div>
        <h3>업로드된 파일 목록</h3>
        <ul id="fileList">
    `;
    for (let key in files) {
        listHtml += `<li onclick="viewFile('${key}')">${files[key].title}</li>`;
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
            <button onclick="uploadFile()">업로드</button>
        </div>
    `;
}

export function viewFile(file, key) {
    return `
        <h3>${file.title}</h3>
        <div class="date-display">${file.date}</div>
        <div class="file-download">
            <a href="#" onclick="downloadFile('${file.fileName}')">파일 다운로드</a>
        </div>
        <p>${file.content}</p>
        <div class="button-container">
            <button onclick="deleteFile('${key}')">삭제</button>
            <button onclick="showFileUpload()">목록으로</button>
        </div>
    `;
}
