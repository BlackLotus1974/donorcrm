-- Completely rewrite RLS policies to avoid all recursion
-- The key is to use auth.uid() directly without querying user_profiles

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in same org" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins and managers can update user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Admins can invite users" ON user_profiles;

DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Allow organization creation" ON organizations;

DROP POLICY IF EXISTS "Users can view donors in their organization" ON donors;
DROP POLICY IF EXISTS "Users can create donors in their organization" ON donors;
DROP POLICY IF EXISTS "Users can update donors in their organization" ON donors;
DROP POLICY IF EXISTS "Admins and managers can delete donors" ON donors;

-- USER_PROFILES policies - avoid self-reference completely
-- Allow users to always view their own profile (no subquery needed)
CREATE POLICY "view_own_profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

-- Allow users to insert their own profile during signup
CREATE POLICY "create_own_profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "update_own_profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- ORGANIZATIONS policies
-- Allow anyone authenticated to create an organization (for onboarding)
CREATE POLICY "create_organization" ON organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow viewing organizations where user is a member
-- This uses a function to break the recursion
CREATE POLICY "view_own_organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id
            FROM user_profiles
            WHERE id = auth.uid()
            AND organization_id IS NOT NULL
        )
    );

-- Allow admins to update their organization
CREATE POLICY "admin_update_organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id
            FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id IS NOT NULL
        )
    );

-- DONORS policies
-- Allow viewing donors in user's organization
CREATE POLICY "view_organization_donors" ON donors
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM user_profiles
            WHERE id = auth.uid()
            AND organization_id IS NOT NULL
        )
    );

-- Allow creating donors in user's organization
CREATE POLICY "create_organization_donors" ON donors
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM user_profiles
            WHERE id = auth.uid()
            AND organization_id IS NOT NULL
        )
    );

-- Allow updating donors in user's organization
CREATE POLICY "update_organization_donors" ON donors
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id
            FROM user_profiles
            WHERE id = auth.uid()
            AND organization_id IS NOT NULL
        )
    );

-- Allow admins/managers to delete donors
CREATE POLICY "delete_organization_donors" ON donors
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id
            FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'manager')
            AND organization_id IS NOT NULL
        )
    );
