# Feature Design Note

Read this reference only after the `design-decision` new-document gate has passed and a new document under `docs/features/` is the accepted owner.

## Location and name

- Use `docs/features/<feature-name>.md`.
- Use kebab-case, for example `user-profile.md`.
- Do not create the file when an existing feature or architecture document already owns the facts.

## Content checklist

Adapt the existing `docs/features/` style and include only applicable sections:

- feature title and goal;
- MVP scope and later/post-MVP scope;
- entities and enums;
- API endpoints and request/response implications;
- business logic, including examples when they remove ambiguity;
- security and database constraints;
- main risks and how they are handled;
- Definition of Done covering applicable functional, security, data-integrity, testing, code-quality, documentation, and Git checks;
- expected files changed or created;
- Postman test cases for HTTP contracts.

Make checklist items specific and verifiable. Do not guess endpoints, entities, files, or security behavior; mark unresolved decisions with their owner. Omit empty sections instead of filling them with placeholders.

After writing the note, use `.agents/guidance/documentation-sync.md` to update only affected direct consumers such as Postman, frontend integration contracts, or roadmap owners.
