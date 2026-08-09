# HARBOURER V2

This is a clean, modular rebuild based on the supplied working HARBOURER source.

## Upload to GitHub
Upload the entire contents of this folder to a new repository, e.g. `HARBOURER-V2`.
In GitHub: Settings → Pages → Deploy from a branch → `main` / root.

## Content workflow
The live site reads `content/projects.json`.

Open `/cms/` through a local server or GitHub Pages.
1. LOAD JSON and choose `content/projects.json`.
2. Edit/add projects and sections.
3. Reorder projects or sections with ↑ ↓.
4. EXPORT SITE DATA.
5. Replace `content/projects.json` with the exported file.

Supported blocks: text, image, video, SVG, Lottie, spacer.
Text supports CSS `text-wrap`: normal, pretty, balance.
Media can float left/right with box/circle/ellipse shape wrapping.

## Assets
Put new files into:
- assets/images
- assets/svg
- assets/video
- assets/lottie

Then use paths such as `assets/images/project.jpg`.

## Important
The original site is not modified.
