-- Run this SQL in your Supabase SQL Editor after signing up
-- Replace 'YOUR_USER_UUID' with your actual user UUID from Authentication -> Users

-- To find your user UUID:
-- 1. Go to Supabase Dashboard
-- 2. Click Authentication -> Users
-- 3. Find the user with email: joeyventulan@gmail.com
-- 4. Copy the UUID from the 'id' column

INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_UUID', 'admin');

-- Example (replace with your actual UUID):
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6', 'admin');
