-- Create work_history table for daily work logs
CREATE TABLE public.work_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  task_summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.work_history ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins can view all work history
CREATE POLICY "Admins can view all work history"
ON public.work_history
FOR SELECT
USING (is_admin(auth.uid()));

-- Users can view their own work history
CREATE POLICY "Users can view own work history"
ON public.work_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own work history
CREATE POLICY "Users can insert own work history"
ON public.work_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own work history
CREATE POLICY "Users can update own work history"
ON public.work_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own work history
CREATE POLICY "Users can delete own work history"
ON public.work_history
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can delete any work history
CREATE POLICY "Admins can delete any work history"
ON public.work_history
FOR DELETE
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_work_history_updated_at
BEFORE UPDATE ON public.work_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();