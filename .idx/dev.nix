{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "guardian-child360-env";

  buildInputs = with pkgs; [
    nodejs_20
    yarn
    watchman

    # Android build system
    (jdk17_headless.override { isBare = false; })

    gradle_8

    # Android SDK
    (android-sdk.override {
      android-sdk-components = with pkgs.android-sdk-components; [
        build-tools-34-0-0
        platform-tools
        cmdline-tools-latest
        platforms-android-34
      ];
    })
  ];

  shellHook = ''
    echo "--------------------------------------------"
    echo " GuardianChild360 Android Build Environment "
    echo "--------------------------------------------"

    export JAVA_HOME="${pkgs.jdk17_headless}"
    export ANDROID_HOME="${pkgs.android-sdk}/libexec/android-sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"

    export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

    echo "JAVA:  $(java -version 2>&1 | head -n 1)"
    echo "NODE:  $(node -v)"
    echo "GRADLE: $(gradle -v | grep 'Gradle ')"
    echo "SDK:   $ANDROID_HOME"
    echo "--------------------------------------------"
    echo " Android Environment Ready!"
  '';
}