import { extname, join } from "https://deno.land/std/path/mod.ts";
import { readAll } from "https://deno.land/std/streams/read_all.ts"; // Import readAll from here


export async function host(publicDir: string) {
    const port = 8000;
    console.log(`\nFlag --preview: http server running at http://localhost:${port}/ for directory "${publicDir}"...`);

    Deno.serve(async (req) => {

        const url = new URL(req.url);
        console.log("Path:", url.pathname);
        let filePath = join(publicDir, url.pathname);
        try {
            const fileInfo = await Deno.stat(filePath);

            // If directory, serve up directory index page
            if (fileInfo.isDirectory) {
                filePath = join(filePath, 'index.html');
            }
            const file = await Deno.open(filePath);
            const contentType = getContentType(filePath);
            const headers = new Headers();
            headers.set("Content-Type", contentType);
            const fileContent = await readAll(file);
            file.close();
            return new Response(fileContent, { status: 200, headers });

        } catch (error) {
            console.warn('⚠️ Http Server Error:', error);
            return new Response("File not found", { status: 404 });
        }
    });
}

function getContentType(filePath: string): string {
    const ext = extname(filePath);
    switch (ext) {
        case ".html":
            return "text/html";
        case ".css":
            return "text/css";
        case ".js":
            return "text/javascript";
        case ".png":
            return "image/png";
        // Add more content types as needed
        default:
            return "application/octet-stream";
    }
}