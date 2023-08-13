## Tasks
- First page doesn't link to toc
- CLI should only overwrite, never delete the outDir contents
- youtu.be links are not being parsed correctly (see page "Chris Paines")
- Remove manifest


## Bugs
- Bug: Nested directories mess up in the Previous Button (see page "Armbar". Previous button says ": Locks")
- Bug: "Submissions" page is empty, it should container "Locks" and "Strangles"

## Tech Debt
- Fix hacky way of removing %20 from image urls
- Handle page titles with parenthesis

## Backlog
- Add EULA to executable output
- feature: Add <meta> description for SEO

- auto embed youtube videos:
```
<iframe width="560" height="315" src="https://www.youtube.com/embed/VA6zjDN690s" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
```

## Critical Path
- Add Sentry for error reporting
- Integrate `publish` feature with vercel
- Integrate `preview` features to preview locally
- Beta Testers
- Landing Page / Accept Payment
- Advertise