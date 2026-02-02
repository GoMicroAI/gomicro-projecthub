-- Create a table for project links
CREATE TABLE public.project_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_links ENABLE ROW LEVEL SECURITY;

-- Create policies for access
CREATE POLICY "Users can view links in assigned projects" 
ON public.project_links 
FOR SELECT 
USING (is_admin(auth.uid()) OR is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can create links" 
ON public.project_links 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()) OR (is_project_member(auth.uid(), project_id) AND auth.uid() = created_by));

CREATE POLICY "Admins can update links" 
ON public.project_links 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete links" 
ON public.project_links 
FOR DELETE 
USING (is_admin(auth.uid()));