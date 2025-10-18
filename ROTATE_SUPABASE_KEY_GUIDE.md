# How to Rotate Supabase Service Role Key

## Step-by-Step Guide

### Step 1: Navigate to API Keys
1. In Supabase dashboard, click **"API Keys"** in the left sidebar
   - It's under "PROJECT SETTINGS" section
   - Should have a "NEW" badge next to it

### Step 2: Find Service Role Key
On the API Keys page, you'll see two keys:
- **anon (public)** - This is safe, used in client-side code
- **service_role (secret)** - This is the one that was exposed and needs rotation

### Step 3: Reset the Service Role Key

**Option A: If there's a "Reset" button**
1. Click the reset/regenerate icon next to `service_role` key
2. Confirm the reset
3. Copy the new key immediately

**Option B: If there's no reset button visible**
Supabase may not allow direct key rotation from the UI. In this case:

1. **Contact Supabase Support**
   - Go to: https://supabase.com/dashboard/support
   - Request service_role key rotation
   - Reference the exposed key incident

2. **Or create a new project** (if this is development/testing)
   - Export your database schema
   - Create a new Supabase project
   - Import schema to new project
   - Use new project's keys

### Step 4: Update Your Environment Files

Once you have the new service_role key:

1. **Update `.env.local`**:
```env
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key-here
```

2. **Update `.env.docker`**:
```env
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key-here
```

3. **Never commit these files to Git!**

### Step 5: Verify the Change

1. Restart your application
2. Check that everything still works
3. The old key should now be invalid

## Alternative: Revoke Access via RLS Policies

While waiting for key rotation, you can add extra security:

1. **Review RLS Policies**: Make sure Row Level Security is enabled on all tables
2. **Check API Settings**: Ensure Data API is only exposing necessary schemas
3. **Monitor Logs**: Watch for suspicious activity

## What NOT to Do

❌ Don't ignore this - exposed service_role keys are serious
❌ Don't just change the key in your .env file without rotating in Supabase
❌ Don't commit the new key to Git

## If You Can't Find Reset Option

If Supabase UI doesn't show a reset button for service_role key:

### Contact Supabase Support:
- **Email**: support@supabase.com
- **Dashboard**: https://supabase.com/dashboard/support
- **Message**: "Service role key exposed in public GitHub repo. Need immediate rotation. Project: flqgkpytrqpkqmedmtuf"

### Immediate Mitigation:
1. Enable RLS on all tables (if not already)
2. Review and restrict API access
3. Monitor logs for suspicious activity
4. Consider creating new project for production

## After Rotation

1. ✅ Update GitHub security alert to "Resolved"
2. ✅ Update all deployment environments
3. ✅ Verify old key no longer works
4. ✅ Document the incident

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs/guides/api#api-keys
- Support: https://supabase.com/dashboard/support
