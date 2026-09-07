---
title: "Git and GitHub: from your first commit to a reproducible project"
description: Learn the working tree, staging area and commit history; practise core commands safely; connect a local project to GitHub and recover from common mistakes.
category: Reproducible Research
tags: [Git, GitHub, version control, command line, reproducibility]
published: 2026-09-07
level: Introductory
software: [Git, GitHub, Bash]
estimatedMinutes: 65
featured: true
template: false
draft: false
browserR: false
downloadableAssets: []
---

Git records meaningful versions of a project. GitHub hosts Git repositories and adds collaboration features such as pull requests, issues and web-based code review. They are related, but they are not the same thing: you can use Git without GitHub, and a GitHub account does not automatically place a local folder under version control.

Use the **Git sandbox** above to practise the central sequence:

```bash
git init
git status
git add README.md
git commit -m "Add project README"
git log
```

The simulator never runs a real shell. Commands shown elsewhere in this lesson are for your own terminal and are intentionally not executed by the webpage.

## The mental model

Git asks you to distinguish four places:

1. **Working tree:** files currently visible in your project folder.
2. **Staging area:** the precise changes selected for the next commit.
3. **Local repository:** the commit history stored in the hidden `.git` directory.
4. **Remote repository:** a related copy hosted somewhere such as GitHub.

The common workflow is:

```text
edit → inspect → stage → commit → push
```

A commit is not simply “save”. It is a named snapshot of staged changes with parent history and author metadata.

## Install and identify yourself

Install [Git](https://git-scm.com/downloads) and confirm it is available:

```bash
git --version
```

Configure the name and email attached to future commits:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Use an email verified by GitHub if you want commits attributed to your profile. GitHub also provides a private `noreply` address.

Inspect configuration without exposing credentials:

```bash
git config --global --list
```

Never paste access tokens into a repository, command screenshot or teaching resource.

## Start a repository

Open a terminal in the project folder. In VS Code, use **Terminal → New Terminal**.

```bash
pwd
ls
git init
git status
```

On PowerShell, `pwd` and `ls` are available as aliases. The prompt should show that the terminal is inside the intended project—not your entire user folder or Downloads directory.

`git init` creates repository metadata. It does not upload anything.

## Add a `.gitignore`

A `.gitignore` names files Git should normally leave untracked.

```text
# R and RStudio session files
.Rhistory
.RData
.Ruserdata
.Rproj.user/

# Rendered or temporary files
*_cache/
*_files/
.quarto/

# Secrets and local configuration
.env
.Renviron

# Operating-system files
.DS_Store
Thumbs.db
```

Do not use `.gitignore` as the only protection for secrets. If a credential was already committed, ignoring it later does not remove it from history: revoke or rotate it.

## Inspect before staging

```bash
git status
git diff
```

`git status` tells you which files are untracked, modified or staged. `git diff` shows unstaged line changes. Review before staging; this prevents accidental data, generated output and unrelated edits entering a commit.

## Stage deliberately

```bash
git add README.md
git add analysis/model.R
git status
git diff --staged
```

`git add .` stages all eligible changes below the current directory. It is convenient, but use it only after reviewing `git status`.

To remove a file from the staging area without deleting it:

```bash
git restore --staged analysis/model.R
```

## Make a useful commit

```bash
git commit -m "Document cohort inclusion criteria"
```

A good commit:

- represents one coherent change;
- leaves the project in a usable state;
- excludes unrelated formatting or generated files; and
- uses a message that completes “This commit will…”.

Prefer `Correct outcome coding for readmissions` over `updates` or `final final changes`.

Inspect history:

```bash
git log --oneline --decorate --graph
git show HEAD
```

`HEAD` identifies the currently checked-out commit.

## Connect an empty GitHub repository

Create a new repository on GitHub. When your local project already contains files, it is simplest to leave GitHub’s README, licence and `.gitignore` boxes unticked so the remote starts empty.

GitHub displays commands similar to:

```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

- `origin` is a conventional nickname for the remote URL.
- `-u` records the upstream relationship, so later `git push` and `git pull` know which branch to use.

Check the connection:

```bash
git remote -v
git branch -vv
```

Do not copy the example URL literally. Use the exact URL GitHub gives for your repository.

## Clone an existing repository

Cloning creates a new local directory, downloads history and configures `origin`.

```bash
git clone https://github.com/OWNER/REPOSITORY.git
cd REPOSITORY
git status
```

Do not run `git init` inside a repository you just cloned.

## The everyday cycle

```bash
git status
git pull --ff-only

# edit and test files

git diff
git add path/to/file
git diff --staged
git commit -m "Describe the completed change"
git push
```

`git pull --ff-only` updates only when Git can move the branch pointer forward without making an automatic merge commit. It is a useful conservative default for a simple personal workflow.

## Branches

A branch is a movable name pointing to a commit. Use branches for work that should be reviewed or kept separate from stable `main`.

```bash
git switch -c add-regression-resource
git status

# edit, stage and commit

git push -u origin add-regression-resource
```

Return to main:

```bash
git switch main
git pull --ff-only
```

Delete a merged local branch:

```bash
git branch -d add-regression-resource
```

Avoid long-lived branches when one small change can be completed and merged promptly.

## Pull requests on GitHub

A pull request proposes merging one branch into another. It provides a place to:

- explain the purpose of the change;
- inspect the exact diff;
- run automated checks;
- discuss specific lines; and
- preserve a review record.

For your own site, a pull request is useful for large or risky changes. Small corrections can reasonably be committed directly if you have tested them.

## Merge conflicts

A conflict occurs when Git cannot decide how to combine competing changes. The affected file contains markers:

```text
<<<<<<< HEAD
content from the current branch
=======
content from the incoming branch
>>>>>>> other-branch
```

Read both versions, edit the file into the intended final form, remove every marker, then test and stage the resolution:

```bash
git add path/to/resolved-file
git commit
```

Do not keep both halves automatically. The correct resolution depends on meaning.

## Recover safely

### Discard one unstaged file change

```bash
git restore path/to/file
```

This overwrites the unstaged change. Inspect `git diff` first.

### Amend the most recent local commit

```bash
git add forgotten-file
git commit --amend --no-edit
```

Avoid amending a commit already shared with collaborators unless you understand the consequences of rewriting history.

### Reverse a published commit

```bash
git revert COMMIT_ID
```

`revert` creates a new commit that applies the inverse change. It preserves shared history and is usually safer than resetting a published branch.

### Find earlier work

```bash
git log --oneline --all
git reflog
```

`reflog` records recent movements of local references and can help recover commits that no branch currently names.

## Git and research data

Git is excellent for text-based source files, including `.R`, `.qmd`, `.md`, `.csv` files that are genuinely small and non-sensitive, and configuration files. It is usually unsuitable for:

- identifiable participant data;
- confidential clinical or commercial datasets;
- large binary exports;
- credentials;
- frequently changing rendered documents; and
- files governed by data-access agreements.

GitHub is not an approved clinical data store merely because a repository is private. Follow ethics, governance and institutional storage requirements.

## Line endings on Windows

Windows and Unix systems traditionally use different line endings. Git can normalise them. A project-level `.gitattributes` may include:

```text
* text=auto
*.R text eol=lf
*.qmd text eol=lf
*.md text eol=lf
```

This reduces diffs where every line appears changed despite no substantive edit.

## A reproducible project structure

```text
project/
├── README.md
├── project.Rproj
├── renv.lock
├── data-raw/       # never commit restricted source data
├── data-derived/   # only if safe and appropriate
├── R/
├── analysis/
├── output/
└── .gitignore
```

Document which files must be obtained separately and how derived files are regenerated.

## A clean first publication

```bash
git init
git branch -M main
git status
git add .gitignore README.md project.Rproj renv.lock R analysis
git diff --staged
git commit -m "Create reproducible analysis structure"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Before pushing, search for secrets, personal information, restricted course material and data that should not leave its approved environment.

## Command reference

| Command | Purpose |
| --- | --- |
| `git status` | Summarise working tree and staging area |
| `git diff` | Inspect unstaged changes |
| `git diff --staged` | Inspect the proposed commit |
| `git add FILE` | Stage selected content |
| `git commit -m "…"` | Record staged changes |
| `git log --oneline` | Inspect concise history |
| `git switch -c NAME` | Create and enter a branch |
| `git pull --ff-only` | Update without an automatic merge commit |
| `git push` | Send local commits to the configured remote |
| `git restore FILE` | Discard unstaged changes to a file |
| `git revert ID` | Reverse a commit with a new commit |

The aim is not to memorise every command. Build the habit of inspecting the state before changing it: `git status`, `git diff`, then the smallest justified action.
