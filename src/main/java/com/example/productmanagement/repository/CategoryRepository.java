package com.example.productmanagement.repository;

import com.example.productmanagement.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Custom finder method to check for duplicate categories by name
    Optional<Category> findByNameIgnoreCase(String name);
}