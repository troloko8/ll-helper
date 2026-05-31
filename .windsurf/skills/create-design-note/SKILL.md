---
name: create-design-note
description: Creates a design note file for a new feature following the established template in docs/features/
---

Create a design note file in `/Users/troloko/LLHelper/ll-helper/docs/features/` following the established template.

## Template Structure

The file should follow this structure (example: `learning-mode.md`):

```markdown
# Feature: {FeatureName}

## Goal
Brief description of what this feature accomplishes.

## MVP
- Core functionality item 1
- Core functionality item 2
- ...

## Later (Post-MVP)
- Future enhancement 1
- Future enhancement 2
- ...

## Entities
- Entity1 — description
- Entity2 — description
- ...

## Enums (if applicable)
- EnumName: VALUE1, VALUE2, ...

## API Endpoints
- `METHOD /path` — description
- ...

## Business Logic
Describe key business rules, algorithms, priority logic.

### Example Logic (if applicable)
```
rule1 → result1
rule2 → result2
```

## Security
List security concerns and how they're handled:
- Risk 1 → Handling approach
- Risk 2 → Handling approach

## Database Constraints (if applicable)
```sql
-- Example CHECK constraints
CHECK (status IN ('VALUE1', 'VALUE2'))
```

## Main Risks (Handled)
- Risk description 1
- Risk description 2

---

## Definition of Done

### Functional
- [ ] Specific functional requirement 1
- [ ] Specific functional requirement 2
- [ ] ...

### Security
- [ ] Security check 1
- [ ] Security check 2
- [ ] ...

### Data Integrity
- [ ] Data integrity check 1
- [ ] Data integrity check 2
- [ ] ...

### Testing
- [ ] Test case 1
- [ ] Test case 2
- [ ] ...

### Code Quality
- [ ] Code convention check 1
- [ ] Code convention check 2
- [ ] ...

### Documentation
- [ ] Documentation requirement 1
- [ ] Documentation requirement 2
- [ ] ...

### Git
- [ ] Git requirement 1
- [ ] ...

---

## Files Changed/Created

### New Files
- `path/to/NewFile1.java`
- `path/to/NewFile2.java`
- ...

### Modified Files
- `path/to/ExistingFile.java` — what changed
- ...

---

## Postman Test Cases

### Test Case 1
```
METHOD /path
Expected: STATUS description
Body: { ... }
```

### Test Case 2
...
```

## Steps

1. Ask user for feature name (or infer from context)
2. Ask for key details:
   - Goal of the feature
   - MVP scope (what's included now)
   - Post-MVP scope (what's for later)
   - Main entities involved
   - API endpoints planned
   - Security concerns
3. Create file at `/Users/troloko/LLHelper/ll-helper/docs/features/{feature-name}.md`
4. Fill template with provided information
5. Ensure Definition of Done checkboxes are specific and actionable
6. List expected files to be created/modified
7. Include Postman test case examples

## File Naming

- Use kebab-case: `feature-name.md`
- Examples: `learning-mode.md`, `user-profile.md`, `spaced-repetition.md`

## Location

Always create in: `/Users/troloko/LLHelper/ll-helper/docs/features/`
