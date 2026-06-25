# MapStruct Conventions Rule

Always use MapStruct for DTO ↔ Entity mapping. Never write manual mapping code in service layer.

---

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

---

## Mapper Interface Pattern

```java
@Component
@Mapper(componentModel = "spring")
public interface UserMapper {
    
    UserResponse toResponse(User entity);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "authUser", ignore = true)
    User toEntity(CreateUserRequest request);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "username", ignore = true)
    void updateEntity(UpdateUserRequest request, @MappingTarget User entity);
}
```

---

## Required @Mapping Ignores

Always ignore in `toEntity()` and `updateEntity()`:

- `@Mapping(target = "id", ignore = true)` — DB-generated
- `@Mapping(target = "createdAt", ignore = true)` — @PrePersist or manual
- `@Mapping(target = "updatedAt", ignore = true)` — @PreUpdate or manual
- `@Mapping(target = "authUser", ignore = true)` — JPA relationships
- `@Mapping(target = "cardDesc", ignore = true)` — Set manually in service
- `@Mapping(target = "cardDescId", ignore = true)` — Read-only fields

---

## Service Layer Pattern

### ✅ Correct

```java
@Service
@RequiredArgsConstructor
public class UserServiceImpl {
    private final UserMapper userMapper;
    
    public UserResponse createUser(CreateUserRequest request) {
        // 1. Use mapper
        User user = userMapper.toEntity(request);
        
        // 2. Set relationships manually
        user.setAuthUser(authUser);
        
        // 3. Save and return
        return userMapper.toResponse(userRepository.save(user));
    }
}
```

### ❌ Wrong

```java
// DON'T: Manual mapping
User user = new User();
user.setFirstName("John");
user.setLastName("Doe");
// ... 10 more setters instead of using mapper

// DON'T: Duplicate calls
DeckCardResponse resp = mapper.toDeckCardResponse(card, progress);
return mapper.toDeckCardResponse(card, progress);  // Called twice!
```

---

## Common Mistakes

1. **Forgot to ignore managed fields** → `id` becomes `null`
2. **Mapping relationships in mapper** → should be set in service
3. **Manual mapping when mapper exists** → use mapper
4. **Duplicate mapper calls** → call once, reuse result

---

## Complex Cases

### Multiple sources:
```java
@Mapping(target = "userId", source = "userId")
@Mapping(target = "deckId", source = "deckId")
@Mapping(target = "status", constant = "ACTIVE")
UserDeckProgress toUserDeckProgress(Long userId, Long deckId);
```

### Nested DTOs:
```java
@Mapping(target = "progress", source = "progress")
DeckCardResponse toDeckCardResponse(Card card, UserCardProgress progress);
```

### Using other mappers:
```java
@Mapper(componentModel = "spring", uses = {CardMapper.class})
public interface CardDescMapper {
    CardDescResponse toResponse(CardDesc cardDesc);
}
```

---

## Edge Cases

**Timestamps inconsistency:** Some entities have `@PrePersist`, some don't → always ignore in mapper, handle in service

**Read-only fields:** `Card.cardDescId` (insertable=false) → manual sync after save or refresh from DB

**Circular dependencies:** Avoid. If unavoidable → use `@Context`

**Code duplication:** Extract helper methods with internal records (see `LearningServiceImpl.loadDeckCardsWithProgress()`)

---

## Verification Checklist

- [ ] Mapper exists in `{module}/mapper/`?
- [ ] `@Component` + `@Mapper(componentModel = "spring")`?
- [ ] Managed fields (`id`, `createdAt`, `updatedAt`) ignored?
- [ ] JPA relationships ignored?
- [ ] Manual mapping removed?
- [ ] Relationships set in service?

---

## Current Status

**Modules with mappers:**
- ✅ User, Card, CardDesc, Learning

**Modules without mappers (intentional):**
- Auth (simple token generation)

---

## References

- **MapStruct docs:** https://mapstruct.org/
- **Examples:** See existing mappers in `{module}/mapper/`
- **Roadmap:** Sprint 0.2 Task #6 (DONE)
- **TODO Sprint 0.3:** Унифицировать timestamps (@PrePersist everywhere)
