import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../data/models/order_model.dart';

class OrdersProvider extends ChangeNotifier {
  List<OrderModel> _orders = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<OrderModel> get orders => _orders;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchMyOrders() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.get('/orders/my');
      if (res is List) {
        _orders = res.map((o) => OrderModel.fromJson(o)).toList();
      } else if (res is Map && res['items'] is List) {
        _orders = (res['items'] as List).map((o) => OrderModel.fromJson(o)).toList();
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  Future<OrderModel> createOrder({
    required String bookId,
    required String deliveryAddress,
    String paymentMethod = 'COD',
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiClient.post('/orders', {
        'book_id': bookId,
        'delivery_address': deliveryAddress,
        'payment_method': paymentMethod,
      });

      final newOrder = OrderModel.fromJson(res);
      _orders.insert(0, newOrder);
      _isLoading = false;
      notifyListeners();
      return newOrder;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      rethrow;
    }
  }

  Future<void> raiseDispute(String orderId, String reason) async {
    try {
      await ApiClient.post('/orders/$orderId/dispute', {'reason': reason});
      await fetchMyOrders();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> simulateCourierStep({
    required String trackingId,
    required String status,
    String? location,
    String? notes,
  }) async {
    try {
      await ApiClient.post('/couriers/mock/simulate', {
        'tracking_id': trackingId,
        'status': status,
        'location': location ?? 'Dhaka Hub',
        'notes': notes ?? 'Automatic courier milestone update',
      });
      await fetchMyOrders();
    } catch (e) {
      rethrow;
    }
  }
}
