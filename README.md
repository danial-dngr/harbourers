# HARBOURERS V3 EXACT

This version changes strategy: the original HARBOURER interaction engine is preserved.

The project preview DOM structure remains exactly:
- `.preview`
- `.close-button`
- `.preview-title`
- `.preview-image-wrapper`
- `.preview-blurb`

The original JS remains responsible for:
- native free-mode resize (`resize: both`)
- free dragging
- Swiss grid layout
- grid dragging
- grid resize handle
- grid/free saved positions
- mobile stacking
- close-all
- drawing/contact including fill, undo, redo, caption, PNG save and email

The CMS only supplies project data.

## Update the GitHub repo

Replace the repo contents with this folder.

GitHub Pages settings do not need to change.

## CMS

Open:
`https://<username>.github.io/harbourers/cms/`

Load:
`content/projects.json`

Edit projects/blocks, export `projects.json`, then replace:
`content/projects.json`

## Why this version is safer

The CMS compiles its blocks into the original `image` and `blurb` structure at runtime. The window/grid/drawing code therefore does not have to know a CMS exists.
