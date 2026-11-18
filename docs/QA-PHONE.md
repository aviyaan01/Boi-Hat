# Physical Phone QA Checklist (Testing with PC Turned Off)

This checklist verifies that the Boi-Hat system functions seamlessly on any physical Android phone, over Wi-Fi or Cellular Mobile Data (Grameenphone, Banglalink, Robi, Teletalk), without needing a local development machine or local Wi-Fi IP.

---

## 1. Preparing the Release APK

1. Build the production release APK configured with your Render HTTPS endpoint:
   ```bash
   cd apps/mobile
   flutter build apk --release --dart-define=API_BASE_URL=https://<your-render-service>.onrender.com
   ```
2. Locate the output APK:
   `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`
3. Transfer the APK to your phone via:
   - USB cable / Google Drive / Telegram / WhatsApp / Direct download.
4. On your phone:
   - Tap `app-release.apk` $\to$ Allow install from unknown sources $\to$ **Install**.

---

## 2. Test Environment Setup

- [ ] **Turn off your computer** (or disconnect it from all networks) to guarantee that zero local backend dependencies are active.
- [ ] Turn off Wi-Fi on your Android phone and enable **Mobile Data (4G/5G)**.

---

## 3. Test Scenarios & Invariant Verifications

### Scenario A: App Launch & Cold-Start Wake-up
1. Open the **Boi-Hat** app on your phone.
2. If Render has been idle for > 15 minutes, the app's background wake ping will initiate container spinning.
3. If an initial request takes more than 5 seconds, observe the top status banner:
   `"সার্ভার চালু হচ্ছে, একটু অপেক্ষা করুন..."`
4. Once Render responds, the banner automatically dismisses.

### Scenario B: Live Username Availability Check
1. Open the Drawer or Bottom Sheet $\to$ Tap **"রেজিস্ট্রেশন করুন"** (Sign Up).
2. Enter your full name (Bangla or English).
3. In the **Username** field, type an available username (e.g. `readerdhk`):
   - [ ] Within 500ms debounce, observe a **Green Checkmark** $\checkmark$ appearing.
4. Test an already taken or reserved username (e.g. `admin`):
   - [ ] Observe the red alert icon and Bangla message explaining the username is reserved or taken, with interactive suggestion chips.
5. Inconclusive check test (toggle Airplane mode briefly):
   - [ ] Observe the neutral amber warning `"যাচাই করা যায়নি, আবার চেষ্টা করুন"` with tap-to-retry. Notice that the button is NOT blocked by network timeouts alone.

### Scenario C: Email OTP Dispatch (Brevo HTTPS API)
1. Enter your real email address.
2. Tap **"কোড পাঠান"** (Send Code).
3. Verify:
   - [ ] The app transitions to Screen 2 (OTP Entry) with masked email (e.g., `y***@gmail.com`).
   - [ ] The 5:00 countdown timer starts ticking.
   - [ ] The resend button displays a 60-second cooldown timer.
4. Check your inbox:
   - [ ] Open Gmail / your email client.
   - [ ] Verify you received the email from **"বই-হাট (Boi-Hat)"** with subject `"বই-হাট অ্যাকাউন্ট ভেরিফিকেশন কোড"`.
   - [ ] The email contains the cleanly styled 6-digit code.

### Scenario D: 6-Box OTP Verification & Auto-Submit
1. Return to the Boi-Hat app.
2. Enter the 6-digit code received via email:
   - [ ] Each box auto-focuses to the next digit.
   - [ ] Pasting the 6 digits fills all 6 boxes automatically.
   - [ ] On the 6th digit, the form auto-submits.
3. Successful registration:
   - [ ] Returns JWT access & refresh tokens.
   - [ ] User profile persists in `flutter_secure_storage`.
   - [ ] The UI returns to the main screen showing you logged in with your username.

### Scenario E: Login Flow & Generic Enumeration Defense
1. Log out from the account menu.
2. Tap **"লগইন"** (Log In).
3. Test with non-existent username/email:
   - [ ] System returns identical generic message: `"যদি এই ইমেইল বা ইউজারনেমে কোনো অ্যাকাউন্ট থাকে..."` (prevents account enumeration).
4. Test with your registered username or email:
   - [ ] Receives login verification OTP via Brevo email.
   - [ ] Submitting code logs you in instantly.

---

## 4. Production Keystore Generation (For Google Play / Permanent Release)

If publishing to Google Play Store or replacing debug signing keys:

### 1. Generate Keystore via keytool:
```bash
keytool -genkey -v -keystore apps/mobile/android/app/boihat-release-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias boihat -storetype JKS
```

### 2. Configure `apps/mobile/android/key.properties`:
Create `apps/mobile/android/key.properties` (this file is ignored in git):
```properties
storePassword=<your-keystore-password>
keyPassword=<your-key-password>
keyAlias=boihat
storeFile=boihat-release-keystore.jks
```
Then run:
```bash
flutter build apk --release --dart-define=API_BASE_URL=https://<your-render-service>.onrender.com
```
