package com.llhelper.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    // default values
    private String provider = "openai";
    private int requestTimeoutSeconds = 120;
    private int maxRequestsPerSecond = 10;
    private int maxTokensPerRequest = 4000;
    private int maxBulkSize = 100;

    private OpenAi openai = new OpenAi();

    @Getter
    @Setter
    public static class OpenAi {
        private String apiKey;
        private String model = "gpt-4o-mini";
        private String baseUrl = "https://api.openai.com/v1";
    }
}
