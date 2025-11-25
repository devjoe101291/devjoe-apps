# Quick Setup Checklist

## 1️⃣ Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create new project
- Save your database password!

## 2️⃣ Get Credentials
- Project Settings → API
- Copy **Project URL** and **anon public key**

## 3️⃣ Update .env File
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

## 4️⃣ Set Up Database (Choose one)

### Option A: CLI (Fastest)
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### Option B: Manual
- Copy SQL from `supabase/migrations/` files
- Paste in SQL Editor and run

## 5️⃣ Create Admin User
```bash
# Start app
npm run dev

# Sign up in the app
# Then run this SQL in Supabase (replace UUID):
```

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-uuid', 'admin');
```

## ✅ Done!
Refresh your app and you're ready to go! 🎉
