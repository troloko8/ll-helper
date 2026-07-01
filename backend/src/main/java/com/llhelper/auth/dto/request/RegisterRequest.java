package com.llhelper.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Email @Size(max = 255, message = "Email must be less than 255 characters") String email,
    @NotBlank @Size(min = 6, max = 100, message = "password must be between 6 and 100 characters") String password
) {
}
