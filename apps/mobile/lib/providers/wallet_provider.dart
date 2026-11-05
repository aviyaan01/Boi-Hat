import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../data/models/wallet_model.dart';

class WalletProvider extends ChangeNotifier {
  WalletModel _wallet = WalletModel();
  bool _isLoading = false;
  String? _errorMessage;

  WalletModel get wallet => _wallet;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchWallet() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.get('/wallet');
      if (res is Map<String, dynamic>) {
        _wallet = WalletModel.fromJson(res);
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  Future<void> requestPayout({
    required double amount,
    required String method,
    required String accountNumber,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      await ApiClient.post('/wallet/payout-request', {
        'amount': amount,
        'method': method,
        'account_number': accountNumber,
      });
      await fetchWallet();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      rethrow;
    }
  }
}
