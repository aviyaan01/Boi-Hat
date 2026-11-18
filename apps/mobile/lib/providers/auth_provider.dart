import 'package:flutter/foundation.dart';
import '../core/api_client.dart';
import '../core/auth_localizations.dart';
import '../data/models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null && _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    _token = await ApiClient.getToken();
    if (_token != null) {
      try {
        final data = await ApiClient.get('/users/me');
        if (data != null && data is Map<String, dynamic>) {
          _user = UserModel.fromJson(data);
        }
      } catch (_) {
        // Access token might be expired; attempt token refresh
        final refreshToken = await ApiClient.getRefreshToken();
        if (refreshToken != null) {
          try {
            final res = await ApiClient.post('/auth/refresh', {'refreshToken': refreshToken});
            if (res is Map && res['accessToken'] != null) {
              _token = res['accessToken'].toString();
              await ApiClient.setToken(_token!);
              if (res['refreshToken'] != null) {
                await ApiClient.setRefreshToken(res['refreshToken'].toString());
              }
              final me = await ApiClient.get('/users/me');
              if (me != null && me is Map<String, dynamic>) {
                _user = UserModel.fromJson(me);
              }
            }
          } catch (_) {
            // Both tokens invalid: clear session
            await ApiClient.removeTokens();
            _token = null;
            _user = null;
          }
        }
      }
    }
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // ==========================================================================
  // Live Username Availability Check (500ms Debounce Consumer with Cancellation & Retry)
  // ==========================================================================
  Future<Map<String, dynamic>> checkUsernameAvailable(String username) async {
    try {
      final res = await ApiClient.getUsernameAvailable(username);
      if (res is Map<String, dynamic>) {
        return res;
      }
      return {
        'available': null,
        'inconclusive': true,
        'message': AuthLocalizations.usernameInconclusive,
      };
    } catch (e) {
      debugPrint('[AuthProvider] checkUsernameAvailable caught exception for "$username": $e (${e.runtimeType})');
      return {
        'available': null,
        'inconclusive': true,
        'message': AuthLocalizations.usernameInconclusive,
        'error': e.toString(),
        'errorType': e.runtimeType.toString(),
      };
    }
  }

  // ==========================================================================
  // Signup Flow
  // ==========================================================================
  Future<Map<String, dynamic>> requestSignupCode({
    required String name,
    required String username,
    required String email,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post('/auth/signup/request-code', {
        'name': name.trim(),
        'username': username.trim().toLowerCase(),
        'email': email.trim().toLowerCase(),
      });
      _isLoading = false;
      notifyListeners();
      if (res is Map<String, dynamic>) {
        return res;
      }
      return {'expires_in_seconds': 300, 'resend_cooldown_seconds': 60};
    } catch (e) {
      _isLoading = false;
      _errorMessage = AuthLocalizations.mapError(e);
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> verifySignupCode({
    required String email,
    required String code,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final asciiCode = AuthLocalizations.toAsciiDigits(code);
      final res = await ApiClient.post('/auth/signup/verify-code', {
        'email': email.trim().toLowerCase(),
        'code': asciiCode,
      });

      if (res is Map) {
        final accessToken = res['accessToken'] ?? res['token'];
        final refreshToken = res['refreshToken'];
        if (accessToken != null) {
          _token = accessToken.toString();
          await ApiClient.setToken(_token!);
        }
        if (refreshToken != null) {
          await ApiClient.setRefreshToken(refreshToken.toString());
        }
        if (res['user'] != null && res['user'] is Map<String, dynamic>) {
          _user = UserModel.fromJson(res['user']);
        }
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = AuthLocalizations.mapError(e);
      notifyListeners();
      return false;
    }
  }

  // ==========================================================================
  // Login Flow
  // ==========================================================================
  Future<Map<String, dynamic>> requestLoginCode({
    required String identifier,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post('/auth/login/request-code', {
        'identifier': identifier.trim().toLowerCase(),
      });
      _isLoading = false;
      notifyListeners();
      if (res is Map<String, dynamic>) {
        return res;
      }
      return {'expires_in_seconds': 300, 'resend_cooldown_seconds': 60};
    } catch (e) {
      _isLoading = false;
      _errorMessage = AuthLocalizations.mapError(e);
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> verifyLoginCode({
    required String identifier,
    required String code,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final asciiCode = AuthLocalizations.toAsciiDigits(code);
      final res = await ApiClient.post('/auth/login/verify-code', {
        'identifier': identifier.trim().toLowerCase(),
        'code': asciiCode,
      });

      if (res is Map) {
        final accessToken = res['accessToken'] ?? res['token'];
        final refreshToken = res['refreshToken'];
        if (accessToken != null) {
          _token = accessToken.toString();
          await ApiClient.setToken(_token!);
        }
        if (refreshToken != null) {
          await ApiClient.setRefreshToken(refreshToken.toString());
        }
        if (res['user'] != null && res['user'] is Map<String, dynamic>) {
          _user = UserModel.fromJson(res['user']);
        }
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = AuthLocalizations.mapError(e);
      notifyListeners();
      return false;
    }
  }

  // ==========================================================================
  // Quick Dev Login (Only accessible in kDebugMode)
  // ==========================================================================
  Future<bool> quickDevLogin({String identifier = 'tanvir@example.com'}) async {
    if (!kDebugMode) return false;
    try {
      final req = await requestLoginCode(identifier: identifier);
      final code = req['dev_code']?.toString() ?? '123456';
      return await verifyLoginCode(identifier: identifier, code: code);
    } catch (e) {
      _errorMessage = AuthLocalizations.mapError(e);
      notifyListeners();
      return false;
    }
  }

  // ==========================================================================
  // Logout
  // ==========================================================================
  Future<void> logout() async {
    try {
      await ApiClient.post('/auth/logout', {});
    } catch (_) {}
    await ApiClient.removeTokens();
    _token = null;
    _user = null;
    notifyListeners();
  }

  // ==========================================================================
  // Legacy Phone OTP Methods (Retained)
  // ==========================================================================
  Future<String?> requestOtp(String phone) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post('/auth/otp/request', {'phone': phone});
      _isLoading = false;
      notifyListeners();
      if (res is Map && res['dev_otp'] != null) {
        return res['dev_otp'].toString();
      }
      return null;
    } catch (e) {
      _isLoading = false;
      _errorMessage = AuthLocalizations.mapError(e);
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> verifyOtp(String phone, String code) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post('/auth/otp/verify', {
        'phone': phone,
        'code': AuthLocalizations.toAsciiDigits(code),
      });

      if (res is Map) {
        final accessToken = res['accessToken'] ?? res['token'];
        if (accessToken != null) {
          _token = accessToken.toString();
          await ApiClient.setToken(_token!);
        }
        if (res['user'] != null) {
          _user = UserModel.fromJson(res['user']);
        }
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = AuthLocalizations.mapError(e);
      notifyListeners();
      return false;
    }
  }
}
