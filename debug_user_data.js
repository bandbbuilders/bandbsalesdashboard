// Paste this into your browser console while on the dashboard
// It will show your actual user data

import { supabase } from './src/integrations/supabase/client';

const getUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        console.log('No session found');
        return;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

    console.log('=== YOUR ACTUAL USER DATA ===');
    console.log('User ID:', session.user.id);
    console.log('Email:', session.user.email);
    console.log('Full Name:', profile?.full_name);
    console.log('Position:', profile?.position);
    console.log('Department:', profile?.department);
    console.log('Role (from user_roles):', roleData?.role);
    console.log('============================');

    return {
        userId: session.user.id,
        email: session.user.email,
        fullName: profile?.full_name,
        position: profile?.position,
        department: profile?.department,
        role: roleData?.role
    };
};

getUserData();
