-- Create the policies table
CREATE TABLE IF NOT EXISTS public.policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'confirmed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Everyone can view confirmed policies
CREATE POLICY "Everyone can view confirmed policies" ON public.policies
    FOR SELECT USING (status = 'confirmed');

-- 2. HR and Management can view all policies
CREATE POLICY "HR and Management can view all policies" ON public.policies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('ceo_coo', 'manager')
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND department = 'HR'
        )
    );

-- 3. HR can create policies
CREATE POLICY "HR can create policies" ON public.policies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND department = 'HR'
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('ceo_coo')
        )
    );

-- 4. COO/CEO can update (confirm/delete) policies
CREATE POLICY "Management can manage policies" ON public.policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('ceo_coo')
        )
    );

-- 5. HR can delete their own pending policies
CREATE POLICY "HR can delete own pending policies" ON public.policies
    FOR DELETE USING (
        auth.uid() = created_by 
        AND status = 'pending'
    );
