## MVP Tasks
- (MVP) bug: Asset serving doesn't work for drag-n-drop exe
- (MVP) Bi-directional linking
    - see: `// TODO make backlinks work`
        - Backlinks will have to be aggregated on a pass before all files are converted to html
        - Allow backlinks to link to the element
            - smooth scrolling https://stackoverflow.com/a/24739173/4418836
- (MVP) Custom URL (in video tutorial)
- (MVP) Example site and source that demos all working features
    - Explain CLI usage in and out of workingdirectory

## Bugs
- Bug: Nested directories mess up in the Previous Button (see page "Armbar". Previous button says ": Locks")
- Bug: ignoreDirs does fuzzy matching but should be exact, see tests in os.ts

## Enhancements
- allow for defining different templates than default in a .md's metadata
    - see: `// Get default html template`
    - Maybe allow for a root template that has boilerplate such as <html> and a specific template that does the rest
- CLI should only overwrite, never delete the outDir contents
- Prevent page centering from jumping around when pages switch to scrollbar present/not present
- Custom index page
## Tech Debt
- // TODO: Make config help text visible to users
- Warn if a directory is both ignored and included as a static serve directory in config
- // TODO: Clean up forbidden files, they ruin the JSON
- Add error reporting
- youtu.be links are not being parsed correctly (see page "Chris Paines")
    - It looks like they are so long as they are surrounded with `[]` as links should be in markdown
- Fix hacky way of removing %20 from image urls
- Handle page titles with parenthesis


## Backlog
- Add EULA to executable output
- Remove manifest
- feature: Add <meta> description for SEO
- auto embed youtube videos:
```
<iframe width="560" height="315" src="https://www.youtube.com/embed/VA6zjDN690s" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
```

## Features
### Easy
- Index pages based on tags (ex: https://maggieappleton.com/essays)
- Ability to create different object types, ontologies, and tags
    - Example: https://www.gwern.net/About#confidence-tags
    - Example: Maggie Appleton's site, which has "Notes", "Essays", and "Patterns", among other collections of different objects
    - Support [markdown metadata](https://help.obsidian.md/Editing+and+formatting/Properties) 
        - ex test page is http://localhost:8000/My_Own_Curriculum.html
        - Make use of metadataParser
- Ability to support interactive and animation embeds
- Expandible/collapsible blocks (like Roam or Gamma)
- Navigation: Support for vertical and horizontal nav, primary and secondary, floating navbar, nested or expanded megamenu navigation
- Sidenotes, in margin
    - https://www.gwern.net/Sidenotes
- Site search
    - make entire garden available in json like [Maggie Appleton's Garden.json](https://maggieappleton.com/_next/data/yUhDOUNEYA1W3PsJNBhvU/garden.json)
### Medium
- Support syntax highlighting
- Block-based, content as data, so the same piece of content can easily be transcluded in multiple places
    - Adding in dynamically updated bits of content into other bits of content
    - https://subpixel.space/entries/open-transclude/
- Serve as or integrate with a headless or component content management system
- Inflation-adjusted currency plugin (like Gwern)
- Live link previews, infoboxes, and hover popups
- Print-ready, capable of being exported to EPUB or PDF
- Customizable header (like https://maggieappleton.com/) that works with transclusion.
### Unkown
- Annotation support (or compatible with social annotation plugins)
- Notable: https://gwern.net/design
### Done
- Breadcrumbs
- Future-proof: Exportable data, portable, control and own your data, no lock-in
- Make file metadata (such as Created On Date) accessible to the template
- Customizable via CSS, HTML, and JS

## Critical Path
- Finish MVP Features
    - User should be able to move the exe to the directory that they want to parse, run it once and have it make a website (if they provide a vercel token).  Vercel token could be saved to config (optionally)
    - exe should create config files that are modifiable in the parse directory
- Test
    - Beta Testers
- Sell MVP
    - Landing Page / Accept Payment
    - Advertise
    - Relevant Sites / Influencers
        - markdownguide.org

## Relevant Links
- [.md meta data](https://help.obsidian.md/Editing+and+formatting/Properties)
- [Commonmark Spec](https://spec.commonmark.org/0.30/)
- [Markdown Guide Extended Syntax](https://www.markdownguide.org/extended-syntax/)


## Competition
- [Quartz](https://quartz.jzhao.xyz/)
    - Too many links make pages feel overwhelming due to their styling