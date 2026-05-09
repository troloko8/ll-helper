package com.llhelper.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank @Size(min = 2, max = 100) String firstName,
    @NotBlank @Size(min = 2, max = 100) String lastName,
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank String nativeLanguage,
    @NotBlank String targetLanguage,
    String avatarUrl,
    @NotBlank String uiLanguage
) {
}
