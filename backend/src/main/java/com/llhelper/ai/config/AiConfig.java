package com.llhelper.ai.config;

import com.llhelper.ai.util.RateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public RateLimiter rateLimiter(AiProperties aiProperties) {
        return new RateLimiter(aiProperties.getMaxRequestsPerSecond());
    }
}
