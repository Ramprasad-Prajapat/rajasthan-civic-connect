# RAJCIVIC CONNECT — ANTIGRAVITY RECOVERY MASTER PROMPT
## Compact, resumable, one-run execution

Repository:
`R:\Inernship\WebDevelopment\Project\rajasthan-civic-connect`

Branch:
`feature/next-phase`

The previous Antigravity run terminated due to an agent/runtime error. Resume from the current repository state. Do not restart the project and do not rely on any previous chat response.

This prompt is intentionally compact. Execute it in internal checkpoints and continue automatically. If the same prompt is run again, inspect current Git state and resume without repeating completed changes.

## Hard rules

- Preserve every pre-existing user change and legitimate Phase 1–6 feature.
- Do not redesign UI or alter unrelated pages, colors, layout, content, animations, routes, roles, AI modules, dashboards, or complaint features.
- Do not use broad Git restore/reset/clean commands.
- Do not commit, push, deploy, or rotate cloud credentials automatically.
- Do not print secrets, private keys, passwords, full tokens, or Authorization headers.
- Use the smallest correct patch.
- Do not stop with a plan or progress-only message.
- Finish all locally executable work and provide one final report.

## Checkpoint 1 — Current state and secret safety

From repository root run:

```bash
git status --short
git diff --cached --stat
git diff --cached --name-only
git diff --stat
git diff --name-only
git diff --check
git diff --cached --check
git check-ignore -v backend/.env
git ls-files backend/.env
git grep -n -I -E "BEGIN (RSA )?PRIVATE KEY|FIREBASE_PRIVATE_KEY=|JWT_SECRET=" -- . ":!backend/.env" ":!frontend/.env"
```

Requirements:

1. `backend/.env` and `frontend/.env` must remain local and ignored.
2. No real private key, service-account JSON, password, or secret may be staged/tracked.
3. If an `.env` file is tracked, remove it from Git tracking without deleting the local file.
4. Keep only placeholders in `.env.example` and `.env.production.example`.
5. Do not display any secret value.
6. Record that the already exposed Firebase service-account key requires external revocation/rotation before production approval.

## Checkpoint 2 — Inspect only the auth/config surface

Read completely:

```text
backend/config/firebaseAdmin.js
backend/config/envValidation.js
backend/controllers/authController.js
backend/middleware/authMiddleware.js
backend/routes/authRoutes.js
backend/server.js
backend/package.json
frontend/src/firebase.js
frontend/src/firestoreService.js
frontend/src/components/LoginRegister.jsx
frontend/src/App.jsx
frontend/src/main.jsx
frontend/vite.config.js
frontend/package.json
firestore.rules
render.yaml
vercel.json
```

Search for:

```text
createUserWithEmailAndPassword
signInWithEmailAndPassword
onAuthStateChanged
signOut
getIdToken
verifyIdToken
jsonwebtoken
JWT_SECRET
MOCK_TOKEN
scryptSync
passwordHash
passwordSalt
/api/auth/login
/api/auth/register
initializeApp
CORS_ORIGINS
FRONTEND_URL
VITE_API_BASE_URL
```

Identify the actual current Login/Register path and any duplicate Firebase/custom-JWT flow.

## Checkpoint 3 — Restore one Firebase authentication contract

The intended contract is:

```text
React Firebase Client SDK
→ Firebase Authentication
→ Firebase ID Token
→ Express Authorization header
→ Firebase Admin verifyIdToken()
→ Firestore users/{firebaseUid}
```

Implement only what is necessary so that:

1. Registration uses `createUserWithEmailAndPassword`.
2. Login uses `signInWithEmailAndPassword`.
3. Logout uses Firebase `signOut`.
4. Refresh/session restoration uses one `onAuthStateChanged` listener.
5. Protected backend requests obtain `user.getIdToken()` and send it as Bearer token.
6. Backend middleware verifies the token through Firebase Admin `verifyIdToken`.
7. Firebase UID is the canonical identity.
8. User profile is read/written at `users/{uid}` or the existing UID-based equivalent.
9. Public registration always creates Citizen privileges only.
10. Role/portal values are loaded from trusted Firestore data or verified claims, never trusted from client input.
11. Missing/invalid token returns 401; authenticated-but-forbidden returns 403.
12. No normal Firebase Login/Register path uses custom JWT, `JWT_SECRET`, custom password hashes, `MOCK_TOKEN`, or a backend password database.
13. Remove only duplicate/conflicting custom-auth logic proven unused by the Firebase path.
14. Do not remove unrelated uses of a dependency until repository-wide search proves they are unused.

## Checkpoint 4 — Form validation and duplicate-submit prevention

Preserve the existing UI while enforcing:

- required trimmed full name;
- valid email;
- Indian 10-digit mobile beginning 6/7/8/9;
- password at least 8 characters with uppercase, lowercase, number, and special character;
- matching confirmation;
- required terms checkbox.

When invalid:

- show an inline message;
- send no Firebase or backend request;
- create no user/profile;
- stop loading.

During submission:

- disable the submit button;
- one click produces one Firebase operation;
- rapid clicks do not produce duplicates;
- always restore controls after success/failure.

Map Firebase errors to safe messages for invalid email, weak password, existing email, invalid credentials, disabled user, too many requests, network failure, and configuration failure.

## Checkpoint 5 — Environment and deployment variables

Backend local/production variables must use placeholders/documented names only:

```text
NODE_ENV
PORT
FRONTEND_URL
CORS_ORIGINS
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Requirements:

1. Load backend `.env` reliably from the backend directory.
2. Convert escaped private-key newlines safely without logging the key.
3. Production must fail safely when Firebase Admin credentials are missing.
4. Production must never silently fall back to local/in-memory auth or data.
5. Firebase Login/Register must not require `JWT_SECRET`.

Frontend Vite variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_API_BASE_URL
```

Never expose Admin credentials to frontend.

Review `render.yaml`, `vercel.json`, and workflows. Keep variable names/placeholders only; no real secrets and no automatic deployment.

## Checkpoint 6 — CORS and health

Use one environment-driven CORS implementation.

Local allowed origins must match the actual frontend port, preferably:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Use Vite strict port. Do not use `*` with credentials.

Verify:

```text
GET /health
GET /api/health
GET /api/health/deep
```

Deep health must report truthful Firebase status and expose no secret.

## Checkpoint 7 — Safe Git cleanup

Classify changed files as:

- required auth/env fix;
- legitimate Phase 1–6 work to preserve;
- temporary debugging artifact;
- unrelated accidental agent change;
- sensitive file.

Special handling:

1. Preserve legitimate staged AI, audit, SLA, background-job, documentation, workflow, test, and deployment work.
2. Do not stage old RAJCIVIC prompt files.
3. Remove only clearly temporary prompt/debug files created during this troubleshooting.
4. Remove an accidental root `package-lock.json` only when no root package/workspace requires it.
5. Keep `backend/ecosystem.config.cjs` only when it is an intentional validated deployment file with no secrets.
6. Clean only QA accounts created during testing from `localDb.json`; preserve legitimate data.
7. Remove one-off `testRegister.js`/`testLogin.js` scripts when they are not maintained tests.
8. Never use `git add .`; stage only explicit verified files when staging is necessary.
9. Do not force a clean status by deleting legitimate work.

## Checkpoint 8 — Tests and browser validation

Use existing Node/Vitest/Playwright tooling. Do not add another large framework.

Run every available relevant command:

```text
backend install/check
backend tests
frontend lint
frontend tests
frontend production build
Playwright/E2E tests
```

Missing scripts must be reported as NOT AVAILABLE.

Verify:

- backend starts;
- frontend starts;
- Firebase register;
- Firebase login;
- logout;
- refresh persistence;
- duplicate email;
- invalid login;
- ID token sent to protected backend API;
- backend verifies token;
- missing/invalid token rejected;
- Citizen denied Admin route;
- no duplicate request;
- no CORS error;
- no unexpected 500;
- no password/private key/secret in requests or responses.

Responsive browser sizes:

```text
375x812
498x668
768x1024
1440x900
```

Do not claim browser PASS from curl/API-only tests.

## Checkpoint 9 — Final process state and diff

Before completion run:

```bash
git status --short
git diff --cached --stat
git diff --cached --name-only
git diff --cached --check
git diff --stat
git diff --name-only
git diff --check
```

Confirm:

- no `.env` or private key tracked;
- no custom JWT Login/Register path;
- no duplicate auth flow;
- no temporary prompt/debug artifact intended for deletion;
- no unrelated UI change;
- frontend build passes;
- reports match real evidence.

Leave exactly one backend process and one frontend process running. Report actual URLs.

## Final response format

Use exactly:

1. Agent Recovery Status
2. Security Exposure Status
3. Root Causes
4. Authentication Flow After Fix
5. Environment and Deployment Fixes
6. Duplicate Code Removed
7. Files Modified
8. Files Preserved
9. Files Removed
10. Git Status Summary
11. Commands Run
12. Backend Test Results
13. Frontend Test Results
14. Browser and Responsive Results
15. Runtime URLs
16. External Actions Required
17. Final Verdict

Use PASS, FAIL, BLOCKED, or NOT AVAILABLE.

Local verdict may be `LOCAL MANUAL TEST READY` only when critical local checks pass.

Production verdict must remain BLOCKED until the exposed Firebase service-account key is revoked/rotated externally and production Firebase/deployment configuration is genuinely verified.

Begin now from Checkpoint 1 and continue through the final response without asking for another prompt.
