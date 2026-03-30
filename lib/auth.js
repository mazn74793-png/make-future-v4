import { supabase } from './supabase';

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin(email) {
  const { data } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .single();
  return !!data;
}

export async function getSettings() {
  const { data } = await supabase
    .from('site_settings')
    .select('*')
    .single();
  return data;
}
