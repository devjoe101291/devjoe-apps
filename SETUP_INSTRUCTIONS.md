# Setup Instructions for Joey

Your Supabase credentials are now configured! ✅

## ✅ What's Already Done:
- `.env` file configured with your Supabase credentials
- Project URL: `https://kfaaqtjhnrjuypdceljb.supabase.co`
- Anon key: Configured

## 🚀 Next Steps:

### Step 1: Set Up Your Database

You need to run the database migrations. Choose **ONE** method:

#### Option A: Using Supabase CLI (Recommended)

Run these commands in your terminal:

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref kfaaqtjhnrjuypdceljb

# Push the migrations
supabase db push
```

#### Option B: Manual Setup (Copy SQL)

If CLI doesn't work, do this manually:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/kfaaqtjhnrjuypdceljb
2. Click **SQL Editor** in the sidebar
3. Click **"New query"**
4. Open the file: `supabase/migrations/20251124063611_69b9e56b-aeda-462f-b7d9-fd5144058f58.sql`
5. Copy ALL the SQL and paste it in the SQL Editor
6. Click **"Run"**
7. Create another **"New query"**
8. Open the file: `supabase/migrations/20251125080815_5f01db4e-8a29-424e-bbf0-fc242252403c.sql`
9. Copy ALL the SQL and paste it in the SQL Editor
10. Click **"Run"**

### Step 2: Create Your Admin Account

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser** to http://localhost:5173

3. **Sign up** with your credentials:
   - Email: `joeyventulan@gmail.com`
   - Password: `madinner91`

4. **Get your User UUID:**
   - Go to: https://supabase.com/dashboard/project/kfaaqtjhnrjuypdceljb/auth/users
   - Find your email `joeyventulan@gmail.com`
   - Copy the **UUID** (it looks like: `a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6`)

5. **Grant yourself admin role:**
   - Go to: https://supabase.com/dashboard/project/kfaaqtjhnrjuypdceljb/sql/new
   - Paste this SQL (replace `YOUR_USER_UUID` with the UUID you copied):

   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('YOUR_USER_UUID', 'admin');
   ```

   - Click **"Run"**

6. **Refresh your app** in the browser - You should now see the Admin panel!

## 🎉 You're Done!

After completing these steps, you'll have:
- ✅ Full database with apps and user_roles tables
- ✅ Storage buckets for app files and icons
- ✅ Admin access to manage apps
- ✅ Your own Supabase instance (not Lovable's)

## 📝 Quick Reference

**Your Supabase Dashboard:**
https://supabase.com/dashboard/project/kfaaqtjhnrjuypdceljb

**Your Login Credentials:**
- Email: `joeyventulan@gmail.com`
- Password: `madinner91`

## 🔧 Troubleshooting

If you get any errors, check:
1. Did the migrations run successfully?
2. Do the storage buckets exist? (Storage → should see `app-files` and `app-icons`)
3. Did you grant yourself admin role?
4. Did you restart the dev server after updating `.env`?
