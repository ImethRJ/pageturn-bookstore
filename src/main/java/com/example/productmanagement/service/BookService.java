package com.example.productmanagement.service;

import com.example.productmanagement.entity.Book;
import com.example.productmanagement.entity.Category;
import com.example.productmanagement.exception.BookNotFoundException;
import com.example.productmanagement.repository.BookRepository;
import com.example.productmanagement.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;

    public BookService(BookRepository bookRepository, CategoryRepository categoryRepository) {
        this.bookRepository = bookRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException("Book with ID " + id + " not found"));
    }

    public List<Book> searchBooks(String query) {
        if (query == null || query.isBlank()) {
            return bookRepository.findAll();
        }
        return bookRepository.searchBooks(query.trim());
    }

    @Transactional
    public Book createBook(Book book) {
        if (book.getCategory() != null && book.getCategory().getName() != null) {
            String name = book.getCategory().getName().trim();
            if (!name.isEmpty()) {
                Category category = categoryRepository.findByNameIgnoreCase(name)
                        .orElseGet(() -> categoryRepository.save(new Category(name)));
                book.setCategory(category);
            }
        }
        return bookRepository.save(book);
    }

    @Transactional
    public void deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new BookNotFoundException("Book with ID " + id + " not found");
        }
        bookRepository.deleteById(id);
    }

    @Transactional
    public Book updateBookStock(Long id, Integer quantity) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException("Book with ID " + id + " not found"));
        if (quantity < 0) {
            throw new IllegalArgumentException("Stock quantity cannot be negative");
        }
        book.setStockQuantity(quantity);
        return bookRepository.save(book);
    }
}
