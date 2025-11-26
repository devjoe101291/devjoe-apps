# Setup Visitor Tracking System

## Database Setup Required

You need to create the `visitor_logs` table in your Supabase database.

### Run this SQL in Supabase SQL Editor:

```sql
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
```

## Features

✅ **Automatic Visitor Tracking** - Tracks every visitor automatically when they visit your site
✅ **IP Address Logging** - Records visitor IP addresses
✅ **Location Data** - Captures country and city using free IP API
✅ **Browser Detection** - Identifies Chrome, Firefox, Safari, Edge
✅ **Referrer Tracking** - Shows where visitors came from
✅ **Admin Dashboard** - Beautiful stats display with:
  - Total Visitors counter
  - Today's Visitors counter
  - Unique IPs counter
  - Recent 10 visitors table with IP, location, browser, referrer, time

## How It Works

1. When a visitor lands on your site, the `useVisitorTracking` hook automatically fires
2. It fetches their IP address and location from ipapi.co (free service, 30,000 requests/month)
3. Logs the visit to Supabase with:
   - IP address
   - User agent (browser info)
   - Page URL
   - Referrer (where they came from)
   - Country and City
   - Timestamp

4. Admin can view all stats in the "Visitors" tab

## Privacy Note

This tracks basic visitor information for analytics purposes. Make sure this complies with your privacy policy and local regulations (GDPR, CCPA, etc.).

## Deploy

After creating the database table:

```bash
vercel --prod
```

Done! 🎉
