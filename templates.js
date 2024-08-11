// templates.js

export function showContent(content) {
    let html = `<p>${content}</p>`;
    if (content === '이 홈페이지는 글쓰고, 올리고, 지울려고 만드는 사이트 입니다.') {
        html += '<img src="https://apod.nasa.gov/apod/image/2407/CometaryGlobs_Pugh_1080.jpg" alt="소개 이미지" class="intro-image">';
    }
    return html;
}

export function showStudyList(topic, studyContents) {
    let listHtml = `<h2 class="study-title">${topic} 학습 내용</h2>`;
    
    listHtml += '<ul id="studyList">';
    studyContents.filter(item => item.topic === topic).forEach((item, index) => {
        listHtml += `
            <li onclick="viewStudyContent(${index})">
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
        <div class="button-container">
            <button onclick="saveStudyContent('${topic}')">저장</button>
        </div>
    `;
}

export function viewStudyContent(item, index) {
    return `
        <h2>${item.title}</h2>
        <div class="date-display">${item.date || '날짜 없음'}</div>
        <div>${item.content}</div>
        <div class="button-container">
            <button onclick="editStudyContent(${index})">수정</button>
            <button onclick="deleteStudyContent(${index})">삭제</button>
            <button onclick="showStudyList('${item.topic}')">목록으로</button>
        </div>
    `;
}

export function editStudyContent(item, index) {
    return `
        <h3>학습 내용 수정</h3>
        <input type="text" id="studyTitle" value="${item.title}">
        <textarea id="studyContent">${item.content}</textarea>
        <div class="button-container">
            <button onclick="updateStudyContent(${index})">업데이트</button>
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

// 기타 필요한 템플릿 함수들...
