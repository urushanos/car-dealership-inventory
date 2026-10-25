# TurnoverTechnologies Web

React (Vite) frontend for the car dealership inventory system.

## Scripts

```bash
npm run dev -w apps/web
```

The app runs on http://localhost:3000 and expects the API at http://localhost:5000.

Optional env (`apps/web/.env`):

```
VITE_API_URL=http://localhost:5000/api
```

Bearer tokens are kept in memory. Reload the page to sign in again.
