-- Create project_messages table for project-specific chat
CREATE TABLE public.project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text,
  attachment_url text,
  attachment_name text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Team members can view all messages
CREATE POLICY "Team members can view project messages"
ON public.project_messages
FOR SELECT
USING (is_team_member(auth.uid()));

-- Team members can insert messages
CREATE POLICY "Team members can insert messages"
ON public.project_messages
FOR INSERT
WITH CHECK (is_team_member(auth.uid()) AND auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.project_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for efficient querying by project and time
CREATE INDEX idx_project_messages_project_created 
ON public.project_messages(project_id, created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;