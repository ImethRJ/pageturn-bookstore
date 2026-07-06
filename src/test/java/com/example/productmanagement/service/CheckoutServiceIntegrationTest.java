package com.example.productmanagement.service;

import com.example.productmanagement.dto.CartItemDto;
import com.example.productmanagement.dto.CheckoutRequest;
import com.example.productmanagement.entity.Book;
import com.example.productmanagement.entity.Category;
import com.example.productmanagement.entity.Order;
import com.example.productmanagement.exception.InsufficientStockException;
import com.example.productmanagement.repository.BookRepository;
import com.example.productmanagement.repository.CategoryRepository;
import com.example.productmanagement.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
class CheckoutServiceIntegrationTest {

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    private Book book1;
    private Book book2;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        bookRepository.deleteAll();
        categoryRepository.deleteAll();

        Category category = new Category("Fiction");
        category = categoryRepository.save(category);

        book1 = new Book(
                "The Hobbit",
                "J.R.R. Tolkien",
                "9780007488308",
                new BigDecimal("14.99"),
                10,
                category
        );
        book1 = bookRepository.save(book1);

        book2 = new Book(
                "The Fellowship of the Ring",
                "J.R.R. Tolkien",
                "9780007488315",
                new BigDecimal("15.99"),
                5,
                category
        );
        book2 = bookRepository.save(book2);
    }

    @Test
    void shouldCheckoutSuccessfullyDeductingStock() {
        CheckoutRequest request = new CheckoutRequest(
                "Jane Doe",
                List.of(
                        new CartItemDto(book1.getId(), 3),
                        new CartItemDto(book2.getId(), 2)
                )
        );

        Order order = checkoutService.checkout(request);

        // Assert Order and OrderItems details
        assertThat(order).isNotNull();
        assertThat(order.getId()).isNotNull();
        assertThat(order.getCustomerName()).isEqualTo("Jane Doe");
        assertThat(order.getOrderItems()).hasSize(2);
        
        // Assert Stock Deductions in Database
        Book updatedBook1 = bookRepository.findById(book1.getId()).orElseThrow();
        Book updatedBook2 = bookRepository.findById(book2.getId()).orElseThrow();

        assertThat(updatedBook1.getStockQuantity()).isEqualTo(7); // 10 - 3
        assertThat(updatedBook2.getStockQuantity()).isEqualTo(3); // 5 - 2
    }

    @Test
    void shouldRollbackTransactionWhenStockIsInsufficient() {
        // Book 1 has 10 (we request 2 -> OK)
        // Book 2 has 5 (we request 6 -> Insufficient)
        CheckoutRequest request = new CheckoutRequest(
                "John Doe",
                List.of(
                        new CartItemDto(book1.getId(), 2),
                        new CartItemDto(book2.getId(), 6)
                )
        );

        assertThrows(InsufficientStockException.class, () -> {
            checkoutService.checkout(request);
        });

        // Assert Book Stock has NOT changed (Transaction rolled back completely)
        Book rolledBackBook1 = bookRepository.findById(book1.getId()).orElseThrow();
        Book rolledBackBook2 = bookRepository.findById(book2.getId()).orElseThrow();

        assertThat(rolledBackBook1.getStockQuantity()).isEqualTo(10);
        assertThat(rolledBackBook2.getStockQuantity()).isEqualTo(5);

        // Assert no order was persisted
        assertThat(orderRepository.findAll()).isEmpty();
    }
}
