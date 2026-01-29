-- Create task_assignees junction table for multiple assignees per task
CREATE TABLE public.task_assignees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    assigned_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(task_id, user_id)
);

-- Enable RLS
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view all task assignees"
ON public.task_assignees FOR SELECT
USING (true);

CREATE POLICY "Admins can insert task assignees"
ON public.task_assignees FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete task assignees"
ON public.task_assignees FOR DELETE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update task assignees"
ON public.task_assignees FOR UPDATE
USING (is_admin(auth.uid()));