import { logVerbose } from "./console.ts";
import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import * as base64 from "https://deno.land/std@0.198.0/encoding/base64.ts";

const apiUrl = "https://api.vercel.com/v13/deployments";
export interface DeployableFile {
    filePath: string;
    fileContent: string | ArrayBuffer;
}

export async function deploy(projectId: string, files: DeployableFile[], vercelToken: string) {
    const perfStart = performance.now();

    logVerbose(`Publishing to project ${projectId} with token.`);

    const headers = new Headers({
        "Authorization": `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
    });
    const data = {
        name: projectId,
        // .replaceAll is necessary for the filePath due to Vercel's API requiring forward slashes in the filepath
        files: files.map(f => ({ file: f.filePath.replaceAll(path.sep, '/'), encoding: 'base64', data: base64.encode(f.fileContent) })),
        // files: [
        //     {
        //         "data": base64.encode("<!DOCTYPE html><html><head><title>My Static HTML Site</title></head><body><h1>4Welcome to My Site</h1></body></html>"),
        //         "encoding": "base64",
        //         "file": "index.html"
        //     },
        //     {
        //         "data": base64.encode(await Deno.readFile('C:\\ObsidianJordanJiuJitsu\\JordanJiuJitsu\\TestAssets\\test-image.png')),
        //         "encoding": "base64",
        //         "file": "test/image.png"
        //     }
        // ],
        projectSettings: {
            framework: null
        }
    };

    const options = {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    };
    console.log(`Publishing site with ${data.files.length} files`);
    logVerbose('Files', data.files.map(f => f.file));

    const response = await fetch(apiUrl, options);

    if (response.status === 200) {
        const responseBody = await response.json();
        logVerbose("Publish successful:", responseBody);
        console.log("✅ Publish request succeeded.  It may take a couple minutes for the website to update.  See your site at", responseBody.alias.map(url => `https://${url}`));
    } else {
        const responseBody = await response.json();
        console.error("❌ Publish failed. Status:", response.status, responseBody);
    }
    console.log('\nFinished publishing to Vercel in', performance.now() - perfStart, 'milliseconds.');
}