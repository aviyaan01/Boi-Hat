import 'package:flutter_test/flutter_test.dart';
import 'package:boi_hat_mobile/main.dart';

void main() {
  testWidgets('BoiHatApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const BoiHatApp());
    expect(find.text('বই-হাট'), findsOneWidget);
  });
}
