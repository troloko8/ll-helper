package com.llhelper.ai.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.ai.dto.AiCardData;
import com.llhelper.ai.exception.AiServiceException;
import org.springframework.stereotype.Component;

@Component
public class AiResponseParser {

    private final ObjectMapper objectMapper;

    public AiResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AiCardData parse(String rawResponse) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode content = root.path("choices").get(0).path("message").path("content");
            return objectMapper.readValue(content.asText(), AiCardData.class);
        } catch (Exception e) {
            throw new AiServiceException("Failed to parse AI response", e);
        }
    }
}
