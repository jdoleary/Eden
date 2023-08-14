## Tasks
- Integrate `publish` feature with vercel
    - send files array to publish function

## Bugs
- Bug: Nested directories mess up in the Previous Button (see page "Armbar". Previous button says ": Locks")
- Bug: "Submissions" page is empty, it should container "Locks" and "Strangles"

## Tech Debt
- Add Sentry for error reporting
- Fix hacky way of removing %20 from image urls
- Handle page titles with parenthesis
- youtu.be links are not being parsed correctly (see page "Chris Paines")
- CLI should only overwrite, never delete the outDir contents

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