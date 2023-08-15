import { extname, join } from "https://deno.land/std/path/mod.ts";
import { readAll } from "https://deno.land/std/streams/read_all.ts"; // Import readAll from here


export async function host(publicDir: string) {
    const port = 8000;
    console.log(`\nFlag --preview: http server running at http://localhost:${port}/ for directory "${publicDir}"...`);

    Deno.serve(async (req) => {

        const url = new URL(req.url);
        console.log("Path:", url.pathname);
        const filePath = join(publicDir, url.pathname);
        try {
            const file = await Deno.open(filePath);
            const fileInfo = await Deno.stat(filePath);

            if (fileInfo.isDirectory) {
                file.close();
                return new Response("Forbidden", { status: 403 });
            } else {
                const contentType = getContentType(filePath);
                const headers = new Headers();
                headers.set("Content-Type", contentType);
                const fileContent = await readAll(file);
                file.close();
                return new Response(fileContent, { status: 200, headers });
            }

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