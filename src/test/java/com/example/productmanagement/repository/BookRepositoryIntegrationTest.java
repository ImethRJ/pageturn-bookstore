package com.example.productmanagement.repository;

import com.example.productmanagement.entity.Book;
import com.example.productmanagement.entity.Category;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@ActiveProfiles("test")
class BookRepositoryIntegrationTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private BookRepository bookRepository;

    @Test
    void shouldSaveAndFindBookSuccessfully() {
        Category category = new Category("Fiction");
        entityManager.persist(category);

        Book book = new Book(
                "The Hobbit",
                "J.R.R. Tolkien",
                "9780007488308",
                new BigDecimal("14.99"),
                25,
                category
        );

        Book savedBook = bookRepository.save(book);

        Optional<Book> foundBook = bookRepository.findById(savedBook.getId());
        assertThat(foundBook).isPresent();
        assertThat(foundBook.get().getTitle()).isEqualTo("The Hobbit");
        assertThat(foundBook.get().getCategory().getName()).isEqualTo("Fiction");
    }

    @Test
    void shouldFailValidationWhenPriceIsNegative() {
        Category category = new Category("Sci-Fi");
        entityManager.persist(category);

        Book invalidBook = new Book(
                "Neuromancer",
                "William Gibson",
                "9780441569595",
                new BigDecimal("-5.00"),
                10,
                category
        );

        assertThrows(ConstraintViolationException.class, () -> {
            bookRepository.saveAndFlush(invalidBook);
        });
    }
}