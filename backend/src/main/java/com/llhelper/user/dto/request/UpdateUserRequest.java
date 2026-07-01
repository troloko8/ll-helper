package com.llhelper.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    @NotBlank @Size(min = 2, max = 100) String firstName,
    @NotBlank @Size(min = 2, max = 100) String lastName,
    @NotBlank @Size(min = 2, max = 10, message = "nativeLanguage must be between 2 and 10 characters")
    @Pattern(regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$", message = "nativeLanguage must be a valid ISO language code (e.g. en, ru, zh-CN)")
    String nativeLanguage,
    @NotBlank @Size(min = 2, max = 10, message = "targetLanguage must be between 2 and 10 characters")
    @Pattern(regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$", message = "targetLanguage must be a valid ISO language code (e.g. en, ru, zh-CN)")
    String targetLanguage,
    String avatarUrl,
    @NotBlank @Size(min = 2, max = 10, message = "uiLanguage must be between 2 and 10 characters")
    @Pattern(regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$", message = "uiLanguage must be a valid ISO language code (e.g. en, ru, zh-CN)")
    String uiLanguage
) {
}
