package com.example.productmanagement.service;

import com.example.productmanagement.dto.CartItemDto;
import com.example.productmanagement.dto.CheckoutRequest;
import com.example.productmanagement.entity.Book;
import com.example.productmanagement.entity.Order;
import com.example.productmanagement.entity.OrderItem;
import com.example.productmanagement.entity.User;
import com.example.productmanagement.exception.BookNotFoundException;
import com.example.productmanagement.exception.InsufficientStockException;
import com.example.productmanagement.repository.BookRepository;
import com.example.productmanagement.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class CheckoutService {

      private final BookRepository bookRepository;
      private final OrderRepository orderRepository;

      public CheckoutService(BookRepository bookRepository, OrderRepository orderRepository) {
          this.bookRepository = bookRepository;
          this.orderRepository = orderRepository;
      }

      @Transactional
      public Order checkout(CheckoutRequest request, User user) {
          Order order = new Order(request.customerName(), LocalDateTime.now());
          order.setUser(user);

          for (CartItemDto item : request.items()) {
              Book book = bookRepository.findById(item.bookId())
                      .orElseThrow(() -> new BookNotFoundException("Book with ID " + item.bookId() + " not found"));

              if (book.getStockQuantity() < item.quantity()) {
                  throw new InsufficientStockException("Insufficient stock for book '" + book.getTitle() + "'. Required: " + item.quantity() + ", Available: " + book.getStockQuantity());
              }

              // Deduct stock
              book.setStockQuantity(book.getStockQuantity() - item.quantity());
              bookRepository.save(book);

              // Add item to order
              OrderItem orderItem = new OrderItem(book, item.quantity(), book.getPrice());
              order.addOrderItem(orderItem);
          }

          return orderRepository.save(order);
      }
}
