## Tasks
- Style index pages
- Add 'next' and 'prev' buttons

## Enhancements
- Rework commented out Manifest code that allows it to only process files that have changed

## Tech Debt
- Fix hacky way of removing %20 from image urls
- Handle Directories with spaces in them in Table of Contents links

## Backlog
- Add EULA to executable output
- feature: Add <meta> description for SEO
- enhancement: https://dev.to/lukekyl/how-to-avoid-layout-shifts-when-using-web-fonts-3n7g
- fix: config appears to require absolute path in `parseDir` for backlinks to work correctly

- auto embed youtube videos:
```
<iframe width="560" height="315" src="https://www.youtube.com/embed/VA6zjDN690s" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
```