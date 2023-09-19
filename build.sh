
# deno compile --allow-net --allow-write --allow-read --output executable/test-aarch64-apple-darwin --target aarch64-apple-darwin src/test.ts
# deno compile --allow-net --allow-write --allow-read --output executable/test-x86_64-pc-windows-msvc.exe --target x86_64-pc-windows-msvc src/test.ts
cp LICENCE.txt executable/LICENCE.md
deno compile --allow-net --allow-write --allow-read --allow-env --output executable/eden.exe --target x86_64-pc-windows-msvc src/main.ts
deno compile --allow-net --allow-write --allow-read --allow-env --output executable/eden-mac-x86-64 --target x86_64-apple-darwin src/main.ts
deno compile --allow-net --allow-write --allow-read --allow-env --output executable/eden-mac-aarch --target aarch64-apple-darwin src/main.ts
chmod +x executable/eden-mac-x86-64
chmod +x executable/eden-mac-aarch