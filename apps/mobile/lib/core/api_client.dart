import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Compile-time default public HTTPS URL. Override via --dart-define=API_BASE_URL=https://...
  static const String _envBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://boi-hat-api.onrender.com',
  );
  static const int _defaultPort = 4000;

  static String? _customBaseUrl;
  static bool _hasExplicitDebugOverride = false;

  // Dedicated client for username checks to allow cancelling previous in-flight requests
  static http.Client? _activeUsernameClient;

  // Server waking indicators for Render cold starts (> 5s latency)
  static final ValueNotifier<bool> isServerWaking = ValueNotifier<bool>(false);
  static final ValueNotifier<String?> serverWakingMessage = ValueNotifier<String?>(null);

  // Synchronized token refresh completer to prevent race conditions on concurrent 401s
  static Completer<bool>? _refreshCompleter;

  // Secure storage instance for Android and iOS
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(resetOnError: true),
  );

  /// Default URL computation
  static String get defaultBaseUrl {
    if (!kDebugMode) {
      final url = _envBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
      if (!url.startsWith('https://')) {
        throw StateError('CRITICAL: Release builds must use a secure HTTPS API endpoint. Received: $url');
      }
      return url;
    }

    if (_envBaseUrl.isNotEmpty && _envBaseUrl != 'https://boi-hat-api.onrender.com') {
      return _envBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    }

    if (kIsWeb) return 'http://localhost:$_defaultPort';
    if (Platform.isAndroid) {
      // 10.0.2.2 is standard for Android Emulator in debug
      return 'http://10.0.2.2:$_defaultPort';
    }
    return 'http://localhost:$_defaultPort';
  }

  /// Active Base URL resolution:
  /// - Release builds: Strictly HTTPS compile-time default or --dart-define. Saved debug URLs are completely ignored.
  /// - Debug builds: Allows saved or dialog-configured local URLs.
  static String get baseUrl {
    if (!kDebugMode) {
      final url = defaultBaseUrl;
      if (!url.startsWith('https://')) {
        throw StateError('Release builds require a secure HTTPS base URL');
      }
      return url;
    }

    if (_hasExplicitDebugOverride && _customBaseUrl != null && _customBaseUrl!.trim().isNotEmpty) {
      return _customBaseUrl!.trim().replaceAll(RegExp(r'/+$'), '');
    }
    if (_envBaseUrl.isNotEmpty && _envBaseUrl != 'https://boi-hat-api.onrender.com') {
      return _envBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    }
    if (_customBaseUrl != null && _customBaseUrl!.trim().isNotEmpty) {
      return _customBaseUrl!.trim().replaceAll(RegExp(r'/+$'), '');
    }
    return defaultBaseUrl;
  }

  /// App initialization routine
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

      if (_envBaseUrl.isNotEmpty && _envBaseUrl != 'https://boi-hat-api.onrender.com' && cleanSaved != _envBaseUrl) {
        debugPrint('[ApiClient] --dart-define=API_BASE_URL ($_envBaseUrl) overrides saved URL ($cleanSaved).');
        _hasExplicitDebugOverride = false;
        return;
      }

      try {
        final savedHealth = await checkHealth(cleanSaved);
        if (savedHealth['status'] != 'ok') {
          final defaultHealth = await checkHealth(defaultBaseUrl);
          if (defaultHealth['status'] == 'ok') {
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

  /// Background non-blocking health ping on startup to wake up asleep Render instances
  static void pingHealthInBackground() {
    unawaited(
      checkHealth().then((res) {
        debugPrint('[ApiClient] Background wake ping finished: ${res['status']} (${res['latencyMs']}ms)');
      }).catchError((err) {
        debugPrint('[ApiClient] Background wake ping non-fatal error: $err');
      }),
    );
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

  /// Cold-start resilient timeouts (60s connect & receive)
  static const Duration _connectTimeout = Duration(seconds: 60);
  static const Duration _receiveTimeout = Duration(seconds: 60);

  static bool get _isInTest => Platform.environment.containsKey('FLUTTER_TEST');

  /// Executes an operation while monitoring latency for server cold-start notification (> 5s)
  static Future<T> _withColdStartIndicator<T>(Future<T> Function() call) async {
    if (_isInTest) {
      return await call();
    }
    Timer? timer;
    try {
      timer = Timer(const Duration(seconds: 5), () {
        isServerWaking.value = true;
        serverWakingMessage.value = 'সার্ভার চালু হচ্ছে, একটু অপেক্ষা করুন...';
      });
      return await call();
    } finally {
      timer?.cancel();
      isServerWaking.value = false;
      serverWakingMessage.value = null;
    }
  }

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
      return {
        'status': 'error',
        'latencyMs': stopwatch.elapsedMilliseconds,
        'targetUrl': target,
        'error': 'SocketException: ${e.message} ${e.osError != null ? "(${e.osError})" : ""}',
      };
    } on TimeoutException {
      stopwatch.stop();
      return {
        'status': 'error',
        'latencyMs': stopwatch.elapsedMilliseconds,
        'targetUrl': target,
        'error': 'TimeoutException (60s exceeded)',
      };
    } catch (e) {
      stopwatch.stop();
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

  /// Synchronized refresh-token procedure with mutex locking to handle concurrent 401s
  static Future<bool> _refreshTokenSynchronized() async {
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }

    final completer = Completer<bool>();
    _refreshCompleter = completer;

    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        await removeTokens();
        completer.complete(false);
        return false;
      }

      final refreshUri = Uri.parse('$baseUrl/auth/refresh');
      final response = await http.post(
        refreshUri,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({'refreshToken': refreshToken}),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final json = jsonDecode(utf8.decode(response.bodyBytes));
        final data = (json is Map && json.containsKey('data')) ? json['data'] : json;
        if (data is Map && data['accessToken'] != null) {
          await setToken(data['accessToken'].toString());
          if (data['refreshToken'] != null) {
            await setRefreshToken(data['refreshToken'].toString());
          }
          completer.complete(true);
          return true;
        }
      }

      await removeTokens();
      completer.complete(false);
      return false;
    } catch (e) {
      debugPrint('[ApiClient] Token refresh exception: $e');
      completer.complete(false);
      return false;
    } finally {
      _refreshCompleter = null;
    }
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Standard GET with up to 2 automatic retries on cold-start errors (502, 503, 504)
  static Future<dynamic> get(String endpoint) async {
    return _withColdStartIndicator(() async {
      final uri = Uri.parse('$baseUrl$endpoint');
      int attempts = 0;
      const maxRetries = 2;

      while (true) {
        try {
          final response = await http
              .get(uri, headers: await _headers())
              .timeout(_receiveTimeout);

          // Handle 401 Unauthorized with single token refresh
          if (response.statusCode == 401 && !endpoint.contains('/auth/')) {
            final refreshed = await _refreshTokenSynchronized();
            if (refreshed) {
              final retryRes = await http
                  .get(uri, headers: await _headers())
                  .timeout(_receiveTimeout);
              return _handleResponse(retryRes);
            }
          }

          // Cold start 5xx retry
          if ((response.statusCode == 502 || response.statusCode == 503 || response.statusCode == 504) &&
              attempts < maxRetries) {
            attempts++;
            await Future.delayed(const Duration(seconds: 2));
            continue;
          }

          return _handleResponse(response);
        } on SocketException catch (e) {
          if (attempts < maxRetries) {
            attempts++;
            await Future.delayed(const Duration(seconds: 2));
            continue;
          }
          debugPrint('[ApiClient] GET $uri SocketException: ${e.message}');
          throw Exception('সার্ভারে সংযোগ করা সম্ভব হয়নি ($baseUrl)। ইন্টারনেট কানেকশন চেক করুন। (${e.message})');
        } on TimeoutException {
          if (attempts < maxRetries) {
            attempts++;
            await Future.delayed(const Duration(seconds: 2));
            continue;
          }
          debugPrint('[ApiClient] GET $uri TimeoutException (exceeded 60s)');
          throw Exception('সার্ভার থেকে উত্তর আসতে বিলম্ব হচ্ছে। ইন্টারনেট কানেকশন চেক করুন।');
        } on http.ClientException catch (e) {
          if (attempts < maxRetries) {
            attempts++;
            await Future.delayed(const Duration(seconds: 2));
            continue;
          }
          debugPrint('[ApiClient] GET $uri ClientException: ${e.message}');
          throw Exception('কানেকশন ত্রুটি: $baseUrl এ সংযোগ পাওয়া যায়নি। (${e.message})');
        }
      }
    });
  }

  /// Cancelable GET for live username availability check with single retry on timeout
  static Future<dynamic> getUsernameAvailable(String username) async {
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
      debugPrint('[ApiClient] Username check SocketException: ${e.message}');
      rethrow;
    } on http.ClientException catch (e) {
      if (e.message.contains('Connection closed before full header was received') ||
          e.message.contains('Client has been closed')) {
        debugPrint('[ApiClient] In-flight username request superseded and cancelled.');
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
    return _withColdStartIndicator(() async {
      final uri = Uri.parse('$baseUrl$endpoint');
      try {
        final response = await http
            .post(
              uri,
              headers: await _headers(),
              body: jsonEncode(body),
            )
            .timeout(_receiveTimeout);

        if (response.statusCode == 401 && !endpoint.contains('/auth/')) {
          final refreshed = await _refreshTokenSynchronized();
          if (refreshed) {
            final retryRes = await http
                .post(
                  uri,
                  headers: await _headers(),
                  body: jsonEncode(body),
                )
                .timeout(_receiveTimeout);
            return _handleResponse(retryRes);
          }
        }

        return _handleResponse(response);
      } on SocketException catch (e) {
        debugPrint('[ApiClient] POST $uri SocketException: ${e.message}');
        throw Exception('সার্ভারে সংযোগ করা সম্ভব হয়নি ($baseUrl)। ইন্টারনেট কানেকশন চেক করুন। (${e.message})');
      } on TimeoutException {
        debugPrint('[ApiClient] POST $uri TimeoutException (exceeded 60s)');
        throw Exception('সার্ভার থেকে উত্তর আসতে বিলম্ব হচ্ছে। ইন্টারনেট কানেকশন চেক করুন।');
      } on http.ClientException catch (e) {
        debugPrint('[ApiClient] POST $uri ClientException: ${e.message}');
        throw Exception('কানেকশন ত্রুটি: $baseUrl এ সংযোগ পাওয়া যায়নি। (${e.message})');
      }
    });
  }

  /// Standard PATCH
  static Future<dynamic> patch(String endpoint, Map<String, dynamic> body) async {
    return _withColdStartIndicator(() async {
      final uri = Uri.parse('$baseUrl$endpoint');
      try {
        final response = await http
            .patch(
              uri,
              headers: await _headers(),
              body: jsonEncode(body),
            )
            .timeout(_receiveTimeout);

        if (response.statusCode == 401 && !endpoint.contains('/auth/')) {
          final refreshed = await _refreshTokenSynchronized();
          if (refreshed) {
            final retryRes = await http
                .patch(
                  uri,
                  headers: await _headers(),
                  body: jsonEncode(body),
                )
                .timeout(_receiveTimeout);
            return _handleResponse(retryRes);
          }
        }

        return _handleResponse(response);
      } on SocketException catch (e) {
        debugPrint('[ApiClient] PATCH $uri SocketException: ${e.message}');
        throw Exception('সার্ভারে সংযোগ করা সম্ভব হয়নি ($baseUrl)। ইন্টারনেট কানেকশন চেক করুন। (${e.message})');
      } on TimeoutException {
        debugPrint('[ApiClient] PATCH $uri TimeoutException');
        throw Exception('সার্ভার থেকে উত্তর আসতে বিলম্ব হচ্ছে। ইন্টারনেট কানেকশন চেক করুন।');
      } on http.ClientException catch (e) {
        debugPrint('[ApiClient] PATCH $uri ClientException: ${e.message}');
        throw Exception('কানেকশন ত্রুটি: $baseUrl এ সংযোগ পাওয়া যায়নি। (${e.message})');
      }
    });
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
