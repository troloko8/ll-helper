package com.llhelper.ai.config;

import com.llhelper.ai.util.AiRateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public AiRateLimiter aiRateLimiter(AiProperties aiProperties) {
        return new AiRateLimiter(aiProperties.getMaxRequestsPerSecond(), aiProperties.getMaxTokensPerRequest());
    }
}
