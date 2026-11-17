import 'package:flutter_test/flutter_test.dart';
import 'package:boi_hat_mobile/core/auth_validators.dart';

void main() {
  group('AuthValidators - Name Validation', () {
    test('validates valid Bangla and English names', () {
      expect(AuthValidators.validateName('Md. Rahim Uddin'), isNull);
      expect(AuthValidators.validateName('তানভীর আহমেদ'), isNull);
      expect(AuthValidators.validateName('A.K.M. Fazlul Huq'), isNull);
      expect(AuthValidators.validateName('Dr. Farhana (Seller)'), isNull);
    });

    test('rejects empty or short names (<2 chars)', () {
      expect(AuthValidators.validateName(''), isNotNull);
      expect(AuthValidators.validateName('  '), isNotNull);
      expect(AuthValidators.validateName('A'), isNotNull);
    });

    test('rejects names with invalid symbols', () {
      expect(AuthValidators.validateName(r'Rahim @#$%'), isNotNull);
      expect(AuthValidators.validateName('User<script>'), isNotNull);
    });

    test('rejects names exceeding 60 characters', () {
      final longName = 'A' * 61;
      expect(AuthValidators.validateName(longName), isNotNull);
    });
  });

  group('AuthValidators - Username Validation', () {
    test('accepts valid usernames starting with a letter', () {
      expect(AuthValidators.validateUsername('rahim_uddin'), isNull);
      expect(AuthValidators.validateUsername('book_reader.99'), isNull);
      expect(AuthValidators.validateUsername('anika123'), isNull);
    });

    test('rejects usernames not starting with a letter', () {
      expect(AuthValidators.validateUsername('123reader'), isNotNull);
      expect(AuthValidators.validateUsername('_reader'), isNotNull);
      expect(AuthValidators.validateUsername('.reader'), isNotNull);
    });

    test('rejects consecutive dots or underscores', () {
      expect(AuthValidators.validateUsername('user..name'), isNotNull);
      expect(AuthValidators.validateUsername('user__name'), isNotNull);
      expect(AuthValidators.validateUsername('user._name'), isNotNull);
    });

    test('rejects reserved system usernames', () {
      expect(AuthValidators.validateUsername('admin'), isNotNull);
      expect(AuthValidators.validateUsername('boihat'), isNotNull);
      expect(AuthValidators.validateUsername('support'), isNotNull);
      expect(AuthValidators.validateUsername('root'), isNotNull);
    });

    test('rejects length <3 or >20', () {
      expect(AuthValidators.validateUsername('ab'), isNotNull);
      expect(AuthValidators.validateUsername('a_very_long_username_exceeding_twenty'), isNotNull);
    });
  });

  group('AuthValidators - Email Validation', () {
    test('accepts valid RFC emails', () {
      expect(AuthValidators.validateEmail('user@example.com'), isNull);
      expect(AuthValidators.validateEmail('anika.tabassum@gmail.com'), isNull);
      expect(AuthValidators.validateEmail('student+boihat@du.ac.bd'), isNull);
    });

    test('rejects invalid email formats', () {
      expect(AuthValidators.validateEmail('plainaddress'), isNotNull);
      expect(AuthValidators.validateEmail('@missingusername.com'), isNotNull);
      expect(AuthValidators.validateEmail('missingdomain@.com'), isNotNull);
      expect(AuthValidators.validateEmail(''), isNotNull);
    });
  });

  group('AuthValidators - Mask Email', () {
    test('masks emails properly', () {
      expect(AuthValidators.maskEmail('rahim@gmail.com'), 'rah***@gmail.com');
      expect(AuthValidators.maskEmail('anika.tabassum@gmail.com'), 'ani***@gmail.com');
      expect(AuthValidators.maskEmail('ab@gmail.com'), 'a***@gmail.com');
    });
  });
}
