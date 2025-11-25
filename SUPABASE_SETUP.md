# Supabase Setup Guide

This guide will help you set up your own Supabase instance for this application.

## 📋 Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js installed on your machine

## 🚀 Step-by-Step Setup

### Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `devjoe-showcase-studio` (or any name you prefer)
   - **Database Password**: Choose a strong password and SAVE IT
   - **Region**: Select the region closest to you
4. Click **"Create new project"** and wait for it to finish setting up (~2 minutes)

### Step 2: Get Your Project Credentials

1. In your Supabase dashboard, click on **"Project Settings"** (gear icon in sidebar)
2. Go to **"API"** section
3. You'll see:
   - **Project URL** - Copy this
   - **Project API keys** → **anon public** - Copy this key

### Step 3: Configure Your .env File

1. Open the `.env` file in your project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with YOUR actual values from Step 2.

### Step 4: Set Up the Database Schema

You have **2 options** to set up your database:

#### Option A: Using Supabase CLI (Recommended - Easiest)

1. **Install Supabase CLI** (if not already installed):
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```
This will open your browser to authenticate.

3. **Link your project**:
```bash
supabase link --project-ref your-project-ref
```
*Find your project-ref in the Project URL: https://YOUR-PROJECT-REF.supabase.co*

4. **Push migrations to your database**:
```bash
supabase db push
```

This will automatically create:
- ✅ `apps` table
- ✅ `user_roles` table
- ✅ `app-files` storage bucket
- ✅ `app-icons` storage bucket
- ✅ All security policies (RLS)
- ✅ Helper functions

#### Option B: Manual Setup via SQL Editor

If you prefer manual setup or CLI doesn't work:

1. Go to your Supabase Dashboard → **SQL Editor**
2. Click **"New query"**
3. Copy and paste the contents of `supabase/migrations/20251124063611_69b9e56b-aeda-462f-b7d9-fd5144058f58.sql`
4. Click **"Run"**
5. Create another new query
6. Copy and paste the contents of `supabase/migrations/20251125080815_5f01db4e-8a29-424e-bbf0-fc242252403c.sql`
7. Click **"Run"**

### Step 5: Verify Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. You should see two buckets:
   - `app-files` (public)
   - `app-icons` (public)

If they don't exist, create them manually:
- Click **"New bucket"**
- Name: `app-files`, Make it **Public**
- Repeat for `app-icons`

### Step 6: Create Your First Admin User

1. **Start your development server**:
```bash
npm run dev
```

2. **Open the app** in your browser (usually http://localhost:5173)

3. **Sign up for an account** using the Auth page

4. **Find your User ID**:
   - Go to Supabase Dashboard → **Authentication** → **Users**
   - Find your email and copy the **UUID** (something like: `a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6`)

5. **Grant yourself admin role**:
   - Go to Supabase Dashboard → **SQL Editor**
   - Run this query (replace with your actual UUID):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-uuid-here', 'admin');
```

Example:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6', 'admin');
```

6. **Refresh your app** - You should now have access to the Admin panel!

## ✅ Verification Checklist

After completing the setup, verify everything works:

- [ ] App connects to Supabase (no errors in console)
- [ ] You can sign up/sign in
- [ ] You can access the Admin page
- [ ] You can create/upload apps
- [ ] File uploads work (icons and app files)
- [ ] Apps appear on the home page

## 🔧 Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file has the correct `VITE_SUPABASE_PUBLISHABLE_KEY`
- Make sure you're using the **anon public** key, not the service role key
- Restart your dev server after changing `.env`

### "relation does not exist" error
- The database migrations weren't run successfully
- Go back to Step 4 and run the migrations again

### Can't access Admin page
- Make sure you granted yourself the admin role (Step 6)
- Check the `user_roles` table in Supabase dashboard to verify the role exists

### File upload fails
- Verify storage buckets exist and are public
- Check storage policies in Supabase Dashboard → Storage → Policies

## 📚 Database Schema Overview

### Tables

**apps**
- Stores all your applications
- Fields: id, name, description, platform, icon_url, file_url, download_count
- Public read access, admin-only write access

**user_roles**
- Manages user permissions
- Fields: id, user_id, role (admin/user)
- Admin-only write access

### Storage Buckets

**app-files**
- Stores downloadable app files
- Public read access

**app-icons**
- Stores app icon images
- Public read access

## 🎉 You're All Set!

Your app is now connected to your own Supabase instance. You have full control over:
- User authentication
- Database content
- File storage
- Security policies

Happy coding! 🚀
