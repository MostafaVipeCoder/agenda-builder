-- ==========================================
-- REGISTRATION PORTALS MIGRATION
-- ==========================================
-- This migration creates tables for dynamic registration portals
-- that allow companies and experts to submit their information
-- with customizable forms and live preview functionality.

-- 1. Form Field Configurations Table
-- Stores dynamic form field definitions for each event
CREATE TABLE IF NOT EXISTS form_field_configs (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'expert')),
    
    -- Field Definition
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'email', 'url', 'select', 'multiselect', 'number', 'tel', 'file')),
    field_options JSONB DEFAULT '[]',
    
    -- Field Behavior
    is_required BOOLEAN DEFAULT false,
    show_in_card BOOLEAN DEFAULT false,
    placeholder TEXT,
    help_text TEXT,
    validation_rules JSONB DEFAULT '{}',
    
    -- Display
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, entity_type, field_name)
);

-- 2. Company Submissions Table
-- Stores company registration submissions before approval
CREATE TABLE IF NOT EXISTS company_submissions (
    submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
    
    -- Status Management
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Core Required Fields (for card generation)
    startup_name TEXT NOT NULL,
    logo_url TEXT,
    industry TEXT,
    location TEXT,
    
    -- Extended Fields (flexible JSONB storage)
    additional_data JSONB DEFAULT '{}',
    
    -- Approval Metadata
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Expert Submissions Table
-- Stores expert registration submissions before approval
CREATE TABLE IF NOT EXISTS expert_submissions (
    submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
    
    -- Status Management
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Core Required Fields (for card generation)
    expert_name TEXT NOT NULL,
    photo_url TEXT,
    title TEXT,
    company TEXT,
    bio TEXT,
    
    -- Extended Fields (flexible JSONB storage)
    additional_data JSONB DEFAULT '{}',
    
    -- Approval Metadata
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Update Events Table
-- Add portal configuration fields
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS company_portal_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS expert_portal_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS company_portal_message TEXT,
ADD COLUMN IF NOT EXISTS expert_portal_message TEXT,
ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMPTZ;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE form_field_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_submissions ENABLE ROW LEVEL SECURITY;

-- Form Field Configs: Public can read, admin can manage
CREATE POLICY "Public can read form configs"
ON form_field_configs FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can manage form configs"
ON form_field_configs FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Company Submissions: Public can insert, admin can view/update
CREATE POLICY "Public can submit company registrations"
ON company_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can read their own submissions"
ON company_submissions FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can update submissions"
ON company_submissions FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Expert Submissions: Public can insert, admin can view/update
CREATE POLICY "Public can submit expert registrations"
ON expert_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can read their own submissions"
ON expert_submissions FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can update submissions"
ON expert_submissions FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_form_configs_event 
ON form_field_configs(event_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_company_submissions_event 
ON company_submissions(event_id, status);

CREATE INDEX IF NOT EXISTS idx_expert_submissions_event 
ON expert_submissions(event_id, status);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_form_field_configs_updated_at
    BEFORE UPDATE ON form_field_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_submissions_updated_at
    BEFORE UPDATE ON company_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expert_submissions_updated_at
    BEFORE UPDATE ON expert_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
