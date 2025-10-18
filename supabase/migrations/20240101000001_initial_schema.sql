-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user', 'viewer');
CREATE TYPE organization_status AS ENUM ('active', 'inactive', 'trial');

-- Organizations table for multi-tenancy
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tax_id TEXT,
    address JSONB DEFAULT '{}',
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    status organization_status DEFAULT 'trial',
    subscription_tier TEXT DEFAULT 'basic',
    subscription_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);

-- User profiles extension (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user',
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    last_active_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_profiles
CREATE INDEX idx_user_profiles_organization_id ON user_profiles(organization_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);

-- Donors table with comprehensive fields
CREATE TABLE donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    external_id TEXT, -- For integration with external systems
    
    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    preferred_name TEXT,
    title TEXT, -- Mr., Mrs., Dr., etc.
    suffix TEXT, -- Jr., Sr., III, etc.
    
    -- Contact Information
    email TEXT,
    phone TEXT,
    mobile TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    
    -- Professional Information
    employer TEXT,
    job_title TEXT,
    work_address JSONB DEFAULT '{}',
    
    -- Donor Specific Fields
    donor_type TEXT DEFAULT 'individual', -- individual, foundation, corporation
    source TEXT, -- How they were acquired
    assigned_to UUID REFERENCES user_profiles(id), -- Assigned fundraiser
    capacity_rating TEXT, -- Wealth capacity
    interest_areas TEXT[], -- Array of interest areas
    giving_level TEXT, -- major, mid-level, annual, etc.
    
    -- Communication Preferences
    communication_preferences JSONB DEFAULT '{
        "email": true,
        "phone": true,
        "mail": true,
        "newsletter": false
    }',
    
    -- Status and Dates
    status TEXT DEFAULT 'active', -- active, inactive, deceased, do_not_contact
    first_gift_date DATE,
    last_gift_date DATE,
    total_lifetime_giving DECIMAL(12,2) DEFAULT 0.00,
    largest_gift_amount DECIMAL(12,2) DEFAULT 0.00,
    
    -- Metadata
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Create comprehensive indexes for donors
CREATE INDEX idx_donors_organization_id ON donors(organization_id);
CREATE INDEX idx_donors_name ON donors(first_name, last_name);
CREATE INDEX idx_donors_email ON donors(email);
CREATE INDEX idx_donors_phone ON donors(phone);
CREATE INDEX idx_donors_assigned_to ON donors(assigned_to);
CREATE INDEX idx_donors_status ON donors(status);
CREATE INDEX idx_donors_giving_level ON donors(giving_level);
CREATE INDEX idx_donors_total_giving ON donors(total_lifetime_giving);
CREATE INDEX idx_donors_last_gift_date ON donors(last_gift_date);
CREATE INDEX idx_donors_tags ON donors USING GIN(tags);
CREATE INDEX idx_donors_created_at ON donors(created_at);
CREATE INDEX idx_donors_updated_at ON donors(updated_at);

-- Full-text search index for donors
CREATE INDEX idx_donors_search ON donors USING GIN(
    to_tsvector('english', 
        COALESCE(first_name, '') || ' ' || 
        COALESCE(last_name, '') || ' ' || 
        COALESCE(email, '') || ' ' ||
        COALESCE(employer, '') || ' ' ||
        COALESCE(notes, '')
    )
);

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donors_updated_at 
    BEFORE UPDATE ON donors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create organization slug
CREATE OR REPLACE FUNCTION generate_organization_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        -- Ensure uniqueness
        WHILE EXISTS(SELECT 1 FROM organizations WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')) LOOP
            NEW.slug = NEW.slug || '-' || substr(gen_random_uuid()::text, 1, 8);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for organization slug generation
CREATE TRIGGER generate_organization_slug_trigger
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION generate_organization_slug();

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, first_name, last_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'user'::user_role
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create user profile on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();