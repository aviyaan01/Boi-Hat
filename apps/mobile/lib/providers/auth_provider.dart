import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../data/models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null;
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
        if (data != null) {
          _user = UserModel.fromJson(data);
        }
      } catch (_) {
        // Token might be invalid or expired
      }
    }
    notifyListeners();
  }

  Future<String?> requestOtp(String phone) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post('/auth/otp/request', {'phone': phone});
      _isLoading = false;
      notifyListeners();
      // If dev OTP is returned, return it
      if (res is Map && res['dev_otp'] != null) {
        return res['dev_otp'].toString();
      }
      return null;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
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
        'code': code,
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
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> quickDevLogin({String phone = '+8801700000001'}) async {
    try {
      final otp = await requestOtp(phone);
      return await verifyOtp(phone, otp ?? '123456');
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await ApiClient.post('/auth/logout', {});
    } catch (_) {}
    await ApiClient.removeToken();
    _token = null;
    _user = null;
    notifyListeners();
  }
}

