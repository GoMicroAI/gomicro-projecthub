-- Add image_url column to projects table
ALTER TABLE public.projects 
ADD COLUMN image_url text;