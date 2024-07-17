// HTML Templates and Content Display Functions

function showContent(content) {
    let html = `<p>${content}</p>`;
    if (content === '이 홈페이지는 글쓰고, 올리고, 지울려고 만드는 사이트 입니다.') {
        html += '<img src="https://apod.nasa.gov/apod/image/2407/CometaryGlobs_Pugh_1080.jpg" alt="소개 이미지" class="intro-image">';
    }
    document.getElementById('mainContent').innerHTML = html;
}

function showStudyList(topic) {
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

    document.getElementById('mainContent').innerHTML = listHtml;
}

function showStudyForm(topic) {
    document.getElementById('mainContent').innerHTML = `
        <h3>${topic} 내용 추가</h3>
        <input type="text" id="studyTitle" placeholder="제목을 입력하세요">
        <textarea id="studyContent" placeholder="내용을 입력하세요..."></textarea>
        <div class="button-container">
            <button onclick="saveStudyContent('${topic}')">저장</button>
        </div>
    `;
}

function saveStudyContent(topic) {
    const title = document.getElementById('studyTitle').value;
    const content = document.getElementById('studyContent').value;
    if (title && content) {
        const date = new Date().toLocaleString();
        studyContents.push({topic, title, content, date});
        localStorage.setItem('studyContents', JSON.stringify(studyContents));
        showStudyList(topic);
    }
}

function viewStudyContent(index) {
    const item = studyContents[index];
    let content = `
        <h2>${item.title}</h2>
        <div class="date-display">${item.date || '날짜 없음'}</div>
        <div>${item.content}</div>
        <div class="button-container">
            <button onclick="editStudyContent(${index})">수정</button>
            <button onclick="deleteStudyContent(${index})">삭제</button>
            <button onclick="showStudyList('${item.topic}')">목록으로</button>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function editStudyContent(index) {
    const item = studyContents[index];
    document.getElementById('mainContent').innerHTML = `
        <h3>학습 내용 수정</h3>
        <input type="text" id="studyTitle" value="${item.title}">
        <textarea id="studyContent">${item.content}</textarea>
        <div class="button-container">
            <button onclick="updateStudyContent(${index})">업데이트</button>
            <button onclick="showStudyList('${item.topic}')">취소</button>
        </div>
    `;
}

function updateStudyContent(index) {
    const title = document.getElementById('studyTitle').value;
    const content = document.getElementById('studyContent').value;
    if (title && content) {
        const date = new Date().toLocaleString();
        studyContents[index] = {topic: studyContents[index].topic, title, content, date};
        localStorage.setItem('studyContents', JSON.stringify(studyContents));
        viewStudyContent(index);
    }
}

function deleteStudyContent(index) {
    if (confirm('정말로 이 학습 내용을 삭제하시겠습니까?')) {
        const topic = studyContents[index].topic;
        studyContents.splice(index, 1);
        localStorage.setItem('studyContents', JSON.stringify(studyContents));
        showStudyList(topic);
    }
}

function searchStudy(topic) {
    const searchTerm = document.getElementById('studySearchInput').value.toLowerCase();
    const results = studyContents.filter(item => 
        item.topic === topic && (item.title.toLowerCase().includes(searchTerm) || item.content.toLowerCase().includes(searchTerm))
    );
    let resultHtml = `<h3>${topic} 검색 결과</h3><ul>`;
    results.forEach((item, index) => {
        resultHtml += `<li onclick="viewStudyContent(${index})">${item.title}</li>`;
    });
    resultHtml += '</ul>';
    document.getElementById('mainContent').innerHTML = resultHtml;
}

function showQnAList() {
    fetchPostsFromFirebase().then(posts => {
        let listHtml = '<h3>Q&A 목록</h3><ul id="postList">';
        for (let key in posts) {
            listHtml += `<li onclick="viewPost('${key}')">${posts[key].title}</li>`;
        }
        listHtml += '</ul>';
        document.getElementById('mainContent').innerHTML = listHtml;
    });
}

function showQnAForm() {
    document.getElementById('mainContent').innerHTML = `
        <h3>Q&A 글쓰기</h3>
        <input type="text" id="postTitle" placeholder="제목을 입력하세요">
        <textarea id="editor" placeholder="여기에 글을 작성하세요..."></textarea>
        <div class="button-container">
            <button onclick="savePost()">저장</button>
        </div>
    `;
}

function savePost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('editor').value;
    if (title && content) {
        addPostToFirebase(title, content).then(() => {
            showQnAList();
        });
    }
}

function viewPost(key) {
    database.ref('posts/' + key).once('value').then(snapshot => {
        const post = snapshot.val();
        let content = `
            <h3>${post.title}</h3>
            <div class="date-display">${post.date || '날짜 없음'}</div>
            <p>${post.content}</p>
            <div class="button-container">
                <button onclick="editPost('${key}')">수정</button>
                <button onclick="deletePost('${key}')">삭제</button>
                <button onclick="showQnAList()">목록으로</button>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = content;
    });
}

function editPost(key) {
    database.ref('posts/' + key).once('value').then(snapshot => {
        const post = snapshot.val();
        document.getElementById('mainContent').innerHTML = `
            <h3>게시글 수정</h3>
            <input type="text" id="editTitle" value="${post.title}">
            <textarea id="editEditor">${post.content}</textarea>
            <div class="button-container">
                <button onclick="updatePost('${key}')">업데이트</button>
                <button onclick="showQnAList()">취소</button>
            </div>
        `;
    });
}

function updatePost(key) {
    const title = document.getElementById('editTitle').value;
    const content = document.getElementById('editEditor').value;
    if (title && content) {
        updatePostInFirebase(key, title, content).then(() => {
            viewPost(key);
        });
    }
}

function deletePost(key) {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        deletePostFromFirebase(key).then(() => {
            showQnAList();
        });
    }
}

function showNoticeList() {
    let listHtml = '<h3>공지사항</h3><ul id="noticeList">';
    notices.forEach((notice, index) => {
        listHtml += `<li onclick="viewNotice(${index})">${notice.title}</li>`;
    });
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
    document.getElementById('mainContent').innerHTML = listHtml;
}

function showNoticePasswordForm() {
    document.getElementById('mainContent').innerHTML = `
        <h3>비밀번호 입력</h3>
        <input type="password" id="noticePassword" placeholder="비밀번호를 입력하세요">
        <div class="button-container">
            <button onclick="checkNoticePassword()">확인</button>
        </div>
    `;
}

function checkNoticePassword() {
    const password = document.getElementById('noticePassword').value;
    if (password === '369369') {
        showNoticeForm();
    } else {
        alert('비밀번호가 올바르지 않습니다.');
    }
}

function showNoticeForm() {
    document.getElementById('mainContent').innerHTML = `
        <h3>공지사항 작성</h3>
        <input type="text" id="noticeTitle" placeholder="제목을 입력하세요">
        <textarea id="noticeContent" placeholder="내용을 입력하세요..."></textarea>
        <div class="button-container">
            <button onclick="saveNotice()">저장</button>
        </div>
    `;
}

function saveNotice() {
    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    if (title && content) {
        const date = new Date().toLocaleString();
        notices.push({title, content, date});
        localStorage.setItem('notices', JSON.stringify(notices));
        showNoticeList();
    } else {
        alert('제목과 내용을 모두 입력해주세요.');
    }
}

function viewNotice(index) {
    const notice = notices[index];
    let content = `
        <h3>${notice.title}</h3>
        <div class="date-display">${notice.date || '날짜 없음'}</div>
        <p>${notice.content}</p>
        <div class="button-container">
            <button onclick="showNoticeList()">목록으로</button>
            <button onclick="editNotice(${index})">수정</button>
            <button onclick="deleteNotice(${index})">삭제</button>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function editNotice(index) {
    const notice = notices[index];
    document.getElementById('mainContent').innerHTML = `
        <h3>공지사항 수정</h3>
        <input type="text" id="noticeTitle" value="${notice.title}">
        <textarea id="noticeContent">${notice.content}</textarea>
        <div class="button-container">
            <button onclick="updateNotice(${index})">업데이트</button>
            <button onclick="showNoticeList()">취소</button>
        </div>
    `;
}

function updateNotice(index) {
    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    if (title && content) {
        const date = new Date().toLocaleString();
        notices[index] = {title, content, date};
        localStorage.setItem('notices', JSON.stringify(notices));
        viewNotice(index);
    }
}

function deleteNotice(index) {
    if (confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
        notices.splice(index, 1);
        localStorage.setItem('notices', JSON.stringify(notices));
        showNoticeList();
    }
}

function searchNotice() {
    const searchTerm = document.getElementById('noticeSearchInput').value.toLowerCase();
    const results = notices.filter(notice => 
        notice.title.toLowerCase().includes(searchTerm) || 
        notice.content.toLowerCase().includes(searchTerm)
    );
    let resultHtml = '<h3>공지사항 검색 결과</h3><ul>';
    results.forEach((notice, index) => {
        resultHtml += `<li onclick="viewNotice(${index})">${notice.title}</li>`;
    });
    resultHtml += '</ul>';
    document.getElementById('mainContent').innerHTML = resultHtml;
}

function showFileUpload() {
    document.getElementById('mainContent').innerHTML = `
        <h3>자료실</h3>
        <div class="button-container">
            <button onclick="showFileUploadForm()">글쓰기</button>
        </div>
        <h3>업로드된 파일 목록</h3>
        <ul id="fileList"></ul>
    `;
    updateFileList();
}

function showFileUploadForm() {
    document.getElementById('mainContent').innerHTML = `
        <h3>파일 업로드</h3>
        <input type="text" id="fileTitle" placeholder="제목을 입력하세요">
        <textarea id="fileContent" placeholder="내용을 입력하세요..."></textarea>
        <input type="file" id="fileInput">
        <div class="button-container">
            <button onclick="uploadFile()">업로드</button>
        </div>
    `;
}

function uploadFile() {
    const title = document.getElementById('fileTitle').value;
    const content = document.getElementById('fileContent').value;
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (title && content && file) {
        const date = new Date().toLocaleString();
        files.push({title, content, fileName: file.name, date});
        localStorage.setItem('files', JSON.stringify(files));
        showFileUpload();
    }
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    files.forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = file.title;
        li.onclick = () => viewFile(index);
        fileList.appendChild(li);
    });
}

function viewFile(index) {
    const file = files[index];
    let content = `
        <h3>${file.title}</h3>
        <div class="date-display">${file.date}</div>
        <div class="file-download">
            <a href="#" onclick="downloadFile('${file.fileName}')">파일 다운로드</a>
        </div>
        <p>${file.content}</p>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function downloadFile(fileName) {
    // 실제 파일 다운로드 로직을 구현해야 합니다.
    // 이 예제에서는 단순히 알림을 표시합니다.
    alert(`${fileName} 다운로드를 시작합니다.`);
}

function pushState(content) {
    history.pushState({content: content}, "", "");
    document.getElementById('mainContent').innerHTML = content;
}

window.onpopstate = function(event) {
    if (event.state) {
        document.getElementById('mainContent').innerHTML = event.state.content;
    }
};
