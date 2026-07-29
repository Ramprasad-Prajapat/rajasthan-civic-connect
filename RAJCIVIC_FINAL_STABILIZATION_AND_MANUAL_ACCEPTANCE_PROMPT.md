# RAJCIVIC FINAL STABILIZATION + MANUAL ACCEPTANCE HANDOFF

## Execution instruction

Continue from the **current Rajasthan Civic Connect repository state**. Do not restart the project, recreate completed work, redesign the UI, or return another plan.

The previous report is **not yet sufficient for final acceptance** because it contains contradictions and unresolved risks, including:

- frontend reported on port `5175` while CORS evidence only lists `5173`;
- weak-password registration was accepted but marked as PASS;
- JWT uses a hard-coded development fallback secret;
- legacy/mock tokens may still be accepted in some modes;
- no automated authentication test suite exists;
- `git status` lists many modified files while the report describes only one changed file;
- browser/responsive PASS claims need reproducible evidence.

Treat this as the final **minimum-patch stabilization, evidence-based QA, and manual-testing handoff**. Complete every locally executable requirement in one run.

Do not commit, push, deploy, upgrade frameworks, redesign screens, add unrelated features, or modify unrelated user work.

---

## 1. Preserve current work and establish the real baseline

Before editing:

1. Run:
   - `git status --short`
   - `git diff --stat`
   - `git diff --name-only`
   - `git diff --check`

2. Read completely:
   - `FINAL_AUTH_FIX_AND_QA_REPORT.md`
   - `MANUAL_ACCEPTANCE_TEST_CHECKLIST.md`
   - backend and frontend `package.json`
   - current authentication controller, middleware, routes, Firebase configuration, local DB implementation, API client, and login/register component.

3. Identify:
   - all pre-existing user changes;
   - all changes made by the previous agent;
   - actual backend URL and port;
   - actual frontend URL and port;
   - active processes and task logs;
   - actual auth mode;
   - exact API base URL used by the frontend.

4. Do not revert or overwrite pre-existing user changes.

5. Do not claim a file is unchanged when it appears in the final diff.

---

## 2. Fix the real frontend-origin and CORS mismatch

The current report says the frontend runs on `http://localhost:5175`, while CORS evidence lists only port `5173`. Resolve this correctly.

Requirements:

1. Confirm the actual frontend origin in the browser.
2. Configure development CORS so the actual frontend origin works.
3. Prefer an environment-driven comma-separated allowlist such as `CORS_ORIGINS`.
4. In development, support the current localhost/127.0.0.1 Vite origin without using an unrestricted wildcard with credentials.
5. In production, allow only explicitly configured production origins.
6. Keep credentials behavior consistent with the frontend request configuration.
7. Test both:
   - OPTIONS preflight;
   - actual POST/GET request from the browser origin.
8. Verify the response has the correct `Access-Control-Allow-Origin`.
9. Do not report CORS PASS until the browser at the real frontend port successfully reaches the backend.

---

## 3. Remove unsafe JWT-secret fallback and insecure token paths

Requirements:

1. Remove any hard-coded fallback such as:
   - `dev-secret-key`;
   - `secret`;
   - `test-secret`;
   - any predictable static secret.

2. Local signed-JWT mode must require a strong `JWT_SECRET`.

3. When local development needs a secret and none exists:
   - generate a cryptographically secure random secret of at least 32 bytes;
   - place it only in the ignored local backend `.env`;
   - do not print it in terminal output, reports, screenshots, or responses;
   - ensure `.env` is ignored;
   - document only the variable name in `.env.example`.

4. Missing or invalid required secrets must cause a clear startup failure instead of silently using an insecure fallback.

5. Remove legacy `MOCK_TOKEN_*` acceptance from normal authentication middleware.

6. Local mode must accept only correctly signed, unexpired JWTs.

7. Firebase/Admin mode must verify the intended Firebase ID token path and must not accept local mock tokens.

8. If proxy mode genuinely exists, it must still verify a cryptographic token or trusted upstream identity. It must not accept editable base64/mock role claims.

9. Add a reasonable token expiry and verify expired-token behavior.

10. Test:
    - missing token;
    - malformed token;
    - tampered payload;
    - wrong signature;
    - expired token;
    - valid token;
    - role-escalation attempt.

---

## 4. Make auth-mode selection explicit and deterministic

Requirements:

1. `AUTH_MODE` must be the single explicit mode selector.
2. Accepted values must be validated.
3. Configure local manual testing with `AUTH_MODE=local` in the ignored local `.env`.
4. Do not infer auth mode from a Firebase web API key.
5. Do not silently switch to local mode in production.
6. Invalid or missing production mode configuration must fail fast with a safe message.
7. Do not log secrets or full credential objects.
8. Record the active non-sensitive mode in the QA report.

---

## 5. Enforce registration validation consistently

Implement the same registration rules in frontend and backend.

At minimum:

- full name is required and trimmed;
- email format is valid and normalized;
- Indian mobile number contains 10 digits and starts with `6`, `7`, `8`, or `9`;
- password has at least 8 characters and includes:
  - one uppercase letter;
  - one lowercase letter;
  - one number;
  - one special character;
- confirm password must match;
- required terms/policy acceptance is enforced in the frontend;
- public registration always creates only a Citizen account;
- any submitted privileged role is ignored or rejected.

Important compatibility rule:

- enforce the stronger password policy for **new registration/password creation**;
- do not unnecessarily break login for valid pre-existing seeded demo users.

When frontend validation fails:

- show a clear inline message;
- do not call Firebase;
- do not call the backend;
- do not create data;
- do not redirect;
- do not leave a loader active.

Test passwords such as:

- invalid: `test1234`;
- valid manual-test example: `RajCivic@2026`.

Do not expose the actual JWT secret or any real user password in reports.

---

## 6. Prevent duplicate submissions and duplicate authentication flows

Verify the complete form path:

`React form → client validation → authentication request → profile/session state → redirect`

Requirements:

1. One click must produce one intended authentication sequence.
2. Disable the submit control while a request is pending.
3. Ignore repeated clicks until completion.
4. Restore the control after success or failure.
5. Verify there is no accidental Firebase call plus a second backend registration/login call unless the architecture explicitly requires both.
6. Verify duplicate submissions cannot create duplicate accounts or duplicate profile documents.
7. Preserve the current UI appearance.

---

## 7. Sanitize every authentication and user response

Search all relevant controllers/services/serializers.

No response, log, error, report, or screenshot may contain:

- plaintext password;
- `passwordHash`;
- `passwordSalt`;
- JWT secret;
- full access token;
- refresh token;
- private key;
- authorization header.

Verify sanitization for:

- registration;
- login;
- `/me`;
- profile;
- user lists;
- role-specific user endpoints;
- error paths.

Use a reusable safe-user serializer when appropriate, but do not perform a broad unrelated refactor.

---

## 8. Clean test/runtime data safely

Inspect `localDb.json` and its intended role.

Requirements:

1. Confirm whether it is tracked seed data or runtime data.
2. Remove only agent-created temporary accounts/records such as obvious `test@example.com` or `testuser@example.com` entries when they were created by this QA run.
3. Preserve pre-existing user data.
4. Ensure no plaintext password remains for any stored user.
5. Do not clear collections or reset all data.
6. Avoid leaving random timestamps or QA mutations in tracked seed data.
7. If runtime data should not be committed, handle it using the repository's existing data strategy rather than a broad redesign.
8. Report exactly what cleanup was performed.

---

## 9. Add minimal deterministic automated auth tests

The previous report says no auth tests exist. Add a focused test suite using the repository's existing framework. If no framework exists, prefer Node's built-in `node:test` for backend tests rather than installing a large new dependency.

Cover at least:

1. empty registration;
2. invalid email;
3. invalid Indian mobile;
4. weak password rejected;
5. valid registration;
6. duplicate email;
7. correct login;
8. incorrect login;
9. response contains no password/hash/salt;
10. protected route without token;
11. malformed/tampered token rejected;
12. valid token accepted;
13. role-escalation payload rejected;
14. public registration cannot create Admin/Officer/Worker;
15. CORS preflight for the actual development frontend origin.

Tests must be isolated and deterministic. They must not destroy existing user data.

Add only the minimum test script/configuration required.

Do not mark missing tests as PASS.

---

## 10. Run all available validation commands

Inspect actual scripts and run every relevant command in the correct directory:

- install verification only when needed;
- lint;
- typecheck;
- unit tests;
- backend auth/integration tests;
- E2E tests when available;
- production frontend build;
- any backend syntax/startup validation.

Rules:

1. Do not invent commands that do not exist.
2. Do not write “all tests pass” without command evidence.
3. If a script is unavailable, mark it `NOT AVAILABLE`.
4. Fix only failures caused by this auth/stabilization work.
5. Document unrelated pre-existing failures without changing unrelated modules.
6. Run `npm audit` only as an informational check when appropriate; do not perform broad automatic dependency upgrades.

---

## 11. Perform real browser QA with evidence

Use the agent browser or available browser automation. API-only curl tests are not sufficient.

Test the real rendered UI at:

- `375 × 812`
- `498 × 668`
- `768 × 1024`
- `1440 × 900`

Test:

### Registration
- empty form;
- invalid email;
- invalid mobile;
- weak password;
- password mismatch;
- unchecked terms;
- valid unique Citizen registration;
- duplicate email;
- repeated submit clicks.

### Login/session
- correct credentials;
- wrong password;
- empty fields;
- repeated clicks;
- refresh/session persistence;
- logout;
- browser Back after logout;
- direct protected-route access after logout.

### Authorization
- Citizen route access;
- Citizen attempt to open Admin route;
- Officer/Worker/Admin flows only when valid seeded credentials exist;
- do not fabricate privileged-role PASS results.

### Main regression
- dashboard;
- complaint creation;
- complaint listing/detail;
- draft behavior when implemented;
- profile;
- notifications;
- reports;
- helpdesk;
- emergency page;
- navigation/menu;
- location/map flow where implemented.

At each critical step inspect:

- Console;
- Network;
- duplicate requests;
- unexpected 4xx/5xx;
- blank pages;
- stuck loaders;
- horizontal overflow;
- obstructed form controls.

Save reproducible QA evidence under a scoped folder such as:

`qa-evidence/final-auth/`

Include only non-sensitive screenshots/log summaries. Never capture full tokens or secrets.

If browser automation is unavailable, mark browser tests `BLOCKED`; do not claim PASS from API calls alone.

---

## 12. Accurate final diff review

Before completion run:

- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- `git diff --check`

Review every modified file.

Confirm:

- recreated `authController.js` did not remove original features;
- all changed files are listed accurately;
- package changes are strictly required;
- no unrelated UI/design work was introduced;
- no secret was committed;
- no test account or full token is committed;
- no plaintext passwords remain;
- no hard-coded JWT secret remains;
- no legacy mock-token acceptance remains;
- CORS supports the actual frontend origin;
- production build passes.

Remove only unrelated changes created by the agent. Never revert pre-existing user work.

Do not commit, push, deploy, or run destructive Git commands.

---

## 13. Update final reports for manual handoff

Update:

- `FINAL_AUTH_FIX_AND_QA_REPORT.md`
- `MANUAL_ACCEPTANCE_TEST_CHECKLIST.md`

The QA report must state:

- exact root causes;
- exact files changed;
- exact commands and results;
- actual frontend/backend URLs;
- actual CORS origin tested;
- validation rules;
- token/security behavior;
- automated test results;
- real browser evidence;
- data cleanup;
- remaining limitations;
- separate local and production verdicts.

The manual checklist must include:

- exact startup commands;
- exact URLs and ports;
- safe unique-account test procedure;
- valid password example `RajCivic@2026`;
- registration/login/logout/session tests;
- role-boundary tests;
- complaint workflow tests;
- four responsive viewport tests;
- Console/Network inspection instructions;
- expected result beside every step;
- a simple PASS/FAIL/NOT TESTED column;
- an issue-log section with page, steps, expected, actual, console error, network status, and screenshot filename.

Do not put a real JWT secret, full token, or private credential in either report.

---

## 14. Leave the project ready for the user's manual test

After every required check is complete:

1. Start exactly one backend process.
2. Start exactly one frontend process.
3. Confirm both are reachable.
4. State the final URLs clearly.
5. Leave both processes running.
6. Do not make further code edits after declaring the handoff ready.
7. Tell the user to follow `MANUAL_ACCEPTANCE_TEST_CHECKLIST.md`.

Final verdict rules:

- Use `LOCAL MANUAL TEST READY` only when all locally executable critical checks PASS.
- Use `NOT READY` when any critical local auth, CORS, security, build, or browser test fails.
- Real Firebase/production verification must remain `BLOCKED` unless it was genuinely executed with authorized credentials.
- Never call the app production-ready merely because local mode passes.

---

## Required final response format

Use exactly:

1. Contradictions Corrected
2. Root Causes Confirmed
3. Files Changed
4. Security Changes
5. Validation Changes
6. CORS and Runtime URLs
7. Automated Test Results
8. Browser Test Results
9. Responsive Test Results
10. Console and Network Evidence
11. Data Cleanup
12. Commands Run
13. Final Diff Review
14. Reports Updated
15. Remaining Blockers
16. Manual Testing Handoff
17. Final Verdict

For every test use only:

- `PASS`
- `FAIL`
- `BLOCKED`
- `NOT AVAILABLE`

Provide evidence for every PASS.

Begin execution immediately from the current repository state. Do not return another plan or progress-only message.
