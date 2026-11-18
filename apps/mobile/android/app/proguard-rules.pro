# Flutter R8 / ProGuard rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# FlutterSecureStorage
-keepattributes *Annotation*
-keepclassmembers class * {
    @org.spongycastle.** *;
}
-dontwarn javax.crypto.**
-dontwarn java.security.**

# Keep models & JSON serialization
-keepclassmembers class * {
    void set*(***);
    *** get*();
}


# Google Play Core split install & deferred components (Flutter embedding)
-dontwarn com.google.android.play.core.**
