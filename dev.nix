{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "guardian-child360-env";

  buildInputs = with pkgs; [
    # Correct Node for RN 0.81.5
    (nodejs_20.overrideAttrs (old: { version = "20.19.4"; }))
    yarn
    watchman

    # Java 17 (full JDK)
    (jdk17_headless.override { isBare = false; })

    # Gradle stable
    gradle_8

    # Android SDK components
    (android-sdk.override {
      android-sdk-components = with pkgs.android-sdk-components; [
        build-tools-34.0.0
        platform-tools
        platforms-android-34
        cmdline-tools-latest
      ];
    })
  ];

  shellHook = ''
    echo "➡ Setting environment variables..."

    export JAVA_HOME="${pkgs.jdk17_headless}"
    export ANDROID_HOME="${pkgs.android-sdk}/libexec/android-sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"

    export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

    echo ""
    echo "------------------------------------------------------"
    echo "  GuardianChild360 Build Environment Loaded Successfully"
    echo "------------------------------------------------------"
    echo " Java:     $(java -version 2>&1 | head -n 1)"
    echo " Node:     $(node -v)"
    echo " NPM:      $(npm -v)"
    echo " Gradle:   $(gradle -v | grep 'Gradle ')"
    echo " SDK:      $ANDROID_HOME"
    echo ""
    echo "💡 You may now run './gradlew' inside the android folder."
    echo ""
  '';
}