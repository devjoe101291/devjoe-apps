# Original Filename Preservation Setup

## Database Migration Required

To preserve original filenames (e.g., `himigly.apk`) when users download files, you need to add a new column to the database.

### Run this SQL in Supabase SQL Editor:

```sql
-- Add original_filename column to apps table to preserve uploaded file names
ALTER TABLE public.apps 
ADD COLUMN IF NOT EXISTS original_filename text;

-- Add comment for documentation
COMMENT ON COLUMN public.apps.original_filename IS 'Original filename of the uploaded app file (e.g., himigly.apk)';
```

## How It Works

### **Upload Process:**
1. When you upload a file (e.g., `himigly.apk`), the system saves the original filename to the database
2. The file is stored in Supabase/R2 with a unique generated name for security
3. The `original_filename` column stores `"himigly.apk"`

### **Download Process:**
1. User clicks "Download" button
2. System fetches the file as a blob for smooth download
3. Browser saves it with the **original filename** from the database
4. Downloaded file: `himigly.apk` ✅ (not `app_name_12345.apk`)

## Features

✅ **Preserves Original Names** - Downloads use exact uploaded filename
✅ **Smooth Downloads** - Fetches as blob, no browser redirect
✅ **Backward Compatible** - Old apps without `original_filename` still work
✅ **User-Friendly** - Clear progress messages during download

## Testing

1. **Upload a new app** with filename like `himigly.apk`
2. **Download it** from the homepage
3. **Check your downloads folder** - file should be named `himigly.apk`

## Migration Steps

1. Run the SQL migration above in Supabase
2. Deploy the updated code
3. Upload a new app to test
4. Download should preserve the original filename!
