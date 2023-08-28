## MVP Tasks
- (MVP) Splash page with waitlist
    - Validate the idea
- (MVP) Sign app on mac
    - https://developer.apple.com/forums/thread/130379
- (MVP) Homepage
    - Header with links to special pages like "About"
    - Footer: links to TOC, copywrite, buildwith Eden-md, social links, etc
    - Fix template html5 tags
    - Use xml for custom behavior such as showing pages by tag with cover art (ex: <AssumedAudience> gets special styling in Maggie Appleton's blog)
- (MVP) Make mvp demo video and send to Zak

- Separate root template from content template
- Support auto h1 headers based on filename (for obsidian)
- add readme instructions in config dir?
- Change icon from deno dinosaur to something else
    - http://www.angusj.com/resourcehacker/
- Add footer with app name and such
- if the out dir goes inside of the obsidian directory it takes obsidian too long to start up (it's caching) so the out dir should be somewhere else
- Would this program work with Notion too?? What other programs output .md files? Evernote?

## Bugs
- Bug: Nested directories mess up in the Previous Button (see page "Armbar". Previous button says ": Locks")
- Bug: ignoreDirs does fuzzy matching but should be exact, see tests in os.ts

## Enhancements
- For custom tags like "<AssumedAudience>", I think the best way to parse them is to look for html tags that match a custom formatter.
    - Otherwise it gets real messy parsing nested html tags.
- Output an rss.xml feed
- Formatting: Obsidian usually takes a single \n to mean a newline where the current markdown parser will not
- Allow for commented out content {/* ### Commented out */} that is in the doc but doesn't show
- Embeddable youtube works with the image syntax: ![](https://youtu.be/aFBp0cZ79bQ?si=rdrrNxhVlJWzHpVw)
- Custom tags could / should be used in the custom transcludable blocks. See tests.md in sample/ for example
- Metadata inspired by Maggie  Appleton
    - content
    - title
    - cover (thumbnail)
    - description
    - growthStage
    - startDate
    - topics
    - type "essay", "note", "etc"
    - updated
    - slug
    - filePath
- Hide broken image icons
- Auto url linking (turn urls into links even if they aren't markdown links)
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
- Fix hacky way of removing %20 from image urls
- Handle page titles with parenthesis


## Backlog
- Features to brag about (and to verify first)
    - High Lighthouse + SEO rating
- Add EULA to executable output
- Remove manifest
- feature: Add <meta> description for SEO
- auto embed youtube videos:
```
<iframe width="560" height="315" src="https://www.youtube.com/embed/VA6zjDN690s" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
```


## Critical Path
- Finish MVP Features
    - Make a 1 minute video showing how it works
- Test
    - Beta Testers
- Sell MVP
    - Landing Page / Accept Payment
    - Advertise
    - Relevant Sites / Influencers
        - markdownguide.org

## User flow
- If the user runs the program for the first time and there is no config in the directory it should ASK
"Would you like to generate a digital garden from the markdown files in {{DIRECTORY}}?"
- If not, it will ask for a directory path
    - If it cannot find that directory, exit
- If a directory path is supplied, do nothing

## Relevant Links
- [.md meta data](https://help.obsidian.md/Editing+and+formatting/Properties)
- [Commonmark Spec](https://spec.commonmark.org/0.30/)
- [Markdown Guide Extended Syntax](https://www.markdownguide.org/extended-syntax/)
- zettelkasten
- Notable: https://gwern.net/design
- How to make a good purchase page: https://easlo.gumroad.com/l/brain?layout=profile
- md editors
    - Roam
    - Tana.inc
    - Obsidian
- Use Cliffy.io for a better cli experience


## Competition
- [Quartz](https://quartz.jzhao.xyz/)
    - Too many links make pages feel overwhelming due to their styling
- https://www.11ty.dev/
- Gatsby
- Next.js
- Jekyll
- Even more https://www.11ty.dev/docs/#competitors
- https://roam.garden/

## Benchmark
https://www.zachleat.com/web/build-benchmark/#benchmark-results
Found using `time ./run.sh`
Eden Results:
250: 0.809s
500: 4.395s
1000: 10.196s
2000: 21.907s
4000: 54.249s