
export interface Config {
    parseDir: string;
    outDir: string;
    ignoreDirs: string[];
    // Where assets such as images are stored.
    assetDir?: string;
    logVerbose?: boolean;
}