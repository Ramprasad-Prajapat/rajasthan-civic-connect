# RajCivic Connect — Final Authentication Fix, Full Agent Test, and Manual Acceptance Prompt

Copy this entire prompt into Antigravity while the existing **Rajasthan Civic Connect / RajCivic Connect** repository is open.

---

## MASTER PROMPT FOR ANTIGRAVITY

You are the final release engineer, senior React/Firebase/Node.js debugger, security reviewer, and QA automation engineer for the existing **Rajasthan Civic Connect (RajCivic Connect)** project.

Treat the currently opened repository as the only source of truth. Continue the existing application. Do not create a new project, do not replace the architecture, and do not redesign the UI.

### Current project context

The existing application uses approximately this stack, which you must verify from the repository before making changes:

- React 19 + Vite frontend
- Firebase Authentication
- Cloud Firestore
- Node.js + Express backend
- Multi-role portals: Citizen, Officer/Department, Worker, and Admin
- Frontend currently runs at approximately `http://localhost:5173`
- Backend likely runs at approximately `http://localhost:5000`, but discover the real configured URL and ports from the source and environment files

### Current failure evidence to reproduce

The browser Network panel currently shows these failures during Citizen registration/login:

- CORS preflight for `login` returns `204`
- Actual `POST login` returns `500`
- Firebase `accounts:signInWithPassword` returns `400`
- Firebase `accounts:signUp` returns `400`
- Actual `POST register` returns `500`
- A Firebase/Google iframe or reCAPTCHA-related document request also fails
- The registration UI appears to allow a two-character password to reach Firebase instead of blocking it locally

Do not assume the exact Firebase error. Open the failed Network requests, inspect their response bodies, inspect the frontend exception objects, and inspect backend terminal logs. Record the real error codes and root causes before changing code.

## Non-negotiable constraints

1. Work only in the existing repository.
2. Preserve the current UI, branding, content, navigation, responsive design, role system, complaint workflow, maps, dashboards, and working features.
3. Do not create a new React app or a parallel replacement implementation.
4. Do not remove Firebase Authentication or Firestore merely to hide the error.
5. Do not bypass authentication with hard-coded login success, localStorage-only fake users, mock credentials, or disabled security checks.
6. Do not expose passwords, Firebase tokens, service-account values, API secrets, or full private environment values in source code, browser logs, test reports, screenshots, or terminal output.
7. Do not weaken Firestore rules, CORS, Helmet, rate limiting, or role authorization to make tests pass.
8. Do not modify or delete real production data. Use an emulator or isolated timestamped QA accounts where possible, and clean them up when safe.
9. Do not deploy to production and do not push to a remote repository unless explicitly requested.
10. Install only project-local npm dependencies when genuinely required. Do not require global packages or unrelated system software.
11. Do not report a test as passed unless it actually ran and produced evidence.
12. Finish this as one complete task. Do not stop after diagnosis or give me a list of changes for me to implement manually.

## Required execution order

### 1. Audit and reproduce before editing

- Read the root README, package manifests, lockfiles, environment examples, Vite config, Firebase initialization, Firestore service, login/register component, auth context/store, route guards, backend server, auth routes/controllers, middleware, Firestore rules, seed/test scripts, and all existing tests.
- Search the repository for:
  - `signInWithEmailAndPassword`
  - `createUserWithEmailAndPassword`
  - `signInWithPassword`
  - `signUp`
  - `/login`
  - `/register`
  - `RecaptchaVerifier`
  - `signInWithPhoneNumber`
  - `TEMP_CREDENTIALS`
  - Firebase config and environment-variable names
- Start frontend and backend using the repository’s existing scripts.
- Reproduce registration and login in the browser.
- Capture the exact frontend console error, Firebase error code/message, backend stack trace, request payload shape, response body, and failing source line.
- Confirm whether the frontend is performing Firebase authentication and then also calling Express authentication endpoints, causing a duplicate or conflicting dual-auth flow.
- Confirm whether the failed iframe is actually part of a required phone OTP flow or is being initialized unnecessarily on an email/password form.
- Before editing, write a brief root-cause note in your working log.

### 2. Establish one coherent authentication flow

Inspect the existing architecture and select one source of truth. Prefer the following architecture unless the existing repository clearly and intentionally implements another secure pattern:

1. The React frontend uses the Firebase client SDK for email/password account creation and sign-in.
2. After successful Firebase registration, the application creates or updates `users/{uid}` in Firestore with normalized profile data and the allowed role/portal fields.
3. Protected Express APIs receive the Firebase ID token in `Authorization: Bearer <token>` and verify it using Firebase Admin middleware.
4. Express `/login` and `/register` must not duplicate Firebase client authentication if the frontend already completed it. Either remove the duplicate request from the frontend or redefine those endpoints for a clearly documented server-side purpose.
5. If the repository intentionally uses backend-owned authentication instead, then the frontend must not separately call Firebase client sign-up/sign-in. Implement only one complete path and document why it matches the existing design.

Do not leave both paths firing for a single submit action.

### 3. Fix frontend registration and login behavior

Implement robust form behavior without redesigning the screen:

- Trim and normalize the full name and email.
- Validate full name as non-empty.
- Validate email format before any network call.
- Validate Indian mobile number as exactly 10 digits after removing spaces and separators; keep `+91` as presentation/configuration, not duplicated inside the stored number.
- Remove false “Mobile Verified” UI state unless real verification has completed. If mobile verification is only a demo field, label it honestly rather than claiming verification.
- Require a secure password that satisfies at least Firebase’s minimum length and the project’s existing policy. A two-character password must be blocked before any Firebase or backend request.
- Validate confirm-password equality.
- Require acceptance of terms before submission.
- Show inline validation messages next to the relevant fields.
- Disable the submit button while the request is running.
- Prevent double-click, duplicate event handlers, and duplicate API calls.
- Stop execution immediately after the first failed stage. Do not call profile creation or backend registration after Firebase account creation fails.
- Navigate to the correct role dashboard only after authentication and required profile synchronization succeed.
- Keep the user on the form after an error and preserve non-sensitive input values.
- Never preserve or log password fields.

Map Firebase errors to safe, understandable UI messages, including at minimum:

- `auth/weak-password`
- `auth/email-already-in-use`
- `auth/invalid-email`
- `auth/invalid-credential`
- `auth/user-disabled`
- `auth/too-many-requests`
- `auth/network-request-failed`
- Firestore `permission-denied`
- generic unexpected failure with a support/reference code

Use the actual Firebase SDK error codes available in the installed version rather than string-matching only the English message.

### 4. Fix Firebase configuration and iframe/reCAPTCHA behavior

- Verify that all required Vite environment variables are read using the correct `import.meta.env.VITE_*` names.
- Add safe startup validation that clearly reports which required variable name is missing without printing secret values.
- Confirm Firebase Authentication email/password provider is enabled in the project configuration; if this cannot be checked programmatically, document it as a console-side prerequisite rather than pretending it is fixed in code.
- Confirm `localhost` and the real deployment domain are valid authorized domains when applicable.
- Ensure Firebase initialization happens once and does not create duplicate app instances during hot reload.
- If the registration form uses only email/password, do not initialize `RecaptchaVerifier`, phone auth, or an invisible iframe on page load.
- If real phone OTP is an intended existing feature, initialize reCAPTCHA only when the user explicitly starts OTP verification, use a stable container, clean up the verifier on unmount/retry, handle blocked third-party content gracefully, and provide a clear user error.
- Do not mark a phone number verified until Firebase or the intended verification service confirms it.

### 5. Fix Express `/login` and `/register` 500 errors

- Identify the exact routes shown as `login` and `register` in the Network panel.
- Inspect controllers, service calls, environment access, Firebase Admin initialization, request-body parsing, and Firestore writes.
- Fix the root cause rather than catching and hiding it.
- Validate request bodies with the project’s existing validation approach or a small local validation layer.
- Return correct status codes:
  - `400` for malformed or invalid input
  - `401` for bad credentials or invalid/expired token
  - `403` for valid identity without permission
  - `404` when an expected record is absent
  - `409` for duplicate account/profile conflicts
  - `429` for rate-limit conditions
  - `500` only for genuine unexpected server failures
- Use a consistent JSON error envelope such as:

```json
{
  "success": false,
  "code": "AUTH_EMAIL_IN_USE",
  "message": "An account already exists for this email.",
  "requestId": "safe-reference-id"
}
```

- Add development-only server logging with request IDs and stack traces, while keeping production responses sanitized.
- Never log passwords, ID tokens, refresh tokens, service-account keys, or full private user records.
- Verify CORS for the actual frontend origin, methods, and required headers. Since preflight is already returning `204`, do not randomly rewrite CORS; confirm the actual POST path and error first.
- Confirm JSON body parsing is registered before routes.
- Confirm Firebase Admin is initialized once and receives valid credentials through environment configuration.
- Make user-profile creation idempotent. Repeating a safe registration/profile-sync request must not create duplicate documents or crash.

### 6. Protect data consistency

Registration must not leave silent partial state.

- Handle the sequence of Auth user creation and Firestore profile creation deliberately.
- If the Auth account is created but profile creation fails, show a recoverable error and implement a safe retry/profile-repair path.
- Do not automatically delete a successfully created Auth user unless that rollback is proven safe and is part of the existing design.
- On later sign-in, repair a missing profile only when authorization and default-role rules make that safe.
- Store server timestamps where appropriate.
- Restrict role values to the project’s allowed roles; never accept arbitrary Admin/Officer roles from an untrusted Citizen registration form.
- Citizen self-registration must always create only the Citizen role unless the existing secure approval workflow says otherwise.

### 7. Add or repair automated tests

Use the existing test stack where present. Add only the minimum missing local dependencies and configuration required to run reliable tests.

#### Unit/component tests

Cover at minimum:

- weak password blocked with zero network calls
- password mismatch blocked
- invalid email blocked
- invalid phone blocked
- terms unchecked blocked
- loading state prevents duplicate submit
- Firebase error-code-to-message mapping
- successful registration calls each required operation exactly once
- failed Firebase registration does not call backend/profile sync
- successful login routes to the correct role
- logout clears the authenticated session safely

#### Backend/API tests

Cover at minimum:

- valid/invalid request body handling
- duplicate registration conflict
- invalid credentials/token
- missing authorization header
- valid Firebase token verification path, using emulator/mocks only at the external boundary
- role authorization for Citizen, Officer, Worker, and Admin
- no unexpected `500` for expected client errors
- consistent error envelope
- CORS preflight and actual POST behavior

#### Playwright end-to-end tests

Run actual browser tests against the local frontend and backend. Use Firebase Emulator Suite if already configured or feasible without destabilizing the project. Otherwise use isolated timestamped QA accounts and clean them up when credentials/tools allow.

Test at minimum:

1. Citizen registration with a unique valid email and strong password.
2. Duplicate-email registration shows a clear error and no crash.
3. Weak password is blocked before the Network panel receives an auth request.
4. Login with a valid Citizen account.
5. Login with a wrong password shows a safe error.
6. Session survives a page refresh.
7. Logout returns to the public/sign-in state.
8. Citizen cannot open Officer, Worker, or Admin-only screens.
9. Existing Officer account routes to Officer workspace.
10. Existing Worker account routes to Worker workspace.
11. Existing Admin account routes to Admin workspace.
12. Citizen can create a complaint with required fields.
13. Complaint draft save/restore still works.
14. Map/location picker loads and remains usable on touch-sized viewport.
15. Profile update still works.
16. No unhandled console errors occur during the critical journeys.
17. No unexpected `5xx` responses occur during the critical journeys.
18. No password/token values appear in logs or UI.

Run the critical journeys at these viewports, adapting only if the existing project supports a different matrix:

- Mobile: `375x812`
- Current screenshot-like compact viewport: approximately `498x668`
- Tablet: `768x1024`
- Desktop: `1440x900`

Use Chromium at minimum. Run Firefox/WebKit only when locally available; mark unavailable browsers as `BLOCKED`, not `PASSED`.

On test failure, retain a screenshot, trace, relevant console output, and request/response status without exposing secrets.

### 8. Run complete release validation

Discover the real scripts from package manifests and run the applicable equivalents of:

- dependency installation using lockfiles (`npm ci` when valid)
- lint
- unit/component tests
- backend tests
- typecheck if configured
- production frontend build
- backend startup/import smoke check
- existing responsive verification script
- Playwright E2E suite

Start both applications and perform one additional agent-driven exploratory browser pass after automated tests. In that pass, click through every major navigation item and verify there are no blank pages, dead buttons, stuck loaders, broken overlays, horizontal overflow, or uncaught errors.

Do not make unrelated cosmetic changes merely because you notice them. Fix only regressions or objectively broken behavior required for release acceptance.

### 9. Create final project documentation

Create or update these files in the repository root:

#### `FINAL_AUTH_FIX_AND_QA_REPORT.md`

Include:

- date/time and tested commit/worktree state
- exact reproduced errors
- root causes
- authentication architecture before and after
- exact files changed and why
- environment-variable names required, without values
- Firebase Console prerequisites that code cannot enforce
- commands executed
- test results in a PASS/FAIL/BLOCKED table
- browser/viewport matrix
- remaining known risks
- production-release recommendation: `READY`, `CONDITIONALLY READY`, or `NOT READY`

#### `MANUAL_ACCEPTANCE_TEST_CHECKLIST.md`

Create a clear checkbox-based manual test guide for a non-technical reviewer. It must include setup, valid test data guidance, registration, login, all roles, complaint workflow, map, profile, responsive layouts, accessibility basics, error messages, Network/Console checks, session/logout, and a final sign-off table.

#### `TEST_ACCOUNTS.md` or existing test-account documentation

Update only if the project already uses dedicated local/emulator accounts. Do not commit real passwords or production credentials. Prefer placeholders and setup instructions.

### 10. Final acceptance criteria

You may call this task complete only when all applicable conditions below are true:

- A two-character password is rejected locally with no Firebase/backend request.
- A valid new Citizen can register exactly once.
- Duplicate email produces a controlled `409`/Firebase-mapped client error, not `500`.
- Valid login works.
- Invalid login produces a controlled `401`/Firebase-mapped client error, not `500`.
- A single submit action does not trigger both competing Firebase and backend auth flows.
- There is no unexplained Firebase iframe/reCAPTCHA failure during ordinary email/password registration.
- User profile synchronization succeeds or fails with a recoverable, accurately reported state.
- Role routing and role restrictions still work.
- Existing complaint, map, profile, dashboard, and responsive behavior are not broken.
- Frontend build passes.
- Automated tests pass, or every genuine environment blocker is clearly evidenced as `BLOCKED`.
- Agent exploratory testing is completed.
- No critical console errors or unexpected `5xx` responses remain in tested critical journeys.
- Final reports are written.

### Required final response format

When finished, respond with exactly these sections:

1. **Root Causes Found**
2. **Files Changed**
3. **Authentication Flow After Fix**
4. **Commands Run**
5. **Automated Test Results**
6. **Agent Browser Test Results**
7. **Manual Testing File Location**
8. **Remaining Blockers/Risks**
9. **Final Release Verdict**

For every failed or blocked item, provide the exact reason and evidence. Do not claim “production ready” simply because the build passes.

---

## QUICK MANUAL ACCEPTANCE CHECKLIST FOR THE PROJECT OWNER

Run this only after Antigravity finishes and both frontend and backend are running.

### Registration

- [ ] Open the Citizen Registration page in a fresh Incognito window.
- [ ] Enter a two-character password and submit.
- [ ] Confirm the form blocks submission locally and shows a clear password message.
- [ ] Confirm no `signUp` and no `register` request appears in Network for that invalid attempt.
- [ ] Enter mismatched passwords and confirm submission is blocked.
- [ ] Enter an invalid email and phone number and confirm submission is blocked.
- [ ] Use a unique email and a strong password, then register.
- [ ] Confirm only one registration flow occurs and the app opens the Citizen area.
- [ ] Refresh the page and confirm the session remains valid.
- [ ] Try registering the same email again and confirm a friendly duplicate-account message appears with no `500` response.

Suggested valid QA password: `RccTest@2026`

Use a unique timestamped QA email rather than a personal production account.

### Login and session

- [ ] Log out.
- [ ] Log in with the valid Citizen account.
- [ ] Try a wrong password and confirm a safe error appears.
- [ ] Confirm the password is not printed in Console, Network response, or UI.
- [ ] Refresh after login and verify the session persists.
- [ ] Log out and verify protected pages are no longer accessible through Back or direct URL/navigation.

### Role access

- [ ] Test Citizen account and confirm it cannot access Officer, Worker, or Admin controls.
- [ ] Test an approved Officer account and confirm Officer routing and permissions.
- [ ] Test an approved Worker account and confirm Worker routing and permissions.
- [ ] Test an Admin account and confirm Admin routing and permissions.
- [ ] Confirm a public registration form cannot choose or create Admin/Officer/Worker role directly.

### Main functionality regression

- [ ] Create a Citizen complaint with all required fields.
- [ ] Save and restore a complaint draft.
- [ ] Select a map location on mobile and desktop.
- [ ] Submit the complaint and verify it appears in My Complaints.
- [ ] Verify status/timeline content is visible.
- [ ] Update profile information and photo if supported.
- [ ] Verify dashboards, reports, helpdesk, emergency help, notifications, and navigation buttons do not open blank pages.
- [ ] Verify Officer/Worker complaint actions still work with their permitted accounts.

### Responsive and usability

- [ ] Test at approximately `375x812`, `498x668`, `768x1024`, and desktop width.
- [ ] Confirm no horizontal page overflow.
- [ ] Confirm menu, form fields, password-eye icons, submit buttons, and chatbot do not overlap.
- [ ] Confirm all important touch targets are easy to tap.
- [ ] Confirm keyboard focus is visible and labels are understandable.
- [ ] Confirm loading states and error messages are readable.

### Browser developer checks

- [ ] Clear Network and Console, then repeat one valid registration/login journey.
- [ ] Confirm there are no unexpected red Console errors.
- [ ] Confirm there are no unexpected `500` responses.
- [ ] Confirm expected invalid attempts return controlled `4xx` errors rather than server crashes.
- [ ] Confirm ordinary email/password auth does not trigger an unexplained failed reCAPTCHA iframe.
- [ ] Confirm one click creates only one auth request sequence.

### Final sign-off

- [ ] Registration passed.
- [ ] Login/session passed.
- [ ] All four roles passed.
- [ ] Complaint workflow passed.
- [ ] Map/profile regression passed.
- [ ] Mobile/tablet/desktop passed.
- [ ] Console/Network passed.
- [ ] No critical unresolved issue remains.

Final reviewer name: ____________________

Date: ____________________

Verdict: `PASS / FAIL / PASS WITH KNOWN LIMITATIONS`
