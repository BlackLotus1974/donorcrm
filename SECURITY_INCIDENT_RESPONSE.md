# Security Incident Response - Exposed Supabase Credentials

## Status: ⚠️ URGENT ACTION REQUIRED

### What Happened
Supabase credentials were accidentally committed to the GitHub repository on **October 18, 2025** in commit `6db61c6`.

**Exposed Credentials:**
- Supabase Project URL: `https://flqgkpytrqpkqmedmtuf.supabase.co`
- Supabase Anon Key (public) - Low risk
- **Supabase Service Role Key** - HIGH RISK ⚠️

### Immediate Actions Required

#### 1. Rotate Supabase Service Role Key (CRITICAL)
**Do this NOW:**

1. Go to https://supabase.com/dashboard/project/flqgkpytrqpkqmedmtuf/settings/api
2. Click "Reset service_role key"
3. Copy the new service_role key
4. Update your local `.env.docker` and `.env.local` files
5. Update any production deployments

**Why this is critical:**
- Service role key bypasses Row Level Security (RLS)
- Exposed key could allow unauthorized database access
- Could lead to data breach, data loss, or service disruption

#### 2. Review Database Access Logs
Check Supabase logs for any suspicious activity:
1. Go to https://supabase.com/dashboard/project/flqgkpytrqpkqmedmtuf/logs/explorer
2. Check for API requests from unfamiliar IPs
3. Look for unusual database queries
4. Review authentication attempts

#### 3. Clean Git History (Optional but Recommended)
The secrets are still in Git history. To completely remove them:

```bash
# Install BFG Repo Cleaner (easier than git-filter-repo)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Create a backup first!
cd ..
cp -r crm crm-backup

# Go back to repo
cd crm

# Create a file with secrets to remove
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5NTQ0OCwiZXhwIjoyMDc2MjcxNDQ4fQ.jatPHfLaKxVvZnnNI5QycHnCx0gX6gFIdiBVybgPbFU" > secrets.txt

# Run BFG to remove secrets
java -jar bfg.jar --replace-text secrets.txt

# Force push cleaned history
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push origin master --force

# Clean up
rm secrets.txt
```

**WARNING:** Force pushing rewrites history. Coordinate with any collaborators.

### What We Fixed
✅ Removed hardcoded secrets from `docker-compose.local-prod.yml`
✅ Replaced with environment variable references
✅ Removed API keys from `.claude/.mcp.json`
✅ Pushed fix to GitHub (commit `dba33a6`)

### What Still Needs Attention
⚠️ **Rotate Supabase Service Role Key** - Do this first!
🔍 Review Supabase access logs
🧹 Clean Git history (optional)
📝 Update production deployments with new keys

### Prevention Measures

1. **Never commit `.env*` files** except `.env.example`
2. **Use .gitignore** to exclude sensitive files
3. **Use environment variables** for all secrets
4. **Enable GitHub secret scanning** (already active)
5. **Use pre-commit hooks** to scan for secrets

### Git Hooks for Secret Detection
Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check for potential secrets before commit

if git diff --cached | grep -E "(SUPABASE_SERVICE_ROLE_KEY|sk-ant-|pplx-|eyJ)" >/dev/null; then
    echo "⚠️  ERROR: Potential secret detected in commit!"
    echo "Please remove secrets and use environment variables instead."
    exit 1
fi
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Lessons Learned
1. Environment variables should NEVER be hardcoded in version-controlled files
2. Docker Compose should always use `--env-file` for secrets
3. Build args should reference environment variables, not hardcoded values
4. Service role keys require extra protection (never commit, rotate immediately if exposed)

### Timeline
- **Oct 18, 2025 14:38 UTC** - Secrets committed in `6db61c6`
- **Oct 18, 2025 14:40 UTC** - GitHub secret scanning alerted
- **Oct 18, 2025 16:04 UTC** - Secrets removed in `dba33a6`
- **PENDING** - Service role key rotation

### Contact
If you discover any unauthorized access or suspicious activity:
1. Immediately revoke all Supabase keys
2. Contact Supabase support
3. Review and restore from backup if needed

---

**Remember: The exposed service_role key MUST be rotated immediately!**

This is not optional - do it now before reading further.
