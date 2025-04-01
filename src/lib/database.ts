import { supabase } from './supabase';

export interface DatabaseFile {
  id: string;
  name: string;
  type: string;
  size: number;
  cid: string;
  uploaded_at?: string;
  user_id: string;
  wallet_address: string;
}

export interface SharedFile {
  id: string;
  file_id: string;
  file_name: string;
  file_type: string;
  encryption_key?: string;
  share_link_id: string;
  password_hash?: string;
  expiry_date?: Date;
  created_by: string;
  created_at?: Date;
  cid: string;
}

export const saveFileToDatabase = async (file: DatabaseFile) => {
  try {
    console.log('Attempting to save file to database:', { 
      id: file.id,
      name: file.name, 
      size: file.size, 
      userId: file.user_id,
      walletAddress: file.wallet_address
    });

    const { data, error } = await supabase
      .from('user_files')
      .insert([{
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        cid: file.cid,
        uploaded_at: file.uploaded_at,
        user_id: file.user_id,
        wallet_address: file.wallet_address
      }]);

    if (error) {
      console.error('Supabase error saving file:', error);
      throw error;
    }
    
    console.log('File saved to database successfully');
    return data;
  } catch (error) {
    console.error('Error saving file to database:', error);
    throw error;
  }
};

export async function getUserFiles(userId: string, walletAddress: string): Promise<DatabaseFile[]> {
  console.log(`Fetching files for user ID: ${userId || 'none'} or wallet: ${walletAddress || 'none'}`);
  
  try {
    let query = supabase.from('user_files').select('*');
    
    // Filter by either userId or walletAddress
    if (userId && walletAddress) {
      query = query.or(`user_id.eq.${userId},wallet_address.eq.${walletAddress}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching user files:', error);
      return [];
    }
    
    console.log(`Retrieved ${data?.length || 0} files`);
    return data || [];
  } catch (err) {
    console.error('Exception in getUserFiles:', err);
    return [];
  }
}

export const deleteFileFromDatabase = async (fileId: string) => {
  try {
    const { error } = await supabase
      .from('user_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting file from database:', error);
    throw error;
  }
};

export async function createSharedFile(sharedFile: Omit<SharedFile, 'id' | 'created_at'>) {
  try {
    console.log('Attempting to create shared file:', sharedFile);

    const { data, error } = await supabase
      .from('shared_files')
      .insert({
        file_id: sharedFile.file_id,
        file_name: sharedFile.file_name,
        file_type: sharedFile.file_type,
        encryption_key: sharedFile.encryption_key,
        share_link_id: sharedFile.share_link_id,
        password_hash: sharedFile.password_hash,
        expiry_date: sharedFile.expiry_date?.toISOString(),
        created_by: sharedFile.created_by,
        cid: sharedFile.cid
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shared file:', error);
      throw error;
    }

    console.log('Shared file created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createSharedFile:', error);
    throw error;
  }
}

export async function getSharedFile(shareId: string): Promise<SharedFile | null> {
  try {
    console.log('Fetching shared file with ID:', shareId);

    const { data, error } = await supabase
      .from('shared_files')
      .select('*')
      .eq('share_link_id', shareId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      console.error('Error fetching shared file:', error);
      throw error;
    }

    console.log('Shared file fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in getSharedFile:', error);
    throw error;
  }
} 