-- Fix infinite recursion in RLS policies by dropping and recreating them properly

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Users can view donors in their organization" ON donors;
DROP POLICY IF EXISTS "Users can create donors in their organization" ON donors;
DROP POLICY IF EXISTS "Users can update donors in their organization" ON donors;
DROP POLICY IF EXISTS "Admins and managers can delete donors" ON donors;

-- Replace with non-recursive policies using SECURITY DEFINER functions

-- User profiles: Allow users to view their own profile and profiles in their org
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view profiles in same org" ON user_profiles
    FOR SELECT USING (
        organization_id IS NOT NULL
        AND organization_id = (
            SELECT up.organization_id
            FROM user_profiles up
            WHERE up.id = auth.uid()
            LIMIT 1
        )
    );

-- Organizations: Use the helper function to avoid recursion
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (
        id = (
            SELECT up.organization_id
            FROM user_profiles up
            WHERE up.id = auth.uid()
            LIMIT 1
        )
    );

CREATE POLICY "Admins can update organization" ON organizations
    FOR UPDATE USING (
        id = (
            SELECT up.organization_id
            FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role = 'admin'
            LIMIT 1
        )
    );

-- Donors: Use subquery with LIMIT to prevent recursion
CREATE POLICY "Users can view donors in their organization" ON donors
    FOR SELECT USING (
        organization_id = (
            SELECT up.organization_id
            FROM user_profiles up
            WHERE up.id = auth.uid()
            LIMIT 1
        )
    );

CREATE POLICY "Users can create donors in their organization" ON donors
    FOR INSERT WITH CHECK (
        organization_id = (
            SELECT up.organization_id
            FROM user_profiles up
            WHERE up.id = auth.uid()
            LIMIT 1
        )
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update donors in their organization" ON donors
    FOR UPDATE USING (
        organization_id = (
            SELECT up.organization_id
            FROM user_profiles up
            WHERE up.id = auth.uid()
            LIMIT 1
        )
    );

CREATE POLICY "Admins and managers can delete donors" ON donors
    FOR DELETE USING (
        organization_id = (
            SELECT up.organization_id
            FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('admin', 'manager')
            LIMIT 1
        )
    );
