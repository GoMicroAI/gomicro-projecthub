-- Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create announcement comments table
CREATE TABLE public.announcement_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  attachment_url text,
  attachment_name text,
  parent_id uuid REFERENCES public.announcement_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create announcement reactions table (for both posts and comments)
CREATE TABLE public.announcement_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.announcement_comments(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT reaction_target CHECK (
    (announcement_id IS NOT NULL AND comment_id IS NULL) OR
    (announcement_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE(user_id, announcement_id, emoji),
  UNIQUE(user_id, comment_id, emoji)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "Team members can view announcements"
ON public.announcements FOR SELECT
USING (is_team_member(auth.uid()));

CREATE POLICY "Team members can create announcements"
ON public.announcements FOR INSERT
WITH CHECK (is_team_member(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can update own announcements"
ON public.announcements FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own announcements"
ON public.announcements FOR DELETE
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Comments policies
CREATE POLICY "Team members can view comments"
ON public.announcement_comments FOR SELECT
USING (is_team_member(auth.uid()));

CREATE POLICY "Team members can create comments"
ON public.announcement_comments FOR INSERT
WITH CHECK (is_team_member(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.announcement_comments FOR DELETE
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Reactions policies
CREATE POLICY "Team members can view reactions"
ON public.announcement_reactions FOR SELECT
USING (is_team_member(auth.uid()));

CREATE POLICY "Team members can add reactions"
ON public.announcement_reactions FOR INSERT
WITH CHECK (is_team_member(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
ON public.announcement_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_announcements_created ON public.announcements(created_at DESC);
CREATE INDEX idx_comments_announcement ON public.announcement_comments(announcement_id, created_at);
CREATE INDEX idx_reactions_announcement ON public.announcement_reactions(announcement_id);
CREATE INDEX idx_reactions_comment ON public.announcement_reactions(comment_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_reactions;