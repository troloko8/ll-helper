package com.llhelper.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
    @NotBlank @Email @Size(max = 255, message = "Email must be less than 255 characters") String email,
    @NotBlank String password
) {
}
