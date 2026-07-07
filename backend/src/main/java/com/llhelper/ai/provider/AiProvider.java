package com.llhelper.ai.provider;

import com.llhelper.ai.dto.AiCardData;
import com.llhelper.common.model.Language;

public interface AiProvider {

    AiCardData generate(String title, Language sourceLanguage, Language targetLanguage);
//FIXME ckeck it later on invertation
    boolean isAvailable();
}
