// Logs only if globalThis.logVerbose is true
// Matches the typing of console.log
// deno-lint-ignore no-explicit-any
export function logVerbose(...data: any[]): void {
    if (globalThis.useLogVerbose) {
        console.log(...data);
    }
}