#!/bin/sh
# Modified installer based off of https://deno.land/x/install@v0.1.8/install.sh
# Copyright 2019 the Deno authors. All rights reserved. MIT license.

set -e

# if ! command -v unzip >/dev/null; then
# 	echo "Error: unzip is required to install Eden (see: https://github.com/denoland/deno_install#unzip-is-required )." 1>&2
# 	exit 1
# fi

if [ "$OS" = "Windows_NT" ]; then
	target=".exe"
else
	case $(uname -sm) in
	"Darwin x86_64") target="-mac-x86-64" ;;
	"Darwin arm64") target="-mac-aarch" ;;
	"Linux aarch64") target="-mac-aarch" ;;
	*) target="-mac-aarch" ;;
	esac
fi

file_name="eden${target}"
eden_uri="https://jordanoleary.me/assets/executables/${file_name}"

eden_install="${EDEN_INSTALL:-$HOME/.eden}"
bin_dir="$eden_install/bin"
exe="$bin_dir/eden"

if [ ! -d "$bin_dir" ]; then
	mkdir -p "$bin_dir"
fi

curl --fail --location --progress-bar --output "$exe" "$eden_uri"
chmod +x "$exe"

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
