# RAJCIVIC CONNECT — FINAL ONE-SHOT ANTIGRAVITY MASTER PROMPT
## Firebase Login/Register Fix • Environment/Deployment Variables • Duplicate-Code Cleanup • Safe Git-Status Cleanup • No Unrelated Changes

You are working inside the existing repository:

`R:\Inernship\WebDevelopment\Project\rajasthan-civic-connect`

Active branch:

`feature/next-phase`

This is an existing project with substantial staged Phase 1–6 work. Do not create a new project. Do not redesign the application. Do not replace working features. Do not return only a plan.

The user will not provide another implementation prompt. Complete all locally executable inspection, repair, cleanup, testing, and manual-testing handoff work in this single execution.

---

# 0. PRIMARY OBJECTIVES

Complete all of the following in one controlled run:

1. Fix the Login issue.
2. Fix the Register issue.
3. Restore one consistent Firebase Authentication flow.
4. Fix local and production environment-variable handling.
5. Fix deployment-variable configuration without hardcoding secrets.
6. Remove duplicated/conflicting authentication code.
7. Stop repeated edits that keep changing the same files without resolving the root cause.
8. Preserve all legitimate Phase 1–6 work already present in the Git index.
9. Remove only clearly unwanted debugging/runtime artifacts.
10. Produce an intentional, reviewable Git state.
11. Run real validation and leave the project ready for manual testing.
12. Do not commit, push, or deploy automatically.

---

# 1. CRITICAL SECURITY INCIDENT — HANDLE BEFORE NORMAL CODING

A Firebase service-account private key and a local JWT secret were exposed in terminal/chat output.

Treat both as compromised.

Never print, quote, copy, echo, log, commit, screenshot, or reproduce their values.

Perform these safe checks from the repository root:

```bash
git check-ignore -v backend/.env
git ls-files backend/.env
git ls-files | grep -Ei '(^|/)\.env($|\.)|service.?account|\.pem$|\.key$'
git grep -n -I -E 'BEGIN (RSA )?PRIVATE KEY|FIREBASE_PRIVATE_KEY=|JWT_SECRET=' -- . \
  ':!backend/.env' ':!frontend/.env'
git log --all --oneline -S 'BEGIN PRIVATE KEY'
```

Rules:

1. `backend/.env` and `frontend/.env` must not be tracked.
2. If a real `.env` is tracked, remove it from Git tracking without deleting the local file:

```bash
git rm --cached backend/.env
git rm --cached frontend/.env
```

Run only for files that are actually tracked.

3. Ensure root `.gitignore` protects:
   - `.env`
   - `.env.*`
   - `!.env.example`
   - `!.env.production.example`
   - Firebase service-account JSON files
   - `*.pem`
   - `*.key`
   - logs
   - test artifacts
   - build folders
   - `node_modules`
   - local temporary backup files
4. Do not put real values in any example file.
5. Do not rewrite Git history automatically.
6. Do not rotate/delete cloud credentials automatically unless the connected environment explicitly supports the approved action.
7. Final output must clearly state:

```text
EXTERNAL SECURITY ACTION REQUIRED:
Revoke/delete the exposed Firebase service-account key in Google Cloud IAM,
create a replacement only if still required, and update deployment secrets.
```

8. If custom JWT is no longer part of authentication, remove its Login/Register dependency.
9. If `JWT_SECRET` is used by another legitimate feature, rotate it locally and in deployment secrets without displaying the replacement.
10. Production readiness remains BLOCKED until the exposed service-account key is revoked/rotated externally.

---

# 2. NON-NEGOTIABLE AUTHENTICATION ARCHITECTURE

Firebase Authentication is the only Login/Register provider.

Required architecture:

```text
React frontend
→ Firebase Client SDK
→ Firebase Authentication
→ Firebase ID Token
→ Authorization: Bearer <Firebase ID Token>
→ Express backend
→ Firebase Admin SDK verifyIdToken()
→ Firestore profile users/{firebaseUid}
```

Do not use for normal Login/Register:

- `jsonwebtoken`
- custom `JWT_SECRET`
- `crypto.scryptSync()` password authentication
- custom password hashes/salts
- custom backend password database
- editable mock tokens
- base64 role tokens
- a second login/register request that duplicates Firebase Auth

Do not use the Firebase private key as a JWT secret.

Do not create a second authentication architecture.

If `jsonwebtoken` is used for an unrelated valid feature, keep that unrelated usage isolated. Remove it from Login/Register only after confirming all references.

---

# 3. EXECUTION MODE — DO NOT STOP AT A PLAN

Use this loop until completion:

```text
inspect
→ compare with last known working code
→ reproduce
→ identify one root cause
→ apply smallest patch
→ rerun affected test
→ review diff
→ continue
```

Do not respond with:

- “I will now…”
- “Next I’ll…”
- “The server has started; let me know…”
- another plan
- progress-only output
- a request for a new prompt

Do not pause for ordinary edits already approved by this prompt.

Pause only for a genuine external blocker such as cloud credential rotation, Firebase Console configuration, or unavailable authorized production access. Finish every other local task first.

---

# 4. PRESERVE EXISTING WORK — NO UNWANTED CHANGES

The current index includes substantial legitimate work such as:

- CI workflows
- architecture/scalability/recovery documents
- Firestore rules
- AI routes/services/components
- audit services
- SLA/background-job features
- frontend error boundary/loaders
- Vitest/Playwright tests
- Render/Vercel deployment files
- verification scripts
- existing Phase 1–6 functionality

Do not delete these merely because they are unrelated to Login/Register.

Do not redesign:

- Citizen portal
- Department/Officer portal
- Worker portal
- Admin portal
- complaint flows
- dashboards
- reports
- notifications
- emergency services
- maps
- AI analytics
- civic chatbot
- voice assistant
- audit logs
- SLA escalation
- background jobs
- styling, colors, typography, icons, spacing, animations, branding

Do not run broad formatters across the repository.

Do not update frameworks or packages unless an exact required dependency correction is proven.

Do not use:

```bash
git reset --hard
git clean -fd
git checkout .
git restore .
git restore --staged .
```

Do not overwrite pre-existing user changes.

---

# 5. ESTABLISH AN ACCURATE GIT BASELINE

From repository root run:

```bash
git status --short
git diff --cached --stat
git diff --cached --name-status
git diff --cached --check
git diff --stat
git diff --name-status
git diff --check
git diff HEAD --stat
git diff HEAD --name-status
```

Then inspect complete diffs for authentication and environment files:

```bash
git diff HEAD -- backend/config/firebaseAdmin.js
git diff HEAD -- backend/config/envValidation.js
git diff HEAD -- backend/controllers/authController.js
git diff HEAD -- backend/middleware/authMiddleware.js
git diff HEAD -- backend/routes/authRoutes.js
git diff HEAD -- backend/server.js
git diff HEAD -- backend/package.json
git diff HEAD -- frontend/src/components/LoginRegister.jsx
git diff HEAD -- frontend/src/firestoreService.js
git diff HEAD -- frontend/src/App.jsx
git diff HEAD -- frontend/src/main.jsx
git diff HEAD -- frontend/vite.config.js
git diff HEAD -- .gitignore
git diff HEAD -- render.yaml
git diff HEAD -- vercel.json
```

Compare current code with the last committed version:

```bash
git show HEAD:backend/controllers/authController.js
git show HEAD:backend/middleware/authMiddleware.js
git show HEAD:backend/config/firebaseAdmin.js
git show HEAD:frontend/src/components/LoginRegister.jsx
git show HEAD:frontend/src/firestoreService.js
```

If Git history shows a known working deployed revision, inspect it before deciding what to retain.

Classify every changed file:

```text
A. Required for Firebase auth/env/deployment correction
B. Legitimate existing Phase 1–6 work to preserve
C. Temporary QA/debug/prompt/runtime artifact
D. Unrelated accidental agent change
E. Sensitive/unsafe file
```

Rules:

- Preserve B.
- Keep A only after validation.
- Remove C only when clearly generated during debugging.
- Revert D only when it was introduced by the agent and is not user work.
- Remove E from tracking and report it.
- Do not change staging state blindly.

---

# 6. CURRENT UNTRACKED/UNSTAGED ITEMS — SPECIAL HANDLING

Review these exact known items:

```text
RAJCIVIC_FINAL_AUTONOMOUS_COMPLETION_PROMPT.md
RAJCIVIC_FINAL_FIX_AGENT_AND_MANUAL_TEST_PROMPT.md
RAJCIVIC_FINAL_ONE_SHOT_SECURITY_QA_MANUAL_READY_PROMPT.md
RAJCIVIC_FINAL_STABILIZATION_AND_MANUAL_ACCEPTANCE_PROMPT.md
backend/ecosystem.config.cjs
package-lock.json at repository root
backend/config/localDb.json
```

Rules:

1. The old prompt MD files are debugging instructions, not application source.
   - Read only when needed for context.
   - Do not stage or commit them.
   - Remove only those exact files when they contain no project documentation required by the user.
2. Inspect root `package.json`.
   - If no valid root package/workspace requires a root `package-lock.json`, remove only the accidental untracked root lock file.
   - If a real root workspace exists, keep and validate it.
3. Inspect `backend/ecosystem.config.cjs`.
   - Keep only if it is a deliberate PM2/deployment artifact with correct paths and no secrets.
   - Otherwise remove it as an unrequested generated file.
4. Inspect `backend/config/localDb.json`.
   - Preserve legitimate seed/demo content.
   - Remove only temporary QA accounts created during debugging.
   - Never delete the whole database.
   - Never leave plaintext passwords.
   - Do not use it as the Firebase Login/Register identity source.
5. Do not use wildcard deletion.

---

# 7. INSPECT THE REAL LOGIN/REGISTER CONTRACT

Read fully:

```text
backend/config/firebaseAdmin.js
backend/config/envValidation.js
backend/controllers/authController.js
backend/middleware/authMiddleware.js
backend/routes/authRoutes.js
backend/server.js
backend/config/localDb.json
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
.github/workflows/*
tests/*
backend/tests/*
frontend/src/tests/*
```

Search for duplicate/conflicting logic:

```bash
git grep -n -E 'createUserWithEmailAndPassword|signInWithEmailAndPassword|onAuthStateChanged|signOut'
git grep -n -E 'jsonwebtoken|jwt\.sign|jwt\.verify|JWT_SECRET|MOCK_TOKEN'
git grep -n -E 'scryptSync|passwordHash|passwordSalt'
git grep -n -E '/api/auth/register|/api/auth/login'
git grep -n -E 'verifyIdToken|getIdToken'
git grep -n -E 'initializeApp|getApps|getApp|cert\('
git grep -n -E 'users/\{|collection\(.*users|doc\(.*users'
git grep -n -E 'CORS_ORIGINS|FRONTEND_URL|VITE_API_BASE_URL'
```

Determine:

1. Which code path the frontend actually calls.
2. Whether one form submit calls both Firebase and backend password auth.
3. Whether duplicate register/login handlers exist.
4. Whether Firebase is initialized more than once.
5. Whether email or UID is used as profile ID.
6. Whether role values are accepted from the client.
7. Whether auth state restoration is duplicated.
8. Whether stale custom-JWT tests are driving the wrong architecture.

Do not edit before this inspection is complete.

---

# 8. FINAL LOGIN FLOW

Implement or restore this exact behavior:

1. User submits email/password.
2. Frontend validates required fields.
3. Frontend calls Firebase:

```js
signInWithEmailAndPassword(auth, email, password)
```

4. Obtain the current Firebase ID Token:

```js
await user.getIdToken()
```

5. Update application auth state from Firebase user.
6. Load the Firestore profile by Firebase UID.
7. Protected backend requests send:

```http
Authorization: Bearer <Firebase-ID-Token>
```

8. Backend middleware calls:

```js
adminAuth.verifyIdToken(token)
```

or the existing equivalent.

9. Store decoded Firebase identity in `req.user`.
10. Use UID as canonical identity.
11. Load trusted role/profile data from Firestore or verified custom claims.
12. Route to correct dashboard.

Also verify:

- invalid credentials show a friendly Firebase-mapped error;
- disabled users are handled;
- loading state always ends;
- repeated clicking creates one login attempt;
- refresh uses `onAuthStateChanged`;
- token refresh works;
- backend 401 is handled safely;
- logout calls Firebase `signOut()`;
- localStorage/sessionStorage does not store passwords;
- no custom backend `/login` password request remains in the frontend.

If an existing backend `/api/auth/login` endpoint is no longer part of the deployed Firebase contract, do not keep using it. Preserve backward compatibility only when proven necessary and never accept/store raw passwords in the Firebase-only production flow.

---

# 9. FINAL REGISTER FLOW

Implement or restore:

1. Validate:
   - full name required and trimmed;
   - valid email;
   - valid Indian 10-digit mobile starting with 6/7/8/9;
   - strong password;
   - confirm password match;
   - terms checkbox.
2. Disable submit while pending.
3. Call Firebase:

```js
createUserWithEmailAndPassword(auth, email, password)
```

4. Obtain `user.uid`.
5. Create profile at:

```text
users/{firebaseUid}
```

6. Store only safe fields, for example:

```text
uid
email
fullName
phone
role
portal
district
ulbType
ulbName
ward
createdAt
updatedAt
```

7. Public registration must always produce:

```text
role = Citizen
portal = citizen
```

8. Ignore/reject client attempts to set Admin/Officer/Worker role.
9. Do not store password/hash/salt in Firestore or local DB.
10. Handle:
    - email already exists;
    - weak password;
    - invalid email;
    - network failure;
    - Firebase misconfiguration;
    - Firestore write failure.
11. Handle Auth-created/Profile-failed partial registration safely.
12. One click must create one Firebase user and one profile only.
13. No second backend password-registration request.

If the existing secure architecture creates the profile through a protected backend endpoint after Firebase signup, preserve that architecture and ensure the backend derives UID and Citizen role from the verified token rather than request payload.

Do not weaken Firestore rules to make this pass.

---

# 10. BACKEND AUTH MIDDLEWARE

Required behavior:

1. Read `Authorization` header.
2. Require `Bearer <token>`.
3. Verify with Firebase Admin Auth.
4. Set trusted decoded identity on `req.user`.
5. Return:
   - 401 missing token;
   - 401 invalid/expired/revoked token;
   - 403 authenticated but unauthorized;
   - 500 only for true server configuration failure.
6. Do not:
   - decode without verification;
   - accept `MOCK_TOKEN`;
   - accept custom JWT for Firebase routes;
   - accept role from body/query/local storage;
   - silently fall back to local authentication in production.

Keep development mocks only in isolated tests through dependency mocking, not a runtime production-capable bypass.

---

# 11. FIREBASE ADMIN INITIALIZATION

Use one deterministic initialization.

Requirements:

1. Initialize Firebase Admin once.
2. Use environment variables only.
3. Resolve backend `.env` from backend location, not accidental process CWD.
4. Handle escaped private-key newlines:

```js
process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
```

5. Never log credentials.
6. In production:
   - missing Admin credentials must fail safely;
   - no local/in-memory fallback;
   - no fake connected status.
7. In development:
   - use actual Firebase when configured;
   - any data fallback must be explicit and must not replace Firebase Auth.
8. Avoid mutable/contradictory mode selection.
9. Do not infer auth mode from Firebase Web API key.
10. Do not initialize the client SDK in backend code.

Use an explicit non-secret mode variable only when the project truly needs it, for example:

```text
AUTH_MODE=firebase
DATA_MODE=firebase
```

Do not retain local custom-auth mode for Login/Register.

---

# 12. ENVIRONMENT FILE CORRECTION

## Backend local `.env`

Do not print its values.

It should contain only backend-required variables, such as:

```text
NODE_ENV=development
PORT=5000
AUTH_MODE=firebase
DATA_MODE=firebase
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FIREBASE_PROJECT_ID=<value>
FIREBASE_STORAGE_BUCKET=<value>
FIREBASE_CLIENT_EMAIL=<value>
FIREBASE_PRIVATE_KEY=<rotated-value-with-escaped-newlines>
```

Do not require `JWT_SECRET` for Firebase Login/Register.

Remove backend Firebase Web SDK variables when unused by backend:

```text
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
```

Move their public web equivalents to frontend Vite variables when needed.

## Frontend local `.env`

Use:

```text
VITE_FIREBASE_API_KEY=<public-web-config>
VITE_FIREBASE_AUTH_DOMAIN=<public-web-config>
VITE_FIREBASE_PROJECT_ID=<public-web-config>
VITE_FIREBASE_STORAGE_BUCKET=<public-web-config>
VITE_FIREBASE_MESSAGING_SENDER_ID=<public-web-config>
VITE_FIREBASE_APP_ID=<public-web-config>
VITE_API_BASE_URL=http://localhost:5000
```

Never put Admin client email/private key/JWT secret in frontend variables.

## Example files

Create/update placeholders only:

```text
backend/.env.example
backend/.env.production.example
frontend/.env.example
frontend/.env.production.example
```

Do not insert real IDs, keys, URLs containing secrets, or private-key material.

---

# 13. DEPLOYMENT VARIABLE CORRECTION

Inspect and correct `render.yaml`, `vercel.json`, workflows, and environment examples.

Backend production variables:

```text
NODE_ENV=production
AUTH_MODE=firebase
DATA_MODE=firebase
FRONTEND_URL=<production-frontend-origin>
CORS_ORIGINS=<production-frontend-origin>
FIREBASE_PROJECT_ID=<deployment-secret-or-variable>
FIREBASE_STORAGE_BUCKET=<deployment-variable>
FIREBASE_CLIENT_EMAIL=<deployment-secret>
FIREBASE_PRIVATE_KEY=<deployment-secret>
```

Frontend production variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_API_BASE_URL
```

Rules:

1. No secret value in:
   - `render.yaml`
   - `vercel.json`
   - workflow YAML
   - source code
   - example files
2. Use provider-managed environment secrets.
3. Do not automatically deploy.
4. Do not silently use localhost in production.
5. Do not silently use local DB in production.
6. Validate production startup with placeholder/missing-variable failure tests without exposing secrets.
7. Document exact variable names in final output, never values.

---

# 14. CORS CORRECTION

Use one environment-driven CORS configuration.

Local allowed origins:

```text
http://localhost:5173
http://127.0.0.1:5173
```

If 5173 is occupied:

- identify the process;
- do not kill unrelated processes;
- configure one explicit alternate port consistently;
- update local `CORS_ORIGINS`;
- use Vite `strictPort` so it does not drift silently.

Production:

- allow only configured production frontend origin(s);
- no `*` with credentials.

Verify:

- OPTIONS preflight;
- Authorization header;
- GET protected API;
- browser Login/Register;
- actual `Access-Control-Allow-Origin`;
- disallowed origin behavior.

---

# 15. HEALTH ENDPOINTS

Ensure these exist:

```text
GET /health
GET /api/health
GET /api/health/deep
```

Requirements:

- registered before 404/error middleware;
- return JSON;
- no secret values;
- `/api/health/deep` reports truthful Firebase status;
- do not call Firebase connected when initialization/query failed;
- do not expose stack traces in production.

---

# 16. DUPLICATE-CODE CLEANUP

Remove only exact duplicate/conflicting logic for:

- login handlers;
- register handlers;
- Firebase initialization;
- auth-state listeners;
- profile creation;
- token attachment;
- CORS setup;
- health endpoints;
- API base URL declarations;
- submit handlers;
- tests for obsolete custom JWT behavior.

Rules:

1. Keep one canonical implementation.
2. Do not rewrite complete files when a local edit is enough.
3. Do not repeatedly patch the same area without reading the final file.
4. After every auth-file edit run:
   - syntax/lint for that package;
   - affected tests;
   - `git diff --check`;
   - inspect the full file/diff.
5. Remove obsolete dependency only after repository-wide search proves it unused.
6. Update package lock only through package-manager commands.
7. Do not run `npm update` or broad audit fixes.

---

# 17. FIRESTORE PROFILE AND RULES

Identity:

```text
users/{request.auth.uid}
```

Rules must prevent:

- unauthenticated protected access;
- Citizen self-promotion to Admin/Officer/Worker;
- changing another user's profile;
- arbitrary role/portal changes;
- public access to admin-only data.

Do not rely only on frontend route checks.

Do not weaken existing rules.

Validate rules using existing Firebase CLI/emulator tooling when available. If tooling or authorized project access is unavailable, mark verification BLOCKED rather than claiming PASS.

---

# 18. TEST STRATEGY

Use existing Vitest/Node/Playwright setup.

Do not add another large test framework.

Update/remove tests that assert obsolete custom JWT/local-password behavior.

Backend tests must cover:

1. server starts;
2. `/health`;
3. `/api/health`;
4. `/api/health/deep`;
5. missing token → 401;
6. invalid Firebase token → 401;
7. verified Firebase token → protected-route success using mocked Admin verification in unit tests;
8. unauthorized role → 403;
9. production missing Firebase credentials fails safely;
10. production cannot fall back to local data/auth;
11. CORS allowed origin;
12. CORS rejected origin;
13. no secret in health/error responses.

Frontend tests must cover:

1. empty login/register validation;
2. invalid email;
3. invalid mobile;
4. weak password;
5. password mismatch;
6. terms unchecked;
7. Firebase login call once;
8. Firebase register call once;
9. repeated-click prevention;
10. duplicate email error mapping;
11. invalid-login error mapping;
12. logout calls Firebase signOut;
13. refresh/onAuthStateChanged behavior;
14. protected API receives Firebase ID Token;
15. no raw password sent to backend.

Integration/browser tests must verify where authorized:

```text
Firebase register
→ UID
→ Firestore profile
→ login
→ ID Token
→ backend verifyIdToken
→ profile/role
→ correct dashboard
```

Do not use API `/auth/login` curl success as evidence of Firebase browser login.

Do not expose full tokens in output.

---

# 19. LOCAL RUN AND BROWSER QA

Stop only stale duplicate processes belonging to this repository.

Leave exactly one backend and one frontend process running at handoff.

Run:

```bash
cd backend
npm install
npm run lint        # when available
npm run test        # when available
npm run dev
```

In second terminal:

```bash
cd frontend
npm install
npm run lint
npm run test
npm run build
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Use actual package scripts. Missing script = NOT AVAILABLE, not PASS.

Verify:

```text
http://localhost:5173
http://localhost:5000/health
http://localhost:5000/api/health
http://localhost:5000/api/health/deep
```

Browser-test:

### Registration
- empty form;
- invalid email;
- invalid mobile;
- weak password;
- mismatch;
- terms unchecked;
- valid unique Citizen registration;
- duplicate email;
- rapid double-click.

### Login/session
- valid login;
- invalid login;
- disabled/nonexistent user where safe;
- refresh persistence;
- protected page;
- logout;
- browser Back after logout;
- direct protected URL after logout.

### Authorization
- Citizen dashboard;
- Citizen attempt to open Admin page;
- Officer/Admin tests only using authorized existing test accounts;
- no client-side role escalation.

### Regression
- complaint create/list/detail;
- profile;
- notifications;
- reports;
- helpdesk;
- emergency;
- navigation;
- maps/location where implemented;
- AI features must still load where already implemented.

Inspect Console and Network:

- no CORS error;
- no uncaught auth error;
- no duplicate auth request;
- no unexpected 500;
- no stuck loader;
- Firebase ID Token sent only to backend protected APIs;
- no password/private key/secret in requests or responses.

Responsive viewports:

```text
375 × 812
498 × 668
768 × 1024
1440 × 900
```

Do not redesign during QA. Fix only confirmed regressions.

---

# 20. TEMPORARY DATA CLEANUP

After tests:

1. Remove only QA users/Firestore profiles created by this task when authorized.
2. Do not delete real users.
3. Remove only temporary `localDb.json` records introduced during debugging.
4. Preserve seed data.
5. Remove temporary test scripts such as one-off `testRegister.js` or `testLogin.js` when they are not part of the real test suite.
6. Keep maintained tests under the proper tests directory.
7. Do not leave token dumps or screenshots containing sensitive data.

---

# 21. FINAL GIT-STATUS CLEANUP

Run:

```bash
git status --short
git diff --cached --stat
git diff --cached --name-status
git diff --cached --check
git diff --stat
git diff --name-status
git diff --check
git diff HEAD --stat
git diff HEAD --name-status
```

Then verify:

- no `.env` tracked;
- no private key tracked;
- no service-account JSON tracked;
- no secret in staged diff;
- no `JWT_SECRET` dependency in Firebase Login/Register;
- no custom JWT Login/Register;
- no `MOCK_TOKEN`;
- no duplicate auth flow;
- no temporary prompt files;
- no accidental root lock file;
- no temporary QA account in tracked data;
- no unrelated UI changes introduced by this task;
- package locks correspond to manifests;
- staged Phase 1–6 work remains preserved.

Do not force a clean Git status by committing or discarding valid changes.

The desired outcome is:

```text
Intentional staged changes
+ no sensitive files
+ no accidental temporary files
+ no unexplained unstaged runtime mutations
+ no unrelated agent edits
```

Stage only exact verified files when necessary:

```bash
git add <explicit-file-list>
```

Never use `git add .` until every untracked file is classified. Prefer explicit paths.

Do not commit or push.

---

# 22. FINAL OUTPUT FORMAT

Do not create extra report files inside the repository unless an existing tracked report explicitly requires updating.

Provide final response with exactly these sections:

1. Security Incident Status
2. Root Causes Found
3. Authentication Architecture After Fix
4. Login Fix
5. Register Fix
6. Environment Variable Fix
7. Deployment Variable Fix
8. Duplicate Code Removed
9. Files Modified
10. Files Created
11. Files Deleted
12. Pre-existing Phase 1–6 Changes Preserved
13. Git Status Cleanup
14. Commands Run
15. Backend Test Results
16. Frontend Test Results
17. Browser/Integration Results
18. Health and CORS Results
19. Manual Testing URLs
20. Exact Production Variable Names
21. External Actions Still Required
22. Final Verdict

Use only:

```text
PASS
FAIL
BLOCKED
NOT AVAILABLE
```

for each test/status.

Do not print:

- private key;
- JWT secret;
- full ID token;
- password;
- service-account JSON;
- authorization header;
- replacement credential values.

Final verdict rules:

```text
LOCAL MANUAL TEST READY
```

only when critical local Login/Register, Firebase-token, build, CORS, browser, and Git-safety checks pass.

```text
PRODUCTION READY
```

must remain BLOCKED until the exposed Firebase service-account key is externally revoked/rotated and production environment/Firebase Console checks are genuinely completed.

---

# 23. FINAL ACCEPTANCE CHECKLIST

Task is complete only when all applicable items are satisfied:

- Firebase Authentication remains the only Login/Register provider.
- No custom JWT Login/Register remains.
- No raw password backend auth remains.
- Login works locally through rendered frontend.
- Register works locally through rendered frontend.
- Logout works.
- Refresh preserves Firebase auth state.
- Firebase ID Token reaches protected backend APIs.
- Backend verifies with Firebase Admin `verifyIdToken()`.
- Firestore profile uses Firebase UID.
- Public registration cannot create privileged roles.
- Missing/invalid tokens return 401.
- Unauthorized role returns 403.
- `/health`, `/api/health`, and `/api/health/deep` work.
- Frontend production build passes.
- Backend starts with valid local variables.
- Production fails safely when Firebase Admin credentials are missing.
- Production cannot silently use local auth/data fallback.
- CORS matches actual local and configured production origins.
- No secret is tracked or staged.
- `.env` is ignored.
- No service-account JSON is tracked.
- Exposed cloud key rotation is clearly marked BLOCKED/required.
- Existing Phase 1–6 features are preserved.
- Temporary prompt/debug files are removed.
- Git state is intentional and accurately reported.
- Exactly one backend and one frontend process are left running for manual testing.
- No automatic commit, push, or deployment occurs.

Begin now from the repository root. First perform the secret-tracking and complete Git-baseline checks, then inspect the current Firebase/custom-auth diff before editing anything. Continue until the full local manual-testing handoff is complete.
