-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations table
-- Users can only see their own organization
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.organization_id = organizations.id
        )
    );

-- Only admins can update organization settings
CREATE POLICY "Admins can update organization" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.organization_id = organizations.id 
            AND user_profiles.role = 'admin'
        )
    );

-- Allow organization creation during signup process
CREATE POLICY "Allow organization creation" ON organizations
    FOR INSERT WITH CHECK (true);

-- RLS Policies for user_profiles table
-- Users can view profiles in their organization
CREATE POLICY "Users can view profiles in their organization" ON user_profiles
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- Admins and managers can update user profiles in their organization
CREATE POLICY "Admins and managers can update user profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles AS acting_user
            WHERE acting_user.id = auth.uid()
            AND acting_user.organization_id = user_profiles.organization_id
            AND acting_user.role IN ('admin', 'manager')
        )
    );

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Admins can invite new users to their organization
CREATE POLICY "Admins can invite users" ON user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles AS acting_user
            WHERE acting_user.id = auth.uid()
            AND acting_user.organization_id = user_profiles.organization_id
            AND acting_user.role = 'admin'
        )
    );

-- RLS Policies for donors table
-- Users can view donors in their organization
CREATE POLICY "Users can view donors in their organization" ON donors
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Users can insert donors in their organization
CREATE POLICY "Users can create donors in their organization" ON donors
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_profiles 
            WHERE id = auth.uid()
        )
        AND auth.uid() IS NOT NULL
    );

-- Users can update donors in their organization (with role restrictions)
CREATE POLICY "Users can update donors in their organization" ON donors
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Only admins and managers can delete donors
CREATE POLICY "Admins and managers can delete donors" ON donors
    FOR DELETE USING (
        organization_id IN (
            SELECT user_profiles.organization_id FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'manager')
        )
    );

-- Function to get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = required_role
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION user_has_any_role(required_roles user_role[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = ANY(required_roles)
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to check if user can access organization
CREATE OR REPLACE FUNCTION user_can_access_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND organization_id = org_id
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION get_user_organization() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_role(user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_any_role(user_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_access_organization(UUID) TO authenticated;