import 'package:flutter/material.dart';
import '../../core/app_theme.dart';
import 'home_screen.dart';
import 'search_screen.dart';
import 'post_ad_screen.dart';
import 'orders_screen.dart';
import 'wallet_screen.dart';

class MainNavScreen extends StatefulWidget {
  const MainNavScreen({super.key});

  @override
  State<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends State<MainNavScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      HomeScreen(
        onNavigateToSearch: () => setState(() => _currentIndex = 1),
      ),
      const SearchScreen(),
      PostAdScreen(
        onPostSuccess: () => setState(() => _currentIndex = 0),
      ),
      const OrdersScreen(),
      const WalletScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: AppTheme.textSecondary,
        selectedFontSize: 11,
        unselectedFontSize: 11,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'হোম',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            activeIcon: Icon(Icons.saved_search),
            label: 'অনুসন্ধান',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_circle, size: 28, color: AppTheme.primary),
            label: 'বিক্রি করুন',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_bag_outlined),
            activeIcon: Icon(Icons.shopping_bag),
            label: 'অর্ডার',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet_outlined),
            activeIcon: Icon(Icons.account_balance_wallet),
            label: 'ওয়ালেট',
          ),
        ],
      ),
    );
  }
}
