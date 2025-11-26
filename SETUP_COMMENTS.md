# Setup App Comments Feature

## Database Setup Required

You need to create the `app_comments` table in your Supabase database.

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the SQL from `supabase/migrations/create_app_comments.sql`
6. Click **Run** to execute the SQL

### Option 2: Quick SQL (Copy this directly)

```sql
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
```

## Features

✅ **Anonymous Usernames** - Auto-generates names like "Anonymous1234"
✅ **Persistent Identity** - Same user keeps same anonymous name (stored in localStorage)
✅ **User-Friendly UI** - Toggle to show/hide comments
✅ **Real-time Feedback** - See comment count before opening
✅ **Character Limit** - 500 characters with counter
✅ **Responsive Design** - Works on all devices
✅ **Time Stamps** - Shows "Just now", "5m ago", etc.

## How It Works

1. Visitors can click "View Comments" on any app card
2. They see existing comments and can post their own
3. Anonymous username is auto-generated (e.g., "Anonymous3847")
4. Username is saved in browser so they keep the same identity
5. Comments are saved to Supabase with timestamp
6. Comments display with relative time ("2h ago", "3d ago", etc.)

## Deploy

After creating the database table, deploy to Vercel:

```bash
vercel --prod
```

Done! 🎉
