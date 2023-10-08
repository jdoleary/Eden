# Test without updating snapshots
MODE=test deno test --allow-env src/main.ts -- --parseDir test/

# Update snapshots
# MODE=test deno test --allow-env src/main.ts --parseDir test/ -- --update

# Preview test dir
# deno run --allow-env src/main.ts --parseDir test/ --preview && start http://localhost:8000/Table_of_Contents.html