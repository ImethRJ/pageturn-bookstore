package com.example.productmanagement.controller;

import com.example.productmanagement.dto.CheckoutRequest;
import com.example.productmanagement.entity.Book;
import com.example.productmanagement.entity.Order;
import com.example.productmanagement.entity.Role;
import com.example.productmanagement.entity.User;
import com.example.productmanagement.service.BookService;
import com.example.productmanagement.service.CheckoutService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;
    private final CheckoutService checkoutService;

    public BookController(BookService bookService, CheckoutService checkoutService) {
        this.bookService = bookService;
        this.checkoutService = checkoutService;
    }

    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks(@RequestParam(value = "search", required = false) String search) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(bookService.searchBooks(search));
        }
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }

    @PostMapping
    public ResponseEntity<?> createBook(@Valid @RequestBody Book book, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));
        }
        Book createdBook = bookService.createBook(book); 
        return ResponseEntity.status(HttpStatus.CREATED).body(createdBook);
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@Valid @RequestBody CheckoutRequest request, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }
        Order order = checkoutService.checkout(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));
        }
        bookService.deleteBook(id);
        return ResponseEntity.ok(Map.of("message", "Book deleted successfully"));
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<?> updateBookStock(@PathVariable Long id, @RequestBody Map<String, Integer> payload, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));
        }
        Integer quantity = payload.get("stockQuantity");
        if (quantity == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "stockQuantity is mandatory"));
        }
        try {
            Book updated = bookService.updateBookStock(id, quantity);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
