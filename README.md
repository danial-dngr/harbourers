# HARBOURERS V2.1

This version preserves the supplied original HARBOURER interaction engine rather than recreating it.

Preserved from the original source:
- free-mode draggable preview windows
- Swiss grid mode
- grid cell movement
- grid resize handle
- remembered free positions
- remembered grid size/position
- grid/free switching
- mobile stacked preview behaviour
- close-all and active project state
- contact/drawing system
- original styling

Changed:
- hard-coded project menu is generated from `content/projects.json`
- hard-coded project data is moved to `content/projects.json`
- project content supports ordered sections
- CMS edits the same JSON used by the site
- image / video / SVG / Lottie / text / embed / spacer blocks
- section ↑ ↓ ordering
- text-wrap and shape-based media wrapping

## Updating your GitHub test repo
Replace the files in your `harbourers` repo with the contents of this folder.

The live site reads:
`content/projects.json`

CMS:
`/cms/`

When the CMS exports `projects.json`, replace `content/projects.json` with it.
