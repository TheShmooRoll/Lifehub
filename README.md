# Life Atlas

A personal life map with illustrated branches, task completion, XP, levels, and permanent achievements. Built for Tomer's proposed structure:

Life → Work → University → Lab → Grants / Experiments / Team, with Teaching and Obligations alongside Lab; Recreation, Home, Social, and Hobbies beside Work.

## The easy way

**Only `index.html` is needed to run the app.** The artwork, styles, and code are all inside it. Open it in a modern browser to try it. It opens with clearly labeled example tasks.

For GitHub Pages:

1. Create a repository for this project, or open the repository you want to use.
2. Upload `index.html` to its top level. Do not upload the ZIP as the website.
3. Under **Settings → Pages**, select **Deploy from a branch**.
4. Select **main** and **/(root)**, then **Save**.
5. Open the website URL displayed by GitHub once deployment finishes.

Official instructions: [Configure a publishing source for GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The remaining ZIP files are editable source and development tools; they are optional for hosting. This package has not been uploaded to your GitHub account.

## Use your world

- Click **Work** to follow its University branch, then click **Lab**. The breadcrumb lets you revisit every level.
- Move a quest's slider to update its percentage, or tick it complete. Click its title to edit it.
- Add a quest with **+ Quest**. Choose its branch, task size, attribute, and optional due date.
- Open **Edit branches** to add or rename branches, adjust their relative weight, or delete branches you do not need. Deleting a branch also deletes its current tasks, after confirmation.
- **Start my own world** keeps the branch structure and removes example tasks, XP, and achievements after confirmation.
- The gear menu has backup export/import. Import replaces the current world after validation and confirmation.

## How progress is calculated

Within a branch, Small / Medium / Large tasks have weights of 1 / 3 / 5. Example: one large task at 100% and one small task at 0% produce 83.3% progress.

Every parent takes the weighted average of its nonempty children. Child branches have equal weight by default; the editor offers 1× through 5×. This means one busy work branch cannot outweigh the other life areas merely by having more tasks. A parent's direct tasks form one extra group of weight 1. Empty branches show a dash and do not lower the score.

Percentages are computed with full precision and rounded for display. Adding unfinished tasks can lower current progress. That is expected: the scope has grown.

Heart (connection and care), Soul (meaning and growth), Smile (joy), and Strength (energy and fitness) show weighted completion of the quests assigned to each attribute. They are task meters, not health or wellbeing measurements.

## The game layer

- Every icon fills from muted to full color with task progress. Branches and connecting paths also show their completion.
- A 100% branch has a gold ring.
- Each task earns up to 20 / 60 / 100 XP, progressively. A task's reward is fixed when it is created; changing its size later changes its progress weight only.
- XP uses the highest percentage ever reached for each task. Undoing and repeating the same completion cannot generate extra XP.
- Level 1 needs 200 XP; each next level requires 200 more XP than the last.
- Eight achievements add one-time bonus XP: First spark, Momentum, Big leap, A wider world, Lab legend, Golden heart, All-rounder, and Constellation. Their exact requirements are shown in the collection.
- Each branch gets Bronze / Silver / Gold at 1 / 5 / 10 historically completed quests in that branch or its descendants. The heart displays the rank across the whole world.
- Achievement and XP history stays after task deletion or progress reduction. A completion remains attributed to the branch and attribute where it was first earned, even if you later move the task.

## Saving and portability

This first version stores progress in your browser's local storage. It has **no account system, server, or automatic cross-device sync**. GitHub hosts the app; it does not receive your task edits. A local file and the hosted website may have separate saved worlds. Export/import moves a world between them. Some browsers restrict saving for files opened directly from disk; the app shows a notice when it cannot save.

Backups contain your tasks and progress. Keep them separately from the public website files unless you intend to publish that data. Use Export regularly, especially before clearing browser data or switching devices.

## Edit the code

- `src/shell.html`: page layout and dialogs.
- `src/styles.css`: visual design and responsive layouts.
- `src/engine.js`: task weights, progress, levels, achievements, and backup validation.
- `src/app.js`: map rendering, editing, browser saving, and import/export.
- `assets/`: two compressed WebP artwork files, embedded by the build.

Run `python3 build.py` to regenerate the self-contained `index.html` and ZIP. No npm install, build service, API key, or network call is required.

Run `node tests/engine.test.cjs` and `node tests/app-smoke.test.cjs` for logic and DOM-adapter smoke checks. These checks do not replace visual testing in your browser.

## Ideas for the next version

These are proposals, not implemented features:

1. **Boss quests:** a grant submission or manuscript becomes a large visual project with weighted checkpoints.
2. **Rituals:** daily or weekly habits have a fresh cycle, while lifetime achievements remain.
3. **Personal rewards:** unlock a reward you choose at a milestone, such as a day trip or time for a hobby.
4. **Seasons:** start a new month with a fresh progress map and retain a history of previous worlds.
5. **Visual upgrades:** earned achievements unlock alternate heart designs, branch decorations, and themes.
6. **Optional account and sync:** keep the same world on phone and computer with a separate authenticated data service.
