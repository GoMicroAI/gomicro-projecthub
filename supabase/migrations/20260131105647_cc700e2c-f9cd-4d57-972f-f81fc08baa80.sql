-- Create table for custom project tabs
CREATE TABLE public.project_custom_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.project_custom_tabs ENABLE ROW LEVEL SECURITY;

-- Create policies for project custom tabs
CREATE POLICY "Users can view custom tabs in assigned projects"
ON public.project_custom_tabs
FOR SELECT
USING (is_admin(auth.uid()) OR is_project_member(auth.uid(), project_id));

CREATE POLICY "Admins can insert custom tabs"
ON public.project_custom_tabs
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update custom tabs"
ON public.project_custom_tabs
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete custom tabs"
ON public.project_custom_tabs
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_custom_tabs_updated_at
BEFORE UPDATE ON public.project_custom_tabs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for custom tabs
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_custom_tabs;