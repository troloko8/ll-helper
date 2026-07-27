package com.llhelper.ai.provider;

import static org.assertj.core.api.Assertions.assertThat;

import com.llhelper.ai.config.AiProperties;
import com.llhelper.ai.parser.AiResponseParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OpenAiProviderTest {

    @Mock
    private AiResponseParser aiResponseParser;

    private OpenAiProvider openAiProvider(String apiKey) {
        AiProperties aiProperties = new AiProperties();
        aiProperties.getOpenai().setApiKey(apiKey);
        return new OpenAiProvider(aiProperties, aiResponseParser);
    }

    @Test
    void isAvailable_shouldReturnTrue_whenApiKeyIsSet() {
        OpenAiProvider provider = openAiProvider("sk-test-key");

        assertThat(provider.isAvailable()).isTrue();
    }

    @Test
    void isAvailable_shouldReturnFalse_whenApiKeyIsNull() {
        OpenAiProvider provider = openAiProvider(null);

        assertThat(provider.isAvailable()).isFalse();
    }

    @Test
    void isAvailable_shouldReturnFalse_whenApiKeyIsBlank() {
        OpenAiProvider provider = openAiProvider("   ");

        assertThat(provider.isAvailable()).isFalse();
    }
}
