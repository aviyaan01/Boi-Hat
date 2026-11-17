class AuthValidators {
  static const Set<String> reservedUsernames = {
    'admin',
    'administrator',
    'support',
    'boihat',
    'boi-hat',
    'boi_hat',
    'root',
    'api',
    'null',
    'undefined',
    'system',
    'moderator',
    'help',
    'test',
    'official',
    'auth',
    'user',
    'superuser',
    'owner',
  };

  /// Full name validation: 2-60 chars, allows Bangla and English letters, spaces, dots, parentheses, hyphens.
  static String? validateName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'আপনার পুরো নাম লিখুন (Full name is required)';
    }

    final trimmed = value.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (trimmed.length < 2) {
      return 'নাম কমপক্ষে ২ অক্ষরের হতে হবে (At least 2 characters)';
    }
    if (trimmed.length > 60) {
      return 'নাম সর্বোচ্চ ৬০ অক্ষরের হতে পারবে (Maximum 60 characters)';
    }

    // Unicode letters (\p{L}), marks (\p{M} for Bengali vowels/matras), spaces, dots, parentheses, hyphens
    final nameRegex = RegExp(r"^[\p{L}\p{M}\s.()'-]+$", unicode: true);
    if (!nameRegex.hasMatch(trimmed)) {
      return 'নামে শুধুমাত্র বর্ণ, স্পেস ও ডট গ্রহণযোগ্য (Only letters, spaces, and dots allowed)';
    }

    return null;
  }

  /// Username validation: 3-20 chars, lowercase a-z, 0-9, _, .
  /// Must start with a letter; no consecutive dots/underscores; reserved words blocked.
  static String? validateUsername(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'ইউজারনেম লিখুন (Username is required)';
    }

    final lower = value.trim().toLowerCase();
    if (lower.length < 3) {
      return 'ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে (At least 3 characters)';
    }
    if (lower.length > 20) {
      return 'ইউজারনেম সর্বোচ্চ ২০ অক্ষরের হতে পারবে (Maximum 20 characters)';
    }

    if (!RegExp(r'^[a-z]').hasMatch(lower)) {
      return 'ইউজারনেম অবশ্যই ইংরেজি অক্ষর দিয়ে শুরু হতে হবে (Must start with a letter)';
    }

    if (!RegExp(r'^[a-z0-9_.]+$').hasMatch(lower)) {
      return 'শুধুমাত্র ইংরেজি ছোট হাতের অক্ষর, সংখ্যা, _ এবং . ব্যবহার করুন';
    }

    if (RegExp(r'\.{2,}|_{2,}|\._|_\.').hasMatch(lower)) {
      return 'পরপর একাধিক ডট বা আন্ডারস্কোর ব্যবহার করা যাবে না';
    }

    if (reservedUsernames.contains(lower)) {
      return 'এই ইউজারনেমটি সিস্টেমের জন্য সংরক্ষিত (Reserved username)';
    }

    return null;
  }

  /// Email validation: RFC-compliant email regex.
  static String? validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'ইমেইল ঠিকানা লিখুন (Email is required)';
    }

    final clean = value.trim().toLowerCase();
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$',
    );

    if (!emailRegex.hasMatch(clean)) {
      return 'সঠিক ইমেইল ঠিকানা প্রদান করুন (Enter a valid email)';
    }

    return null;
  }

  /// Identifier validation (email or username)
  static String? validateIdentifier(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'ইমেইল অথবা ইউজারনেম লিখুন (Enter email or username)';
    }
    if (value.trim().length < 3) {
      return 'কমপক্ষে ৩ অক্ষর লিখুন';
    }
    return null;
  }

  /// Mask email for privacy display: e.g. "anika.tabassum@gmail.com" -> "an***@gmail.com"
  static String maskEmail(String email) {
    final clean = email.trim();
    final atIndex = clean.indexOf('@');
    if (atIndex <= 1) return clean;

    final localPart = clean.substring(0, atIndex);
    final domain = clean.substring(atIndex);

    if (localPart.length <= 2) {
      return '${localPart[0]}***$domain';
    } else if (localPart.length <= 4) {
      return '${localPart.substring(0, 2)}***$domain';
    } else {
      return '${localPart.substring(0, 3)}***$domain';
    }
  }
}
