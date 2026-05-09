package com.llhelper.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    @NotBlank @Size(min = 2, max = 100) String firstName,
    @NotBlank @Size(min = 2, max = 100) String lastName,
    @NotBlank String nativeLanguage,
    @NotBlank String targetLanguage,
    String avatarUrl,
    @NotBlank String uiLanguage
) {
}
