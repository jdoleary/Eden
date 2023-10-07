# Sample
deno run --allow-net --allow-write --allow-read --allow-env src/mod.ts --overwrite-template --preview --parseDir sample/ && start http://localhost:8000/
# deno.land/x/eden isn't working right now https://github.com/denoland/wanted_modules/issues/87 so I'm selfhosting for now
# deno run --allow-net --allow-write --allow-read --allow-env https://www.edenmarkdown.com/code/mod.ts --overwrite-template --preview --parseDir sample/ && start http://localhost:8000/

# Benchmark: use `time ./run.sh` to measure perf.  Measured against https://www.zachleat.com/web/build-benchmark/#benchmark-results
# deno run --allow-net --allow-write --allow-read --allow-env mod.ts --parseDir C:\\markdown-benchmark\\_markdown-samples\\4000