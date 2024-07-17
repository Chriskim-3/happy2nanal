// Data Manager for handling local storage and Firebase CRUD operations
const studyContents = JSON.parse(localStorage.getItem('studyContents')) || [];
const notices = JSON.parse(localStorage.getItem('notices')) || [];
const files = JSON.parse(localStorage.getItem('files')) || [];

function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function addStudyContent(topic, title, content) {
    const date = new Date().toLocaleString();
    studyContents.push({ topic, title, content, date });
    saveToLocalStorage('studyContents', studyContents);
}

function updateStudyContent(index, topic, title, content) {
    const date = new Date().toLocaleString();
    studyContents[index] = { topic, title, content, date };
    saveToLocalStorage('studyContents', studyContents);
}

function deleteStudyContent(index) {
    studyContents.splice(index, 1);
    saveToLocalStorage('studyContents', studyContents);
}

function addNotice(title, content) {
    const date = new Date().toLocaleString();
    notices.push({ title, content, date });
    saveToLocalStorage('notices', notices);
}

function updateNotice(index, title, content) {
    const date = new Date().toLocaleString();
    notices[index] = { title, content, date };
    saveToLocalStorage('notices', notices);
}

function deleteNotice(index) {
    notices.splice(index, 1);
    saveToLocalStorage('notices', notices);
}

function addFile(title, content, fileName) {
    const date = new Date().toLocaleString();
    files.push({ title, content, fileName, date });
    saveToLocalStorage('files', files);
}

function fetchPostsFromFirebase() {
    return database.ref('posts').once('value').then(snapshot => snapshot.val());
}

function addPostToFirebase(title, content) {
    const date = new Date().toLocaleString();
    const newPost = { title, content, date };
    return database.ref('posts').push(newPost);
}

function updatePostInFirebase(key, title, content) {
    const date = new Date().toLocaleString();
    return database.ref('posts/' + key).update({ title, content, date });
}

function deletePostFromFirebase(key) {
    return database.ref('posts/' + key).remove();
}
