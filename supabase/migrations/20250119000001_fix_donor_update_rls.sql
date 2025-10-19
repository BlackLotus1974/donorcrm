-- Fix donor update RLS policy to include WITH CHECK clause
-- This ensures that updated rows also pass the security check

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update donors in their organization" ON donors;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Users can update donors in their organization" ON donors
    FOR UPDATE
    USING (
        -- User must be authenticated and in the same organization
        organization_id IN (
            SELECT organization_id FROM user_profiles
            WHERE id = auth.uid()
            AND is_active = true
        )
    )
    WITH CHECK (
        -- Ensure the updated row still belongs to the same organization
        organization_id IN (
            SELECT organization_id FROM user_profiles
            WHERE id = auth.uid()
            AND is_active = true
        )
    );
