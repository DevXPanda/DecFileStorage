import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('Initializing Supabase client with:', { 
  urlAvailable: !!supabaseUrl, 
  keyAvailable: !!supabaseAnonKey
});

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    }
  }
);

// Function to check if Supabase connection is working
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('user_files').select('count', { count: 'exact' }).limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
};

// Disable RLS temporarily for testing
const disableRLS = async () => {
  try {
    await supabase.rpc('disable_rls');
  } catch (error) {
    console.error('Error disabling RLS:', error);
  }
};

disableRLS();

export async function createShareableLink(
  fileId: string,
  fileName: string,
  fileType: string,
  password: string | null = null,
  expiryDays: number | null = null
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const shareId = crypto.randomUUID();
    const encryptionKey = crypto.randomUUID();

    const { data, error } = await supabase
      .from('shared_files')
      .insert({
        file_id: fileId,
        file_name: fileName,
        file_type: fileType,
        encryption_key: encryptionKey,
        share_link_id: shareId,
        password_hash: password ? await hashPassword(password) : null,
        expiry_date: expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null,
        created_by: session.user.id,
        cid: fileId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shareable link:', error);
      throw error;
    }

    return `${window.location.origin}/share/${shareId}`;
  } catch (error) {
    console.error('Error in createShareableLink:', error);
    throw error;
  }
}

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}