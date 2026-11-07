import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Can be overridden at build time via --dart-define=API_BASE_URL=http://your-ip:4000
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');

  // Current detected local machine Wi-Fi IP
  static const String _defaultLocalIp = '192.168.1.104';
  static const int _defaultPort = 4000;

  static String? _customBaseUrl;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _customBaseUrl = prefs.getString('custom_api_base_url');
  }

  // Base URL resolution:
  // 1. User configured URL in settings / SharedPreferences
  // 2. Compile-time --dart-define=API_BASE_URL=...
  // 3. Android physical device default: http://192.168.1.104:4000
  // 4. Android emulator / Web / Desktop: localhost or 10.0.2.2
  static String get baseUrl {
    if (_customBaseUrl != null && _customBaseUrl!.trim().isNotEmpty) {
      return _customBaseUrl!.trim().replaceAll(RegExp(r'/+$'), '');
    }
    if (_envBaseUrl.isNotEmpty) {
      return _envBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    }
    if (kIsWeb) return 'http://localhost:$_defaultPort';
    if (Platform.isAndroid) {
      return 'http://$_defaultLocalIp:$_defaultPort';
    }
    return 'http://localhost:$_defaultPort';
  }

  static Future<void> setCustomBaseUrl(String url) async {
    final clean = url.trim().replaceAll(RegExp(r'/+$'), '');
    final prefs = await SharedPreferences.getInstance();
    if (clean.isEmpty) {
      await prefs.remove('custom_api_base_url');
      _customBaseUrl = null;
    } else {
      await prefs.setString('custom_api_base_url', clean);
      _customBaseUrl = clean;
    }
  }

  static Future<String> getCustomBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('custom_api_base_url') ?? '';
  }

  static Future<bool> testConnection([String? testUrl]) async {
    final target = (testUrl != null && testUrl.trim().isNotEmpty)
        ? testUrl.trim().replaceAll(RegExp(r'/+$'), '')
        : baseUrl;
    try {
      final uri = Uri.parse('$target/books?limit=1');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      return res.statusCode >= 200 && res.statusCode < 500;
    } catch (_) {
      return false;
    }
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('boi_hat_token');
  }

  static Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('boi_hat_token', token);
  }

  static Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('boi_hat_token');
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<dynamic> get(String endpoint) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    try {
      final response = await http.get(uri, headers: await _headers()).timeout(const Duration(seconds: 10));
      return _handleResponse(response);
    } on SocketException catch (e) {
      throw Exception('সার্ভারে সংযোগ করা সম্ভব হয়নি ($baseUrl)। ওয়াইফাই ও সার্ভার আইপি চেক করুন। (${e.message})');
    } on http.ClientException catch (e) {
      throw Exception('কানেকশন ত্রুটি: $baseUrl এ সংযোগ পাওয়া যায়নি। (${e.message})');
    }
  }

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    try {
      final response = await http
          .post(
            uri,
            headers: await _headers(),
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));
      return _handleResponse(response);
    } on SocketException catch (e) {
      throw Exception('সার্ভারে সংযোগ করা সম্ভব হয়নি ($baseUrl)। ওয়াইফাই ও সার্ভার আইপি চেক করুন। (${e.message})');
    } on http.ClientException catch (e) {
      throw Exception('কানেকশন ত্রুটি: $baseUrl এ সংযোগ পাওয়া যায়নি। (${e.message})');
    }
  }

  static Future<dynamic> patch(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    try {
      final response = await http
          .patch(
            uri,
            headers: await _headers(),
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));
      return _handleResponse(response);
    } on SocketException catch (e) {
      throw Exception('সার্ভারে সংযোগ করা সম্ভব হয়নি ($baseUrl)। ওয়াইফাই ও সার্ভার আইপি চেক করুন। (${e.message})');
    } on http.ClientException catch (e) {
      throw Exception('কানেকশন ত্রুটি: $baseUrl এ সংযোগ পাওয়া যায়নি। (${e.message})');
    }
  }

  static dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final json = jsonDecode(utf8.decode(response.bodyBytes));
      if (json is Map && json.containsKey('data')) {
        return json['data'];
      }
      return json;
    } else {
      String message = 'API Error: ${response.statusCode}';
      try {
        final errJson = jsonDecode(utf8.decode(response.bodyBytes));
        if (errJson is Map && errJson['error'] != null) {
          message = errJson['error']['message'] ?? message;
        } else if (errJson is Map && errJson['message'] != null) {
          message = errJson['message'];
        }
      } catch (_) {}
      throw Exception(message);
    }
  }
}
