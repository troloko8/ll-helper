---
name: add-postman-request
description: Adds a new API request to LLHelper.postman_collection.json
---

Add a new API request to `/Users/troloko/LLHelper/ll-helper/LLHelper.postman_collection.json` following Postman v2.1 format.

## File Structure

The collection uses Postman v2.1 schema with:
- `info` — metadata (name, description)
- `item[]` — folders (Auth, Users, Cards, CardDescs, etc.)
  - Each folder has `name` and `item[]` (array of requests)
- `item[].request` — request details:
  - `method`: GET, POST, PUT, DELETE
  - `header`: array of headers (Content-Type, Authorization)
  - `url`: full URL with http://localhost:8080
  - `body`: for POST/PUT (mode: "raw", raw: JSON string)
- `variable[]` — collection variables (token, baseUrl)

## Folder Mapping Rules

Map endpoint prefix to folder name:
- `/api/v1/auth/*` → "Auth"
- `/api/v1/users/*` → "Users"
- `/api/v1/cards/*` → "Cards"
- `/api/v1/card-descs/*` → "CardDescs"

Create new folder if doesn't exist, using controller name without "Controller" suffix.

## Request Format

```json
{
  "name": "Descriptive Name",
  "request": {
    "method": "POST",
    "header": [
      {"key": "Content-Type", "value": "application/json"},
      {"key": "Authorization", "value": "Bearer {{token}}"}
    ],
    "url": "http://localhost:8080/api/v1/endpoint",
    "body": {
      "mode": "raw",
      "raw": "{\n  \"field\": \"value\"\n}"
    }
  }
}
```

## Auth Header Rules

- **Add Authorization** for all endpoints EXCEPT `/api/v1/auth/*`
- Value format: `"Bearer {{token}}"` (uses collection variable)
- Content-Type: always `"application/json"` for POST/PUT

## Steps

1. Check if collection file exists:
   - If YES: read and parse JSON
   - If NO: create new collection structure with empty `item[]` and `variable[]`

2. Determine folder name from endpoint path

3. Find or create folder in `item[]` array

4. Add request to folder's `item[]` array at the end

5. Ensure collection has `variable` array with at least:
   ```json
   {"key": "token", "value": "", "type": "string"}
   ```

6. Save file with proper JSON formatting (2-space indentation)

## Example Collection Structure

```json
{
  "info": {
    "name": "LLHelper API",
    "description": "API collection for LLHelper backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": "http://localhost:8080/api/v1/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {"key": "token", "value": "", "type": "string"}
  ]
}
```
