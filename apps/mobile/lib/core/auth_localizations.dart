import 'formatters.dart';

enum AppLanguage { bn, en }

class AuthLocalizations {
  static AppLanguage currentLanguage = AppLanguage.bn;

  static bool get isBangla => currentLanguage == AppLanguage.bn;

  /// Display a single digit or string: converts ASCII to Bangla numerals if in Bangla locale
  static String formatDigitForDisplay(String digit) {
    if (isBangla) {
      return Formatters.toBanglaDigits(digit);
    }
    return digit;
  }

  /// Convert any input characters back to clean ASCII digits (0-9) before sending to server
  static String toAsciiDigits(String input) {
    const bnToEn = {
      '০': '0',
      '১': '1',
      '২': '2',
      '৩': '3',
      '৪': '4',
      '৫': '5',
      '৬': '6',
      '৭': '7',
      '৮': '8',
      '৯': '9',
    };
    String result = input;
    bnToEn.forEach((bn, en) {
      result = result.replaceAll(bn, en);
    });
    return result.replaceAll(RegExp(r'[^0-9]'), '');
  }

  // --- UI Strings ---
  static String get welcomeTitle =>
      isBangla ? 'বই-হাট এ স্বাগতম' : 'Welcome to Boi-Hat';

  static String get welcomeSubtitle =>
      isBangla ? 'ইমেইল ভেরিফিকেশনের মাধ্যমে নিরাপদে প্রবেশ করুন' : 'Secure email-verified access';

  static String get tabSignUp => isBangla ? 'নতুন অ্যাকাউন্ট' : 'Sign Up';
  static String get tabLogin => isBangla ? 'লগইন' : 'Log In';

  // Screen 1: Signup Inputs
  static String get fullNameLabel => isBangla ? 'পুরো নাম' : 'Full Name';
  static String get fullNameHint => isBangla ? 'উদা: তানভীর আহমেদ' : 'e.g. Tanvir Ahmed';

  static String get usernameLabel => isBangla ? 'ইউজারনেম' : 'Username';
  static String get usernameHint => isBangla ? 'উদা: tanvir_books' : 'e.g. tanvir_books';

  static String get usernameAvailable =>
      isBangla ? 'এই ইউজারনেম পাওয়া যাবে' : 'Username is available';
  static String get usernameChecking =>
      isBangla ? 'যাচাই করা হচ্ছে...' : 'Checking availability...';
  static String get usernameTaken =>
      isBangla ? 'ইউজারনেমটি আগে থেকেই নেওয়া' : 'Username already taken';
  static String get usernameInconclusive =>
      isBangla ? 'যাচাই করা যায়নি, আবার চেষ্টা করুন' : 'Could not verify, please try again';
  static String get retryCheck =>
      isBangla ? 'আবার চেষ্টা করুন' : 'Retry';
  static String get suggestionsLabel =>
      isBangla ? 'পরামর্শ:' : 'Suggestions:';

  static String get emailLabel => isBangla ? 'ইমেইল ঠিকানা' : 'Email Address';
  static String get emailHint => isBangla ? 'example@gmail.com' : 'example@gmail.com';

  static String get sendCodeBtn => isBangla ? 'কোড পাঠান' : 'Send Code';

  // Screen 2: OTP Verification
  static String get verifyTitle => isBangla ? 'ইমেইল ভেরিফিকেশন' : 'Email Verification';
  static String codeSentTo(String maskedEmail) =>
      isBangla ? '$maskedEmail ঠিকানায় ৬ ডিজিটের কোড পাঠানো হয়েছে' : 'A 6-digit code was sent to $maskedEmail';

  static String get changeEmail =>
      isBangla ? 'ইমেইল ভুল? পরিবর্তন করুন' : 'Wrong email? Change it';

  static String get enterCodeHint => isBangla ? '৬ ডিজিটের ওটিপি লিখুন' : 'Enter 6-digit OTP';
  static String get verifyAndEnterBtn => isBangla ? 'যাচাই ও প্রবেশ করুন' : 'Verify & Enter';

  static String get resendCodeBtn => isBangla ? 'আবার কোড পাঠান' : 'Resend Code';
  static String resendInSeconds(int s) =>
      isBangla ? 'পুনরায় পাঠাতে অপেক্ষা করুন: ${Formatters.toBanglaDigits(s.toString())} সে.' : 'Resend in: ${s}s';

  static String timerDisplay(int minutes, int seconds) {
    final m = minutes.toString().padLeft(2, '0');
    final s = seconds.toString().padLeft(2, '0');
    final str = '$m:$s';
    return isBangla ? Formatters.toBanglaDigits(str) : str;
  }

  // Login
  static String get loginIdentifierLabel =>
      isBangla ? 'ইমেইল অথবা ইউজারনেম' : 'Email or Username';
  static String get loginIdentifierHint =>
      isBangla ? 'your_email@gmail.com বা username' : 'email@domain.com or username';

  static String get genericLoginNotice => isBangla
      ? 'যদি এই ইমেইল বা ইউজারনেমে কোনো অ্যাকাউন্ট থাকে, তবে ভেরিফিকেশন কোড পাঠানো হয়েছে।'
      : 'If an account exists with this email or username, a verification code has been sent.';

  static String get alreadyHaveAccount =>
      isBangla ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন' : 'Already have an account? Log In';
  static String get needAccount =>
      isBangla ? 'নতুন ব্যবহারকারী? রেজিস্ট্রেশন করুন' : 'New to Boi-Hat? Sign Up';

  // Dev mode
  static String get quickDevLogin =>
      isBangla ? '⚡ ১-ক্লিকে টেস্ট অ্যাকাউন্টে লগইন (Dev Mode)' : '⚡ 1-Click Test Account Login (Dev Mode)';
  static String get serverConfig =>
      isBangla ? 'সার্ভার কনফিগারেশন' : 'Server Configuration';

  // --- Friendly Error Handling in Bangla ---
  static String mapError(dynamic error) {
    final msg = error.toString().replaceAll('Exception: ', '').trim();

    if (msg.contains('SocketException') || msg.contains('সার্ভারে সংযোগ করা সম্ভব হয়নি') || msg.contains('Failed host lookup')) {
      return isBangla
          ? 'ইন্টারনেট বা সার্ভারে সংযোগ নেই। আপনার ইন্টারনেট কানেকশন চেক করুন।'
          : 'No internet or server unreachable. Please check connection.';
    }
    if (msg.contains('TimeoutException') || msg.contains('timed out')) {
      return isBangla
          ? 'সার্ভার থেকে উত্তর আসতে সময় লেগেছে। দয়া করে আবার চেষ্টা করুন।'
          : 'Request timed out. Please try again.';
    }
    if (msg.contains('ইমেইলটি আগে থেকেই নিবন্ধিত') || msg.contains('Email already registered')) {
      return isBangla
          ? 'এই ইমেইলটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে। দয়া করে লগইন করুন।'
          : 'This email is already registered. Please log in.';
    }
    if (msg.contains('ইউজারনেমটি আগে থেকেই নেওয়া') || msg.contains('Username already taken')) {
      return isBangla
          ? 'এই ইউজারনেমটি অন্য কেউ নিয়ে ফেলেছেন। নতুন ইউজারনেম বেছে নিন।'
          : 'This username is already taken. Please choose another.';
    }
    if (msg.contains('মেয়াদ শেষ হয়ে গেছে') || msg.contains('expired')) {
      return isBangla
          ? 'ভেরিফিকেশন কোডের মেয়াদ শেষ হয়ে গেছে। আবার কোড পাঠান।'
          : 'Verification code has expired. Please request a new one.';
    }
    if (msg.contains('অতিরিক্ত ভুল চেষ্টা') || msg.contains('Too many invalid attempts')) {
      return isBangla
          ? 'অতিরিক্ত ভুল কোড দেওয়ার কারণে এটি বাতিল হয়েছে। নতুন কোড অনুরোধ করুন।'
          : 'Too many wrong attempts. Code invalidated. Please request a new code.';
    }
    if (msg.contains('ভুল ভেরিফিকেশন কোড') || msg.contains('Invalid verification code')) {
      return isBangla
          ? 'ভুল কোড দেওয়া হয়েছে। দয়া করে আপনার ইমেইল চেক করে সঠিক কোড দিন।'
          : 'Invalid verification code. Please check your email.';
    }
    if (msg.contains('Too many requests') || msg.contains('অতিরিক্ত অনুরোধ') || msg.contains('সেকেন্ড পর পুনরায়')) {
      return msg; // Already contains countdown in Bangla
    }

    return msg.isNotEmpty ? msg : (isBangla ? 'একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' : 'An error occurred. Please try again.');
  }
}
