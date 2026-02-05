-- Create task_reporters table to store who task assignees report to
CREATE TABLE public.task_reporters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Enable RLS
ALTER TABLE public.task_reporters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can insert task reporters"
ON public.task_reporters
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update task reporters"
ON public.task_reporters
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete task reporters"
ON public.task_reporters
FOR DELETE
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view task reporters in assigned projects"
ON public.task_reporters
FOR SELECT
USING (
  is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id = task_reporters.task_id 
    AND is_project_member(auth.uid(), t.project_id)
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_reporters;