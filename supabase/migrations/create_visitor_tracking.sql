-- Create visitor_logs table to track site visits
CREATE TABLE IF NOT EXISTS visitor_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    page_url TEXT,
    referrer TEXT,
    country TEXT,
    city TEXT,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visited_at ON visitor_logs(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_ip ON visitor_logs(ip_address);

-- Enable Row Level Security
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert visitor logs (anonymous tracking)
CREATE POLICY "Anyone can log visits"
    ON visitor_logs FOR INSERT
    WITH CHECK (true);

-- Policy: Only admins can view visitor logs
CREATE POLICY "Admins can view visitor logs"
    ON visitor_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );
