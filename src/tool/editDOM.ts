import { DOMParser, Element, Node } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { Config, Garden, edenEmbedClassName, embedPathDataKey } from "../sharedTypes.ts";
import * as path from "https://deno.land/std@0.177.0/path/mod.ts";
import { getOutDir } from "../path.ts";

// Returns undefined if nothing changed
export function processBlockElementsWithID(html: string, pageName: string, garden: Garden): string | undefined {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) {
    return undefined;
  }
  let changedHTML = false;

  const nodes = document.body.querySelectorAll("*");
  // In Obsidian blocks are paragraphs, so search all blocks,
  // find ones that end in a blockEmbedId, replace the element
  // with an ID'd element and add that block to the garden
  for (const node of nodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const blockEmbedIdRegex = /\^([\w\d]*)(?:\n|$)/;
      const el = (node as Element);
      if (el.classList.contains(edenEmbedClassName)) {
        // Do not match edenEmbed blocks which are referencing an embed block and are
        // not embeddable blocks themselves
        continue;
      }
      let match = el.firstChild?.textContent.match(blockEmbedIdRegex);
      if (!match) {
        match = el.lastChild?.textContent.match(blockEmbedIdRegex);
      }
      if (match) {
        // id is without "^"
        const id = match[1];
        if (id) {
          changedHTML = true;
          const blockId = pageName + '#^' + id;
          let innerHTML = el.innerHTML;
          // Remove id tag
          innerHTML = innerHTML.replace(match[0], '');
          if (innerHTML == '' && el.previousElementSibling) {
            // Handle special case (tests/embedBlocksSource#^f3edfd) where
            // the block id is on it's own line and is referencing a previous code block
            innerHTML = el.previousElementSibling.outerHTML || innerHTML;
            el.previousElementSibling.setAttribute('id', id);
          } else if (el.tagName == 'P' && el.parentElement && ['LI', 'UL'].includes(el.parentElement.tagName)) {
            // Special case: Handle embedding <ul> and <li> when their first line is a <p> and
            // they have more ul or li children.
            // This block ensures that the <p> doesn't render alone as the whole embedded block and the
            // rest of the children come with it
            if (el.parentElement.tagName == 'LI') {
              innerHTML = el.parentElement.innerHTML;
            } else {
              // <ul>'s need to use outerHTML so that the <ul> is embedded else the <li> will
              // embed on it's own and be at the same level of its <li> children which should be on the next level
              innerHTML = el.parentElement.outerHTML;
            }
            el.parentElement.setAttribute('id', id);
          } else {
            el.setAttribute('id', id);
          }
          // Add the block to the garden
          garden.blocks[blockId] = innerHTML;
        }
      }
    }
  }
  if (!changedHTML) {
    return undefined;
  }

  // Return the modified html
  return document?.documentElement?.outerHTML || undefined;
}

// Returns undefined if nothing changed
export function embedBlocks(html: string, garden: Garden, webPath: string, config: Config): string | undefined {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) {
    return undefined;
  }
  let changedHTML = false;
  const toReplaceWithEmbedBlocks = document.querySelectorAll("." + edenEmbedClassName);
  for (const node of toReplaceWithEmbedBlocks) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      {
        const el = node as Element;
        // Note: .data isn't in deno-dom yet
        const embedId = el.attributes.getNamedItem(`data-${embedPathDataKey}`)?.value;
        if (embedId) {
          if (embedId.includes('#^')) {

            const block = garden.blocks[embedId];
            if (block) {
              changedHTML = true;
              const div = document.createElement('div');
              const [pageName, embedBlockId] = embedId.split('#^');
              const linkPage = garden.pages.find(page => page.name == pageName);
              const linkEl = linkPage ? `
            <div>
            <a href="${linkPage.webPath}#${embedBlockId}" class="feint-link"> ${embedId} </a>
            </div>
              `: '';
              div.innerHTML = `
            <div class= "embed-block">
            ${block}
              ${linkEl}
            </div>
              `;
              el.replaceWith(div);
            } else {
              console.warn(`WARN: ${webPath}: Missing embed block for ${embedId}`);
            }
          } else {
            // it is embedding an entire file
            const foundPage = garden.pages.find(p => p.name == embedId);
            if (foundPage) {
              const pageContent = Deno.readTextFileSync(path.join(getOutDir(config), foundPage.webPath))
              const document = new DOMParser().parseFromString(pageContent, "text/html");
              if (document) {
                const embedPageEl = document.getElementById('article-content')
                if (embedPageEl) {
                  changedHTML = true;
                  el.classList.add('embed-block')
                  el.appendChild(embedPageEl);
                }
              }
              if (!changedHTML) {
                console.warn(`WARN: Failed to embed entire page. embedId: ${embedId}.`)
              }

            } else {
              console.warn(`WARN: Failed to embed entire page: Could not find associated page. embedId: ${embedId}.`)
              changedHTML = true;
              el.remove();
            }

          }
        }
      }
    }
  }
  if (!changedHTML) {
    return undefined;
  }

  // Return the modified html
  return document?.documentElement?.outerHTML || html;

}