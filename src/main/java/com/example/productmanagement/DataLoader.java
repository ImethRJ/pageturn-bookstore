package com.example.productmanagement;

import com.example.productmanagement.entity.Book;
import com.example.productmanagement.entity.Category;
import com.example.productmanagement.repository.BookRepository;
import com.example.productmanagement.repository.CategoryRepository;
import com.example.productmanagement.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class DataLoader implements CommandLineRunner {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final UserService userService;

    public DataLoader(BookRepository bookRepository, CategoryRepository categoryRepository, UserService userService) {
        this.bookRepository = bookRepository;
        this.categoryRepository = categoryRepository;
        this.userService = userService;
    }

    @Override
    public void run(String... args) throws Exception {
        // Seed default admin user
        userService.createAdmin("admin", "adminpassword");

        if (categoryRepository.count() == 0) {
            Category fiction = categoryRepository.save(new Category("Fiction"));
            Category science = categoryRepository.save(new Category("Science"));
            Category fantasy = categoryRepository.save(new Category("Fantasy"));

            bookRepository.save(new Book("The Hobbit", "J.R.R. Tolkien", "9780007488308", new BigDecimal("14.99"), 25, fantasy));
            bookRepository.save(new Book("The Fellowship of the Ring", "J.R.R. Tolkien", "9780007488315", new BigDecimal("15.99"), 15, fantasy));
            bookRepository.save(new Book("1984", "George Orwell", "9780451524935", new BigDecimal("9.99"), 4, fiction));
            bookRepository.save(new Book("A Brief History of Time", "Stephen Hawking", "9780553380163", new BigDecimal("18.99"), 8, science));
        }
    }
}
