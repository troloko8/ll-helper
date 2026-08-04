# MapStruct Edge Cases

Deep reference for uncommon MapStruct situations. Read only when the ordinary mapper pattern (see `backend/.windsurf/rules/mapstruct-conventions.md`) doesn't cover the case.

## Multiple sources

```java
@Mapping(target = "userId", source = "userId")
@Mapping(target = "deckId", source = "deckId")
@Mapping(target = "status", constant = "ACTIVE")
UserDeckProgress toUserDeckProgress(Long userId, Long deckId);
```

## Nested DTOs

```java
@Mapping(target = "progress", source = "progress")
DeckCardResponse toDeckCardResponse(Card card, UserCardProgress progress);
```

## Using other mappers

```java
@Mapper(componentModel = "spring", uses = {CardMapper.class})
public interface DeckMapper {
    DeckResponse toResponse(Deck deck);
}
```

## Timestamps inconsistency

Some entities historically had `@PrePersist`/`@PreUpdate`, some didn't. Current convention: always ignore `createdAt`/`updatedAt` in the mapper, let the database handle them (see `backend/.windsurf/rules/entity-conventions.md`).

## Read-only fields

A field like `Card.deckId` (`insertable = false, updatable = false`, mirrors the `deck` relationship) should not be set directly by the mapper — either ignore it and rely on the relationship, or sync manually after save/refresh from DB.

## Circular dependencies

Avoid mapping cycles between mappers. If unavoidable, use `@Context` to break the cycle.

## Code duplication

Extract helper methods with internal records when a mapper needs to combine data from multiple sources repeatedly (see `LearningServiceImpl.loadDeckCardsWithProgress()` for an example of the pattern this replaces manual mapping with).

## References

- MapStruct docs: https://mapstruct.org/
- Examples: existing mappers in `{module}/mapper/`
