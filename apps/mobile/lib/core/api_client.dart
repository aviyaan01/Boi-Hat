import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Can be configured at build time via --dart-define=API_BASE_URL=http://<PC-IP>:4000
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const int _defaultPort = 4000;

  static String? _customBaseUrl;
  static bool _hasExplicitDebugOverride = false;

  // Dedicated client for username checks to allow cancelling previous in-flight requests
  static http.Client? _activeUsernameClient;

  // Secure storage instance for Android and iOS
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(resetOnError: true),
  );

  /// Default URL computation
  static String get defaultBaseUrl {
    if (_envBaseUrl.isNotEmpty) {
      return _envBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    }
    if (!kDebugMode) {
      return 'https://api.boihat.com';
    }
    if (kIsWeb) return 'http://localhost:$_defaultPort';
    if (Platform.isAndroid) {
      // 10.0.2.2 is standard for Android Emulator.
      // For physical device over USB, use adb reverse tcp:4000 tcp:4000 with http://localhost:4000
      // For physical device over Wi-Fi, pass --dart-define=API_BASE_URL=http://<PC-IP>:4000
      return 'http://10.0.2.2:$_defaultPort';
    }
    return 'http://localhost:$_defaultPort';
  }

  /// Active Base URL resolution:
  /// - In Release builds: Strictly use compile-time --dart-define or production HTTPS. Saved debug URLs are completely ignored.
  /// - In Debug builds: --dart-define has priority unless user explicitly set a custom URL in this session dialog.
  static String get baseUrl {
    if (!kDebugMode) {
      return defaultBaseUrl;
    }
    if (_hasExplicitDebugOverride && _customBaseUrl != null && _customBaseUrl!.trim().isNotEmpty) {
      return _customBaseUrl!.trim().replaceAll(RegExp(r'/+$'), '');
    }
    if (_envBaseUrl.isNotEmpty) {
      return _envBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    }
    if (_customBaseUrl != null && _customBaseUrl!.trim().isNotEmpty) {
      return _customBaseUrl!.trim().replaceAll(RegExp(r'/+$'), '');
    }
    return defaultBaseUrl;
  }

  /// App initialization routine:
  /// Verifies health of saved custom URL in debug mode.
  /// If saved URL fails /health but default URL works, automatically purges the stale saved URL.
  static Future<void> init() async {
    if (!kDebugMode) {
      _customBaseUrl = null;
      _hasExplicitDebugOverride = false;
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('custom_api_base_url');

    if (saved != null && saved.trim().isNotEmpty) {
      final cleanSaved = saved.trim().replaceAll(RegExp(r'/+$'), '');
      _customBaseUrl = cleanSaved;

      // If --dart-define is provided, it takes precedence over stale saved preference
      if (_envBaseUrl.isNotEmpty && cleanSaved != _envBaseUrl) {
        debugPrint('[ApiClient] --dart-define=API_BASE_URL ($_envBaseUrl) overrides saved URL ($cleanSaved).');
        _hasExplicitDebugOverride = false;
        return;
      }

      // Check health of saved URL vs default URL
      try {
        final savedHealth = await checkHealth(cleanSaved);
        if (savedHealth['status'] != 'ok') {
          debugPrint('[ApiClient] Stale saved URL $cleanSaved failed /health: ${savedHealth['error']}');
          final defaultHealth = await checkHealth(defaultBaseUrl);
          if (defaultHealth['status'] == 'ok') {
            debugPrint('[ApiClient] Default URL ($defaultBaseUrl) is healthy! Auto-clearing stale saved URL.');
            await prefs.remove('custom_api_base_url');
            _customBaseUrl = null;
            _hasExplicitDebugOverride = false;
          }
        }
      } catch (e) {
        debugPrint('[ApiClient] Exception during health check verification on init: $e');
      }
    }
  }

  /// Explicitly set custom base URL from debug-only dialog
  static Future<void> setCustomBaseUrl(String url) async {
    if (!kDebugMode) return;
    final clean = url.trim().replaceAll(RegExp(r'/+$'), '');
    final prefs = await SharedPreferences.getInstance();
    if (clean.isEmpty) {
      await prefs.remove('custom_api_base_url');
      _customBaseUrl = null;
      _hasExplicitDebugOverride = false;
      debugPrint('[ApiClient] Custom base URL cleared. Active URL is now: $baseUrl');
    } else {
      await prefs.setString('custom_api_base_url', clean);
      _customBaseUrl = clean;
      _hasExplicitDebugOverride = true;
      debugPrint('[ApiClient] Custom base URL explicitly set to: $clean');
    }
  }

  /// Reset to default base URL
  static Future<void> resetToDefault() async {
    await setCustomBaseUrl('');
  }

  static Future<String> getCustomBaseUrl() async {
    if (!kDebugMode) return '';
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('custom_api_base_url') ?? '';
  }

  /// Connect and receive timeout constants
  static const Duration _connectTimeout = Duration(seconds: 15);
  static const Duration _receiveTimeout = Duration(seconds: 30);

  /// Performs an in-depth connectivity test against GET /health
  static Future<Map<String, dynamic>> checkHealth([String? testUrl]) async {
    final target = (testUrl != null && testUrl.trim().isNotEmpty)
        ? testUrl.trim().replaceAll(RegExp(r'/+$'), '')
        : baseUrl;
    final stopwatch = Stopwatch()..start();
    final uri = Uri.parse('$target/health');

    try {
      final client = http.Client();
      final response = await client.get(uri).timeout(_connectTimeout);
      client.close();
      stopwatch.stop();

      if (response.statusCode == 200) {
        final body = jsonDecode(utf8.decode(response.bodyBytes));
        return {
          'status': 'ok',
          'statusCode': 200,
          'latencyMs': stopwatch.elapsedMilliseconds,
          'targetUrl': target,
          'db': body is Map ? body['db'] : 'unknown',
          'service': body is Map ? body['service'] : 'boi-hat-api',
        };
      } else {
        return {
          'status': 'error',
          'statusCode': response.statusCode,
          'latencyMs': stopwatch.elapsedMilliseconds,
          'targetUrl': target,
          'error': 'HTTP ${response.statusCode}',
        };
      }
    } on SocketException catch (e) {
      stopwatch.stop();
      debugPrint('[ApiClient] checkHealth SocketException on $target: ${e.message} (errno: ${e.osError?.errorCode})');
      return {
        'status': 'error',
        'latencyMs': stopwatch.elapsedMilliseconds,
        'targetUrl': target,
        'error': 'SocketException: ${e.message} ${e.osError != null ? "(${e.osError})" : ""}',
      };
    } on TimeoutException {
      stopwatch.stop();
      debugPrint('[ApiClient] checkHealth TimeoutException on $target');
      return {
        'status': 'error',
        'latencyMs': stopwatch.elapsedMilliseconds,
        'targetUrl': target,
        'error': 'TimeoutException (15s exceeded)',
      };
    } catch (e) {
      stopwatch.stop();
      debugPrint('[ApiClient] checkHealth Exception on $target: $e');
      return {
        'status': 'error',
        'latencyMs': stopwatch.elapsedMilliseconds,
        'targetUrl': target,
        'error': e.toString(),
      };
    }
  }

  /// Backward-compatible connection test
  static Future<bool> testConnection([String? testUrl]) async {
    final res = await checkHealth(testUrl);
    return res['status'] == 'ok';
  }

  // --- Secure Token Storage ---
  static Future<String?> getToken() async {
    try {
      return await _secureStorage.read(key: 'boi_hat_token');
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('boi_hat_token');
    }
  }

  static Future<void> setToken(String token) async {
    try {
      await _secureStorage.write(key: 'boi_hat_token', value: token);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('boi_hat_token', token);
    }
  }

  static Future<String?> getRefreshToken() async {
    try {
      return await _secureStorage.read(key: 'boi_hat_refresh_token');
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('boi_hat_refresh_token');
    }
  }

  static Future<void> setRefreshToken(String token) async {
    try {
      await _secureStorage.write(key: 'boi_hat_refresh_token', value: token);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('boi_hat_refresh_token', token);
    }
  }

  static Future<void> removeTokens() async {
    try {
      await _secureStorage.delete(key: 'boi_hat_token');
      await _secureStorage.delete(key: 'boi_hat_refresh_token');
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('boi_hat_token');
    await prefs.remove('boi_hat_refresh_token');
  }

  static Future<void> removeToken() async {
    await removeTokens();
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Standard GET with 15s connect & 30s receive timeouts
  static Future<dynamic> get(String endpoint) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    try {
      final response = await http
          .get(uri, headers: await _headers())
          .timeout(_receiveTimeout);
      return _handleResponse(response);
    } on SocketException catch (e) {
      debugPrint('[ApiClient] GET $uri SocketException: ${e.message} (osError: ${e.osError})');
      throw Exception('সার্ভারে সংযোগ করা সম্ভব হয়নি ($baseUrl)। ওয়াইফাই ও সার্ভার আইপি চেক করুন। (${e.message})');
    } on TimeoutException {
      debugPrint('[ApiClient] GET $uri TimeoutException (exceeded 30s)');
      throw Exception('সার্ভার থেকে উত্তর আসতে বিলম্ব হচ্ছে। ইন্টারনেট কানেকশন চেক করুন।');
    } on http.ClientException catch (e) {
      debugPrint('[ApiClient] GET $uri ClientException: ${e.message}');
      throw Exception('কানেকশন ত্রুটি: $baseUrl এ সংযোগ পাওয়া যায়নি। (${e.message})');
    } catch (e) {
      debugPrint('[ApiClient] GET $uri Unexpected error: $e');
      rethrow;
    }
  }

  /// Cancelable GET for live username availability check with single retry on timeout
  static Future<dynamic> getUsernameAvailable(String username) async {
    // 1. Cancel previous in-flight username request
    _activeUsernameClient?.close();
    final client = http.Client();
    _activeUsernameClient = client;

    final uri = Uri.parse('$baseUrl/auth/username-available?u=${Uri.encodeComponent(username)}');
    final headers = await _headers();

    Future<dynamic> executeCall() async {
      final response = await client.get(uri, headers: headers).timeout(_receiveTimeout);
      return _handleResponse(response);
    }

    try {
      return await executeCall();
    } on TimeoutException {
      debugPrint('[ApiClient] Username check for "$username" timed out. Retrying once...');
      try {
        return await executeCall();
      } catch (retryErr) {
        debugPrint('[ApiClient] Username check retry also failed: $retryErr');
        rethrow;
      }
    } on SocketException catch (e) {
      debugPrint('[ApiClient] Username check SocketException: ${e.message} (osError: ${e.osError})');
      rethrow;
    } on http.ClientException catch (e) {
      // If cancelled by next request, quietly ignore
      if (e.message.contains('Connection closed before full header was received') ||
          e.message.contains('Client has been closed')) {
        debugPrint('[ApiClient] In-flight username request was superseded and cancelled.');
      } else {
        debugPrint('[ApiClient] Username check ClientException: ${e.message}');
      }
      rethrow;
    } finally {
      if (_activeUsernameClient == client) {
        _activeUsernameClient = null;
      }
    }
  }

  /// Standard POST with NO auto-retry (code sending must not duplicate)
  static Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    try {
      final response = await http
          .post(
            uri,
            headers: await _headers(),
            body: jsonEncode(body),
          )
          .timeout(_receiveTimeout);
      return _handleResponse(response);
    } on SocketException catch (e) {
      debugPrint('[ApiClient] POST $uri SocketException: ${e.message} (osError: ${e.osError})');
      throw Exception('সার্ভারে সংযোগ করা সম্ভব হয়নি ($baseUrl)। ওয়াইফাই ও সার্ভার আইপি চেক করুন। (${e.message})');
    } on TimeoutException {
      debugPrint('[ApiClient] POST $uri TimeoutException (exceeded 30s)');
      throw Exception('সার্ভার থেকে উত্তর আসতে বিলম্ব হচ্ছে। ইন্টারনেট কানেকশন চেক করুন।');
    } on http.ClientException catch (e) {
      debugPrint('[ApiClient] POST $uri ClientException: ${e.message}');
      throw Exception('কানেকশন ত্রুটি: $baseUrl এ সংযোগ পাওয়া যায়নি। (${e.message})');
    } catch (e) {
      debugPrint('[ApiClient] POST $uri Unexpected error: $e');
      rethrow;
    }
  }

  /// Standard PATCH
  static Future<dynamic> patch(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    try {
      final response = await http
          .patch(
            uri,
            headers: await _headers(),
            body: jsonEncode(body),
          )
          .timeout(_receiveTimeout);
      return _handleResponse(response);
    } on SocketException catch (e) {
      debugPrint('[ApiClient] PATCH $uri SocketException: ${e.message} (osError: ${e.osError})');
      throw Exception('সার্ভারে সংযোগ করা সম্ভব হয়নি ($baseUrl)। ওয়াইফাই ও সার্ভার আইপি চেক করুন। (${e.message})');
    } on TimeoutException {
      debugPrint('[ApiClient] PATCH $uri TimeoutException');
      throw Exception('সার্ভার থেকে উত্তর আসতে বিলম্ব হচ্ছে। ইন্টারনেট কানেকশন চেক করুন।');
    } on http.ClientException catch (e) {
      debugPrint('[ApiClient] PATCH $uri ClientException: ${e.message}');
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
        if (errJson is Map) {
          if (errJson['error'] != null && errJson['error'] is Map) {
            message = errJson['error']['message'] ?? message;
          } else if (errJson['message'] != null) {
            if (errJson['message'] is List) {
              message = (errJson['message'] as List).join(', ');
            } else {
              message = errJson['message'].toString();
            }
          }
        }
      } catch (_) {}
      throw Exception(message);
    }
  }
}
