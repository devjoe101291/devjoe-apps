# Video Gallery Setup Guide

## ✅ What's Been Done

1. ✅ Created database migration file for videos table
2. ✅ Installed react-player library  
3. ✅ Created VideoCard component with smooth video player
4. ✅ Added Video Gallery section to home page
5. ✅ Added video fetching and view tracking functionality

## 🚀 Next Steps to Complete Setup

### Step 1: Run the Database Migration

You need to run the SQL migration to create the videos table in your Supabase database.

**Go to your Supabase SQL Editor:**
https://supabase.com/dashboard/project/kfaaqtjhnrjuypdceljb/sql/new

**Copy and paste this SQL:**

```sql
-- The content from: supabase/migrations/20251125_create_videos_table.sql
```

Then click **"Run"**.

### Step 2: Verify Storage Buckets

Go to **Storage** in Supabase dashboard and verify these buckets exist:
- `videos` (public)
- `video-thumbnails` (public)

If they don't exist, the SQL migration should have created them. If not, create them manually.

### Step 3: Add Video Management to Admin Panel

The admin panel needs to be updated to allow uploading and managing videos. This includes:

- Video title and description fields
- Video file upload (MP4, WebM, etc.)
- Thumbnail image upload (optional)
- List of uploaded videos with edit/delete options
- View count display

### Step 4: Test the Setup

1. **Run the app locally:**
   ```bash
   npm run dev
   ```

2. **Go to Admin panel** and add a test video

3. **Check the home page** - Video Gallery section should appear below Featured Apps

4. **Click a video** - Should open in a smooth player dialog

## 🎬 Video Gallery Features

### For Users (Home Page):
- ✅ Beautiful grid layout of video thumbnails
- ✅ Play button overlay on hover
- ✅ View count display
- ✅ Smooth video player in modal dialog
- ✅ Responsive design (mobile-friendly)
- ✅ Auto-play when opened
- ✅ Full controls (play, pause, seek, volume, fullscreen)

### For Admin:
- Upload video files (MP4, WebM, etc.)
- Add custom thumbnails
- Edit video details
- Delete videos
- View total view count per video

## 📝 Recommended Video Settings

**Optimal video formats:**
- MP4 (H.264 codec) - Best compatibility
- WebM - Good for web
- Max file size: 50MB (Supabase free tier limit)

**Thumbnail images:**
- 16:9 aspect ratio (e.g., 1280x720px)
- JPG or PNG format
- File size: < 1MB for fast loading

## 🎨 Design Features

- Elegant card design matching the app cards
- Smooth hover animations
- Primary color accents
- Gradient borders on hover
- Responsive text sizes
- Professional video player with custom styling
- View count badges
- Loading states

## 🔧 Troubleshooting

**Videos not showing:**
1. Check if migration was run successfully
2. Verify storage buckets exist
3. Check browser console for errors
4. Ensure videos table has data

**Upload failing:**
1. Check file size (max 50MB)
2. Verify storage policies are correct
3. Check admin permissions

**Player not working:**
1. Ensure video URL is publicly accessible
2. Check video format compatibility
3. Test in different browsers

## 📚 Additional Resources

- React Player docs: https://github.com/cookpete/react-player
- Supabase Storage docs: https://supabase.com/docs/guides/storage
- Video optimization: https://web.dev/fast/  

## 🎉 You're All Set!

Once you complete the steps above, your website will have a fully functional video gallery for inspirational/religious content!
