import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'core/api_client.dart';
import 'core/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/books_provider.dart';
import 'providers/orders_provider.dart';
import 'providers/wallet_provider.dart';
import 'ui/screens/main_nav_screen.dart';

// Sentry DSN for org: anvvi, project: boi-hat
// Can be configured via --dart-define=SENTRY_DSN=... or updated directly
const String kSentryDsn = String.fromEnvironment(
  'SENTRY_DSN',
  defaultValue: '',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiClient.init();

  await SentryFlutter.init(
    (options) {
      options.dsn = kSentryDsn;
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
      options.tracesSampleRate = 1.0;
    },
    appRunner: () => runApp(
      DefaultAssetBundle(
        bundle: SentryAssetBundle(),
        child: const BoiHatApp(),
      ),
    ),
  );
}

class BoiHatApp extends StatelessWidget {
  const BoiHatApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BooksProvider()),
        ChangeNotifierProvider(create: (_) => OrdersProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
      ],
      child: MaterialApp(
        title: 'বই-হাট (Boi-Hat)',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const MainNavScreen(),
      ),
    );
  }
}
