-- Create task_type enum
CREATE TYPE public.task_type AS ENUM ('development', 'rnd');

-- Add task_type column to tasks table with default 'development'
ALTER TABLE public.tasks 
ADD COLUMN task_type public.task_type NOT NULL DEFAULT 'development';