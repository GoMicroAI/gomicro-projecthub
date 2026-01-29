-- Create folders table for organizing project files
CREATE TABLE public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Add folder reference to files table
ALTER TABLE public.files ADD COLUMN folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL;

-- Enable RLS on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Team members can view all folders" 
ON public.folders 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert folders" 
ON public.folders 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update folders" 
ON public.folders 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete folders" 
ON public.folders 
FOR DELETE 
USING (is_admin(auth.uid()));