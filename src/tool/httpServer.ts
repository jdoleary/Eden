import { extname, join } from "https://deno.land/std/path/mod.ts";
import { readAll } from "https://deno.land/std/streams/read_all.ts"; // Import readAll from here


export async function host(publicDir: string) {
    const port = 8000;
    console.log(`Server is running at http://localhost:${port}/ for directory`, publicDir);

    const server = Deno.listen({ port });

    for await (const conn of server) {
        try {
            handleRequest(conn);
        } catch (_) {
            // Prevent any single request from crashing the server
        }
    }
    async function handleRequest(conn: Deno.Conn) {
        const httpConn = Deno.serveHttp(conn);
        for await (const reqEvent of httpConn) {
            const req = reqEvent.request;
            const filePath = join(publicDir, req.url.replace(`http://localhost:${port}`, ''));

            try {
                const file = await Deno.open(filePath);
                const fileInfo = await Deno.stat(filePath);

                if (fileInfo.isDirectory) {
                    reqEvent.respondWith(new Response("Forbidden", { status: 403 }));
                } else {
                    const contentType = getContentType(filePath);
                    const headers = new Headers();
                    headers.set("Content-Type", contentType);
                    const fileContent = await readAll(file);
                    reqEvent.respondWith(new Response(fileContent, { status: 200, headers }));
                }

                file.close();
            } catch (error) {
                reqEvent.respondWith(new Response("File not found", { status: 404 }));
            }
        }
    }
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