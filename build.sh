deno compile --allow-net --allow-write --allow-read --output executable/eden.exe --target x86_64-pc-windows-msvc src/index.ts
deno compile --allow-net --allow-write --allow-read --output executable/eden-mac-x86-64 --target x86_64-apple-darwin src/index.ts
deno compile --allow-net --allow-write --allow-read --output executable/eden-mac-aarch --target aarch64-apple-darwin src/index.ts