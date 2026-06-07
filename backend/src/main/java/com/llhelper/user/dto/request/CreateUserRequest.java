package com.llhelper.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank @Size(min = 2, max = 100, message = "firstName must be between 2 and 100 characters") String firstName,
    @NotBlank @Size(min = 2, max = 100, message = "lastName must be between 2 and 100 characters") String lastName,
    @NotBlank @Size(min = 3, max = 50, message = "username must be between 3 and 50 characters") String username,
    @NotBlank String nativeLanguage,
    // TODO: in future need expand to multiple languages
    @NotBlank String targetLanguage,
    String avatarUrl,
    // TODO: todo an enums for this
    @NotBlank String uiLanguage
) {
}
