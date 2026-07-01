package com.llhelper.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank @Size(min = 2, max = 100, message = "firstName must be between 2 and 100 characters") String firstName,
    @NotBlank @Size(min = 2, max = 100, message = "lastName must be between 2 and 100 characters") String lastName,
    @NotBlank @Size(min = 3, max = 50, message = "username must be between 3 and 50 characters") String username,
    @NotBlank @Size(min = 2, max = 10, message = "nativeLanguage must be between 2 and 10 characters")
    @Pattern(regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$", message = "nativeLanguage must be a valid ISO language code (e.g. en, ru, zh-CN)")
    String nativeLanguage,
    // TODO: in future need expand to multiple languages
    @NotBlank @Size(min = 2, max = 10, message = "targetLanguage must be between 2 and 10 characters")
    @Pattern(regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$", message = "targetLanguage must be a valid ISO language code (e.g. en, ru, zh-CN)")
    String targetLanguage,
    String avatarUrl,
    // TODO: todo an enums for this
    @NotBlank @Size(min = 2, max = 10, message = "uiLanguage must be between 2 and 10 characters")
    @Pattern(regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$", message = "uiLanguage must be a valid ISO language code (e.g. en, ru, zh-CN)")
    String uiLanguage
) {
}
