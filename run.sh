# Sample
deno run --allow-net --allow-write --allow-read --allow-env src/main.ts --overwrite-template --parseDir sample/ --preview && start http://localhost:8000/Table_of_Contents.html

# Benchmark: use `time ./run.sh` to measure perf.  Measured against https://www.zachleat.com/web/build-benchmark/#benchmark-results
# deno run --allow-net --allow-write --allow-read --allow-env src/main.ts --parseDir C:\\markdown-benchmark\\_markdown-samples\\4000