/*
  # Update shared files table policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Re-create RLS policies for shared_files table
    - Allow authenticated users to insert their own shared files
    - Allow anyone to view shared files via share link
    - Allow file owners to manage their shared files

  2. Security
    - Enable RLS on shared_files table
    - Add policies for INSERT, SELECT, UPDATE, and DELETE operations
    - Ensure proper access control based on user authentication
*/

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can access shared files via link" ON shared_files;
  DROP POLICY IF EXISTS "Users can create shared files" ON shared_files;
  DROP POLICY IF EXISTS "Users can manage their shared files" ON shared_files;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own shared files
CREATE POLICY "Users can create shared files"
ON shared_files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow anyone to access shared files via link
CREATE POLICY "Anyone can access shared files via link"
ON shared_files
FOR SELECT
TO anon, authenticated
USING (
  (share_link_id IS NOT NULL) AND
  (expiry_date IS NULL OR expiry_date > now())
);

-- Allow users to manage their own shared files
CREATE POLICY "Users can manage their own shared files"
ON shared_files
FOR ALL
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);