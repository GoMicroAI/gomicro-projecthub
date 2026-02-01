-- Drop the restrictive admin-only insert policy
DROP POLICY IF EXISTS "Admins can insert folders" ON public.folders;

-- Create a new policy allowing project members to create folders
CREATE POLICY "Project members can create folders"
ON public.folders
FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) OR 
  (is_project_member(auth.uid(), project_id) AND auth.uid() = created_by)
);