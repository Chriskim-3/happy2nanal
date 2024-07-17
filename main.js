// Main Event Listeners and State Management Functions

document.addEventListener('keydown', function(event) {
    if (event.key === "Backspace" && !event.target.matches('input, textarea')) {
        event.preventDefault();
        window.history.back();
    }
});

// Initial page load
showContent('이 홈페이지는 글쓰고, 올리고, 지울려고 만드는 사이트 입니다.');
