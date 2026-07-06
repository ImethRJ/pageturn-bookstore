package com.example.productmanagement.controller;

import com.example.productmanagement.entity.Book;
import com.example.productmanagement.entity.Category;
import com.example.productmanagement.repository.BookRepository;
import com.example.productmanagement.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BookControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Book savedBook;

    @BeforeEach
    void setUp() {
        bookRepository.deleteAll();
        categoryRepository.deleteAll();

        Category category = new Category("Fiction");
        category = categoryRepository.save(category);

        Book book = new Book(
                "The Hobbit",
                "J.R.R. Tolkien",
                "9780007488308",
                new BigDecimal("14.99"),
                25,
                category
        );
        savedBook = bookRepository.save(book);
    }

    @Test
    void shouldReturnAllBooks() throws Exception {
        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("The Hobbit")))
                .andExpect(jsonPath("$[0].author", is("J.R.R. Tolkien")))
                .andExpect(jsonPath("$[0].category.name", is("Fiction")));
    }

    @Test
    void shouldReturnBookById() throws Exception {
        mockMvc.perform(get("/api/books/" + savedBook.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("The Hobbit")))
                .andExpect(jsonPath("$.isbn", is("9780007488308")))
                .andExpect(jsonPath("$.category.name", is("Fiction")));
    }

    @Test
    void shouldReturn404NotFoundWhenBookDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/books/9999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", containsString("Book with ID 9999 not found")))
                .andExpect(jsonPath("$.path", is("/api/books/9999")));
    }

    @Test
    void shouldSearchBooksByTitle() throws Exception {
        mockMvc.perform(get("/api/books").param("search", "Hobbit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("The Hobbit")));
    }

    @Test
    void shouldSearchBooksByAuthor() throws Exception {
        mockMvc.perform(get("/api/books").param("search", "tolkien"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].author", is("J.R.R. Tolkien")));
    }

    @Test
    void shouldSearchBooksByCategory() throws Exception {
        mockMvc.perform(get("/api/books").param("search", "fiction"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].category.name", is("Fiction")));
    }

    @Test
    void shouldReturnEmptyListWhenSearchHasNoMatches() throws Exception {
        mockMvc.perform(get("/api/books").param("search", "NonExistent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
