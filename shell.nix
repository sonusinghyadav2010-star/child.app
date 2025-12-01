{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    jdk
    git-lfs
  ];

  shellHook = ''
    export ANDROID_HOME="$HOME/Android/sdk"
    export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
  '';
}
