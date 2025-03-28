/*
  # Fix shared files table policies and structure

  1. Changes
    - Add missing columns for file sharing
    - Update RLS policies to allow proper sharing
    - Add indexes for better query performance

  2. Security
    - Maintain RLS enabled
    - Update policies for better access control
    - Ensure proper authentication checks
*/

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shared_files' AND column_name = 'share_id'
  ) THEN
    ALTER TABLE shared_files ADD COLUMN share_id uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Update RLS policies
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can access shared files via link" ON shared_files;
DROP POLICY IF EXISTS "Users can create shared files" ON shared_files;
DROP POLICY IF EXISTS "Users can manage their own shared files" ON shared_files;

-- Create new policies
CREATE POLICY "Anyone can access shared files via link"
ON shared_files FOR SELECT
TO public
USING (
  share_link_id IS NOT NULL 
  AND (expiry_date IS NULL OR expiry_date > now())
);

CREATE POLICY "Users can create shared files"
ON shared_files FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage their own shared files"
ON shared_files FOR ALL
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_shared_files_share_link_id ON shared_files(share_link_id);