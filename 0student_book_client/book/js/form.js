document.addEventListener("DOMContentLoaded", () => {
    console.log("문서 로딩 완료");
  });
  
  const bookForm = document.getElementById("bookForm");
  
  bookForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(bookForm);
    const bookData = {
      title: formData.get("title").trim(),
      author: formData.get("author").trim(),
      isbn: formData.get("isbn").trim(),
      price: formData.get("price").trim(),
      publishDate: formData.get("publishDate"),
    };
  
    if (!validateBook(bookData)) {
      return;
    }
  
    console.log("등록 성공:", bookData);
  });
  
  function validateBook(book) {
    if (!book.title) {
      alert("제목을 입력해주세요.");
      return false;
    }
    if (!book.author) {
      alert("저자를 입력해주세요.");
      return false;
    }
    if (!book.isbn) {
      alert("ISBN을 입력해주세요.");
      return false;
    }
    if (!book.price || isNaN(book.price)) {
      alert("가격은 숫자로 입력해주세요.");
      return false;
    }
    if (!book.publishDate) {
      alert("출판일을 입력해주세요.");
      return false;
    }
    return true;
  }
  