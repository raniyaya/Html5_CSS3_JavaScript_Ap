// 전역 변수
const API_BASE_URL = 'http://localhost:8080';
let editingBookId = null; // 현재 수정 중인 도서 ID

// DOM 요소 참조
const bookForm = document.getElementById('bookForm');
const bookTableBody = document.getElementById('bookTableBody');
const submitButton = bookForm.querySelector('button[type="submit"]');
const cancelButton = bookForm.querySelector('.cancel-btn');
const loadingMessage = document.getElementById('loadingMessage');
const formError = document.getElementById('formError');
const bookDetailModal = document.getElementById('bookDetailModal');
const bookDetailContent = document.getElementById('bookDetailContent');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('페이지 로드 완료');
    loadBooks();
});

// 폼 제출 이벤트 핸들러
bookForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 폼 데이터 수집
    const formData = new FormData(bookForm);
    const bookData = {
        title: formData.get('title').trim(),
        author: formData.get('author').trim(),
        isbn: formData.get('isbn').trim(),
        price: formData.get('price') ? parseInt(formData.get('price')) : null,
        publishDate: formData.get('publishDate') || null,
        detail: {
            description: formData.get('description').trim(),
            language: formData.get('language').trim(),
            pageCount: formData.get('pageCount') ? parseInt(formData.get('pageCount')) : null,
            publisher: formData.get('publisher').trim(),
            coverImageUrl: formData.get('coverImageUrl').trim(),
            edition: formData.get('edition').trim()
        }
    };
    
    // 유효성 검사
    if (!validateBook(bookData)) {
        return;
    }
    
    // 수정 모드인지 확인
    if (editingBookId) {
        alert(editingBookId);
        updateBook(editingBookId, bookData);
    } else {
        createBook(bookData);
    }
});

// 도서 데이터 유효성 검사
function validateBook(book) {
    // 필수 필드 검사
    if (!book.title) {
        alert('제목을 입력해주세요.');
        return false;
    }
    
    if (!book.author) {
        alert('저자를 입력해주세요.');
        return false;
    }
    
    if (!book.isbn) {
        alert('ISBN을 입력해주세요.');
        return false;
    }
    
    // ISBN 형식 검사 (기본적인 영숫자 조합)
    const isbnPattern = /^[0-9X-]+$/;
    if (!isbnPattern.test(book.isbn)) {
        alert('올바른 ISBN 형식이 아닙니다. (숫자와 X, -만 허용)');
        return false;
    }
    
    // 가격 유효성 검사
    if (book.price !== null && book.price < 0) {
        alert('가격은 0 이상이어야 합니다.');
        return false;
    }
    
    // 페이지 수 유효성 검사
    if (book.detail.pageCount !== null && book.detail.pageCount < 0) {
        alert('페이지 수는 0 이상이어야 합니다.');
        return false;
    }
    
    // URL 형식 검사 (입력된 경우에만)
    if (book.detail.coverImageUrl && !isValidUrl(book.detail.coverImageUrl)) {
        alert('올바른 이미지 URL 형식이 아닙니다.');
        return false;
    }
    
    return true;
}

// URL 유효성 검사
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 도서 목록 로드 함수
function loadBooks() {
    showLoading(true);
    
    fetch(`${API_BASE_URL}/api/books`)
        .then(response => {
            if (!response.ok) {
                throw new Error('도서 목록을 불러오는데 실패했습니다.');
            }
            return response.json();
        })
        .then(books => {
            renderBookTable(books);
        })
        .catch(error => {
            console.error('Error:', error);
            showError('도서 목록을 불러오는데 실패했습니다.');
            bookTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #f44336;">오류: 데이터를 불러올 수 없습니다.</td></tr>';
        })
        .finally(() => {
            showLoading(false);
        });
}

// 도서 테이블 렌더링
function renderBookTable(books) {
    bookTableBody.innerHTML = '';
    
    books.forEach(book => {
        const row = document.createElement('tr');
        
        const formattedPrice = book.price ? `₩${book.price.toLocaleString()}` : '-';
        const formattedDate = book.publishDate || '-';
        const publisher = book.detail ? book.detail.publisher || '-' : '-';
        
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${formattedPrice}</td>
            <td>${formattedDate}</td>
            <td>${publisher}</td>
            <td>
                <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
                <button class="delete-btn" onclick="deleteBook(${book.id})">삭제</button>
                <button class="detail-btn" onclick="showBookDetail(${book.id})">상세</button>
            </td>
        `;
        
        bookTableBody.appendChild(row);
    });
}

// 도서 생성 함수
function createBook(bookData) {
    setLoading(true);
    
    fetch(`${API_BASE_URL}/api/books`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('도서 등록에 실패했습니다.');
        }
        return response.json();
    })
    .then(result => {
        showSuccess('도서가 성공적으로 등록되었습니다.');
        resetForm();
        loadBooks(); // 목록 새로고침
    })
    .catch(error => {
        console.error('Error:', error);
        showError('도서 등록에 실패했습니다.');
    })
    .finally(() => {
        setLoading(false);
    });
}

// 도서 삭제 함수
function deleteBook(bookId) {
    if (!confirm('정말로 이 도서를 삭제하시겠습니까?')) {
        return;
    }
    
    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('도서 삭제에 실패했습니다.');
        }
        alert('도서가 성공적으로 삭제되었습니다.');
        loadBooks(); // 목록 새로고침
    })
    .catch(error => {
        console.error('Error:', error);
        alert('도서 삭제에 실패했습니다.');
    });
}

// 도서 수정 함수
function editBook(bookId) {
    setLoading(true);
    
    fetch(`${API_BASE_URL}/api/books/${bookId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('도서 정보를 불러오는데 실패했습니다.');
            }
            return response.json();
        })
        .then(book => {
            // 폼에 기본 도서 정보 채우기
            bookForm.title.value = book.title;
            bookForm.author.value = book.author;
            bookForm.isbn.value = book.isbn;
            bookForm.price.value = book.price || '';
            bookForm.publishDate.value = book.publishDate || '';
            
            // 폼에 상세 정보 채우기
            if (book.detail) {
                bookForm.description.value = book.detail.description || '';
                bookForm.language.value = book.detail.language || '';
                bookForm.pageCount.value = book.detail.pageCount || '';
                bookForm.publisher.value = book.detail.publisher || '';
                bookForm.coverImageUrl.value = book.detail.coverImageUrl || '';
                bookForm.edition.value = book.detail.edition || '';
            }
            
            // 수정 모드로 설정
            editingBookId = bookId;
            submitButton.textContent = '도서 수정';
            cancelButton.style.display = 'inline-block';
            
            // 폼으로 스크롤
            bookForm.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Error:', error);
            showError('도서 정보를 불러오는데 실패했습니다.');
        })
        .finally(() => {
            setLoading(false);
        });
}

// 도서 업데이트 함수
function updateBook(bookId, bookData) {
    setLoading(true);
    
    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('도서 정보 수정에 실패했습니다.');
        }
        return response.json();
    })
    .then(result => {
        showSuccess('도서 정보가 성공적으로 수정되었습니다.');
        resetForm();
        loadBooks(); // 목록 새로고침
    })
    .catch(error => {
        console.error('Error:', error);
        showError('도서 정보 수정에 실패했습니다.');
    })
    .finally(() => {
        setLoading(false);
    });
}

// 도서 상세보기 함수
function showBookDetail(bookId) {
    setLoading(true);
    
    fetch(`${API_BASE_URL}/api/books/${bookId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('도서 정보를 불러오는데 실패했습니다.');
            }
            return response.json();
        })
        .then(book => {
            displayBookDetail(book);
        })
        .catch(error => {
            console.error('Error:', error);
            showError('도서 정보를 불러오는데 실패했습니다.');
        })
        .finally(() => {
            setLoading(false);
        });
}

// 도서 상세 정보 모달 표시
function displayBookDetail(book) {
    let detailHTML = `
        <div class="book-detail-item">
            <div class="book-detail-label">제목</div>
            <div class="book-detail-value">${book.title}</div>
        </div>
        <div class="book-detail-item">
            <div class="book-detail-label">저자</div>
            <div class="book-detail-value">${book.author}</div>
        </div>
        <div class="book-detail-item">
            <div class="book-detail-label">ISBN</div>
            <div class="book-detail-value">${book.isbn}</div>
        </div>
        <div class="book-detail-item">
            <div class="book-detail-label">가격</div>
            <div class="book-detail-value">${book.price ? '₩' + book.price.toLocaleString() : '-'}</div>
        </div>
        <div class="book-detail-item">
            <div class="book-detail-label">출판일</div>
            <div class="book-detail-value">${book.publishDate || '-'}</div>
        </div>
    `;
    
    if (book.bookDetail) {
        detailHTML += `
            <div class="book-detail-item">
                <div class="book-detail-label">설명</div>
                <div class="book-detail-value">${book.detail.description || '-'}</div>
            </div>
            <div class="book-detail-item">
                <div class="book-detail-label">언어</div>
                <div class="book-detail-value">${book.detail.language || '-'}</div>
            </div>
            <div class="book-detail-item">
                <div class="book-detail-label">페이지 수</div>
                <div class="book-detail-value">${book.detail.pageCount || '-'}</div>
            </div>
            <div class="book-detail-item">
                <div class="book-detail-label">출판사</div>
                <div class="book-detail-value">${book.detail.publisher || '-'}</div>
            </div>
            <div class="book-detail-item">
                <div class="book-detail-label">에디션</div>
                <div class="book-detail-value">${book.detail.edition || '-'}</div>
            </div>
        `;
        
        if (book.detail.coverImageUrl) {
            detailHTML += `
                <div class="book-detail-item">
                    <div class="book-detail-label">표지 이미지</div>
                    <div class="book-detail-value">
                        <img src="${book.detail.coverImageUrl}" alt="표지 이미지" class="cover-image">
                    </div>
                </div>
            `;
        }
    }
    
    bookDetailContent.innerHTML = detailHTML;
    bookDetailModal.style.display = 'block';
}

// 모달 닫기
function closeBookDetail() {
    bookDetailModal.style.display = 'none';
}

// 모달 바깥 영역 클릭시 닫기
window.onclick = function(event) {
    if (event.target === bookDetailModal) {
        closeBookDetail();
    }
}

// 폼 초기화 함수
function resetForm() {
    bookForm.reset();
    editingBookId = null;
    submitButton.textContent = '도서 등록';
    cancelButton.style.display = 'none';
    clearMessages();
}

// 로딩 상태 표시/숨김
function showLoading(show) {
    if (show) {
        loadingMessage.style.display = 'block';
        bookTableBody.innerHTML = '';
    } else {
        loadingMessage.style.display = 'none';
    }
}

// 폼 로딩 상태 설정
function setLoading(loading) {
    submitButton.disabled = loading;
    if (loading) {
        submitButton.textContent = editingBookId ? '수정 중...' : '등록 중...';
    } else {
        submitButton.textContent = editingBookId ? '도서 수정' : '도서 등록';
    }
}

// 에러 메시지 표시
function showError(message) {
    formError.textContent = message;
    formError.style.display = 'block';
    formError.style.color = '#f44336';
}

// 성공 메시지 표시
function showSuccess(message) {
    formError.textContent = message;
    formError.style.display = 'block';
    formError.style.color = '#4CAF50';
}

// 메시지 초기화
function clearMessages() {
    formError.style.display = 'none';
}

// 폼 입력 이벤트 추가 (에러 메시지 자동 제거)
const formInputs = bookForm.querySelectorAll('input, textarea');
formInputs.forEach(input => {
    input.addEventListener('input', clearMessages);
});