package com.llhelper.ai.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.llhelper.ai.dto.AiCardData;
import com.llhelper.ai.exception.AiServiceException;
import com.llhelper.ai.provider.OpenAiProvider;
import com.llhelper.ai.util.AiRateLimiter;
import com.llhelper.common.exception.RateLimitExceededException;
import com.llhelper.common.model.Language;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AiCardGenerationServiceTest {

    @Mock
    private OpenAiProvider openAiProvider;

    @Mock
    private AiRateLimiter rateLimiter;

    private AiCardGenerationService aiCardGenerationService;

    private static final String TITLE = "hello";

    @BeforeEach
    void setUp() {
        aiCardGenerationService = new AiCardGenerationService(openAiProvider, rateLimiter);
    }

    @Test
    void generateCardData_shouldThrowAiServiceException_whenProviderNotAvailable() {
        when(openAiProvider.isAvailable()).thenReturn(false);

        assertThatThrownBy(() -> aiCardGenerationService.generateCardData(TITLE, Language.EN, Language.RU))
            .isInstanceOf(AiServiceException.class)
            .hasMessageContaining("AI provider is not available");

        verify(rateLimiter, never()).acquirePermit();
        verify(rateLimiter, never()).validateTokenCount(anyInt());
        verify(openAiProvider, never()).generate(any(), any(), any());
    }

    @Test
    void generateCardData_shouldReturnData_whenProviderAvailableAndWithinLimits() {
        AiCardData aiData = new AiCardData("def", List.of("syn"), List.of("ex"), "trans");
        when(openAiProvider.isAvailable()).thenReturn(true);
        when(openAiProvider.generate(TITLE, Language.EN, Language.RU)).thenReturn(aiData);

        AiCardData result = aiCardGenerationService.generateCardData(TITLE, Language.EN, Language.RU);

        assertThat(result).isEqualTo(aiData);
        verify(rateLimiter).acquirePermit();
        verify(rateLimiter).validateTokenCount(501);
        verify(openAiProvider).generate(TITLE, Language.EN, Language.RU);
    }

    @Test
    void generateCardData_shouldPropagateException_whenRateLimitExceededOnPermit() {
        when(openAiProvider.isAvailable()).thenReturn(true);
        doThrow(new RateLimitExceededException("Too many AI requests. Please try again later."))
            .when(rateLimiter).acquirePermit();

        assertThatThrownBy(() -> aiCardGenerationService.generateCardData(TITLE, Language.EN, Language.RU))
            .isInstanceOf(RateLimitExceededException.class)
            .hasMessageContaining("Too many AI requests");

        verify(rateLimiter, never()).validateTokenCount(anyInt());
        verify(openAiProvider, never()).generate(any(), any(), any());
    }

    @Test
    void generateCardData_shouldPropagateException_whenTokenCountExceeded() {
        when(openAiProvider.isAvailable()).thenReturn(true);
        doThrow(new RateLimitExceededException("Request too large. Maximum 4000 tokens allowed."))
            .when(rateLimiter).validateTokenCount(anyInt());

        assertThatThrownBy(() -> aiCardGenerationService.generateCardData(TITLE, Language.EN, Language.RU))
            .isInstanceOf(RateLimitExceededException.class)
            .hasMessageContaining("Request too large");

        verify(rateLimiter).acquirePermit();
        verify(openAiProvider, never()).generate(any(), any(), any());
    }
}
