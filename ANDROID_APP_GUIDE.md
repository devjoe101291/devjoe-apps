# 🤖 Android App Setup Guide - Dev Joe Showcase

## ✅ What's Done

Your web app is now **ready to become an Android app**! Here's what I've set up:

1. ✅ Capacitor installed and configured
2. ✅ Android platform added
3. ✅ Web assets built and copied to Android
4. ✅ App configured with:
   - App ID: `com.devjoe.showcase`
   - App Name: `Dev Joe Showcase`
   - HTTPS scheme for security

## 📋 Requirements

Before building the APK, you need:

### 1. **Java Development Kit (JDK)**
- Download JDK 17: https://adoptium.net/
- Set `JAVA_HOME` environment variable

### 2. **Android Studio**
- Download: https://developer.android.com/studio
- Install Android SDK (API 33 or higher recommended)
- Set `ANDROID_HOME` environment variable

### 3. **Set Environment Variables (Windows)**

```powershell
# Add to System Environment Variables:
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk

# Add to PATH:
%JAVA_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
```

## 🚀 Build Your Android App

### **Option A: Build APK via Android Studio (Recommended for First Time)**

1. **Open Android Studio**
   ```bash
   npx cap open android
   ```

2. **Wait for Gradle Sync** (first time takes 5-10 minutes)

3. **Build APK**
   - Menu: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Wait for build to complete
   - Click "locate" to find your APK file

4. **Install on Device**
   - Connect Android phone via USB
   - Enable Developer Options and USB Debugging
   - Click the green "Run" button in Android Studio

### **Option B: Build APK via Command Line (Faster)**

```bash
# Build debug APK
cd android
./gradlew assembleDebug

# Build release APK (for Play Store)
./gradlew assembleRelease

# APK location:
# Debug: android/app/build/outputs/apk/debug/app-debug.apk
# Release: android/app/build/outputs/apk/release/app-release.apk
```

## 📱 Test on Your Android Device

### **Method 1: USB Install**
1. Connect phone via USB
2. Enable Developer Mode:
   - Settings → About Phone → Tap "Build Number" 7 times
3. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
4. Run from Android Studio or:
   ```bash
   npx cap run android
   ```

### **Method 2: APK File Install**
1. Build the APK (see above)
2. Copy APK to your phone
3. Open APK file and install
4. Allow installation from unknown sources if prompted

## 🎨 Customize Your App

### **1. App Icon**

Replace these files in `android/app/src/main/res/`:
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

**Or use online tool:**
- https://icon.kitchen/ (Upload your logo, download all sizes)

### **2. Splash Screen**

Edit `android/app/src/main/res/values/styles.xml`:
```xml
<item name="android:background">@color/your_color</item>
```

### **3. App Name**

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Dev Joe Showcase</string>
```

## 📦 Prepare for Google Play Store

### **1. Generate Signing Key**

```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### **2. Configure Signing**

Edit `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.jks')
            storePassword 'your-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### **3. Build Release APK/AAB**

```bash
cd android
./gradlew bundleRelease  # For AAB (Google Play prefers this)
./gradlew assembleRelease  # For APK
```

### **4. Upload to Play Store**

1. Create Developer Account: https://play.google.com/console
2. Pay one-time $25 fee
3. Create new app
4. Upload AAB file: `android/app/build/outputs/bundle/release/app-release.aab`
5. Fill in store listing, screenshots, description
6. Submit for review

## 🔄 Update Your App

Whenever you make changes to your web app:

```bash
# 1. Build web app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build new APK
cd android
./gradlew assembleRelease
```

## 🛠️ Useful Commands

```bash
# Open Android Studio
npx cap open android

# Run on connected device
npx cap run android

# Build and sync
npm run build && npx cap sync android

# Clean build
cd android
./gradlew clean

# Check Capacitor status
npx cap doctor
```

## 📸 App Screenshots for Play Store

You need:
- **Phone screenshots**: 2-8 images (1080x1920 px)
- **Tablet screenshots**: 2-8 images (1440x2560 px)
- **Feature graphic**: 1024x500 px
- **App icon**: 512x512 px (high-res)

**Tip:** Use Android Studio emulator to capture perfect screenshots

## ⚠️ Common Issues & Solutions

### **Issue: Gradle sync failed**
```bash
cd android
./gradlew clean
./gradlew build --refresh-dependencies
```

### **Issue: App crashes on startup**
- Check `capacitor.config.ts` has correct `webDir: 'dist'`
- Run `npm run build` before `npx cap sync`

### **Issue: White screen on Android**
- Check browser console in Chrome DevTools
- Connect phone via USB
- Chrome: `chrome://inspect` → Select your device

### **Issue: Supabase/API not working**
- Make sure your API allows requests from the app
- Check CORS settings in Supabase
- Verify internet permissions in `AndroidManifest.xml`

## 🎉 You're Done!

Your web app is now an Android app! 🚀

**Next Steps:**
1. Install Android Studio
2. Build your first APK
3. Test on your phone
4. Publish to Google Play Store

**Questions?** Check Capacitor docs: https://capacitorjs.com/docs

---

**Made with ❤️ by Dev Joe Solutions**
