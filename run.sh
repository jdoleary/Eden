# Sample
deno run --allow-net --allow-write --allow-read --allow-env src/mod.ts --overwrite-template --preview --parseDir sample/ && start http://localhost:8000/

# Benchmark: use `time ./run.sh` to measure perf.  Measured against https://www.zachleat.com/web/build-benchmark/#benchmark-results
# deno run --allow-net --allow-write --allow-read --allow-env mod.ts --parseDir C:\\markdown-benchmark\\_markdown-samples\\4000