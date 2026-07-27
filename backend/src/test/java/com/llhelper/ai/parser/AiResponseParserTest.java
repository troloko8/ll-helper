package com.llhelper.ai.parser;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.ai.dto.AiCardData;
import com.llhelper.ai.exception.AiServiceException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AiResponseParserTest {

    private AiResponseParser aiResponseParser;

    @BeforeEach
    void setUp() {
        aiResponseParser = new AiResponseParser(new ObjectMapper());
    }

    @Test
    void parseResponse_validJson_shouldReturnAiCardData() {
        String rawResponse = """
            {
                "choices": [
                    {
                        "message": {
                            "content": "{\\"definition\\":\\"def\\",\\"synonyms\\":[\\"a\\",\\"b\\"],\\"examples\\":[\\"ex1\\"],\\"translation\\":\\"trans\\"}"
                        }
                    }
                ]
            }
            """;

        AiCardData result = aiResponseParser.parse(rawResponse);

        assertThat(result).isEqualTo(new AiCardData("def", List.of("a", "b"), List.of("ex1"), "trans"));
    }

    @Test
    void parseResponse_invalidJson_shouldThrowException() {
        String rawResponse = "not a json at all";

        assertThatThrownBy(() -> aiResponseParser.parse(rawResponse))
            .isInstanceOf(AiServiceException.class)
            .hasMessageContaining("Failed to parse AI response");
    }
}
