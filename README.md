# HARBOURERS V5 — MODULAR PROJECT FILES

This version keeps the working Harbourer V4/V3 interaction engine, but separates every project into its own JSON file.

## Structure

```text
content/
├── projects.json
└── projects/
    ├── solaris.json
    ├── go-mad.json
    ├── lsw.json
    └── ...
```

`content/projects.json` is only the ordered index:

```json
{
  "version": "5.0",
  "projects": ["solaris", "go-mad", "lsw"]
}
```

## Editing an existing project

Open `/cms/`.

The CMS automatically loads the project index and all project files.

1. Edit a project.
2. Click `EXPORT CURRENT PROJECT`.
3. Upload that one JSON file into `content/projects/`, replacing the matching file.
4. Commit.

That edit does not touch any other project.

## Adding a new project

1. `+ NEW PROJECT`
2. Design it.
3. `EXPORT CURRENT PROJECT`
4. Upload the new project JSON into `content/projects/`
5. `EXPORT PROJECT INDEX`
6. Replace `content/projects.json`
7. Commit both.

## Reordering projects

Use ↑ ↓ in the CMS, then export/replace only `content/projects.json`.

## Removing a project

Use `REMOVE FROM PROJECT INDEX`, then export/replace `content/projects.json`.

Its old individual file can remain in `content/projects/` harmlessly, or you can delete it manually.

## Unchanged engine

The existing project window engine remains in place:
- free dragging/resizing
- Swiss grid dragging/resizing
- saved positions
- mobile stack
- COLLAB drawing/contact


## V7 mobile restore
This build starts from the user's original working repository and keeps its original mobile stack, project scrolling, project-list navigation, grid/free modes and COLLAB behaviour. Only the isolated centre hero/reel and sticky project header were added.
