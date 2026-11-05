import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String _defaultLocalIp = '192.168.0.106';
  
  // Smart Base URL resolution:
  // - On Android Emulator: http://10.0.2.2:4000
  // - On Physical Phone (Wi-Fi): http://192.168.0.106:4000
  // - On Web/Desktop: http://localhost:4000
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:4000';
    if (Platform.isAndroid) {
      // Use physical Wi-Fi IP so it works on real connected phones
      return 'http://$_defaultLocalIp:4000';
    }
    return 'http://localhost:4000';
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
    final response = await http.get(uri, headers: await _headers());
    return _handleResponse(response);
  }

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await http.post(
      uri,
      headers: await _headers(),
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  static Future<dynamic> patch(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await http.patch(
      uri,
      headers: await _headers(),
      body: jsonEncode(body),
    );
    return _handleResponse(response);
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
