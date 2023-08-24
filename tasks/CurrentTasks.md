## MVP Tasks
- Fix template html5 tags
- Separate root template from content template
- Support auto headers (for obsidian)
- (MVP) Make sure auto backlinking and regular backlinking don't clobber each other
- (MVP) Custom URL (in video tutorial)
- (MVP) Example site and source that demos all working features
    - Explain CLI usage in and out of workingdirectory
- add readme instructions in config dir?
- Change icon from deno dinosaur to something else
    - http://www.angusj.com/resourcehacker/
- Add footer with app name and such
- if the out dir goes inside of the obsidian directory it takes obsidian too long to start up (it's caching) so the out dir should be somewhere else

## Bugs
- Bug: Nested directories mess up in the Previous Button (see page "Armbar". Previous button says ": Locks")
- Bug: ignoreDirs does fuzzy matching but should be exact, see tests in os.ts

## Enhancements
- Hide broken image icons
- Full width images
- Will this work with other languages? See potential issue in removing by character in extractMetadata()
- Distinguish between multiple backlinks in the same file (for the sake of linking to the correct one)
- Support pages that are just backlinks but don't exist as their own page
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
- zettelkasten
- Notable: https://gwern.net/design


## Competition
- [Quartz](https://quartz.jzhao.xyz/)
    - Too many links make pages feel overwhelming due to their styling