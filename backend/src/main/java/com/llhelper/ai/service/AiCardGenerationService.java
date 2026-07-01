package com.llhelper.ai.service;

import com.llhelper.ai.dto.AiCardData;
import com.llhelper.ai.exception.AiServiceException;
import com.llhelper.ai.provider.AiProvider;
import com.llhelper.ai.provider.OpenAiProvider;
import com.llhelper.ai.util.AiRateLimiter;
import org.springframework.stereotype.Service;

@Service
public class AiCardGenerationService {

    private final AiProvider aiProvider;
    private final AiRateLimiter rateLimiter;

    public AiCardGenerationService(
        OpenAiProvider openAiProvider,
        AiRateLimiter rateLimiter
    ) {
        this.rateLimiter = rateLimiter;
        this.aiProvider = openAiProvider;
    }

    public AiCardData generateCardData(String title, String sourceLanguage, String targetLanguage) {
        if (!aiProvider.isAvailable()) {
            throw new AiServiceException("AI provider is not available. Check API configuration.");
        }

        rateLimiter.acquirePermit();
        rateLimiter.validateTokenCount(estimateTokens(title));

        return aiProvider.generate(title, sourceLanguage, targetLanguage);
    }

    private int estimateTokens(String text) {
        return (int) (text.length() / 4.0) + 500;
    }
}
