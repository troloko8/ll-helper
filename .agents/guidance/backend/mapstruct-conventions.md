# MapStruct Conventions — Backend

Apply these conventions when creating, modifying, or reviewing mapper interfaces and DTO/entity mapping.

Use MapStruct for entity-to-response, request-to-entity, update, nested, and batch mapping. Manual field-by-field mapping does not belong in services.

MapStruct is unnecessary for simple auth token generation, a single-field response such as `EnrollResponse(Long id)`, internal helper records, or cross-module mapping that would create coupling.

## Mapper interface pattern

```java
@Component
@Mapper(componentModel = "spring")
public interface CardMapper {

    @Mapping(target = "deckId", source = "deck.id")
    CardResponse toResponse(Card card);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deck", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Card toEntity(CardRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deck", ignore = true)
    @Mapping(target = "deckId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CardRequest request, @MappingTarget Card card);
}
```

In `toEntity()` and `updateEntity()`, ignore database-generated IDs, database-managed timestamps, JPA relationships, and read-only/derived fields that mirror relationships. Set relationships explicitly in the service.

```java
public CardResponse create(Long deckId, CardRequest request) {
    Card card = cardMapper.toEntity(request);
    card.setDeck(deck);
    return cardMapper.toResponse(cardRepository.save(card));
}
```

Do not call a mapper twice when one result can be reused.

## Verification

- Mapper is in `{module}/mapper/`.
- It has `@Component` and `@Mapper(componentModel = "spring")`.
- Managed fields and relationships are ignored on request mapping.
- Relationships are assigned in services.
- Existing manual mapping is removed where the mapper owns it.

For multi-source mapping, `@Context`, nested mapping, circular dependencies, or architecture edge cases, read `docs/backend/mapstruct-edge-cases.md`. Do not load that document for ordinary mappers.
