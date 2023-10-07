import main from "./src/main.ts";

main().catch(e => {
    console.error(e);
}).then(() => {
    // If there are no args, this exe was probably executed via a double-click,
    // so we must prompt to leave the log open.  However, we must NOT prompt
    // if there are args (such as --preview) because that will prevent
    // the http server from serving content
    // and there's also no reason to prompt if it was triggered via the command line
    if (Deno.build.os === "windows" && Deno.args.length === 0) {

        prompt("Finished... Enter any key to exit.");
    }
});
