-- Create meetings table to track official club days
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    created_by TEXT,
    created_by_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Policies for meetings
DROP POLICY IF EXISTS "Meetings are viewable by all authenticated users" ON public.meetings;
CREATE POLICY "Meetings are viewable by all authenticated users" ON public.meetings
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Meetings are manageable by super admins" ON public.meetings;
CREATE POLICY "Meetings are manageable by super admins" ON public.meetings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.app_users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Add meeting registration to audit log (optional but good practice)
COMMENT ON TABLE public.meetings IS 'Tracks official club meeting dates for roll call validation';
