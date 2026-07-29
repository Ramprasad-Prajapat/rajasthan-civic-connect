# RAJCIVIC — FINAL AUTONOMOUS COMPLETION PROMPT
## One execution only • No further user prompt will be provided

Continue from the **exact current Rajasthan Civic Connect repository, terminal, task, and process state**.

The user will not send another implementation prompt. You must therefore finish every remaining locally executable fix, verification, cleanup, test, report, and manual-testing handoff in this execution.

The duplicate-registration command is currently running or has just finished. Retrieve its result first. Do not restart from the beginning and do not discard valid work already completed.

---

# 0. EXECUTION BEHAVIOR — NON-NEGOTIABLE

Operate in a closed loop:

**inspect → reproduce → fix → rerun → verify → document → final handoff**

Do not stop after:
- a command starts;
- a test begins;
- an API endpoint passes;
- a plan is written;
- a progress update is produced;
- frontend/backend startup;
- one bug is fixed;
- a report is generated.

Do not reply with:
- “Next I will…”
- “I’ll report back…”
- “Let me know…”
- “Further work is recommended…”
- another implementation plan;
- a progress-only status.

Do not use `ask_permission` for ordinary, non-destructive edits and commands that are already inside this approved scope. If the platform itself requires permission, request permission **once for the complete remaining scoped work**, not repeatedly per file or command.

Pause only for a genuine external blocker that cannot be solved locally, such as unavailable authorized Firebase credentials or a mandatory external console action. Even then, complete every other local task first.

Do not commit, push, deploy, create a pull request, or alter remote infrastructure.

---

# 1. SCOPE LOCK

This is a final **authentication, validation, CORS, security, test, QA, and manual-handoff stabilization task**.

Allowed changes:
- backend authentication config/controller/middleware/routes;
- local development DB handling only where required for auth security or QA cleanup;
- frontend registration/login/session handling;
- API client/CORS configuration;
- minimal environment examples and ignore rules;
- minimal auth tests and existing test configuration;
- final QA reports/checklists;
- narrowly related server startup/health-route corrections.

Forbidden changes:
- UI redesign;
- color, font, spacing, logo, icon, animation, layout, content, or branding changes;
- unrelated feature additions;
- dashboard redesign;
- broad architecture rewrite;
- dependency/framework upgrades;
- database schema redesign;
- route renaming unrelated to the confirmed defect;
- production deployment;
- destructive Git commands;
- deleting existing user work or real user data;
- automatic formatting of the whole repository;
- suppressing errors instead of fixing them;
- fake success responses;
- mock authentication replacing real intended authentication;
- weakening authorization/security to make tests pass.

Use the smallest correct patch. Preserve all pre-existing user changes.

---

# 2. CURRENT CONTRADICTIONS THAT MUST BE RESOLVED

The previous output must not be accepted as final because it contains unresolved contradictions. Verify and correct all of them:

1. Frontend was reported on `http://localhost:5175`, while CORS evidence listed only `http://localhost:5173` and `http://127.0.0.1:5173`.
2. Weak password registration succeeded with HTTP 201 but was incorrectly marked PASS.
3. JWT used or mentioned a fallback such as `dev-secret-key`.
4. Mock or editable tokens were still permitted in some local/proxy paths.
5. No deterministic automated authentication suite existed.
6. `git status` listed many modified files while the report claimed only one changed file.
7. Browser/responsive claims may have been recorded without reproducible browser evidence.
8. `/health` and `/api/health` were used inconsistently.
9. Temporary users such as `testuser@example.com` or `newuser@example.com` may remain in tracked local data.
10. Reports declared “no further changes required” while also listing critical security gaps.

Do not merely rewrite the report. Fix the underlying code/config/test issues and then regenerate accurate reports.

---

# 3. RESUME THE CURRENT COMMAND AND ESTABLISH BASELINE

First:

1. Retrieve the output/status of the currently running duplicate-registration test.
2. Inspect active background tasks and logs.
3. Run from repository root:
   - `git status --short`
   - `git diff --stat`
   - `git diff --name-only`
   - `git diff --check`
4. Read completely:
   - `RAJCIVIC_FINAL_STABILIZATION_AND_MANUAL_ACCEPTANCE_PROMPT.md`
   - `FINAL_AUTH_FIX_AND_QA_REPORT.md`
   - `MANUAL_ACCEPTANCE_TEST_CHECKLIST.md`
   - root, frontend, and backend `package.json`
   - backend auth config/controller/middleware/routes/local DB/server;
   - frontend login/register component, auth/session state, router guards, Firebase initialization, and API client.
5. Identify which modifications existed before this agent session and which were created during this task.
6. Preserve all pre-existing user changes.
7. Review the recreated `authController.js` against available Git history/current routes so no original auth/profile behavior was accidentally removed.
8. Record the actual current backend port, frontend port, API base URL, auth mode, and canonical health route.

Do not assume the previous report is correct; source code, runtime behavior, and test evidence are the authority.

---

# 4. PROCESS AND PORT STABILIZATION

The final manual handoff must use exactly one backend process and one frontend process.

1. Identify project-owned Node/Vite processes.
2. Stop only stale/duplicate processes belonging to this repository.
3. Never terminate unrelated user processes.
4. Start backend explicitly on port `5000`.
5. Prefer frontend on port `5173` with a strict port when available.
6. If `5173` is occupied by an unrelated process, use one explicit alternative such as `5175`, configure it consistently, and document it.
7. Do not allow Vite to silently drift to another port.
8. Verify listening ports and process ownership.
9. Confirm the frontend page loads and reaches the backend.

Health route:
- identify the intended existing route;
- if both `/health` and `/api/health` are already referenced by project scripts/reports, either safely expose both through the same handler or standardize all code, tests, and documentation on one canonical route;
- do not leave contradictory instructions.

---

# 5. EXPLICIT AUTH MODE

Make authentication mode deterministic.

1. `AUTH_MODE` must be the only mode selector.
2. Validate accepted values; use only modes actually supported by the repository.
3. For local manual testing, configure `AUTH_MODE=local` in an ignored backend `.env`.
4. Do not infer mode from a Firebase Web API key.
5. Do not silently fall back to local mode in production.
6. In production, missing or invalid auth configuration must fail safely at startup.
7. Log only the non-sensitive active mode.
8. Do not log service-account objects, secrets, tokens, private keys, or authorization headers.
9. Real Firebase/Admin verification must remain BLOCKED unless authorized credentials are genuinely available and tested.

Update `.env.example` with variable names/placeholders only. Never put a real secret in `.env.example` or Git.

---

# 6. JWT AND TOKEN SECURITY

Eliminate insecure token behavior.

1. Remove every hard-coded/predictable JWT fallback:
   - `dev-secret-key`
   - `secret`
   - `test-secret`
   - similar static values.
2. Local JWT mode must require `JWT_SECRET`.
3. If local `.env` lacks it, generate a cryptographically secure random value of at least 32 bytes and save it only to the ignored backend `.env`.
4. Do not print the generated secret.
5. Confirm `.env` is ignored.
6. Set a reasonable token expiry.
7. Verify signature, expiry, required claims, user existence/status, and role source.
8. Do not trust role/portal values supplied by the client.
9. Remove acceptance of legacy `MOCK_TOKEN_*`, base64-only tokens, or editable unsigned role claims from normal middleware.
10. Firebase/Admin mode must verify the intended Firebase ID token path and must not accept local mock/JWT tokens unless the architecture explicitly separates environments.
11. A tampered Citizen token must never become Admin/Officer/Worker.
12. Missing, malformed, wrong-signature, expired, and tampered tokens must return appropriate 401 responses.
13. Authenticated users lacking permission must receive 403.
14. Do not include full tokens in reports or terminal excerpts.

---

# 7. PASSWORD AND USER-DATA SECURITY

1. Store local passwords using the existing secure hash approach; use a per-user random salt.
2. Compare hashes using a safe constant-time comparison where applicable.
3. Never store a new plaintext password.
4. Search all response paths and serializers.
5. Never return or log:
   - `password`
   - `passwordHash`
   - `passwordSalt`
   - JWT secret
   - full token
   - refresh token
   - private key
   - authorization header.
6. Sanitize:
   - registration;
   - login;
   - `/me`;
   - profile;
   - user listing;
   - role-specific endpoints;
   - error paths.
7. Create/reuse a narrow safe-user serializer where useful.
8. Confirm seeded/pre-existing local users are handled without exposing or corrupting data.
9. Do not claim secure storage merely from one successful response; inspect persisted local data too.

---

# 8. CONSISTENT REGISTRATION VALIDATION

Apply matching frontend and backend rules.

Required new-registration rules:
- full name required and trimmed;
- valid normalized email;
- Indian mobile number: exactly 10 digits, starts with 6/7/8/9;
- optionally accept `+91` input only after safe normalization to the same 10-digit form;
- password at least 8 characters;
- at least one uppercase letter;
- at least one lowercase letter;
- at least one number;
- at least one special character;
- confirm password matches;
- required terms/policy checkbox checked in frontend;
- public registration creates only `Citizen`;
- submitted `Admin`, `Officer`, `Worker`, role, portal, claims, or status values are ignored or rejected.

Compatibility rule:
- enforce stronger rules for new registration/password creation;
- do not unnecessarily break login for legitimate existing seeded demo accounts.

Expected tests:
- `test1234` must be rejected;
- `Password123!`, `StrongPass1!`, and `RajCivic@2026` should satisfy the password rule;
- `1234567890` must be rejected as an Indian mobile;
- `9876543210` must be accepted;
- `+919876543210` may be accepted only if normalized safely.

Frontend invalid input must:
- show a clear inline message;
- send zero Firebase requests;
- send zero backend requests;
- create no record;
- perform no redirect;
- always end loading state.

Do not change the visual design.

---

# 9. DUPLICATE SUBMISSION AND AUTH FLOW

Trace the real end-to-end flow:

`React form → validation → auth request → user/profile/session state → route redirect`

Requirements:
1. One submit action produces one intended auth sequence.
2. Submit controls are disabled while pending.
3. Repeated clicks are ignored until completion.
4. Controls recover after success/failure.
5. Verify whether frontend performs Firebase Auth plus backend auth for one action.
6. Preserve only the intended source of authentication truth.
7. Duplicate submissions must not create duplicate accounts/profile documents.
8. Duplicate-email registration must return 400 or 409 with a friendly response.
9. Login/register loaders must never remain stuck.
10. Network evidence must show request counts.

---

# 10. CORS AND API CONNECTIVITY

Fix actual runtime origin handling.

1. Determine the real frontend origin after process stabilization.
2. Prefer an environment-driven comma-separated allowlist such as `CORS_ORIGINS`.
3. Support both `localhost` and `127.0.0.1` for the actual chosen development port when needed.
4. Do not use unrestricted `*` with credentialed requests.
5. Production must allow only explicitly configured origins.
6. Confirm frontend credentials/request mode matches backend CORS settings.
7. Test:
   - OPTIONS preflight;
   - register POST;
   - login POST;
   - protected GET.
8. Verify `Access-Control-Allow-Origin` equals the requesting permitted origin.
9. Verify a disallowed origin is rejected safely.
10. Do not claim PASS while frontend is on 5175 and only 5173 is configured.

---

# 11. SAFE QA DATA CLEANUP

Inspect local runtime/seed data.

1. Determine whether `localDb.json` is tracked seed data, runtime data, or both.
2. Remove only temporary records created by this agent/test run, including obvious test accounts where safe:
   - `testuser@example.com`
   - `newuser@example.com`
   - other unique QA emails created during this execution.
3. Preserve all pre-existing users and data.
4. Never clear collections or reset the entire database.
5. Ensure no plaintext password remains.
6. Avoid leaving meaningless timestamp churn in tracked data.
7. Use isolated temporary storage for automated tests where possible.
8. Document exact cleanup.

---

# 12. MINIMAL AUTOMATED AUTH TEST SUITE

Add deterministic tests now; “recommended later” is not acceptable.

Use the repository’s existing test framework. If the backend has no framework, prefer Node’s built-in `node:test` and existing dependencies rather than adding a large test stack.

Cover at minimum:

1. health endpoint;
2. empty registration;
3. invalid email;
4. invalid Indian mobile;
5. weak password rejected;
6. valid registration;
7. duplicate registration;
8. correct login;
9. wrong-password login;
10. nonexistent-user login;
11. registration/login responses contain no password/hash/salt;
12. protected route without token;
13. malformed token;
14. wrong-signature token;
15. tampered role payload;
16. expired token;
17. valid token;
18. privileged role in public registration rejected/ignored;
19. public registration results in Citizen only;
20. actual development-origin CORS preflight;
21. disallowed-origin CORS behavior;
22. duplicate request/idempotency behavior where testable.

Tests must:
- be isolated;
- use unique emails or temporary test data;
- not destroy existing data;
- clean up their own records;
- assert status and body;
- avoid printing full tokens/passwords.

Add only minimal scripts/config required.

---

# 13. REAL BROWSER QA

API curl/Node tests alone are not browser QA.

Use Antigravity’s browser agent/controller. If unavailable, use the repository’s existing Playwright setup. Add a browser test dependency only when no built-in/existing browser method works and the addition is minimal, justified, and scoped.

Test the rendered app:

## Registration
- empty form;
- invalid email;
- invalid mobile;
- weak password;
- mismatch;
- unchecked terms;
- valid unique Citizen;
- duplicate email;
- rapid/repeated submit.

## Login/session
- correct credentials;
- wrong password;
- unknown email;
- empty form;
- rapid/repeated submit;
- refresh persistence;
- logout;
- browser Back after logout;
- direct protected-route access after logout.

## Authorization
- Citizen route access;
- Citizen direct attempt to open Admin route;
- Officer/Worker/Admin only with valid existing seeded credentials;
- do not fabricate privileged-role PASS results.

## Main regression
- dashboard;
- complaint creation;
- complaint draft if implemented;
- complaint listing/detail;
- profile;
- notifications;
- reports;
- helpdesk;
- emergency;
- navigation/menu;
- map/location flow where implemented.

Inspect during each critical flow:
- Console;
- Network;
- request count;
- response status/body;
- redirects;
- blank screens;
- stuck loaders;
- uncaught errors;
- CORS errors.

Store non-sensitive evidence in:
`qa-evidence/final-auth/`

Evidence may include screenshots and concise logs, but never full tokens/secrets/passwords.

If a browser test genuinely cannot run, mark it BLOCKED. Never convert API evidence into a browser PASS.

---

# 14. RESPONSIVE QA

Test exact viewports:
- `375 × 812`
- `498 × 668`
- `768 × 1024`
- `1440 × 900`

Verify:
- no horizontal overflow;
- no clipped/overlapping fields;
- labels and validation readable;
- password-eye control usable;
- submit button accessible;
- floating chatbot does not cover form/actions;
- menu opens/closes;
- keyboard focus visible;
- loader/error states remain usable.

Do not redesign while testing. Fix only confirmed defects with minimal CSS/component changes.

---

# 15. FULL VALIDATION COMMANDS

Inspect actual scripts and run every relevant available command from the correct directory:

- lint;
- typecheck;
- unit tests;
- backend auth/integration tests;
- browser/E2E tests;
- production frontend build;
- backend startup/syntax validation.

Rules:
1. Do not invent a passing result.
2. Missing script = `NOT AVAILABLE`, unless this prompt specifically requires adding the minimal auth-test script.
3. Fix only failures caused by scoped work.
4. Document unrelated pre-existing failures without changing unrelated modules.
5. Do not use broad auto-fix or dependency upgrades.
6. Do not run destructive cleanup outside project-owned generated caches.
7. `npm audit` may be informational only; do not perform broad upgrade work.

After fixes, rerun affected tests until stable.

---

# 16. REPORT ACCURACY AND SELF-CHECK

Update:
- `FINAL_AUTH_FIX_AND_QA_REPORT.md`
- `MANUAL_ACCEPTANCE_TEST_CHECKLIST.md`

Before finalizing, search the repository/reports for:
- `dev-secret-key`;
- `MOCK_TOKEN`;
- plaintext test passwords in stored data;
- claims that weak password acceptance is PASS;
- stale frontend port;
- stale CORS port;
- “no tests exist” after tests were added;
- “only one file changed” when diff lists more;
- full token strings;
- real secrets.

The QA report must include:
- exact root causes;
- actual changed-file list;
- reason for each changed file;
- actual runtime URLs;
- canonical health route;
- auth mode;
- CORS origin tested;
- validation policy;
- token/security behavior;
- commands and real results;
- automated test counts/results;
- browser evidence;
- responsive evidence;
- temporary-data cleanup;
- unresolved external blockers;
- separate local and production/Firebase verdicts.

The manual checklist must include:
- exact backend command;
- exact frontend command;
- exact URLs;
- health URL;
- unique manual-account procedure;
- valid test example:
  - Name: `Pawan Manual QA`
  - Mobile: `9876543563`
  - Password: `RajCivic@2026`
  - unique email instruction;
- registration/login/session/logout/role checks;
- complaint regression checks;
- four viewport checks;
- Console/Network instructions;
- expected result for each step;
- columns for PASS / FAIL / NOT TESTED;
- issue log template.

Never include the real JWT secret or a full token.

---

# 17. FINAL DIFF AUDIT

Before completion run:

- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- `git diff --check`

Then review every modified file.

Confirm:
- no original auth behavior was accidentally deleted;
- every changed file is accurately reported;
- dependency changes are strictly required;
- no unrelated design/content changes exist;
- no secret is tracked;
- no full token is tracked;
- no plaintext password remains;
- no hard-coded JWT fallback remains;
- no mock-token bypass remains;
- CORS matches actual frontend origin;
- automated auth tests pass;
- production frontend build passes;
- reports match evidence.

Remove only unrelated changes created by this agent. Never revert pre-existing user changes.

Do not use:
- `git reset --hard`
- `git clean -fd`
- `git checkout .`
- `git restore .`
- destructive stash operations.

---

# 18. MANUAL-TEST HANDOFF STATE

When all locally executable work is complete:

1. Stop duplicate project processes.
2. Start exactly one backend process.
3. Start exactly one frontend process.
4. Confirm both are reachable.
5. Confirm browser can register/login through the real UI.
6. Leave both processes running.
7. State exact URLs and ports.
8. Tell the user to follow `MANUAL_ACCEPTANCE_TEST_CHECKLIST.md`.
9. Make no additional code changes after declaring handoff ready.

Verdict rules:
- `LOCAL MANUAL TEST READY` only when all critical local auth, validation, token, CORS, automated-test, browser, build, and diff checks PASS.
- `NOT READY` if any critical local check fails.
- `REAL FIREBASE VERIFICATION: BLOCKED` unless actually tested with authorized credentials.
- `PRODUCTION READY` must not be claimed from local mode alone.

---

# 19. FINAL RESPONSE — ONLY AFTER ALL WORK

Use exactly these sections:

1. Current Command Result
2. Contradictions Corrected
3. Root Causes Confirmed
4. Files Changed
5. Security Changes
6. Validation and Duplicate-Submit Changes
7. CORS, Health Route, and Runtime URLs
8. Automated Test Results
9. Browser Test Results
10. Responsive Test Results
11. Console and Network Evidence
12. QA Data Cleanup
13. Commands Run
14. Final Diff Review
15. Reports Updated
16. External Blockers
17. Manual Testing Handoff
18. Final Verdict

For each test use only:
- `PASS`
- `FAIL`
- `BLOCKED`
- `NOT AVAILABLE`

Provide real evidence for every PASS.

Do not end with a question, an offer, a recommendation for another prompt, or “next steps.” This is the final autonomous completion run.

Begin now by retrieving the duplicate-registration test result and continue without interruption until the final manual-testing handoff is ready.
