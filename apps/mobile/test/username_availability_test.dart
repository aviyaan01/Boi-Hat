import 'package:flutter_test/flutter_test.dart';
import 'package:boi_hat_mobile/core/auth_localizations.dart';
import 'package:boi_hat_mobile/core/auth_validators.dart';

void main() {
  group('Username Availability - Localization & Message', () {
    test('provides correct Bengali message for inconclusive check', () {
      expect(
        AuthLocalizations.usernameInconclusive,
        'যাচাই করা যায়নি, আবার চেষ্টা করুন',
      );
    });

    test('provides retry action label', () {
      expect(AuthLocalizations.retryCheck, 'আবার চেষ্টা করুন');
    });
  });

  group('Username Availability - Signup Button Logic Invariants', () {
    bool computeIsSignupButtonEnabled({
      required String name,
      required String username,
      required String email,
      required bool? usernameAvailable,
      required bool usernameInconclusive,
    }) {
      return AuthValidators.validateName(name) == null &&
          AuthValidators.validateUsername(username) == null &&
          (usernameAvailable == true || usernameInconclusive == true) &&
          AuthValidators.validateEmail(email) == null;
    }

    const validName = 'তানভীর আহমেদ';
    const validUsername = 'tanvir_books';
    const validEmail = 'tanvir@example.com';

    test('enables signup when username check is explicitly available', () {
      final enabled = computeIsSignupButtonEnabled(
        name: validName,
        username: validUsername,
        email: validEmail,
        usernameAvailable: true,
        usernameInconclusive: false,
      );
      expect(enabled, isTrue);
    });

    test('disables signup when username check is explicitly taken (available == false)', () {
      final enabled = computeIsSignupButtonEnabled(
        name: validName,
        username: validUsername,
        email: validEmail,
        usernameAvailable: false,
        usernameInconclusive: false,
      );
      expect(enabled, isFalse);
    });

    test('enables signup when username check is inconclusive (network/timeout failure)', () {
      final enabled = computeIsSignupButtonEnabled(
        name: validName,
        username: validUsername,
        email: validEmail,
        usernameAvailable: null,
        usernameInconclusive: true,
      );
      expect(enabled, isTrue);
    });

    test('disables signup if username check has not completed and is not inconclusive', () {
      final enabled = computeIsSignupButtonEnabled(
        name: validName,
        username: validUsername,
        email: validEmail,
        usernameAvailable: null,
        usernameInconclusive: false,
      );
      expect(enabled, isFalse);
    });

    test('disables signup if username has syntax error even if inconclusive flag was set', () {
      final enabled = computeIsSignupButtonEnabled(
        name: validName,
        username: '123invalid_user',
        email: validEmail,
        usernameAvailable: null,
        usernameInconclusive: true,
      );
      expect(enabled, isFalse);
    });

    test('disables signup if name or email is invalid even if inconclusive check allowed username', () {
      final invalidName = computeIsSignupButtonEnabled(
        name: '',
        username: validUsername,
        email: validEmail,
        usernameAvailable: null,
        usernameInconclusive: true,
      );
      expect(invalidName, isFalse);

      final invalidEmail = computeIsSignupButtonEnabled(
        name: validName,
        username: validUsername,
        email: 'invalid-email',
        usernameAvailable: null,
        usernameInconclusive: true,
      );
      expect(invalidEmail, isFalse);
    });
  });
}
