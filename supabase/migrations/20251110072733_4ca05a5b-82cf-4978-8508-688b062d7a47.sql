-- Create content_tasks table for managing content production
CREATE TABLE public.content_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'idea',
  priority TEXT NOT NULL DEFAULT 'medium',
  platform TEXT NOT NULL DEFAULT 'instagram',
  due_date TIMESTAMP WITH TIME ZONE,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]'::jsonb,
  caption TEXT,
  hashtags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_comments table for task discussions
CREATE TABLE public.content_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.content_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_approvals table for approval workflow
CREATE TABLE public.content_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.content_tasks(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_analytics table for performance tracking
CREATE TABLE public.content_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.content_tasks(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  engagement INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.content_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_tasks
CREATE POLICY "Users can view all content tasks"
  ON public.content_tasks FOR SELECT
  USING (true);

CREATE POLICY "Users can create content tasks"
  ON public.content_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update content tasks"
  ON public.content_tasks FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete content tasks"
  ON public.content_tasks FOR DELETE
  USING (true);

-- RLS Policies for content_comments
CREATE POLICY "Users can view all comments"
  ON public.content_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.content_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.content_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for content_approvals
CREATE POLICY "Users can view all approvals"
  ON public.content_approvals FOR SELECT
  USING (true);

CREATE POLICY "Users can create approvals"
  ON public.content_approvals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Approvers can update their approvals"
  ON public.content_approvals FOR UPDATE
  USING (auth.uid() = approver_id);

-- RLS Policies for content_analytics
CREATE POLICY "Users can view all analytics"
  ON public.content_analytics FOR SELECT
  USING (true);

CREATE POLICY "Users can insert analytics"
  ON public.content_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update analytics"
  ON public.content_analytics FOR UPDATE
  USING (true);

-- Create trigger for updated_at on content_tasks
CREATE TRIGGER update_content_tasks_updated_at
  BEFORE UPDATE ON public.content_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on content_approvals
CREATE TRIGGER update_content_approvals_updated_at
  BEFORE UPDATE ON public.content_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();