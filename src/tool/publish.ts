const apiUrl = "https://api.vercel.com/v12/now/deployments";

export async function deploy(projectId: string, vercelToken?: string) {
    if (!vercelToken) {
        console.error('Vercel Token required to publish');
        return;
    }

    console.log(`Deploying to project ${projectId} with token.`);
    const newFilePath = "index.html";
    const newFileContent = "<!DOCTYPE html><html><head><title>My Static HTML Site</title></head><body><h1>2Welcome to My Site</h1></body></html>";

    const headers = new Headers({
        "Authorization": `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
    });

    const data = {
        name: projectId,
        files: [
            {
                file: newFilePath,
                data: newFileContent,
            },
        ],
        projectSettings: {
            framework: null
        }
    };

    const options = {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    };

    const response = await fetch(apiUrl, options);

    if (response.status === 200) {
        const responseBody = await response.json();
        console.log("Deployment successful:", responseBody);
        console.log("See your site at", responseBody.alias);
        console.log("DEV MESSAGE: TODO: fill `files` with real files")
    } else {
        const responseBody = await response.json();
        console.error("Deployment failed. Status:", response.status, responseBody);
    }
}