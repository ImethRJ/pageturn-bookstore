package com.example.productmanagement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CheckoutRequest(
    @NotBlank(message = "Customer name is mandatory")
    String customerName,

    @NotEmpty(message = "Cart items cannot be empty")
    @Valid
    List<CartItemDto> items
) {}
