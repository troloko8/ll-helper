package com.llhelper.ai.provider;

import com.llhelper.ai.dto.AiCardData;

public interface AiProvider {

    AiCardData generate(String title, String sourceLanguage, String targetLanguage);

    boolean isAvailable();
}
