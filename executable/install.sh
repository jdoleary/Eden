#!/bin/sh
# Modified installer based off of https://deno.land/x/install@v0.1.8/install.sh
# Copyright 2019 the Deno authors. All rights reserved. MIT license.

set -e

if ! command -v unzip >/dev/null; then
	echo "Error: unzip is required to install Eden (see: https://github.com/denoland/deno_install#unzip-is-required )." 1>&2
	exit 1
fi

if [ "$OS" = "Windows_NT" ]; then
	target="x86_64-pc-windows-msvc"
else
	case $(uname -sm) in
	"Darwin x86_64") target="x86_64-apple-darwin" ;;
	"Darwin arm64") target="aarch64-apple-darwin" ;;
	"Linux aarch64")
		echo "Error: Official Eden builds for Linux aarch64 are not available." 1>&2
		exit 1
		;;
	*) target="x86_64-unknown-linux-gnu" ;;
	esac
fi

file_name="test-${target}"
eden_uri="https://jordanoleary.me/assets/executables/${file_name}"

eden_install="${EDEN_INSTALL:-$HOME/.eden}"
bin_dir="$eden_install/bin"
exe="$bin_dir/eden"

if [ ! -d "$bin_dir" ]; then
	mkdir -p "$bin_dir"
fi

curl --fail --location --progress-bar --output "$exe" "$eden_uri"
# unzip -d "$bin_dir" -o "$exe.zip"
chmod +x "$exe"
# rm "$exe.zip"

echo "Eden was installed successfully to $exe"
if command -v eden >/dev/null; then
	echo "Run 'eden --help' to get started"
else
	case $SHELL in
	/bin/zsh) shell_profile=".zshrc" ;;
	*) shell_profile=".bashrc" ;;
	esac
	echo "Manually add the directory to your \$HOME/$shell_profile (or similar)"
	echo "  export EDEN_INSTALL=\"$eden_install\""
	echo "  export PATH=\"\$EDEN_INSTALL/bin:\$PATH\""
	echo "Run '$exe --help' to get started"
fi
echo
echo "Stuck? Join our Discord https://discord.gg/wrhGWCdRdT"
