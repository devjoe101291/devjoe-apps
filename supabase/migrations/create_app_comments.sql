-- Create app_comments table for user feedback on apps
CREATE TABLE IF NOT EXISTS app_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    anonymous_name TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_comments_app_id ON app_comments(app_id);
CREATE INDEX IF NOT EXISTS idx_app_comments_created_at ON app_comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE app_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments
CREATE POLICY "Anyone can view comments"
    ON app_comments FOR SELECT
    USING (true);

-- Policy: Anyone can insert comments (anonymous posting)
CREATE POLICY "Anyone can post comments"
    ON app_comments FOR INSERT
    WITH CHECK (true);
