# Jiu Jitsu Notes
# deno run --allow-net --allow-write --allow-read src/index.ts --overwrite-template --parseDir C:/ObsidianJordanJiuJitsu/JordanJiuJitsu --preview && start http://localhost:8000/Table_of_Contents.html
# Sample
# deno run --allow-net --allow-write --allow-read src/index.ts --overwrite-template --parseDir C:/git/eden-markdown/sample/ --preview && start http://localhost:8000/Table_of_Contents.html
# Test 
deno run --allow-net --allow-write --allow-read src/index.ts --overwrite-template --parseDir C:/git/eden-markdown/tests/ --preview && start http://localhost:8000/Table_of_Contents.html

# Benchmark: use `time ./run.sh` to measure perf.  Measured against https://www.zachleat.com/web/build-benchmark/#benchmark-results
# deno run --allow-net --allow-write --allow-read src/index.ts --parseDir C:\\markdown-benchmark\\_markdown-samples\\4000