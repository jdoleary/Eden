const { resolve, relative, join } = require('path');
const { readdir, writeFile } = require('fs').promises;
const { createHash } = require('node:crypto');
const { createReadStream } = require('node:fs');

const { version } = require('../package.json');

const directory = join('sample');
// from: https://stackoverflow.com/a/45130990/4418836
async function* getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res);
        } else {
            yield res;
        }
    }
}
; (async () => {
    const files = [];
    for await (const f of getFiles(join('.', directory))) {
        // Add file name relative to the domain
        // so, when I push to the `production` branch
        //(`git push production master`), all the file names
        // will be relative to where you can access them on the url
        // and since the url hosts the `build` directory statically,
        // this will list file names in the manifest as
        // `images/explain/cast.gif` instead of `build/images/explain.cast.gif`
        // WHEN YOU UPDATE MAKE SURE YOU ALSO UPDATE THE SERVER VERSION AND VERIFY THE VERSION NUMBER CHANGED.

        // https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options
        // Create a hash of the file contents:
        const hashAlg = createHash('sha256');
        const hash = await new Promise((resolve) => {
            const input = createReadStream(f);
            input.on('readable', () => {
                // Only one element is going to be produced by the
                // hash stream.
                const data = input.read();
                if (data)
                    hashAlg.update(data);
                else {
                    const digest = hashAlg.digest('hex')
                    console.log(`${digest} ${f}`);
                    resolve(digest);
                }
            });
        });
        files.push({ path: relative((__dirname, directory), f), hash });
    }
    writeFile(join(directory, 'manifest.json'), JSON.stringify(
        {
            version,
            files: files
        }
    ))
})();