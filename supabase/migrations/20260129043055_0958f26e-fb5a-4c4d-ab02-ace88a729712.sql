-- Create function to check if user has any assigned task in a project
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_assignees ta
    JOIN public.tasks t ON t.id = ta.task_id
    WHERE ta.user_id = _user_id
      AND t.project_id = _project_id
  )
$$;

-- Drop existing policies on projects
DROP POLICY IF EXISTS "Team members can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

-- Projects: Admins see all, viewers only see assigned projects
CREATE POLICY "Users can view assigned projects"
ON public.projects FOR SELECT
USING (is_admin(auth.uid()) OR is_project_member(auth.uid(), id));

CREATE POLICY "Admins can insert projects"
ON public.projects FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update projects"
ON public.projects FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete projects"
ON public.projects FOR DELETE
USING (is_admin(auth.uid()));

-- Drop existing policies on tasks
DROP POLICY IF EXISTS "Team members can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and assignees can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;

-- Tasks: Admins see all, viewers see tasks in their assigned projects
CREATE POLICY "Users can view tasks in assigned projects"
ON public.tasks FOR SELECT
USING (is_admin(auth.uid()) OR is_project_member(auth.uid(), project_id));

CREATE POLICY "Admins can insert tasks"
ON public.tasks FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins and assignees can update tasks"
ON public.tasks FOR UPDATE
USING (is_admin(auth.uid()) OR is_task_assignee(auth.uid(), id));

CREATE POLICY "Admins can delete tasks"
ON public.tasks FOR DELETE
USING (is_admin(auth.uid()));

-- Drop existing policies on files
DROP POLICY IF EXISTS "Team members can view all files" ON public.files;
DROP POLICY IF EXISTS "Admins can insert files" ON public.files;
DROP POLICY IF EXISTS "Admins can update files" ON public.files;
DROP POLICY IF EXISTS "Admins can delete files" ON public.files;

-- Files: View/upload in assigned projects, only admins delete
CREATE POLICY "Users can view files in assigned projects"
ON public.files FOR SELECT
USING (is_admin(auth.uid()) OR is_project_member(auth.uid(), project_id));

CREATE POLICY "Users can upload files to assigned projects"
ON public.files FOR INSERT
WITH CHECK (is_admin(auth.uid()) OR is_project_member(auth.uid(), project_id));

CREATE POLICY "Admins can update files"
ON public.files FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete files"
ON public.files FOR DELETE
USING (is_admin(auth.uid()));

-- Drop existing policies on folders
DROP POLICY IF EXISTS "Team members can view all folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can insert folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can update folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can delete folders" ON public.folders;

-- Folders: View in assigned projects, only admins manage
CREATE POLICY "Users can view folders in assigned projects"
ON public.folders FOR SELECT
USING (is_admin(auth.uid()) OR is_project_member(auth.uid(), project_id));

CREATE POLICY "Admins can insert folders"
ON public.folders FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update folders"
ON public.folders FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete folders"
ON public.folders FOR DELETE
USING (is_admin(auth.uid()));

-- Drop existing policies on task_assignees
DROP POLICY IF EXISTS "Team members can view all task assignees" ON public.task_assignees;
DROP POLICY IF EXISTS "Admins can insert task assignees" ON public.task_assignees;
DROP POLICY IF EXISTS "Admins can update task assignees" ON public.task_assignees;
DROP POLICY IF EXISTS "Admins can delete task assignees" ON public.task_assignees;

-- Task Assignees: Users see assignees in their projects
CREATE POLICY "Users can view task assignees in assigned projects"
ON public.task_assignees FOR SELECT
USING (
  is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id AND is_project_member(auth.uid(), t.project_id)
  )
);

CREATE POLICY "Admins can insert task assignees"
ON public.task_assignees FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update task assignees"
ON public.task_assignees FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete task assignees"
ON public.task_assignees FOR DELETE
USING (is_admin(auth.uid()));

-- Project Messages: View/send in assigned projects
DROP POLICY IF EXISTS "Team members can view project messages" ON public.project_messages;
DROP POLICY IF EXISTS "Team members can insert messages" ON public.project_messages;

CREATE POLICY "Users can view messages in assigned projects"
ON public.project_messages FOR SELECT
USING (is_admin(auth.uid()) OR is_project_member(auth.uid(), project_id));

CREATE POLICY "Users can send messages in assigned projects"
ON public.project_messages FOR INSERT
WITH CHECK ((is_admin(auth.uid()) OR is_project_member(auth.uid(), project_id)) AND auth.uid() = user_id);

-- Update announcement_comments to allow users to update own comments
DROP POLICY IF EXISTS "Users can delete own comments" ON public.announcement_comments;

CREATE POLICY "Users can update own comments"
ON public.announcement_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.announcement_comments FOR DELETE
USING (auth.uid() = user_id OR is_admin(auth.uid()));