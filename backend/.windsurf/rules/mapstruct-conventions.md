---
trigger: glob
description: MapStruct rules for mapper interfaces and DTO/entity mapping
globs: backend/src/main/java/**/mapper/*.java
---

# MapStruct Conventions Rule

Always use MapStruct for DTO ↔ Entity mapping. Never write manual mapping code in service layer.

## When to Use MapStruct

**REQUIRED for:**
- Entity → Response DTO (`toResponse()`)
- Request DTO → Entity (`toEntity()`, `updateEntity()`)
- Complex nested DTOs
- Batch mapping

**NOT needed for:**
- Auth module (simple token generation)
- Single-field responses (`EnrollResponse(Long id)`)
- Internal helper records (`DeckCardsData`)
- Cross-module mapping (avoid coupling)

## Mapper Interface Pattern

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

## Required @Mapping Ignores

Always ignore in `toEntity()` and `updateEntity()`:

- `@Mapping(target = "id", ignore = true)` — DB-generated
- `@Mapping(target = "createdAt", ignore = true)` — database-managed
- `@Mapping(target = "updatedAt", ignore = true)` — database-managed
- Any JPA relationship field (e.g. `deck`, `authUser`) — set manually in service
- Any read-only/derived field mirroring a relationship (e.g. `deckId`) — ignore or set manually

## Service Layer Pattern

```java
public CardResponse create(Long deckId, CardRequest request) {
    Card card = cardMapper.toEntity(request);   // 1. mapper
    card.setDeck(deck);                          // 2. relationships set manually
    return cardMapper.toResponse(cardRepository.save(card));  // 3. save + map back
}
```

**Don't:** manually set fields one-by-one instead of using the mapper; call a mapper method twice instead of reusing the result.

## Common Mistakes

1. **Forgot to ignore managed fields** → `id` becomes `null`
2. **Mapping relationships in mapper** → should be set in service
3. **Manual mapping when mapper exists** → use mapper
4. **Duplicate mapper calls** → call once, reuse result

## Verification Checklist

- [ ] Mapper exists in `{module}/mapper/`?
- [ ] `@Component` + `@Mapper(componentModel = "spring")`?
- [ ] Managed fields (`id`, `createdAt`, `updatedAt`) ignored?
- [ ] JPA relationships ignored in `toEntity`/`updateEntity`?
- [ ] Manual mapping removed?
- [ ] Relationships set in service, not mapper?

## Complex cases

For multi-source mapping, `@Context`, nested mapping, circular dependencies, or other edge cases, read `docs/backend/mapstruct-edge-cases.md`.

Do not read it for ordinary mappers.
