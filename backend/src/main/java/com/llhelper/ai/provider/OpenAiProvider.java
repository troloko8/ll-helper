package com.llhelper.ai.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.ai.config.AiProperties;
import com.llhelper.ai.dto.AiCardData;
import com.llhelper.ai.exception.AiServiceException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.netty.http.client.HttpClient;

@Component
public class OpenAiProvider implements AiProvider {

    // TODO: Replace with real prompt
//    private static final String PROMPT_TEMPLATE = """
//        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
//        Word: %s
//        From language: %s
//        To language: %s
//
//        Return ONLY valid JSON in this exact format:
//        {
//            "definition": "...",
//            "synonyms": ["...", "...", "..."],
//            "examples": ["...", "...", "..."],
//            "translation": "..."
//        }
//        """;
//    sourceLanguage, targetLanguage
private static final String PROMPT_TEMPLATE = """
    take %s and do in %s language this
    
    Rules:
    - Replace the keyword in examples with "_ _ _ _" while preserving grammar.
    - Do not add extra empty lines.
    - Synonyms: 3 synonyms.
    - Example sentence with the keyword replaced by "_ _ _ _".
    - Translation have tio be direct translation word in %s.
    - Return ONLY valid JSON in this exact format:
    {
        "definition": "...",
        "synonyms": ["...", "...", "..."],
        "examples": ["...", "...", "..."],
        "translation": "..."
    }
""";

    private final AiProperties aiProperties;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public OpenAiProvider(AiProperties aiProperties, ObjectMapper objectMapper) {
        this.aiProperties = aiProperties;
        this.objectMapper = objectMapper;

        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(aiProperties.getRequestTimeoutSeconds()));

        this.webClient = WebClient.builder()
            .baseUrl(aiProperties.getOpenai().getBaseUrl())
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + aiProperties.getOpenai().getApiKey())
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Override
    public AiCardData generate(String title, String sourceLanguage, String targetLanguage) {
        if (!isAvailable()) {
            throw new AiServiceException("OpenAI API key is not configured");
        }

        String prompt = String.format(PROMPT_TEMPLATE, title, sourceLanguage, targetLanguage);

        // TODO: sort this config out later
        Map<String, Object> requestBody = Map.of(
            "model", aiProperties.getOpenai().getModel(),
            "messages", List.of(
                Map.of("role", "system", "content", "You are a helpful language learning assistant."),
                Map.of("role", "user", "content", prompt)
            ),
            "response_format", Map.of("type", "json_object"),
            "max_tokens", aiProperties.getMaxTokensPerRequest()
        );

        try {
            String response = webClient.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            return parseResponse(response);
        } catch (WebClientResponseException e) {
            throw new AiServiceException("OpenAI API error: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new AiServiceException("Failed to generate card data: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isAvailable() {
        return aiProperties.getOpenai().getApiKey() != null &&
               !aiProperties.getOpenai().getApiKey().isBlank();
    }

    private AiCardData parseResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode content = root.path("choices").get(0).path("message").path("content");
            return objectMapper.readValue(content.asText(), AiCardData.class);
        } catch (Exception e) {
            throw new AiServiceException("Failed to parse AI response", e);
        }
    }
}
