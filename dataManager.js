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

// 학습 내용 관련 함수
export function fetchStudyContentsFromFirebase() {
    return get(ref(database, 'studyContents')).then(snapshot => snapshot.val());
}

export function addStudyContentToFirebase(topic, title, content) {
    const date = new Date().toLocaleString();
    const newContent = { topic, title, content, date };
    const newContentRef = push(ref(database, 'studyContents'));
    return set(newContentRef, newContent);
}

export function updateStudyContentInFirebase(key, topic, title, content) {
    const date = new Date().toLocaleString();
    return update(ref(database, `studyContents/${key}`), { topic, title, content, date });
}

export function deleteStudyContentFromFirebase(key) {
    return remove(ref(database, `studyContents/${key}`));
}

// 공지사항 관련 함수
export function fetchNoticesFromFirebase() {
    return get(ref(database, 'notices')).then(snapshot => snapshot.val());
}

export function addNoticeToFirebase(title, content) {
    const date = new Date().toLocaleString();
    const newNotice = { title, content, date };
    const newNoticeRef = push(ref(database, 'notices'));
    return set(newNoticeRef, newNotice);
}

export function updateNoticeInFirebase(key, title, content) {
    const date = new Date().toLocaleString();
    return update(ref(database, `notices/${key}`), { title, content, date });
}

export function deleteNoticeFromFirebase(key) {
    return remove(ref(database, `notices/${key}`));
}

// 자료실 관련 함수
export function fetchFilesFromFirebase() {
    return get(ref(database, 'files')).then(snapshot => snapshot.val());
}

export function addFileToFirebase(title, content, fileName) {
    const date = new Date().toLocaleString();
    const newFile = { title, content, fileName, date };
    const newFileRef = push(ref(database, 'files'));
    return set(newFileRef, newFile);
}

export function deleteFileFromFirebase(key) {
    return remove(ref(database, `files/${key}`));
}
