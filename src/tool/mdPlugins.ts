import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.198.0/fs/exists.ts";
import { markdownImageRegex, obsidianStyleCallout, twitterRegex, youtubeRegex } from "./regexCollection.ts";

// @deno-types="../../types/markdown-it/index.d.ts"
import MarkdownIt from "../../types/markdown-it/index.d.ts";
import { getOutDir } from "../path.ts";
import { Config, edenEmbedClassName, embedPathDataKey } from "../sharedTypes.ts";
import { findFilePathFromBaseName } from "./backlinkFinder.ts";
// @deno-types="../../types/markdown-it/lib/token.d.ts"
import Token from "https://esm.sh/markdown-it@13.0.1/lib/token.js";
import { TokenType, findToken } from "./mdPluginUtils.ts";
import StateCore from "https://esm.sh/markdown-it@13.0.1/lib/rules_core/state_core.js";

export default function plugins(md: MarkdownIt, config: Config) {
    md.use(callouts, 'callouts', 'blockquote', (tokens: Token[], idx: number) => { });
    function callouts(md: MarkdownIt, ruleName: string, tokenType: string, iterator: (tokens: Token[], idx: number) => void) {
        // https://stackoverflow.com/a/1026087/4418836
        function capitalizeFirstLetter(string: string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
        function scan(state: StateCore) {

            const tokens = state.tokens;

            for (let i = 0, l = tokens.length; i < l; i++) {
                // Find the opening tag of the next blockquote.
                const start = findToken(tokens, { type: TokenType.BLOCKQUOTE_OPEN }, i);

                if (start === -1) {
                    continue;
                }
                const level = tokens[start].level;

                // Find the closing tag of the current block quote.
                const end = findToken(tokens, { type: TokenType.BLOCKQUOTE_CLOSE, level: level }, start + 1);

                // Find potential callout type
                if (start + 2 < end) {
                    const calloutInline = tokens[start + 2];
                    if (calloutInline.type == 'inline') {
                        const tokenText = calloutInline.children[findToken(calloutInline.children, { type: 'text' }, 0)];
                        if (tokenText) {
                            // Remove now empty paragraph tokens
                            if (tokens[start + 1].type == 'paragraph_open') {
                                tokens[start + 1].type = 'html_inline';
                                tokens[start + 1].tag = '';
                            }
                            if (tokens[start + 3].type == 'paragraph_close') {
                                tokens[start + 3].type = 'html_inline';
                                tokens[start + 3].tag = '';
                            }

                            const inlineMatches = new RegExp(obsidianStyleCallout).exec(tokenText.content);
                            if (inlineMatches) {
                                const fullMatch = inlineMatches[0];
                                const calloutType = inlineMatches[1];
                                const isFolding = !!inlineMatches[2];
                                // Remove  markdown that determines which type of callback it is
                                tokenText.content = tokenText.content.replace(fullMatch, calloutType + ' ');
                                tokens[start].attrJoin('class', 'callout');
                                tokens[start].attrSet('data-callout', calloutType);

                                if (isFolding) {

                                    tokenText.type = 'html_inline';
                                    tokenText.content = `<summary>${capitalizeFirstLetter(tokenText.content)}</summary>`;
                                    const detailsOpen = new state.Token('html_block', '', 0);
                                    detailsOpen.content = '<details>';
                                    calloutInline.children.unshift(detailsOpen);
                                    const detailsClose = new state.Token('html_block', '', 0);
                                    detailsClose.content = '</details>';
                                    calloutInline.children.push(detailsClose);


                                } else {
                                    tokenText.type = 'html_inline';
                                    tokenText.content = `<div class="callout-title"><div class="callout-title-inner">${capitalizeFirstLetter(tokenText.content)}</div></div>`;
                                }
                            }
                        }

                    }
                }
            }
        }

        md.core.ruler.push(ruleName, scan);

    }

    {
        // Remember old renderer, if overridden, or proxy to default renderer
        const defaultRender = md.renderer.rules.text || function (tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
        };

        md.renderer.rules.text = function (tokens, idx, options, env, self) {
            const token = tokens[idx];
            const content = token.content;
            if (content) {
                // Feature: Support images with spaces
                // If you copy paste an image into Obsidian, it is saved like: `Pasted image 20230729221843.png`
                // so images with spaces must be handled because they are not automatically handled in
                // markdown-it
                // TODO: Eventually write a custom markdown it rule, for now this custom regex will do
                if (markdownImageRegex.test(content)) {
                    const [_, altText, imgPath, titleText] = content.match(markdownImageRegex) || [];
                    if (imgPath) {
                        const imgActualPath = findFilePathFromBaseName(imgPath, globalThis.garden);
                        return `<img alt="${altText || ''}" title="${titleText || ''}" src="${imgActualPath}"/>`;
                    }
                }
            }
            return defaultRender(tokens, idx, options, env, self);
        }

    }
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
                    const youtubeVideoId = youtubeMatch && youtubeMatch[1];
                    return `<iframe class="responsive-iframe" src="https://www.youtube.com/embed/${youtubeVideoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
                } else if (vimeoRE.test(url)) {
                    const id = url.match(vimeoRE)?.[2];
                    if (id !== null) {
                        return '<iframe class="responsive-iframe" src="//player.vimeo.com/video/' + id + '"></iframe>';
                    }
                } else if (twitterRegex.test(url)) {
                    // .replace is needed because embedding currently only works with twitter.com urls
                    // but the regex allows for x.com
                    return `<blockquote class="twitter-tweet">
  <a href="${url.replace('x.com', 'twitter.com')}"></a>
</blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`;
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
                const foundPath = findFilePathFromBaseName(url, globalThis.garden);
                if (foundPath) {
                    url = foundPath;
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