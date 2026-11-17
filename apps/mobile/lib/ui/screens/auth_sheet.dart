import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../core/app_theme.dart';
import '../../core/auth_localizations.dart';
import '../../core/auth_validators.dart';
import '../../providers/auth_provider.dart';
import '../widgets/server_config_dialog.dart';

class AuthSheet extends StatefulWidget {
  final bool initialIsSignup;
  const AuthSheet({super.key, this.initialIsSignup = true});

  static Future<void> show(BuildContext context, {bool isSignup = true}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AuthSheet(initialIsSignup: isSignup),
    );
  }

  @override
  State<AuthSheet> createState() => _AuthSheetState();
}

class _AuthSheetState extends State<AuthSheet> {
  late bool _isSignup;
  int _step = 1; // 1: Input details, 2: 6-box OTP verification

  // Signup Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();

  // Login Controller
  final TextEditingController _identifierController = TextEditingController();

  // 6-box OTP Controllers & FocusNodes
  final List<TextEditingController> _otpControllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  // Username availability state
  Timer? _debounceTimer;
  bool _isCheckingUsername = false;
  bool? _usernameAvailable;
  String? _usernameMessage;
  List<String> _usernameSuggestions = [];

  // Countdown & Resend timers
  Timer? _countdownTimer;
  int _expirySeconds = 300; // 5:00 minutes
  int _resendCooldownSeconds = 60; // 60s cooldown

  String _targetEmail = '';
  String? _devCode;
  String? _localError;
  bool _showLoginShortcut = false;

  @override
  void initState() {
    super.initState();
    _isSignup = widget.initialIsSignup;
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _countdownTimer?.cancel();
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _identifierController.dispose();
    for (final c in _otpControllers) {
      c.dispose();
    }
    for (final f in _otpFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  // ==========================================================================
  // Timer Management
  // ==========================================================================
  void _startTimers() {
    _countdownTimer?.cancel();
    setState(() {
      _expirySeconds = 300;
      _resendCooldownSeconds = 60;
    });

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        if (_expirySeconds > 0) _expirySeconds--;
        if (_resendCooldownSeconds > 0) _resendCooldownSeconds--;
      });
      if (_expirySeconds <= 0 && _resendCooldownSeconds <= 0) {
        timer.cancel();
      }
    });
  }

  // ==========================================================================
  // Username Live Availability Check (500ms Debounce)
  // ==========================================================================
  void _onUsernameChanged(String value) {
    _debounceTimer?.cancel();
    final lower = value.trim().toLowerCase();

    // Reset availability state
    setState(() {
      _usernameAvailable = null;
      _usernameMessage = null;
      _usernameSuggestions = [];
    });

    final validationErr = AuthValidators.validateUsername(lower);
    if (validationErr != null) {
      setState(() {
        _usernameAvailable = false;
        _usernameMessage = validationErr;
      });
      return;
    }

    setState(() => _isCheckingUsername = true);

    _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
      if (!mounted) return;
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final res = await auth.checkUsernameAvailable(lower);
      if (!mounted) return;

      setState(() {
        _isCheckingUsername = false;
        _usernameAvailable = res['available'] == true;
        _usernameMessage = res['message']?.toString();
        if (res['suggestions'] != null && res['suggestions'] is List) {
          _usernameSuggestions = List<String>.from(res['suggestions']);
        }
      });
    });
  }

  // ==========================================================================
  // Request Code (Signup or Login)
  // ==========================================================================
  Future<void> _handleSendCode() async {
    setState(() {
      _localError = null;
      _showLoginShortcut = false;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);

    if (_isSignup) {
      final nameErr = AuthValidators.validateName(_nameController.text);
      final usernameErr = AuthValidators.validateUsername(_usernameController.text);
      final emailErr = AuthValidators.validateEmail(_emailController.text);

      if (nameErr != null || usernameErr != null || emailErr != null || _usernameAvailable != true) {
        setState(() => _localError = nameErr ?? usernameErr ?? emailErr ?? _usernameMessage);
        return;
      }

      try {
        final email = _emailController.text.trim().toLowerCase();
        final res = await auth.requestSignupCode(
          name: _nameController.text.trim(),
          username: _usernameController.text.trim().toLowerCase(),
          email: email,
        );

        setState(() {
          _targetEmail = email;
          _step = 2;
          _devCode = res['dev_code']?.toString();
          _clearOtpInputs();
        });
        _startTimers();

        if (_devCode != null && mounted) {
          _populateDevCode(_devCode!);
        }
      } catch (e) {
        final errText = AuthLocalizations.mapError(e);
        setState(() {
          _localError = errText;
          if (errText.contains('ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে') || errText.contains('already registered')) {
            _showLoginShortcut = true;
          }
        });
      }
    } else {
      // Login
      final idErr = AuthValidators.validateIdentifier(_identifierController.text);
      if (idErr != null) {
        setState(() => _localError = idErr);
        return;
      }

      try {
        final identifier = _identifierController.text.trim().toLowerCase();
        final res = await auth.requestLoginCode(identifier: identifier);

        setState(() {
          _targetEmail = identifier;
          _step = 2;
          _devCode = res['dev_code']?.toString();
          _clearOtpInputs();
        });
        _startTimers();

        if (_devCode != null && mounted) {
          _populateDevCode(_devCode!);
        }
      } catch (e) {
        setState(() => _localError = AuthLocalizations.mapError(e));
      }
    }
  }

  // ==========================================================================
  // 6-box OTP Handlers (Paste, Auto-advance, Auto-submit)
  // ==========================================================================
  void _clearOtpInputs() {
    for (final c in _otpControllers) {
      c.clear();
    }
  }

  void _populateDevCode(String code) {
    final clean = AuthLocalizations.toAsciiDigits(code);
    for (int i = 0; i < 6 && i < clean.length; i++) {
      _otpControllers[i].text = AuthLocalizations.formatDigitForDisplay(clean[i]);
    }
  }

  void _onOtpDigitChanged(int index, String value) {
    if (value.length > 1) {
      // Paste detected: distributes multiple characters across boxes
      final clean = AuthLocalizations.toAsciiDigits(value);
      for (int i = 0; i < 6 && i < clean.length; i++) {
        _otpControllers[i].text = AuthLocalizations.formatDigitForDisplay(clean[i]);
      }
      if (clean.length >= 6) {
        _otpFocusNodes[5].unfocus();
        _handleVerifyCode();
      } else {
        _otpFocusNodes[clean.length].requestFocus();
      }
      return;
    }

    if (value.isNotEmpty) {
      // Single character entered: format display and advance
      final ascii = AuthLocalizations.toAsciiDigits(value);
      if (ascii.isNotEmpty) {
        _otpControllers[index].text = AuthLocalizations.formatDigitForDisplay(ascii);
      }
      if (index < 5) {
        _otpFocusNodes[index + 1].requestFocus();
      } else {
        // 6th digit entered: auto submit
        _otpFocusNodes[index].unfocus();
        _handleVerifyCode();
      }
    }
  }

  String _getEnteredOtp() {
    return _otpControllers.map((c) => AuthLocalizations.toAsciiDigits(c.text)).join();
  }

  Future<void> _handleVerifyCode() async {
    setState(() => _localError = null);
    final code = _getEnteredOtp();

    if (code.length < 6) {
      setState(() => _localError = AuthLocalizations.enterCodeHint);
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    bool success = false;

    if (_isSignup) {
      success = await auth.verifySignupCode(
        email: _targetEmail,
        code: code,
      );
    } else {
      success = await auth.verifyLoginCode(
        identifier: _targetEmail,
        code: code,
      );
    }

    if (success && mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isSignup ? 'অভিনন্দন! রেজিস্ট্রেশন সফল হয়েছে।' : 'সফলভাবে লগইন হয়েছে!'),
          backgroundColor: AppTheme.primary,
        ),
      );
    } else if (mounted) {
      setState(() => _localError = auth.errorMessage);
    }
  }

  // ==========================================================================
  // Dev Mode 1-Click Quick Login
  // ==========================================================================
  Future<void> _handleQuickDevLogin() async {
    if (!kDebugMode) return;
    setState(() => _localError = null);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.quickDevLogin(identifier: 'tanvir@example.com');
    if (success && mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('টেস্ট অ্যাকাউন্টে লগইন সফল! (Dev Mode)'),
          backgroundColor: AppTheme.primary,
        ),
      );
    } else if (mounted) {
      setState(() => _localError = auth.errorMessage);
    }
  }

  // ==========================================================================
  // Build Methods
  // ==========================================================================
  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    final isSignupButtonEnabled = !_isSignup
        ? _identifierController.text.trim().isNotEmpty
        : (AuthValidators.validateName(_nameController.text) == null &&
            AuthValidators.validateUsername(_usernameController.text) == null &&
            _usernameAvailable == true &&
            AuthValidators.validateEmail(_emailController.text) == null);

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 20,
        bottom: bottomInset + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Sheet Handle
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header Row
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.menu_book_rounded, color: AppTheme.primary, size: 28),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _step == 1 ? AuthLocalizations.welcomeTitle : AuthLocalizations.verifyTitle,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                      Text(
                        _step == 1
                            ? AuthLocalizations.welcomeSubtitle
                            : AuthLocalizations.codeSentTo(AuthValidators.maskEmail(_targetEmail)),
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close, color: AppTheme.textSecondary, size: 20),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Tab Switcher (Step 1 only)
            if (_step == 1) ...[
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() {
                          _isSignup = true;
                          _localError = null;
                        }),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _isSignup ? AppTheme.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            AuthLocalizations.tabSignUp,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: _isSignup ? Colors.white : AppTheme.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() {
                          _isSignup = false;
                          _localError = null;
                        }),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: !_isSignup ? AppTheme.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            AuthLocalizations.tabLogin,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: !_isSignup ? Colors.white : AppTheme.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Error Display
            if (_localError != null || auth.errorMessage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.error_outline, color: Color(0xFFB91C1C), size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _localError ?? auth.errorMessage ?? '',
                            style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 12, height: 1.4),
                          ),
                        ),
                      ],
                    ),
                    if (_showLoginShortcut) ...[
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: () {
                            setState(() {
                              _isSignup = false;
                              _identifierController.text = _emailController.text;
                              _localError = null;
                              _showLoginShortcut = false;
                            });
                          },
                          icon: const Icon(Icons.login, size: 16, color: AppTheme.primary),
                          label: Text(
                            AuthLocalizations.tabLogin,
                            style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

            // ================================================================
            // SCREEN 1: Input Fields
            // ================================================================
            if (_step == 1) ...[
              if (_isSignup) ...[
                // 1. Full Name
                TextField(
                  controller: _nameController,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.name],
                  decoration: InputDecoration(
                    labelText: AuthLocalizations.fullNameLabel,
                    hintText: AuthLocalizations.fullNameHint,
                    prefixIcon: const Icon(Icons.badge_outlined, color: AppTheme.primary),
                  ),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 14),

                // 2. Username with live 500ms check
                TextField(
                  controller: _usernameController,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.username],
                  decoration: InputDecoration(
                    labelText: AuthLocalizations.usernameLabel,
                    hintText: AuthLocalizations.usernameHint,
                    prefixIcon: const Icon(Icons.alternate_email, color: AppTheme.primary),
                    suffixIcon: _isCheckingUsername
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
                            ),
                          )
                        : _usernameAvailable == true
                            ? const Icon(Icons.check_circle_rounded, color: Colors.green)
                            : _usernameAvailable == false
                                ? const Icon(Icons.cancel_rounded, color: Colors.red)
                                : null,
                  ),
                  onChanged: _onUsernameChanged,
                ),

                // Username status / suggestion pills
                if (_usernameMessage != null && !_isCheckingUsername) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 4, left: 12, right: 12),
                    child: Text(
                      _usernameMessage!,
                      style: TextStyle(
                        fontSize: 11,
                        color: _usernameAvailable == true ? Colors.green.shade700 : Colors.red.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
                if (_usernameSuggestions.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          AuthLocalizations.suggestionsLabel,
                          style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                        ),
                        ..._usernameSuggestions.map(
                          (suggestion) => ActionChip(
                            label: Text(suggestion, style: const TextStyle(fontSize: 11, color: AppTheme.primary)),
                            backgroundColor: AppTheme.primaryContainer.withValues(alpha: 0.5),
                            padding: EdgeInsets.zero,
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            onPressed: () {
                              _usernameController.text = suggestion;
                              _onUsernameChanged(suggestion);
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 14),

                // 3. Email Address
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.email],
                  decoration: InputDecoration(
                    labelText: AuthLocalizations.emailLabel,
                    hintText: AuthLocalizations.emailHint,
                    prefixIcon: const Icon(Icons.email_outlined, color: AppTheme.primary),
                  ),
                  onChanged: (_) => setState(() {}),
                  onSubmitted: (_) {
                    if (isSignupButtonEnabled && !auth.isLoading) {
                      _handleSendCode();
                    }
                  },
                ),
              ] else ...[
                // Login Identifier (Email or Username)
                TextField(
                  controller: _identifierController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.username, AutofillHints.email],
                  decoration: InputDecoration(
                    labelText: AuthLocalizations.loginIdentifierLabel,
                    hintText: AuthLocalizations.loginIdentifierHint,
                    prefixIcon: const Icon(Icons.person_outline, color: AppTheme.primary),
                  ),
                  onChanged: (_) => setState(() {}),
                  onSubmitted: (_) {
                    if (isSignupButtonEnabled && !auth.isLoading) {
                      _handleSendCode();
                    }
                  },
                ),
              ],
              const SizedBox(height: 18),

              // "কোড পাঠান" Action Button
              ElevatedButton(
                onPressed: (isSignupButtonEnabled && !auth.isLoading) ? _handleSendCode : null,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: auth.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(
                        AuthLocalizations.sendCodeBtn,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
              ),
            ]
            // ================================================================
            // SCREEN 2: 6-Box OTP Verification Screen
            // ================================================================
            else ...[
              // Masked email notice & change link
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryContainer.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.mark_email_read_outlined, color: AppTheme.primary, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AuthValidators.maskEmail(_targetEmail),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary),
                          ),
                          Text(
                            !_isSignup ? AuthLocalizations.genericLoginNotice : 'ইমেইল ইনবক্স চেক করুন',
                            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        _countdownTimer?.cancel();
                        setState(() => _step = 1);
                      },
                      child: Text(
                        AuthLocalizations.changeEmail,
                        style: const TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 6 Individual OTP Digit Input Boxes
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return SizedBox(
                    width: 46,
                    height: 54,
                    child: KeyboardListener(
                      focusNode: FocusNode(),
                      onKeyEvent: (event) {
                        if (event is KeyDownEvent &&
                            event.logicalKey == LogicalKeyboardKey.backspace &&
                            _otpControllers[index].text.isEmpty &&
                            index > 0) {
                          _otpFocusNodes[index - 1].requestFocus();
                        }
                      },
                      child: TextField(
                        controller: _otpControllers[index],
                        focusNode: _otpFocusNodes[index],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                        maxLength: 6, // Allows paste of up to 6 digits in single field
                        decoration: InputDecoration(
                          counterText: '',
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFCBD5E1), width: 1.5),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: AppTheme.primary, width: 2),
                          ),
                        ),
                        onChanged: (val) => _onOtpDigitChanged(index, val),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 16),

              // Countdown Timer & Resend Button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.timer_outlined, size: 16, color: AppTheme.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        AuthLocalizations.timerDisplay(_expirySeconds ~/ 60, _expirySeconds % 60),
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: _expirySeconds < 60 ? Colors.red : AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: (_resendCooldownSeconds == 0 && !auth.isLoading) ? _handleSendCode : null,
                    child: Text(
                      _resendCooldownSeconds > 0
                          ? AuthLocalizations.resendInSeconds(_resendCooldownSeconds)
                          : AuthLocalizations.resendCodeBtn,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: _resendCooldownSeconds == 0 ? AppTheme.primary : AppTheme.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // "যাচাই ও প্রবেশ করুন" Button
              ElevatedButton(
                onPressed: auth.isLoading ? null : _handleVerifyCode,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: auth.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(
                        AuthLocalizations.verifyAndEnterBtn,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
              ),

              // Dev Mode Code Helper (Only shown when server returns dev_code in development mode)
              if (_devCode != null && kDebugMode) ...[
                const SizedBox(height: 10),
                Center(
                  child: Text(
                    '⚡ স্যান্ডবক্স কোড: $_devCode (Dev Mode)',
                    style: const TextStyle(fontSize: 11, color: Colors.deepPurple, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ],

            // ================================================================
            // DEV MODE & DEBUG OPTIONS (Strictly hidden in release builds)
            // ================================================================
            if (kDebugMode) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 6),
              OutlinedButton.icon(
                onPressed: auth.isLoading ? null : _handleQuickDevLogin,
                icon: const Icon(Icons.flash_on, color: AppTheme.accent),
                label: Text(
                  AuthLocalizations.quickDevLogin,
                  style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 12),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 4),
              TextButton.icon(
                onPressed: () => ServerConfigDialog.show(context),
                icon: const Icon(Icons.settings_ethernet, size: 14, color: AppTheme.textSecondary),
                label: Text(
                  '${AuthLocalizations.serverConfig} (${ApiClient.baseUrl})',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
