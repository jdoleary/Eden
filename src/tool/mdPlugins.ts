import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.198.0/fs/exists.ts";
import { youtubeRegex } from "./regexCollection.ts";

// @deno-types="../../types/markdown-it/index.d.ts"
import MarkdownIt from "../../types/markdown-it/index.d.ts";
import { getOutDir } from "../path.ts";
import { Config, edenEmbedClassName, embedPathDataKey } from "../sharedTypes.ts";
import { copySync } from "https://deno.land/std@0.195.0/fs/copy.ts";

export default function plugins(md: MarkdownIt, config: Config) {

    {
        // Remember old renderer, if overridden, or proxy to default renderer
        const defaultRender = md.renderer.rules.code_inline || function (tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
        };

        md.renderer.rules.code_inline = function (tokens, idx, options, env, self) {
            const token = tokens[idx];
            const content = token.content;
            if (content && content.startsWith(edenEmbedClassName)) {
                // Token is a block embed and must be handled specially
                const embedPath = token.content.split(edenEmbedClassName).join('');

                // TODO find out how to pass page
                // page.blockEmbeds.push(embedPath);

                // Change to html
                // Later using deno-dom, this will be queried for by class and replaced with the html that it is referencing
                // Note: Using class here because this is the many-to-one embed reference whereas the block itself will have the id
                return `<div class="${edenEmbedClassName}" data-${embedPathDataKey}="${embedPath}">${embedPath}</div>`;

            }
            return defaultRender(tokens, idx, options, env, self);
        }

    }
    {

        // Remember old renderer, if overridden, or proxy to default renderer
        const defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
        };

        md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
            const token = tokens[idx];
            const aIndex = token.attrIndex('href');
            let prependHTML = ''
            if (token) {
                // Feature: Prepend website icon to link text
                const url = token.attrs?.[aIndex][1];
                if (url && url.startsWith('http')) {
                    const urlObj = new URL(url);
                    let origin = urlObj.origin;

                    // Special case: handle missing favicon for youtu.be
                    if (origin === 'https://youtu.be') {
                        origin = 'https://youtube.com';
                    }
                    // Add the icon of the website before the link for user convenience
                    prependHTML = `<img class="inline-icon" src="https://s2.googleusercontent.com/s2/favicons?domain=${origin}"/>`;
                }
            }

            // pass token to default renderer.
            return prependHTML + defaultRender(tokens, idx, options, env, self);
        };
    }
    {
        const defaultRender = md.renderer.rules.image;
        const vimeoRE = /^https?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/;

        md.renderer.rules.image = function (tokens, idx, options, env, self) {
            const token = tokens[idx];
            const srcAttrIndex = token.attrIndex('src');
            let url = token.attrs && token.attrs[srcAttrIndex][1];

            if (url) {
                if (youtubeRegex.test(url)) {
                    const youtubeMatch = url.match(youtubeRegex);
                    const youtubeVideoId = youtubeMatch && youtubeMatch[4];
                    return `<iframe class="responsive-iframe" src="https://www.youtube.com/embed/${youtubeVideoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
                }

                if (vimeoRE.test(url)) {
                    const id = url.match(vimeoRE)?.[2];
                    if (id !== null) {
                        return '<iframe class="responsive-iframe" src="//player.vimeo.com/video/' + id + '"></iframe>';
                    }
                }
            }
            const content = token.content;

            // Support specifying width and height for images
            // https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#External+images
            if (content) {
                let imgWidth;
                let imgHeight;
                const imageSizeRegex = /\|(\d+)x?(\d*)$/;
                const matches = content.match(imageSizeRegex);
                if (matches) {
                    imgWidth = matches[1];
                    imgHeight = matches[2];
                }
                if (imgWidth) {
                    tokens[idx].attrPush(['width', `${imgWidth}px`]);
                }
                if (imgHeight) {
                    tokens[idx].attrPush(['height', `${imgHeight}px`]);
                }
            }

            // Feature: Find missing images
            // !imageRelativePath.startsWith('http') ensures that links to online images are served as is
            // otherwise, ensure that images exist locally. This is needed because some .md editors such as Obsidian
            // have an Assets directory (stored in .obsidian/app.json `attachmentFolderPath`) that provide an implicit
            // path, so if the markdown is just converted to html as is, the path will be broken
            // `!await exists` ensures that the image doesn't exist as the url relative to the outDir, in which case we drop into this
            // block to try to find it
            if (url && !url.startsWith('http') && !existsSync(path.join(getOutDir(config), url))) {
                url = `/${url}`;
                let foundMissingImage = false;
                for (const staticPath of config.staticServeDirs) {
                    const testPath = path.join(getOutDir(config), staticPath, url);
                    if (existsSync(testPath)) {
                        // path.posix is needed because this is now a webPath
                        url = `/${path.posix.join(staticPath, url)}`;
                        foundMissingImage = true;
                        break;
                    }
                }
                if (!foundMissingImage) {
                    // Obsidian by default puts drag-n-dropped images in the root,
                    // if the image is not found in any of the staticServeDirs but 
                    // it is in the parseDir root
                    // then copy it to the root of the outDir
                    const pathAtParseRoot = path.join(config.parseDir, url);
                    if (existsSync(pathAtParseRoot)) {
                        const outDir = getOutDir(config);
                        const newOutPath = path.join(outDir, url);
                        copySync(pathAtParseRoot, newOutPath);
                        // Convert to a relative path for web serve root
                        url = `/${path.relative(outDir, newOutPath)}`;
                        foundMissingImage = true;
                    } else {
                        console.error('⚠️ Missing image', url, 'check config staticServeDirs for missing directory.');
                    }
                }

            }


            // Url may have been modified, reassign the token's url to the new value
            if (url && token.attrs) {
                token.attrs[srcAttrIndex][1] = url;
            }
            // pass token to default renderer.
            return defaultRender ? defaultRender(tokens, idx, options, env, self) : '';
        };
    }

}