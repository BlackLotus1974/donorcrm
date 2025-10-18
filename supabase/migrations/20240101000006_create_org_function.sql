-- Create a SECURITY DEFINER function to create organization and return it
-- This bypasses RLS so user can get the org data back immediately

CREATE OR REPLACE FUNCTION create_organization_for_user(
    p_name TEXT,
    p_tax_id TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_address JSONB DEFAULT '{}'
)
RETURNS organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org organizations;
BEGIN
    -- Verify user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert organization (bypasses RLS due to SECURITY DEFINER)
    INSERT INTO organizations (name, tax_id, phone, email, website, address, status)
    VALUES (p_name, p_tax_id, p_phone, p_email, p_website, p_address, 'trial')
    RETURNING * INTO v_org;

    RETURN v_org;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_for_user TO authenticated;
