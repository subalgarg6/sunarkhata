# SunarKhata — Emergent Deployment Notes

## Problem
User's SunarKhata Vite frontend app was imported into Emergent. Publish button was disabled
because both supervisor programs (backend, frontend) were FATAL — Emergent's *read-only*
supervisor config expects `/app/backend` and `/app/frontend` directories, which did not
exist in this single-directory Vite repo.

## Constraint from user
Do NOT permanently restructure the canonical GitHub repository. The Vite app must remain
at the repo root. Any Emergent-required layout must be a git-ignored deployment wrapper.

## Deployment Wrapper Strategy (all git-ignored)
| Wrapper file/dir | Purpose |
|---|---|
| `/app/frontend` → symlink to `/app` | Satisfies supervisor `directory=/app/frontend`; resolves to canonical Vite root |
| `/app/backend/` | Minimal FastAPI stub (server.py + requirements.txt + .env) for `uvicorn server:app` on 8001 |
| `/app/vite.config.emergent.js` | Extends canonical vite.config.js with dev-server overrides (host 0.0.0.0, allowedHosts:true, watcher ignores symlink loop) |
| `/app/.env` | VITE_* + REACT_APP_BACKEND_URL for the preview |
| `/app/.yarnrc` | `--install.ignore-engines true` for Node 20 / supabase-js compatibility |

## Committed changes to canonical repo (minimal)
1. `package.json` — added `"start": "vite --config vite.config.emergent.js"` script only (deployment-only, harmless in dev/prod build)
2. `.gitignore` — added `/frontend`, `/backend`, `.yarnrc`, `vite.config.emergent.js`

## Verification (testing_agent iteration_1.json)
- ✅ Backend RUNNING on 8001, `GET /api/health` = 200 `{"status":"ok","database":"ok"}`
- ✅ Frontend RUNNING on 3000, external HTTP 200, renders SunarKhata landing page
- ✅ `yarn build` = exit 0, produces `/app/dist/`
- ✅ `git diff vite.config.js` = 0 (untouched)
- ✅ No Vite watcher recursion via the symlink
- ✅ Success rate: backend 100%, frontend 100%

## Publish State
Publish button prerequisites are all satisfied (both services healthy, production build passes).

## Future / Backlog
- Real Supabase + Firebase production keys should be added via Emergent env-vars panel before publish
- `package-lock.json` should be removed from canonical repo (yarn.lock is SoT) — user decision
- Bundle size > 500 kB warning — consider code-splitting on service.js modules
