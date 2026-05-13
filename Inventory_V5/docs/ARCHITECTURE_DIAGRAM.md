# Architecture Diagram

```mermaid
flowchart TD
    U[User Browser]

    subgraph FE[Static Front-End]
      H[index.html]
      C[config.js]
      A[app.js]
      S[(Local Storage Session Cache)]
      H --> A
      C --> A
      A <--> S
    end

    subgraph SB[Supabase Platform]
      AU[Auth API]
      RS[PostgREST API]
      DB[(PostgreSQL)]
      RLS[[RLS Policies]]
      AU --> DB
      RS --> RLS
      RLS --> DB
    end

    U --> FE
    A -->|Sign up / Sign in / Refresh / Sign out| AU
    A -->|CRUD: categories, units, inventory_items| RS
    AU -.JWT.-> A
    A -->|apikey + Bearer JWT| RS
```

## Request Flow Notes

- Front-end is served as static files (`npm run start` serves `public`).
- Authentication is done directly against Supabase Auth endpoints.
- Data access is done directly against Supabase PostgREST endpoints.
- Session tokens are persisted in browser local storage and refreshed when close to expiry.
- Inventory data ownership is enforced at database level through RLS on `inventory_items`.
