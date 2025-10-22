# ListIt
Collaborative lists that keep your progress private. ListIt lets you build shared collections, invite friends, and still maintain your own completion state so everyone can focus on the additions that matter without stepping on each other's checkmarks.

## Why ListIt?
- Collaborate without meddling: every item tracks completion per-user, so your progress stays yours.
- Curate any collection: movies, treks, reading lists, grocery runs, you name it.
- Keep things organized: categories, sub-categories, and filters make large lists easy to navigate.
- Bring your team: invite collaborators by email, manage access, and keep a shared source of truth.

## Feature Highlights
- **Per-person progress**: the backend stores each item's `doneBy` UIDs, letting collaborators mark items complete without overwriting anyone else's status.
- **Flexible visibility**: lists can be public, private to the owner, or visible only to collaborators; each user can toggle whether to surface public lists.
- **Category management**: a seeded catalog of default categories plus an admin-only manager for adding, renaming, or pruning categories.
- **Smart item creation**: optional sub-categories with type-ahead suggestions drawn from the list's history.
- **Firebase-powered auth**: Google sign-in on the frontend with Firebase Admin verification on the API keeps routes locked down.
- **Preferences persistence**: user settings (like "Show Public") round-trip through the backend so they stick across sessions and devices.

## Project Structure
```
/
|-- backend/      # Express API, MongoDB models, Firebase Admin integration
`-- frontend/     # React UI, Tailwind styling, Firebase client auth
```

> The repository folder still uses the legacy name `Lister`; the deployed product and brand are **ListIt**.

## Tech Stack

| Layer    | Tools |
|----------|-------|
| Frontend | React 18, React Router, Tailwind CSS, Axios, Framer Motion, Firebase Web SDK |
| Backend  | Node.js, Express, MongoDB with Mongoose, Firebase Admin |
| Auth     | Firebase Authentication (Google sign-in) |
| Hosting  | Local development via `npm`, production-ready for Vercel/Render/Heroku-style deployments |

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB instance (local or Atlas)
- Firebase project with Authentication enabled (Google provider) and a service account key

### 1. Install dependencies
```bash
# Backend
cd backend
npm install

# Frontend (in a second terminal)
cd frontend
npm install
```

### 2. Configure environment variables

Create `.env` files in both `backend/` and `frontend/`. Sample configuration:

**`backend/.env`**
```
PORT=4000
CORS_ORIGIN=http://localhost:3000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
ADMIN_UID=<firebase-admin-user-uid>

# Paste the full JSON for your Firebase service account as single-line JSON.
# You can generate it with: cat serviceAccountKey.json | jq -c .
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"listit","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**`frontend/.env`**
```
REACT_APP_API_BASE_URL=http://localhost:4000
REACT_APP_FIREBASE_API_KEY=<firebase-web-api-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=<project-id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
REACT_APP_FIREBASE_APP_ID=<app-id>
REACT_APP_FIREBASE_MEASUREMENT_ID=<optional-analytics-id>
REACT_APP_ADMIN_UID=<same-admin-uid-as-backend>
```

### 3. Seed default categories
The backend automatically seeds a set of default public categories (`Movies`, `Trips`, `Eateries`, etc.) the first time it connects to MongoDB. Ensure `ADMIN_UID` matches a valid Firebase user so the seeding completes successfully.

### 4. Run the app locally
```bash
# Terminal 1 - API
cd backend
npm run dev

# Terminal 2 - React app
cd frontend
npm start
```

Visit `http://localhost:3000` and sign in with Google to start collaborating.

## Collaboration Without Meddling
- Items fetched from `/items/:listId` are decorated with a user-specific `done` flag computed on the server so everyone sees only their progress.
- Toggling an item calls `PUT /items/:id` which adds or removes the current user's UID in the `doneBy` array so no one else's checkboxes are touched.
- Owners can invite collaborators by email (`POST /lists/:id/collaborators`) and manage access without exposing private completion data.

## API Snapshot

All routes expect a Firebase ID token in the `Authorization: Bearer <token>` header unless noted.

| Method & Path | Description |
|---------------|-------------|
| `GET /` | Health check. |
| `GET /categories` | List public categories (no auth required). |
| `POST /categories` | Create category (auth). Case-insensitive upsert. |
| `PUT /categories/:id` | Rename (owner or admin). |
| `DELETE /categories/:id` | Delete (admin only). |
| `GET /lists` | Visible lists (public, owned, or collaborated). Optional `categoryId` filter. |
| `POST /lists` | Create list, auto-creating category if needed. |
| `PUT /lists/:id` | Update title/category/public flag (owner). |
| `DELETE /lists/:id` | Delete (owner if no foreign items, or admin for public lists). |
| `POST /lists/:id/collaborators` | Invite by email or UID (owner). |
| `DELETE /lists/:id/collaborators/:uid` | Remove collaborator (owner). |
| `GET /items/:listId` | Fetch items with per-user `done` flag. |
| `POST /items` | Add item with optional `subCategory`. |
| `PUT /items/:id` | Toggle current user's done state. |
| `DELETE /items/:id` | Delete item (creator or admin). |
| `GET /preferences` | Fetch (or create) user preference document. |
| `PUT /preferences` | Update `showPublic` preference. |

## Development Notes
- **Auth context**: The frontend stores the Firebase auth user and uses Axios interceptors to attach tokens; ensure you are logged in before making protected requests.
- **Styling**: Tailwind CSS is configured via `tailwind.config.js`. Utility classes drive the UI; tweak or extend as needed.
- **Motion**: Framer Motion adds small layout and hover animations (`ListDetail` cards).
- **Testing & linting**:
  - Frontend: `npm run test` (React Testing Library), `npm run lint`.
  - Backend: add your preferred test runner (none included yet).
- **Deployment**: The included `vercel.json` prepares the frontend for Vercel; deploy the backend separately (Render, Railway, or Firebase Functions) and point `REACT_APP_API_BASE_URL` to it.

## Roadmap Ideas
1. Real-time presence via Firestore or WebSockets so new items appear instantly.
2. Per-item comments or reactions to capture notes without cluttering the main text.
3. Bulk import/export to move lists between workspaces.
4. Mobile-first view refinements for quick check-ins on the go.

---
Happy list-making! If you ship something cool with ListIt, let us know.
