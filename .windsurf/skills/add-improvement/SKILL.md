---
name: add-improvement
description: Adds a new improvement item to backend/IMPROVEMENTS.md following the established format
---

Add a new improvement item to `/Users/troloko/LLHelper/ll-helper/backend/IMPROVEMENTS.md` following the existing format:

## File Structure

The file uses Markdown with these sections:
- Performance
- Security
- Architecture
- Database
- Testing
- Documentation

## Format Rules

1. Each item must be a checkbox: `- [ ] description`
2. Use **bold** for the main title if it needs detailed explanation
3. Add context on new lines with 2-space indentation:
   ```
   - [ ] **Title in bold**
     Context line 1
     Context line 2
     Files: `file1.java`, `file2.java`
   ```
4. Place the item in the most appropriate category section
5. If category doesn't exist — create it following existing pattern (`## CategoryName`)

## Categories Guide

- **Performance** — optimization, caching, reducing DB queries
- **Security** — auth, rate limiting, HTTPS, validation
- **Architecture** — code structure, patterns, logging
- **Database** — migrations, indexes, schema changes
- **Testing** — unit tests, integration tests, coverage
- **Documentation** — swagger, API docs, README updates

## Steps

1. Read the current IMPROVEMENTS.md to understand context
2. Determine the appropriate category (ask user if unclear)
3. Format the item following rules above
4. Add to the file in the correct section
5. If adding to existing section with items — place at the end of list
6. If section is empty — add after the `## SectionName` header

Always maintain consistent formatting with existing items.
