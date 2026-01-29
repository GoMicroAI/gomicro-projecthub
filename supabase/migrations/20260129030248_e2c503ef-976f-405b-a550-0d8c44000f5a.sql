-- Allow team members to update tasks assigned to them
CREATE OR REPLACE FUNCTION public.is_task_assignee(_user_id uuid, _task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_assignees
    WHERE user_id = _user_id
      AND task_id = _task_id
  )
$$;

-- Drop the old admin-only update policy
DROP POLICY IF EXISTS "Admins can update tasks" ON public.tasks;

-- Create new policy allowing admins OR task assignees to update tasks
CREATE POLICY "Admins and assignees can update tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  is_admin(auth.uid()) OR is_task_assignee(auth.uid(), id)
);