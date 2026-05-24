package com.llhelper.ai.dto;

import java.util.List;
// TODO: denote it's a res or req DTO
public record AiCardData(
    String definition,
    List<String> synonyms,
    List<String> examples,
    String translation
) {
}
