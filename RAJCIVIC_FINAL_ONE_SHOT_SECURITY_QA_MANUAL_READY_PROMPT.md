# RAJASTHAN CIVIC CONNECT — FINAL ONE-SHOT SECURITY FIX, FULL AGENT QA, AND MANUAL-READY HANDOFF

## EXECUTION COMMAND FOR ANTIGRAVITY

Continue from the current `rajasthan-civic-connect` repository state.

The earlier implementation plan is already approved. Do not return another plan, do not ask for routine confirmation, and do not stop after API smoke testing. Execute the complete remaining fix, automated verification, real browser QA, responsive QA, security review, regression testing, and manual-test handoff in this single run.

Read `RAJCIVIC_FINAL_FIX_AGENT_AND_MANUAL_TEST_PROMPT.md` completely and treat it together with this prompt as the source of truth. Where the current implementation conflicts with security or correctness requirements below, this prompt takes precedence.

The current known state is:

- Backend is running on port `5000`.
- Frontend has run on `http://localhost:5175/`.
- Registration and login work only in the current local in-memory path.
- `firebaseAdmin.js` currently switches to local mode after detecting a Firebase Web API key.
- Duplicate registration returns a handled client error.
- Login currently returns a `MOCK_TOKEN`.
- The login response currently exposes the user's plain-text `password`.
- Local user records appear to store passwords in plain text.
- Invalid Indian mobile number `1234567890` was accepted.
- Real browser end-to-end testing has not yet been completed.
- Real Firebase Auth/Admin behavior has not yet been verified.

These are not acceptable final conditions. Do not mark the task complete until all locally testable critical issues are fixed and verified.

---

## 1. NON-NEGOTIABLE OUTCOME

At the end of this run, the project must be ready for the owner to perform a deterministic manual acceptance test without first fixing known authentication, security, CORS, validation, blank-page, stuck-loader, or basic responsive defects.

The final local-development flow must meet all of these conditions:

1. No API response, browser storage value, token payload, console log, report, or screenshot exposes a password, password hash, salt, refresh token, private key, or authorization header.
2. Local-mode passwords are never stored in plain text.
3. Authentication mode is selected explicitly, not inferred from the presence of a Firebase Web API key.
4. Mock/local authentication cannot run in production mode.
5. Local tokens or sessions cannot be forged by editing base64 text or changing a client-side role.
6. Invalid forms are blocked before network requests.
7. Backend validation independently rejects invalid input.
8. A single submit creates only one intended authentication sequence.
9. Registration, login, refresh, logout, protected-route behavior, and role authorization work through the actual browser.
10. No unexpected `500` responses, uncaught console exceptions, blank pages, permanent loaders, or duplicate auth requests remain in tested flows.
11. All available relevant automated checks and the production build are executed.
12. A complete manual acceptance checklist is generated with exact startup commands, URLs, test accounts, test order, expected results, and troubleshooting notes.
13. The final verdict distinguishes local-demo readiness from real Firebase/production readiness.

Do not claim zero defects or production readiness without evidence.

---

## 2. STRICT SCOPE LOCK

This is a targeted authentication, security, validation, integration, QA, and manual-handoff task.

Do not:

- redesign the UI;
- change branding, colors, typography, spacing, icons, logo, animations, or content merely for appearance;
- add unrelated features or pages;
- rewrite working modules;
- reorganize folders;
- rename public routes unnecessarily;
- update framework or dependency versions;
- replace Firebase with another production authentication provider;
- alter deployment infrastructure;
- commit, push, deploy, publish, or release;
- clear Firestore collections or delete existing production users;
- use destructive Git commands;
- reformat the whole repository;
- overwrite pre-existing user changes;
- hide failures with fake success responses, empty catch blocks, disabled security checks, or skipped assertions.

Make the smallest correct patch. Every changed source file must directly support authentication correctness, security, validation, required testing, or QA documentation.

---

## 3. SAFETY AND CURRENT-STATE INSPECTION

Before editing:

1. Run:
   - `git status --short`
   - `git diff --stat`
   - `git diff --name-only`
2. Inspect all current uncommitted changes.
3. Preserve pre-existing user work.
4. Review the current `firebaseAdmin.js` diff carefully.
5. Preserve only the valid import/initialization portion of the previous fix.
6. Do not preserve the insecure behavior that treats a Firebase Web API key as a reason to select local mode.
7. Inspect:
   - root and backend `package.json` files;
   - environment-loading code;
   - frontend auth service/context/store;
   - registration and login components;
   - backend auth routes/controllers/services;
   - authentication middleware;
   - role middleware;
   - local database and seed logic;
   - Firebase client initialization;
   - Firebase Admin initialization;
   - API client/base URL;
   - CORS settings;
   - existing tests and scripts.
8. Reproduce the current login response and confirm the password exposure before fixing it.
9. Search the repository for all places where `password`, `passwordHash`, tokens, or user objects are serialized.

Continue automatically after inspection.

---

## 4. EXPLICIT AUTHENTICATION MODE

Authentication mode must be explicit.

Use the project's existing environment convention if one already exists. Otherwise add a minimal variable such as:

`AUTH_MODE=local`
or
`AUTH_MODE=firebase`

Required behavior:

### Local development mode

- Runs only when explicitly selected.
- Is allowed only outside production.
- Uses the local/in-memory data adapter intentionally.
- Logs a clear message such as `Authentication mode: LOCAL DEVELOPMENT`.
- Warns that local data is temporary when applicable.
- Uses secure local password hashing and verified local sessions/tokens.
- Never pretends that Firebase has been verified.

### Firebase mode

- Uses the intended Firebase client and Firebase Admin flow.
- Requires the correct Firebase Admin configuration.
- Does not treat the public Firebase Web API key as an Admin credential.
- Does not silently fall back to local authentication when Firebase initialization fails.
- Fails with a clear, safe configuration message when required credentials are missing.
- Does not expose credential values.

### Production mode

- Must reject local/mock authentication.
- Must not create or accept `MOCK_TOKEN` values.
- Must fail closed when Firebase Admin or the configured production auth system cannot initialize.
- Must not silently start an insecure fallback.

Update `.env.example` or the project's existing environment documentation with variable names and safe placeholders only. Do not place real secrets in tracked files.

For the current local QA run, set explicit local mode through the existing untracked local environment mechanism. Do not commit secret-bearing `.env` content.

---

## 5. REMOVE PASSWORD EXPOSURE EVERYWHERE

The current response containing:

`"password": "test1234"`

is a critical defect.

Create or reuse one centralized safe-user serializer, for example `sanitizeUser`, and apply it consistently to every user-facing response.

Remove at minimum:

- `password`
- `passwordHash`
- `passwordSalt`
- `salt`
- `accessToken`
- `refreshToken`
- `resetToken`
- `verificationToken`
- private authentication metadata
- internal security fields

Verify registration, login, profile, user-list, role-management, complaint-assignee, and any other endpoint that returns user objects.

Requirements:

- Password must never appear in a JSON response.
- Password must never appear in a token/session payload.
- Password must never be written to browser storage.
- Password must never be logged.
- Password must never be written to QA reports.
- Hashes and salts must never be returned.
- Error messages must not reveal whether sensitive internal records exist beyond the application's intended duplicate-email behavior.

Add automated assertions that fail if any auth response contains `password`, `passwordHash`, or salt fields.

---

## 6. SECURE LOCAL PASSWORD STORAGE

Local development mode must not store plain-text passwords.

Use the smallest secure implementation compatible with the repository:

1. Prefer an already installed and actively used password-hashing dependency.
2. If none exists, use Node.js built-in `crypto.scrypt` or an equivalent secure built-in KDF with:
   - a unique cryptographically random salt per user;
   - an appropriate derived-key length;
   - timing-safe comparison.
3. Store only hash material and salt, never the original password.
4. Hash seeded demo-user passwords during seed initialization rather than storing plain-text values in user records.
5. Ensure login compares the submitted password safely.
6. Ensure password hashes and salts are excluded by the serializer.
7. Do not weaken verification to preserve old plain-text local records. Rebuild only local in-memory seed data safely when necessary.
8. Never migrate or modify real Firebase users as part of this local fix.

Add tests proving:

- the stored local user record has no plain-text `password`;
- correct password succeeds;
- incorrect password fails;
- response objects contain no password/hash/salt;
- two users with the same password receive different salts/hashes when applicable.

---

## 7. SECURE LOCAL TOKEN OR SESSION

The current base64-style `MOCK_TOKEN_...` must not be trusted as an authentication credential.

For explicit local development mode, use the smallest secure approach already supported by the repository:

- an existing verified JWT implementation with a development-only secret, or
- a cryptographically signed local token, or
- an opaque random server-side session token.

Requirements:

- The token/session must be unforgeable through simple client editing.
- The role must be loaded or verified server-side.
- The middleware must not trust a client-provided role.
- The token must contain no password or sensitive fields.
- Missing, malformed, expired, modified, or unknown tokens must be rejected.
- Local tokens must be created and accepted only in explicit local mode.
- Production must reject local tokens.
- Logout must clear frontend authentication state and invalidate a server-side local session when the chosen implementation supports it.
- Protected APIs must return `401` for missing/invalid authentication.
- Role violations must return `403`.

Add tests for:

- valid token;
- tampered token;
- missing token;
- forged Admin role;
- Citizen access to Admin route;
- logout/protected-route behavior where supported.

Do not replace genuine Firebase ID-token verification in Firebase mode.

---

## 8. BACKEND INPUT VALIDATION AND ERROR CONTRACT

Apply consistent server-side validation for registration and login.

Registration must validate at minimum:

- trimmed non-empty full name;
- normalized valid email;
- valid Indian mobile number;
- password policy;
- allowed public role behavior;
- duplicate email.

Indian mobile validation:

- normalize only supported formatting;
- final value must contain exactly 10 digits;
- first digit must be `6`, `7`, `8`, or `9`;
- reject `1234567890`;
- reject alphabetic characters;
- reject short or long numbers.

Password policy:

- follow the existing documented UI policy when present;
- otherwise require at least 8 characters and a reasonable combination of letters and numbers;
- keep frontend and backend messages consistent.

Public registration:

- must always create the permitted public role, normally `Citizen`;
- must ignore or reject attempts to register as `Admin`, `Officer`, or `Worker`;
- must not allow privilege escalation through request payload manipulation.

Status codes:

- `400` for malformed/invalid input;
- `401` for invalid credentials or missing/invalid authentication;
- `403` for forbidden role access;
- `409` or the project's consistently documented `400` for duplicate email;
- `429` for rate-limited requests where rate limiting exists;
- `500` only for genuine unexpected failures.

Do not expose stack traces or sensitive internal error details to the browser. Log safe diagnostic context on the server.

---

## 9. FRONTEND VALIDATION AND SINGLE AUTH FLOW

Keep the current visual design.

Registration must block submission locally for:

- empty required fields;
- invalid email;
- invalid Indian mobile;
- weak password;
- password mismatch;
- unchecked required terms/policy;
- a request already in progress.

Login must block:

- empty email;
- invalid email;
- empty password;
- a request already in progress.

When frontend validation fails:

- show a clear inline message;
- send no Firebase request;
- send no backend request;
- create no profile;
- do not redirect;
- do not enter a permanent loading state.

Trace the existing authentication architecture and define one source of truth per mode.

Do not allow a single click to perform both an unintended direct Firebase registration/login and a second independent backend password registration/login.

Expected approach must fit the existing architecture:

- In explicit local mode, the frontend should use the local backend auth contract only.
- In Firebase mode, use the existing intended Firebase flow and backend token/profile verification without performing duplicate account creation.
- Do not rebuild the architecture unnecessarily.

Prevent duplicate submissions caused by:

- double-click;
- multiple event handlers;
- form `onSubmit` plus button `onClick`;
- React Strict Mode side effects;
- retry logic without idempotency;
- repeated redirects.

Verify loading buttons disable while the request is active and recover correctly after handled failures.

Normalize frontend user data so no password is stored in context, Zustand, Redux, localStorage, sessionStorage, IndexedDB, or debug state.

---

## 10. SESSION, LOGOUT, AND ROUTE PROTECTION

Verify through code and browser:

- successful login reaches the correct role dashboard;
- page refresh preserves a valid session;
- invalid/expired session returns to login cleanly;
- logout clears local auth state;
- logout does not leave a usable token in browser storage;
- browser Back after logout does not reopen a usable protected session;
- direct protected URL access while logged out is rejected;
- redirect loops do not occur;
- role route guards match backend authorization;
- Citizen cannot access Admin pages;
- Officer, Worker, and Admin receive only intended permissions;
- public registration cannot create privileged roles.

Do not rely only on hidden navigation links; enforce authorization in routes and APIs.

---

## 11. API BASE URL, PORT, AND CORS

The frontend has run on port `5175`, so test the actual origin.

Requirements:

- Use the existing environment-based API URL mechanism.
- Do not permanently hardcode only `5175` if the development server can use another configured port.
- Remove stale agent-created dev-server processes that cause avoidable port fallback, but do not terminate unrelated user processes.
- Start backend and frontend on documented, deterministic ports whenever possible.
- Record the actual URLs used.
- Development CORS may allow the documented localhost development origins safely.
- Production CORS must use an explicit configured allowlist, not unrestricted wildcard access with credentials.
- Preflight requests must succeed.
- Browser registration and login must work from the actual frontend origin.
- No mixed-content, blocked-origin, or incorrect API-base errors may remain.

Do not loosen production CORS merely to pass local tests.

---

## 12. FIREBASE VERIFICATION

Determine whether valid Firebase Admin credentials and a usable Firebase project configuration are actually available.

When available:

- test Firebase-mode startup;
- test intended registration/login flow;
- test ID-token verification;
- test Firestore profile creation/read;
- test duplicate-email behavior;
- test safe Firebase error mapping;
- verify no password is sent to or stored by the backend beyond the intended Firebase client interaction;
- verify role claims/profile checks.

When credentials are unavailable:

- do not fabricate a PASS;
- do not silently call local mode “Firebase verified”;
- mark real Firebase verification `BLOCKED`;
- document the exact missing configuration category without exposing values;
- finish and pass every locally testable item;
- give the owner precise steps required to enable Firebase-mode testing.

The final verdict may be `LOCAL MANUAL TEST READY` while Firebase/production verification is `BLOCKED`. It may be `PRODUCTION READY` only when production-mode security and Firebase verification actually pass.

---

## 13. AUTOMATED TESTS REQUIRED

Use existing scripts and tooling. Do not add a new framework when the repository already has one.

Run all available relevant checks, including as applicable:

- lint;
- typecheck;
- frontend unit/component tests;
- backend unit/integration/API tests;
- authentication tests;
- authorization tests;
- E2E tests;
- production frontend build;
- backend startup/smoke test.

Add or update only the minimum tests needed to cover this fix.

Required test coverage:

1. valid local registration;
2. duplicate email;
3. invalid email;
4. invalid mobile including `1234567890`;
5. weak password;
6. public role-escalation attempt;
7. valid login;
8. incorrect password;
9. unknown account behavior;
10. no password/hash/salt in any response;
11. local record is not plain text;
12. valid protected request;
13. missing token;
14. tampered token;
15. forged privileged role;
16. Citizen blocked from Admin API;
17. frontend invalid form sends zero auth requests;
18. repeated click sends one intended request;
19. logout/protected-route behavior;
20. production build.

Do not claim a test ran if it did not run. Record exact commands, exit codes, test counts, and relevant evidence.

For unrelated pre-existing failures:

- identify them separately;
- prove they are pre-existing when possible;
- do not modify unrelated modules without explicit necessity.

---

## 14. REAL AGENT BROWSER QA

Do not stop at `curl`, Node `fetch`, or API-only testing.

Start the application and use an actual browser against the recorded frontend URL.

Inspect both Browser Console and Network activity.

### Registration tests

- empty submission;
- invalid email;
- invalid phone;
- `1234567890`;
- weak password;
- password mismatch;
- unchecked terms;
- valid unique user;
- duplicate email;
- rapid double-click;
- backend unavailable/recovery where safely testable;
- successful redirect;
- no duplicate account/profile request;
- no sensitive fields in response.

### Login tests

- valid credentials;
- incorrect password;
- unknown email;
- empty fields;
- rapid double-click;
- refresh after login;
- direct dashboard URL;
- logout;
- browser Back after logout;
- protected URL after logout;
- no sensitive fields in response.

### Role tests

Use only existing authorized demo/test accounts:

- Citizen;
- Officer;
- Worker;
- Admin;
- cross-role protected-route attempts;
- public registration payload attempting privileged role.

Never create or modify privileged production users without authorization.

### Network and console acceptance

For each critical flow verify:

- no unexpected `500`;
- expected `400/401/403/409` only for tested negative cases;
- no duplicate auth requests;
- no failed CORS preflight;
- no uncaught console exception;
- no unhandled promise rejection;
- no infinite request loop;
- no stuck loading indicator;
- no password/hash/salt/token secret visible;
- no blank page.

Capture non-sensitive evidence screenshots or logs in the existing QA artifact location. If no location exists, create a narrowly scoped `qa-evidence/` folder. Do not include real credentials or tokens in screenshots.

---

## 15. RESPONSIVE AND REGRESSION QA

Test these viewports:

- `375 × 812`
- `498 × 668`
- `768 × 1024`
- `1440 × 900`

Check:

- registration;
- login;
- dashboard;
- navigation/menu;
- forms;
- validation messages;
- loading states;
- modal/dialog behavior;
- floating chatbot/control overlap;
- horizontal overflow;
- inaccessible buttons;
- password visibility control;
- focus behavior;
- keyboard submission.

Run regression smoke tests for implemented core areas:

- Citizen dashboard;
- complaint creation;
- complaint draft/restore when implemented;
- complaint list;
- complaint detail;
- location/map selection when implemented;
- profile update;
- notifications;
- reports;
- helpdesk;
- emergency;
- Officer/Worker/Admin landing pages with authorized test accounts.

Do not alter unrelated UI merely because of personal preference. Fix only objective defects discovered in these flows.

---

## 16. MANUAL-TEST HANDOFF

Create or update:

- `FINAL_AUTH_FIX_AND_QA_REPORT.md`
- `MANUAL_ACCEPTANCE_TEST_CHECKLIST.md`

The manual checklist must be executable by a non-developer and include:

1. prerequisites;
2. exact backend start command and working directory;
3. exact frontend start command and working directory;
4. explicit local auth environment setting;
5. expected backend URL;
6. expected frontend URL;
7. health-check command;
8. safe demo/test account credentials or a method to create a unique test account;
9. how to avoid duplicate test-email conflicts;
10. the exact test order;
11. expected result for every step;
12. how to inspect Console and Network;
13. what status codes are expected;
14. what must never appear, especially password fields;
15. responsive viewport instructions;
16. logout and protected-route test;
17. local data reset behavior;
18. how to stop servers cleanly;
19. known external blockers;
20. a final manual sign-off table.

Use demo credentials only. Never place production credentials or secrets in reports.

At the end of the agent run, either:

- leave both verified development services running and state their exact URLs, when the environment supports persistent tasks; or
- stop them cleanly and provide exact commands that reproduce the verified state.

Do not leave multiple stale Vite/backend processes.

---

## 17. FINAL DIFF AND QUALITY GATE

Before completion, run:

- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- `git diff --check`

Review the complete diff.

For every changed file, record:

- why it changed;
- which requirement it satisfies;
- which test covers it.

Remove only unrelated changes created during this task. Do not revert pre-existing user work.

Confirm:

- no secrets were added;
- no real credentials were logged;
- no unrelated dependency upgrade occurred;
- no generated build output was accidentally tracked unless the project already requires it;
- no formatting-only rewrite occurred;
- no source response exposes sensitive fields.

---

## 18. COMPLETION GATES

Do not declare `LOCAL MANUAL TEST READY` unless all of these are PASS:

- password exposure removed;
- local password hashing verified;
- local token/session verification secure;
- invalid mobile blocked frontend and backend;
- public role escalation blocked;
- registration browser flow;
- login browser flow;
- duplicate-submit prevention;
- refresh/session behavior;
- logout/protected route behavior;
- Citizen/Admin authorization boundary;
- actual browser Console/Network checks;
- relevant automated tests;
- production frontend build;
- responsive auth pages;
- reports generated;
- final diff check.

Do not declare `PRODUCTION READY` unless all above pass and the real Firebase/production-mode verification also passes.

If an external credential or service blocks Firebase verification, use:

- Local verdict: `LOCAL MANUAL TEST READY` or `NOT READY`
- Firebase verification: `PASS` or `BLOCKED`
- Production verdict: `BLOCKED`

Complete all unblocked work before reporting a blocker.

---

## 19. REQUIRED FINAL RESPONSE FORMAT

Return exactly these sections:

1. Root Causes Found
2. Security Defects Fixed
3. Files Changed
4. Why Each File Was Changed
5. Authentication Flow After Fix
6. Local Mode and Firebase Mode Behavior
7. Commands Run
8. Automated Test Results
9. Agent Browser Test Results
10. Role and Authorization Results
11. Responsive and Regression Results
12. Console and Network Verification
13. Sensitive-Data Verification
14. Reports Generated
15. Manual Test Startup Instructions
16. External Blockers
17. Unrelated Existing Issues Not Modified
18. Final Verdict

For each check use only:

- `PASS`
- `FAIL`
- `BLOCKED`
- `NOT AVAILABLE`

Include concrete evidence for every `PASS`.

Do not finish with “open the browser and test it yourself” unless the agent has already completed the required browser QA first.

Begin now from `git status --short`, inspect the current diff, and execute the full remaining task without returning another plan.
