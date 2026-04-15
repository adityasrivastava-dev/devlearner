# Security Notes

## ⚠ CRITICAL — Hardcoded Production Credentials

**File:** `learning-system/src/main/resources/application.properties` — lines 8, 10, 42, 48

**What is exposed:**
- MySQL database password (line 8 / 10)
- JWT signing secret (line 42)
- Google OAuth2 client secret (line 48)

**Real-world impact:**
- Full database read/write access using the hardcoded DB password
- Any attacker can forge valid JWT tokens using the exposed signing secret → impersonate any user including admins
- Google OAuth2 client secret compromise → hijack OAuth flow, issue tokens on behalf of the application

**Required actions (in order):**
1. **Rotate the MySQL password** on Railway/RDS immediately
2. **Rotate the JWT secret** — generate a new one: `openssl rand -base64 64`
   - All existing tokens become invalid; users will be logged out (acceptable trade-off)
3. **Rotate the Google OAuth2 client secret** in Google Cloud Console → APIs & Services → Credentials
4. **Remove from git history:**
   ```bash
   git filter-repo --path learning-system/src/main/resources/application.properties --invert-paths
   # Then force-push all branches
   git push origin --force --all
   ```
5. **Replace hardcoded values with environment variables only** — no fallback defaults that contain real secrets:
   ```properties
   spring.datasource.password=${DATABASE_PASSWORD}
   app.jwt.secret=${JWT_SECRET}
   spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
   ```

**Status:** ⏳ Pending rotation — do not deploy to production until completed.

---

*All other security vulnerabilities found in the system review have been patched in code.*
*See git history for individual fixes.*
