-- Create the project-files storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files');

-- Allow admins to upload files
CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files' AND public.is_admin(auth.uid()));

-- Allow admins to delete files
CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files' AND public.is_admin(auth.uid()));