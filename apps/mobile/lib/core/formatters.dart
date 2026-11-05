class Formatters {
  static const Map<String, String> _bnDigits = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };

  static String toBanglaDigits(String input) {
    String res = input;
    _bnDigits.forEach((en, bn) {
      res = res.replaceAll(en, bn);
    });
    return res;
  }

  static String formatPrice(num price, {bool inBangla = true}) {
    final str = price.toInt().toString();
    if (inBangla) {
      return '৳${toBanglaDigits(str)}';
    }
    return '৳$str';
  }

  static String conditionName(String condition) {
    switch (condition.toUpperCase()) {
      case 'LIKE_NEW':
        return 'নতুন মতো';
      case 'GOOD':
        return 'ভালো';
      case 'ACCEPTABLE':
        return 'মোটামুটি';
      default:
        return 'ব্যবহৃত';
    }
  }
}
