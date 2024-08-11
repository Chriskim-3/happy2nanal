// dataManager.js
import { database } from './firebaseConfig.js';
import { ref, push, set, get, remove, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase 관련 함수
export function fetchPostsFromFirebase() {
    return get(ref(database, 'posts')).then(snapshot => snapshot.val());
}

export function addPostToFirebase(title, content) {
    const date = new Date().toLocaleString();
    const newPost = { title, content, date };
    const newPostRef = push(ref(database, 'posts'));
    return set(newPostRef, newPost);
}

export function updatePostInFirebase(key, title, content) {
    const date = new Date().toLocaleString();
    return update(ref(database, `posts/${key}`), { title, content, date });
}

export function deletePostFromFirebase(key) {
    return remove(ref(database, `posts/${key}`));
}

// 로컬 스토리지 관련 함수
export function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

export function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// 학습 내용 관련 함수
export function addStudyContent(studyContents, topic, title, content) {
    const date = new Date().toLocaleString();
    studyContents.push({ topic, title, content, date });
    saveToLocalStorage('studyContents', studyContents);
    return studyContents;
}

export function updateStudyContent(studyContents, index, topic, title, content) {
    const date = new Date().toLocaleString();
    studyContents[index] = { topic, title, content, date };
    saveToLocalStorage('studyContents', studyContents);
    return studyContents;
}

export function deleteStudyContent(studyContents, index) {
    studyContents.splice(index, 1);
    saveToLocalStorage('studyContents', studyContents);
    return studyContents;
}

// 공지사항 관련 함수
export function addNotice(notices, title, content) {
    const date = new Date().toLocaleString();
    notices.push({ title, content, date });
    saveToLocalStorage('notices', notices);
    return notices;
}

export function updateNotice(notices, index, title, content) {
    const date = new Date().toLocaleString();
    notices[index] = { title, content, date };
    saveToLocalStorage('notices', notices);
    return notices;
}

export function deleteNotice(notices, index) {
    notices.splice(index, 1);
    saveToLocalStorage('notices', notices);
    return notices;
}

// 파일 관련 함수
export function addFile(files, title, content, fileName) {
    const date = new Date().toLocaleString();
    files.push({ title, content, fileName, date });
    saveToLocalStorage('files', files);
    return files;
}

// 기타 필요한 함수들...
