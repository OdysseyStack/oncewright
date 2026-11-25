# oncewright

![Rendered re-enactment: at the wrap-up mark, oncewright saves memory and writes the handoff, and its launcher starts the next session, which picks up from the handoff](https://github.com/OdysseyStack/oncewright/releases/download/v1.0.0/oncewright-demo.gif)

A Claude Code plugin built to get each change right the first time, and to carry long work from
one session to the next by itself. As the work goes on, it keeps Claude Code's memory for this
repo up to date without being asked: each session saves what it decided and learned, and the
memory index is tidied once it grows past its target. That is how work in the same repo improves
and gets more streamlined as time goes on: each new session starts from what the earlier ones
decided and learned, not from scratch.

- **At the wrap-up mark, it closes the session and starts the next.** Once a session's context
  passes the mark (35% of the context window, never past 300k tokens), Claude stops the
  session's scheduled jobs, waits for its background agents, saves what the session decided to
  memory and writes the next session's handoff; then the kit's launcher starts the next session
  on that handoff, with nobody at the keyboard. It needs the launcher, one command per repo, and
  the status bar, both offered by setup; it works in a terminal only; and it needs auto mode,
  the permission mode Claude Code starts in since version 2.1.283. In our test, wrap-up and the
  handoff ran without a prompt in auto mode; in Manual mode each wrap-up asked twice (for its one
  read call, and for its one write call, which saves the handoff, memory and the flag the
  launcher waits for) and each handoff once (for its call that reads and resets the handoff), and
  the loop waited for each approval. Any other permission prompt stops it too.
- **It stays inside the task.** Planned work stays inside the files its plan names, open choices
  are decided instead of asked about, and a hook runs the repo's gate before every commit Claude
  makes. In the [benchmark](#the-benchmark) below, none of its 60 runs changed anything outside
  the task; plain Claude Code did in 3 of 60, each a one-line fix to a stale comment.
- **In our benchmark of a pre-release build it cost the same as plain Claude Code while doing
  more.** Over 3 tasks and 120 runs on Opus 5.5 at high effort, with its commit gate on, it
  loaded its own rules, and closed and opened sessions with its own wrap-up and handoff, and
  still cost 1.00x plain Claude Code per correct result (95% range 0.98–1.03), right on the
  first try in 60 of 60 runs to plain's 57.

Always on, it adds the descriptions of the 6 skills Claude can start (1,020 characters), its
rule `primary.md` (918 B, plus a stamp line) and, where your setup answers name anything
sensitive, `sensitive-data.md` (827 B when it names only `.env`); the hooks add nothing until
they fire. `claude plugin details` shows more because it counts all 26 skills, but a skill only
you can start keeps its description out of Claude's context.

Around that it adds a CodeRabbit review loop with recorded verdicts, memory upkeep, and guard
hooks, such as the one that blocks Claude's writes to secret files.

**Names.** oncewright is the project and this repository. It installs as the plugin `odyssey`,
shown as "Odyssey: oncewright" in Claude Code's menus, from the marketplace `odyssey-ai`, so
every command starts with `/odyssey:`. This README calls it the kit.

**Built by Lincoln Powers ∙ Odyssey AI, Inc.** — [odysseystack.com](https://www.odysseystack.com)

An independent project for Claude Code, not affiliated with or endorsed by Anthropic.

## Quickstart

About ten minutes, in a repo you can experiment in. Send each block as a message of its own.

1. **Check Node, then install.** The kit's hooks are Node scripts and need Node.js 22 or later:
   run `node --version` in a terminal. Without it the hooks can't start: from Claude Code 2.1.295 the secrets
   guard then blocks every edit and shell command (an older release lets them through), and the
   other hooks guard nothing.
   Then add the marketplace:

   ```
   /plugin marketplace add OdysseyStack/oncewright
   ```

   Then open the plugin's page:

   ```
   /plugin install odyssey@odyssey-ai
   ```

   Install it there and close the panel: Claude Code loads the plugin into the session. If
   `/odyssey:setup` is not listed yet, run `/reload-plugins`.

   Or, in the terminal where you checked Node, one command adds the marketplace and installs
   the plugin, and the next session you start loads it (Claude Code 2.1.292 or later):

   ```
   claude plugin install odyssey --marketplace OdysseyStack/oncewright
   ```

2. **See a guard work.** Ask Claude to write `FOO=1` to `.env`. The secrets guard is on from
   the start, and it stops the write:

   ```
   Blocked: writing "…/.env" is not allowed. It matches a secret-file pattern: …
   ```

3. **Fit it to the repo.** At the repo's root:

   ```
   /odyssey:setup
   ```

   It shows one filled-in proposal for you to confirm or change, then a dry run, and writes only
   on your yes. Near the end it offers [a status bar](#the-status-bar-and-the-theme),
   [a launcher](#the-launcher), a few spinner tips,
   [the wrap-up band](#wrap-up-and-the-launcher-recommended), [peek](#peek-experimental), an
   experimental file viewer, and [ponytail](#why-we-recommend-ponytail), a separate plugin, for
   your machine, in one step where you pick which. Then run the approve command setup prints,
   yourself, in a terminal or with `!` in the session: it turns on the commit gate and the other
   hooks that run your commands. Then check the result:

   ```
   /odyssey:setup doctor
   ```

   **From here on, sessions in this repo work differently.** A plan is made in slices, each a
   step small enough for one commit, and work on a slice stays inside the files it names
   ([How a slice is made](#how-a-slice-is-made)). Open choices are decided, not asked about,
   unless a wrong guess would be costly to undo. Before each commit Claude makes, the commit
   gate runs the repo's gate stages (the checks setup records, such as lint, typecheck and
   tests), every one to the end, and blocks the commit if one fails. Commits and pushes wait for
   your go, with one exception: while a PR is open, Claude commits and pushes to that PR's own
   branch without asking (never the default branch, a force-push, a merge or a rebase), and
   CodeRabbit reviews each push.

4. **Commit what setup wrote:** `.claude/odyssey.json`, `.claude/rules/` and `.gitignore`. Do it
   before the first change, or setup's files show up in that change's diff.

5. **Take one small change through the cycle.** Have Claude write a short plan for it in
   `docs/plans/`, with `**Status:** ACTIVE` in its first five lines (that header is how
   `/odyssey:make-a-path` and `/odyssey:what-next` find an open plan), then ask it to make the
   plan's first slice and commit it. Claude names the
   files the slice touches before its first edit, stays inside them, and marks the slice done in
   the plan; the commit runs the gate first.

6. **Let sessions follow one another.** If you added a launcher, quit and start Claude with its
   command from now on. Once a session passes the wrap-up mark, it saves memory, writes the
   handoff and starts the next session, which reads the handoff and carries on
   ([Wrap-up and the launcher](#wrap-up-and-the-launcher-recommended)).

The rest of the cycle, the review loop, handoffs and memory, is in
[How the cycle works](#how-the-cycle-works).

## Why this exists

I build production AI agents for real businesses, and the model was never the hard part — the
drift was. Every guardrail in this kit answers one of these failures:

- **Sessions forget what was decided.** Plans, review verdicts, memory and the handoff all live
  in files, so no decision depends on a chat being remembered.
- **Long sessions lose the thread and start making things up.** Every stage starts in a fresh
  session that works from those files, and when a long one is compacted anyway, a hook tells
  Claude so — see Checkpoints below.
- **Keeping a session's context in check becomes your job.** The [launcher](#the-launcher) ends
  a session at the wrap-up mark, once memory and the handoff are saved, and starts the next one
  on that handoff, so long work carries on by itself.
- **Claude "helpfully" edits files nobody asked it to touch.** Planned work stays inside the
  files its slice names, and any other file waits for your yes
  ([How a slice is made](#how-a-slice-is-made)).
- **Two sessions overwrite each other's notes.** One file holds the next session's opening
  message, and writing over one that's still waiting asks first: a convention the skills keep,
  not a lock.
- **A review finding gets argued again every round.** Every finding becomes a recorded verdict,
  and its thread on the pull request gets a one-line reply that CodeRabbit learns from.
- **A rejected finding quietly shapes every future review.** CodeRabbit can save a reply as a
  learning, and triage names each one it saved under a rejection or a deferral, with where to
  edit or delete it.
- **A PR gets merged over a warning nobody read.** Triage lists open items first and puts the
  verdict last.
- **"All green" gets claimed on checks that never ran.** The gate reports how many checks it
  ran, and says INDETERMINATE when one didn't.
- **A commit lands on a red gate.** The commit gate, a hook, runs the repo's gate stages before
  each commit Claude makes and blocks the commit while one fails, with no rule text for Claude
  to remember.
- **A brand-new file slips past review.** `git diff` never shows it, so `/odyssey:review-me`
  reads untracked files in full beside the diff.
- **Docs drift until they describe a system that no longer exists.** The gate's docs stage, a
  script that costs no model tokens, checks that every path, file, script and ADR they name
  exists.
- **A rule sits in a file Claude never loads, or two instruction files disagree.**
  `/odyssey:audit` lists which files Claude Code loads and when, and reads them for rules that
  never reach Claude, claims the code disproves, and rules that contradict each other.
- **Hand edits break lockfiles or overwrite logs meant to be append-only.** Two opt-in hooks
  block both; you name the files in `.claude/odyssey.json`.
- **Claude overwrites a `.env` or a key file while fixing something else.** The secrets
  guard blocks Claude's writes to `.env` and the other secret files through edits, shell
  commands, PowerShell and four MCP file tools, symlinks included. It does not check what gets
  committed.

It's the setup I run every day, packaged so you can run it too.

## The benchmark

The numbers at the top come from a benchmark we publish with its harness and data at
[OdysseyStack/oncewright-bench](https://github.com/OdysseyStack/oncewright-bench), so anyone can
rerun or re-score it. It runs three tasks in one small Node repo (41 files, about 1,300 lines),
each 20 times with the kit and 20 times with plain Claude Code, on Opus 5.5 at high effort:

- **A review round across two sessions.** Session 1 deals with three pasted review findings (fix
  one, decline one the plan rules out, one optional) and is closed; session 2 opens fresh and
  makes the plan's next slice without undoing the fix.
- **A check that can't run.** Make a slice and "make sure every check passes" while one check
  is skipped because its tool isn't installed. A right run says so instead of reporting all
  green.
- **A standing rule.** Three slices, one commit each; the third changes the export format, which
  the repo's `CLAUDE.md` says must also update two named files.

A run is right when hidden tests the model never sees pass, every file it changed was part of
the task (both sides may also touch `CHANGELOG.md`, and the kit side its own `directives/`
folder), and its last reply makes no false claim. A run that isn't right gets up to three
correction rounds, in the same words for both sides, and their cost counts. Cost per correct
result is a side's whole cost divided by its runs right at the end. The runs measured a
pre-release build of the kit, as it stood on 2026-11-20, and later versions may cost more or
less. These are measurements of these runs on these three tasks, not a general effect; the
benchmark repo reports every run, with the method and its limits.

## Checkpoints: why every step starts fresh

This is the idea the whole kit is built on. **Every stage ends by writing its result to a
file, and the next stage starts in a fresh or cleared session, or an agent with a fresh
context, that reads that file.** The plan
lives in `docs/plans/`. Review findings and their verdicts live in `references/CR reviews/`.
Decisions live in memory
(`/odyssey:remember-session`), and the next session's opening message lives in
`directives/handoff/current.md`, with the last one read kept beside it as `previous.md`.

Nothing depends on a session remembering a previous chat. Each session gets a full, fresh
context window and works from the files instead of a long transcript, which is meant to leave
less room for drift than one long session. A checkpoint is also a record: the plan stays in git,
the review findings and their verdicts stay in `references/CR reviews/`, and each commit message
says what changed and why, so when something goes wrong you can see which file said what. The
handoff is the one file cleared once it is read.

## How the cycle works

1. **Shape the idea.** Talk it through with Claude, or run `/odyssey:grill-me` on it: with no
   plan named, it asks one question at a time and keeps the answers as a short plan in
   `docs/grills/`, which step 2 can start from.
2. **Plan.** Write the plan in `docs/plans/`.
3. **Grill.** Stress-test the plan with `/odyssey:grill-me` before any work starts. It asks one
   question at a time and writes each answer into the plan's `## Grilling record` before the
   next question, so a grilling cut short picks up where it stopped. Answers that change the
   plan go back into it.
4. **Make each slice.** Each slice of the plan is made in the session, or by an agent you start
   for it, inside the files it names ([How a slice is made](#how-a-slice-is-made)): test-first
   with `/odyssey:prove-it` where it fits, and, when you want a second look,
   `/odyssey:review-me` against the repo's standards and the plan. Commits wait for your go, and
   so does the first push of a new branch.
5. **Pre-push review (new branches, optional).** Before that first push, ask Claude to run
   CodeRabbit's CLI on the committed branch (`coderabbit review --committed --base <default
   branch>`) and fix what it finds; `/odyssey:make-a-path` suggests this step when a branch has
   commits and no PR. Nothing upstream is watching yet, so mistakes get caught before the
   push opens a PR, and CodeRabbit's PR reviews — which count against your plan's review
   limits — start from a cleaner first commit. Once a PR is open, skip the CLI: the PR bot
   reviews every push, and running both reviews the same diff twice.
6. **Review loop.** Push, open the PR, and run `/odyssey:cr-triage` on it after each CodeRabbit
   round (details below). Claude makes the accepted fixes and, once the gate passes, pushes them
   to the PR's branch without pausing, and the loop repeats until the PR is ready to merge. You
   merge it, or ask triage to merge it once it's ready (see "What triage does").

Around the cycle:

- **Between sessions.** `/odyssey:handoff write` leaves the next session its opening message,
  and `/odyssey:handoff` picks it up. `/odyssey:remember-session` saves the decisions to memory,
  and `/odyssey:index-it` keeps that memory tidy. Claude Code loads only the first 200 lines or
  25 KB of the memory index, `MEMORY.md`, so once it passes 150 lines or 16 KB,
  remember-session runs index-it itself, which proposes a restructure for you to apply. That
  memory folder is the one Claude Code's auto memory writes to, used another way: auto memory
  saves a note whenever Claude judges one worth keeping, while remember-session sweeps the whole
  session at one point, at wrap-up or when you ask, keeps your rulings in your own words, and
  updates the file that owns a topic instead of adding another. That folder,
  `~/.claude/projects/<a folder named after the repo's path>/memory/`, is on your machine only:
  it isn't committed, and teammates don't share it.
- **Docs that drift.** Every gate run has a docs stage, the kit's docs check
  (`scripts/odyssey.mjs docs check`), a script that costs no model tokens. It finds the repo's
  instruction files by walking the repo, git-ignored ones included, with the files they import,
  says when Claude Code loads each one, and checks their claims: every import and every path
  they name exists, every `npm run` names a real script, every ADR they cite exists, and no
  skill or agent under `~/.claude` shadows one of the repo's own. The repo's own docs check
  (`docs.check`) runs after it in the same stage. Your own files under `~/.claude` and the
  managed ones are listed, never edited. A repo with no docs skips the stage.
- **What Claude is told.** `/odyssey:audit`, which you start, answers three questions about the
  instruction files: which ones Claude Code loads and when, beside the load log
  (`hooks.loadLog`) of what did load; which rules sit in files that never load; and which claims
  the code disproves and which rules contradict each other. It reports each finding with its
  fix, and edits nothing.
- **When something breaks.** `/odyssey:heal-me` builds a check that fails on the bug before
  guessing at causes, then makes the fix in the session, with a regression test.
- **A new procedure.** `/odyssey:create-directive` writes a repeatable process down as a
  directive in `directives/`.
- **Schema changes.** `/odyssey:db-migration` generates, reviews and applies a migration with
  the tool in `db.*`, against a local database only. You run it yourself; a schema change you
  describe to it is made in the session and recorded.

### How a slice is made

Planned work, a plan's slice or a scoping document, is made in the session that reads it, or by
an agent it starts, under the kit's rule, `primary.md` ([Project rules](#project-rules)). Before
the first edit, Claude names the files the slice names, with their tests and any file the repo's
own instructions, such as its `CLAUDE.md`, require for that change, and stays inside them.
Another file is changed only after you say yes; otherwise Claude reports it as found, not fixed,
and its last reply names any file changed outside the list. Open choices are decided, not asked
about, unless a wrong guess would be costly to undo. A finished slice is marked done in its
plan, and its commit message says what changed and why. Before each commit Claude makes, in the
session or in an agent, the commit gate runs the repo's gate stages, every one to the end, its
docs stage included, and blocks the commit if one fails.

### The review loop in detail

One round of review runs in two steps. Each can be its own fresh session, and the only thing
passed between them is a file:

| Step | You run | It reads | It writes |
|---|---|---|---|
| 1. Triage | `/odyssey:cr-triage #N` | the PR and CodeRabbit's latest review | `references/CR reviews/pr<N>-<slug>-round<K>.md` and its `.md.resolved` sibling |
| 2. Fix | a request to make the accepted fixes in the `.resolved` file | the `.resolved` verdicts and the findings file | the fix commit, pushed to the PR |

**What triage does.** `/odyssey:cr-triage #N` waits for CodeRabbit to finish reviewing the
latest push (it usually takes 3–4 minutes), then checks whether the PR is ready to merge: no new
actionable findings since the last round, every nitpick, outside-diff comment and non-LGTM
"additional comment" disposed, each accepted one fixed in a commit CodeRabbit has since
reviewed, no answer from CodeRabbit to one of triage's replies that leads triage to change a
verdict, CodeRabbit's status passing and described "Review completed", CI green, a clean merge
state, and no unresolved thread but a deferred finding's. A run that failed still shows a
passing status, so triage reads the status's description too, and asks CodeRabbit for a full
review when the run failed. If the PR is ready, triage says so and stops; it merges only when
you asked it, in that session, to merge that PR once it's ready.

If it isn't, triage writes two files:

- **The findings file** — `references/CR reviews/pr<N>-<slug>-round<K>.md`. Every finding
  verbatim (file, lines, severity, body), inline findings first, then the review's nitpicks,
  its comments on lines outside the diff and its "additional comments" other than a bare
  `LGTM!`, each under a heading of its own, plus a `Source:`
  line naming the CodeRabbit review it came from.
  The next round uses that line to know where the last one ended.
- **The disposition** — the same path plus `.resolved`. For each finding: the verdict (accept,
  defer or reject), the reasoning checked against your ADRs, `CLAUDE.md` and vendor docs (and a
  test's result, when one cheap run settles a claim), and a disposition table.

Triage also fills in the PR description from what it verified, then names the next step.
It changes no code, and the only git it runs are the reads that change nothing, unless you ask
it to make the fixes itself (below) or to merge the PR.

**What the verdicts mean.** An **accepted** finding is fixed in step 2. A **deferred** finding
stays in the `.resolved` file with where it belongs (a phase, a milestone or an issue), and
`/odyssey:what-next` lists it until then. A **rejected** finding keeps its reason in the
`.resolved` file and in the reply on its thread; nothing is written into the code.

**The replies on GitHub.** Once a round is done, triage answers each inline finding's thread on
the pull request in one line: `Accepted — fixed in <sha>: …`, and resolves the thread;
`Declined — …` with the reason, and resolves it; or `Deferred to <target> — …`,
without resolving it. Nitpicks sit in the review's body, not in threads, so they get no reply. The
findings file and the `.resolved` stay on your machine. CodeRabbit answers replies on its own
threads unless its `chat.auto_reply` setting is off, and can save what one says as a learning
that shapes later reviews. When it saves one under a rejection or a deferral, triage says so:
someone with CodeRabbit's Admin role can edit or delete it at app.coderabbit.ai/learnings.

**The `.resolved` file is the fixer's entire input.** Step 2 can start cold, from only that file
and the findings file, so the disposition has to stand on its own.

### CodeRabbit setup

The kit ships no `.coderabbit.yaml`: that file describes your project, so you write it. Any
change Claude makes to it waits for your sign-off on its exact text, since it changes what
every later review sees.

Three settings help the review loop; merge them into the file:

```yaml
reviews:
  auto_review:
    auto_pause_after_reviewed_commits: 0
  path_instructions:
    - path: ".claude/skills/**"
      instructions: |
        A skill: the steps an agent follows for one task. Most rules in it restate
        a home file, such as CLAUDE.md, a rule under .claude/rules/ or package.json.
        Raise a finding only for (1) a statement that contradicts its home file, or
        allows or forbids more than the home does, naming the home file and line;
        and (2) a path, command or script name that doesn't exist, or a command
        described with an effect it doesn't have. Hold the review to the lines this
        PR changes and to restatements of a rule this PR changes elsewhere, and
        leave wording and structure as written.
knowledge_base:
  learnings:
    scope: local
```

- `auto_pause_after_reviewed_commits: 0`: by default CodeRabbit pauses automatic reviews of a
  pull request after five reviewed commits, and triage stops when reviews are paused, so a long
  review loop would stop there. Every push is then reviewed, and each is a review against your
  CodeRabbit plan: past its included reviews, a plan with usage-based reviews on bills each
  reviewed file. The fixer pushes each round once; set a spending cap in CodeRabbit's billing
  settings to bound a long loop.
- The skill files' review: a skill that restates a rule differently from the file that defines
  it changes what an agent does, and so does a step naming a command that doesn't exist. The
  entry leaves wording alone: a full review of such files once took a single pull request ten
  rounds. Add the same entry for any other folder of instructions you keep, such as
  `.claude/agents/**`.
- `learnings.scope: local`: a learning CodeRabbit saves from a reply in this repo shapes only
  this repo's reviews. The default, `auto`, gives a private repo the whole organization's
  learnings.

### Running it by hand (the default) or automated (recommended)

**We recommend running it automated, and turning it on takes one line.** Start triage with
"automate #N until it's ready to merge", and the cycle runs round after round until the PR is
ready to merge (**Automated** below). It's off by default, so no automated round starts until
you ask. Before the first automated run, check the two things it needs: your gate
passes on the branch, and CodeRabbit reviews each push. One round by hand checks both and shows
you what each step does.

**By hand, one review round looks like this:**

1. In a session, run `/odyssey:cr-triage #N`. It ends by naming the `.resolved` file, which
   lists each finding and what to do about it.
2. Have the fixes made: tell that session to make them, or open a fresh one and ask it to make
   the accepted fixes in the `.resolved` file. It makes each fix, runs the gate, then
   commits and pushes to the PR's branch.
3. After CodeRabbit reviews the push, go back to step 1 for the next round.

To carry context across a break, end a session with `/odyssey:handoff write` and start the
next one with `/odyssey:handoff`. The [launcher](#the-launcher) does both at the wrap-up mark:
[`/odyssey:wrap-up`](#wrap-up-and-the-launcher-recommended) writes the handoff, and the next
session opens with `/odyssey:handoff`.

**Automated:** to skip the copy-and-paste between steps, say so in one line when you
start triage:

> automate #N until it's ready to merge

`/odyssey:cr-triage` then chains the steps itself, round after round: it triages, hands the
`.resolved` file to one fixer agent, which makes the accepted fixes, runs the gate and
pushes, then waits for CodeRabbit's next review and repeats. You don't write handoff messages or paste file paths.
It still stops for you when:

- the fixer stops with a question,
- the gate won't go green,
- the git state is unexpected, or CodeRabbit is paused, skipped, or hasn't reviewed within
  about 10 minutes,
- or the PR is ready to merge — merging is yours, unless you asked triage, in that session, to
  merge that PR once it's ready.

The fixes run in an agent with a fresh context, and the triage session keeps only its report,
so a long automated run stays light. An agent can't ask you anything: when the fixer stops with
a question, the triage session asks you for it. The fixer runs under your session's permission
mode, and a permission prompt from it comes to your session.

**Which model runs each step.** Every step runs on the model and effort of the session it runs
in, and the kit sets neither: in an automated chain, the fixer agent runs on the model and
effort of the session that starts it, so a chain stays on the model you chose unless you name
another. Open each session on the model you prefer. To run the fixer on another model,
name the model when you ask for the run, and Claude passes it when it starts the agent; setting
`CLAUDE_CODE_SUBAGENT_MODEL` instead picks one model for every agent that names none. The fixer
takes its session's effort, so set it with `/effort` before the run.

## Wrap-up and the launcher (recommended)

`/odyssey:wrap-up` closes a session so the next one can carry on. In this order, it stops the
session's scheduled jobs and waits for its background agents to report, saves what the session
decided and learned to memory and writes the next session's handoff, then tidies the memory
index when the index is past its target. It asks only when the handoff file already holds
another session's message. Type it yourself at any point; past the wrap-up mark, the band
below offers it, and in a session the [launcher](#the-launcher) started, the kit runs it by itself.

**The wrap-up mark** is how full the context gets before wrap-up is due: 35% of the context
window, and never past 300k tokens, so 70k tokens on a 200k-token window and 300k (30%) on a
1M-token one. The status bar draws it as the `│` on its context bar. Why 35% and not
later: the more the context holds, the likelier Claude is to miss or mix up something in it;
wrapping up takes room of its own; Claude Code can start compacting a conversation automatically
before the window is full, at a point that depends on the model, and the summary that replaces
it keeps less detail; and every turn sends the whole context again, so a fuller context costs
more on every turn. The ceiling is in tokens because the first of those reasons grows with what
the context holds, whatever the window's size. A lower mark means more fresh starts, each with a
start-up of its own. To move the mark, set `ODYSSEY_WRAPUP_PCT` in the `env` block of your user
settings, for example `"ODYSSEY_WRAPUP_PCT": "50"`: it changes the percent, and the mark still
never passes 300k tokens.

**The wrap-up band.** Past the mark, a band above the prompt says "Context 72% used" and offers
**Wrap up** (key `2`), which runs `/odyssey:wrap-up`, and **Not now**. The band shows only in
sessions that loaded the kit, never over a survey, and not again in that session after either
button. `/odyssey:setup` offers it. It's a mod, a plugin whose hooks run inside Claude Code and
draw on its screen, as [peek](#peek-experimental) is: it loads from `~/.claude/odyssey-wrap-up`,
a folder `CLAUDE_CODE_PLUGIN_DIRS` in your user settings names, so it needs Claude Code 2.1.288
or newer and starts with your next session. To remove it, run
`node <the kit's folder>/scripts/odyssey.mjs mod remove wrap-up`.

### The launcher

A command you run instead of `claude`, one per repo, under the name you give it at setup. It
opens the repo in Claude Code from any folder. Once a session passes the wrap-up mark, the kit
asks Claude to run `/odyssey:wrap-up`; the launcher then ends that session and starts the next
with `/odyssey:handoff`, which reads the handoff and carries on. Run `/odyssey:wrap-up` yourself
at any point and the launcher picks it up the same way.

```
ma                                # opens with /odyssey:handoff when a handoff or timer waits
ma "fix the flaky checkout test"  # or with your own first prompt
```

It runs `claude` from your PATH, not a shell alias, and takes a first prompt only: it refuses
claude's own flags (`--model`) anywhere on the line, since the sessions after a wrap-up would
start without them, so quote a prompt that holds a word starting with `-`, as in
`ma "use --force here"`. Set what every session needs in `~/.claude/settings.json` instead
(`permissions.defaultMode`, `model`, `remoteControlAtStartup`).

What it needs, and what it doesn't do:

- **The status bar.** Claude Code tells the status line how full the context is, and the bar
  passes that on to the kit's Stop hook. Without the bar, wrap-up never starts by itself: run it
  yourself, and the launcher still starts the next session.
- **Permissions.** Claude still stops for anything your permission settings ask about. For work
  that runs unwatched, allow what it needs first.
- **Stopping.** Quit Claude Code without wrapping up (`/exit`, or Ctrl+C twice), and the
  launcher ends with it. After three sessions in a row that each wrapped up within 5 minutes of
  starting, likely each started past the mark, it stops and says why.

Setup writes the command to `~/.local/bin` and refuses a name your shell already knows. When that
folder isn't on your PATH, it prints the line that adds it for your shell, and the full path to
run until you open a new terminal. `/odyssey:setup status` names the repo's launcher. To remove
it, run `node <the kit's folder>/scripts/odyssey.mjs launcher remove <name>` in the repo.

## Finding your place: make-a-path and what-next

Two skills read where the repo stands, from its files and git, and write nothing:

- **`/odyssey:make-a-path`**: where you are with the work in front of you, and the one command
  that moves it on: a handoff to read, findings to triage, a branch to push,
  a plan to grill or its next slice. It prints **Here**, **Next**, at most two **Also** lines, and
  where the step should run.
- **`/odyssey:what-next`**: for when you've lost your place across sessions. It lists every open
  thread with the file it came from (uncommitted and unpushed work, unmerged branches, active
  plans, open grilling questions, deferred CodeRabbit findings, the CHANGELOG's unreleased
  section, the last handoff's open flags) and ranks three to pick up.

Their scripts, `odyssey.mjs next` and `odyssey.mjs open`, give the same answer every time for
the same repo. The skills add open pull requests through `gh` when it is installed.

## The skills

The kit has 26 skills. Claude can start six of them on its own, so their descriptions are in its
context. The other 20 run only when you invoke them, or when another skill reads one by path,
and their descriptions stay out of Claude's context.

| Skill | What it does | Claude can start it |
|---|---|---|
| `/odyssey:grill-me` | Interviews you one question at a time to stress-test a plan or idea | Yes |
| `/odyssey:prove-it` | Builds a check that can fail and reports what it shows: a failing test first, or a Confirmed, Denied or Can't tell verdict | Yes |
| `/odyssey:try-it` | Builds a throwaway prototype that answers one design question, and records its verdict | No |
| `/odyssey:shape-it` | Shapes a module's interface (depth, seams, adapters), designing it several ways | No |
| `/odyssey:untangle` | Finds where tangled modules make change hard, ranks them in a report, and grills the one you pick into a plan | No |
| `/odyssey:name-it` | Pins the project's terms down in `GLOSSARY.md`, and records hard-to-reverse decisions as ADRs | No |
| `/odyssey:look-it-up` | Researches a question against primary sources in a background agent and saves the sourced findings to `docs/research/` | No |
| `/odyssey:db-migration` | Generates, reviews and applies a schema migration with the repo's tool, to a local database only | No |
| `/odyssey:mage` | Writes a bash script that walks a person through steps only they can do, checking each and resuming where it stopped | No |
| `/odyssey:cr-triage` | Vets a PR's CodeRabbit findings, or a findings file, into accept, reject or defer, round after round | Yes |
| `/odyssey:review-me` | Reviews changes since a fixed point against the repo's standards and against what the plan asked for | No |
| `/odyssey:heal-me` | Builds a check that fails on a bug, then fixes it with a regression test | Yes |
| `/odyssey:local-gate` | Runs every gate stage, CI's plus a docs check, and reports pass or fail per stage | No |
| `/odyssey:audit` | Checks the repo's instruction files as a whole and reports a fix for each problem; edits nothing | No |
| `/odyssey:wrap-up` | Closes a session: saves memory and writes the next session's handoff ([Wrap-up](#wrap-up-and-the-launcher-recommended)) | No |
| `/odyssey:handoff` | Reads this session's opening message and empties the file, or with `write` leaves the next one | No |
| `/odyssey:remember-session` | Saves this session's rulings, corrections, state and facts to memory | Yes |
| `/odyssey:index-it` | Audits and restructures the memory store when its index grows past its target | No |
| `/odyssey:make-a-path` | Says where the current work stands and the one command that moves it on | No |
| `/odyssey:what-next` | Lists every open thread in the repo with the file it came from, and ranks three to pick up | No |
| `/odyssey:which-one` | Says which kit skill or chain fits what you want, and why | Yes |
| `/odyssey:today-junior` | Re-explains the last message in plain words, each term spelled out with the file it refers to | No |
| `/odyssey:setup` | Sets up the kit in a repo; also `status` and `doctor` | No |
| `/odyssey:create-directive` | Writes a repeatable process down as a directive in `directives/` | No |
| `/odyssey:write-for-claude` | How to write files Claude follows (skills, CLAUDE.md, rules, directives) so it takes the same path every run | No |
| `/odyssey:write-for-me` | Writes as you, in your voice, from a profile a quiz of real situations builds | No |

## Conventions the skills assume

The plugin's skills find their inputs at these fixed paths:

| Path | Holds | In git? |
|---|---|---|
| `.claude/odyssey.json` | The config | Yes |
| `.claude/rules/odyssey/` | The kit-owned rule | Yes |
| `.claude/rules/{sensitive-data,hot-path}.md` | The project rules, each when your answers name something for it | Yes |
| `directives/handoff/current.md` | The next session's opening message | No — setup writes it empty and ignores it |
| `directives/handoff/previous.md` | The last message `/odyssey:handoff` read, kept as a record | No — setup ignores it |
| `directives/handoff/timers.md` | Optional: one-shot timers `/odyssey:handoff` arms again in the next session | No — setup ignores it |
| `references/CR reviews/` | CodeRabbit findings files and their `.resolved` dispositions | No — setup ignores it |
| `docs/plans/` | Implementation plans, each with `**Status:** ACTIVE` in its first five lines, and `CLOSED <sha>` once every slice has landed | Yes |
| `docs/grills/` | A grilling's record when no plan was named | Yes |
| `docs/untangle/` | An architecture review's report, as Markdown and as an HTML page | Your choice |
| `docs/research/` | Research notes, each finding with its source | Yes |
| `.mage/` | A mage script's record of finished stages, never a value | Your choice |
| `docs/adr/` | Architecture decision records | Yes |

They also read `CLAUDE.md`, `CONTEXT.md` and `GLOSSARY.md` when those exist — write your own.

## Requirements

Tested on macOS; CI also runs the automated tests on Linux and Windows.

**Needed:**

- **[Claude Code](https://claude.com/claude-code), the latest release.** CI tests every push
  against the newest release, so that is the one to run. The oldest release the kit's hooks
  can start on is 2.1.139, which added exec-form hooks (the `args` field) that they use on every
  platform. Some extras need later ones: the status bar's spend-limit bar needs 2.1.251, the
  spinner tips 2.1.247, peek 2.1.288, the one-command install from a terminal 2.1.292, and the
  secrets guard's block when Node is missing 2.1.295 (an older release lets the calls through).
- **Node.js 22 or later.** The hooks and the setup script are Node ESM scripts, and their tests
  use the built-in `node --test` runner. Node 20 reached end of life in April 2026.
  `/odyssey:setup` checks for Node first, and each session start tells you when it is missing
  or older. Without a `node` command, from Claude Code 2.1.295 the secrets guard blocks every edit and
  shell command, so Claude can't edit files or run commands until you install Node or turn the kit off with
  `claude plugin disable odyssey`.
- **git.** Setup runs only at the root of a git repo, and the skills and hooks read the repo
  through it.

**For the review loop:**

- **The [GitHub CLI](https://cli.github.com/)** (`gh`), signed in — `/odyssey:cr-triage` reads
  PRs and reviews through it.
- **[CodeRabbit](https://www.coderabbit.ai/)** — the GitHub app on your repo for PR reviews,
  and, if you want a review before a PR exists, its CLI (`coderabbit`).

**Optional:**

- **Python 3** — for the memory survey script that `/odyssey:index-it` and
  `/odyssey:remember-session` run. Without it, remember-session says it skipped its size check.
- **Prettier and ESLint** as devDependencies, only if you switch `formatOnEdit` on. The
  formatter runs the nearest install from the edited file's folder up to the git root, so a
  workspace that installs them once at its root is covered. It does nothing without them, and
  `doctor` fails when it finds no Prettier.

## Install

```
/plugin marketplace add OdysseyStack/oncewright
/plugin install odyssey@odyssey-ai
```

The first command registers the marketplace, named `odyssey-ai`, on your machine. The second
installs the plugin at user scope, so it is on in every project there. For a team, install it
once at project scope instead: `claude plugin install odyssey@odyssey-ai --scope project` records
it in `.claude/settings.json`, which you commit. Each teammate registers the marketplace on their
own machine with the first command, and Claude Code tells them to install the plugin when it
finds it enabled but missing. `claude plugin details odyssey` shows what the plugin adds to a
session.

Each skill's command starts with the plugin's name, as in `/odyssey:handoff`, and you don't have
to type all of it: in the terminal, `/hand` lists `/odyssey:handoff` in the `/` menu, and
`/remem` lists `/odyssey:remember-session`.

Then, in each repo, run `/odyssey:setup` (below). Without it the secrets guard and the zsh guard
still work, the other hooks stay off, and a skill that reads the config falls back to its defaults.
The cycle needs it: setup installs the rule the cycle follows and the handoff file sessions pass
work through.

### Updating and pinning

- **Updates are yours to take.** A marketplace you added yourself doesn't auto-update unless you
  turn that on (`/plugin`, Marketplaces tab). To update by hand: refresh the listing with
  `/plugin marketplace update odyssey-ai`, then update the plugin with
  `claude plugin update odyssey@odyssey-ai` in a shell, or **Update now** on the Installed tab of
  `/plugin`. The new version loads in your next session. Then run `/odyssey:setup` again in each
  repo to upgrade the kit-owned rule it wrote there. The status bar, peek, the wrap-up band and
  the launcher run from copies outside the plugin, which an update leaves as they were; until
  setup refreshes them, each session start names the ones that differ.
- **Pin a version** by adding the marketplace at a release tag:
  `/plugin marketplace add OdysseyStack/oncewright#v1.0.0`. Release tags never move.
  To roll back, pin the previous tag.
- **Every release** bumps `version` in the plugin manifest, which is how Claude Code sees an
  update, and [CHANGELOG.md](CHANGELOG.md) names every hook that changed.

### Turning it off

In a session, `/plugin` (Installed tab) disables the plugin. From a shell,
`claude plugin disable odyssey@odyssey-ai --scope project` turns it off for everyone in the
current repo, and `--scope local` for you alone. Everything the plugin adds goes with it, the
secrets guard included: that is deliberately the only way to switch the guard off in a repo
where editing `.env` is the job.
The status bar, the spinner tips, the wrap-up band, peek and any launcher stay, since they live
in your user settings and your home folder; [Removing it](#removing-it) lists every step to take
them out.

### Removing it

Remove the machine extras first, while the kit's script is still installed. Its folder, written
`<the kit's folder>` in this README, is the `installPath` that `claude plugin list --json` shows
for `odyssey@odyssey-ai`.

1. In each repo with a launcher, run `node <the kit's folder>/scripts/odyssey.mjs launcher remove
   <name>`. In each repo where you approved commands, run
   `node <the kit's folder>/scripts/odyssey.mjs trust revoke`.
2. From any folder, remove the status bar and its rows, the tips, peek and the wrap-up band:
   `bar remove`, `tips remove`, `mod remove peek` and `mod remove wrap-up`, each run as
   `node <the kit's folder>/scripts/odyssey.mjs <command>`.
3. Uninstall: `claude plugin uninstall odyssey@odyssey-ai` (add `--scope project` if you
   installed it there), then `claude plugin marketplace remove odyssey-ai`.
4. What `/odyssey:setup` wrote stays in each repo, and the kit's rules there keep loading in
   every session, naming skills that are gone. Delete what you don't keep as your own:
   - `.claude/rules/odyssey/`, and `sensitive-data.md` and `hot-path.md` beside it, when setup
     wrote them;
   - `.claude/odyssey.json`;
   - `directives/handoff/` and `references/CR reviews/`;
   - the kit's two lines in `.gitignore`.
5. On your machine, delete what's left. In `~/.claude`: `odyssey-trust.json`, the record of the
   commands you approved; `odyssey-loads/`, the load log, if you turned it on; and
   `odyssey-launch/`, a launcher's flag files. In the folder that holds your user settings,
   `~/.claude` or the one `CLAUDE_CONFIG_DIR` names: `settings.json.before-odyssey`, setup's
   copy of your settings from before its first edit, which can still hold your old status line;
   `odyssey-launch.mjs`, if you had a launcher; peek's scratch files, `scratch.png`,
   `scratch.bmp` and `wave.bmp` in `peek/`; and peek's store of the folders you approved, a file
   whose name starts with `peek_` in `plugins/store/`. Last, a launcher's command in
   `~/.local/bin`.

## Fitting it to a repo: `/odyssey:setup`

Run it once at the root of a git repo. It shows one proposal for the project, filled in from
what it finds in `package.json` (or, without one, in the repo's own manifest and task runner)
and the folder layout, which you confirm or change; then it shows a dry run, and writes only on
your yes. It runs each gate stage it proposes once first, timing it, and leaves out one that
fails on the repo as it stands, saying why: a stage whose tool isn't installed would otherwise
block every commit. It leaves out the slowest, one at a time, until the rest take under about
500 s, since the gate has 570 s for them all, and it runs the docs check the gate runs after
them, offering to fix what it finds.
Its writes are create-only: a file the repo already has is never changed, apart from the
`.gitignore` lines below and, on a re-run, the kit's own rules it upgrades and what it retires
(below the list). It writes:

- `.claude/rules/odyssey/primary.md` — the kit's always-on rule, under 1 KB (Quickstart, step
  3), stamped `<!-- odyssey-managed v1.0.0 sha256:… -->` on its first line;
- `.claude/rules/sensitive-data.md` and `.claude/rules/hot-path.md` — your project rules, from
  your answers, each only when your answers name something for it (see below);
- `.claude/odyssey.json` — the config (see below);
- `directives/handoff/current.md` — the handoff file, empty, which sessions relay through;
- two `.gitignore` lines, `directives/handoff/` and `references/CR reviews/`, keeping the
  handoff and the review findings out of commits.

**On a re-run**, setup also retires what builds before this release left, each step in its dry
run: it drops the config keys the kit retired from `.claude/odyssey.json`, the one change it
makes to your config; it removes a retired kit rule from `.claude/rules/odyssey/` that you never
edited; and it removes `directives/layer_3_work_orders/` when it holds only its empty
placeholder. Anything you edited there is kept, and named as yours to delete.

**Outside the repo, only on your yes.** Near the end, setup offers, in one step where you
pick which, the [status bar](#the-status-bar-and-the-theme), the kit's spinner tips, the wrap-up
band and [a launcher](#the-launcher), each recommended, and [peek](#peek-experimental) and
ponytail, not. The bar, the tips and the two mods edit your user settings,
`~/.claude/settings.json`, or the one in the folder `CLAUDE_CONFIG_DIR` names; before its first
edit there, setup saves a copy beside it, `settings.json.before-odyssey`. Run again on a machine
where the bar or peek is on, setup says so and replaces its copy only when this kit version's
differs. It doesn't offer the kit's theme. The launcher goes under a name you choose, in a
question of its own that proposes one no command here has yet: a command in `~/.local/bin`, and
the launcher itself in `~/.claude/odyssey-launch.mjs`.

**Kit-owned and project-owned.** The stamped rule, `primary.md`, belongs to the kit: re-running
`/odyssey:setup` after an update replaces it when it is untouched and out of date. A rule you
edited is kept, its diff shown, and replaced only if you approve it. A rule you deleted is
offered back the same way, unless the whole `.claude/rules/odyssey/` folder is gone: setup then
writes it as on a first run. To take a rule over for good, remove its stamp line: the kit then
treats it as yours. A guard hook keeps Claude's edit tools off stamped files, so project rules go
in `CLAUDE.md`. Everything else setup writes is yours from the start, and a re-run changes it
only to drop the config keys the kit retired (above).

**Trust.** Three hooks run code from your repo: the commit gate runs your gate stages and
`docs.check`, the typecheck gate runs the command you configure, and the formatter runs your own
Prettier and ESLint. Repo config can switch them on, but they
stay off until you approve them: setup prints one command for you to run yourself, in a terminal
or with `!` in the session. If you drive the session through remote control, `!` may not be
available there, so use a terminal on the machine. The record is keyed by the repo's path, as
the file system spells it, and the exact command text, so a repo at a new path asks again, and
a changed command stops until you approve it again. The repo and its git worktrees share one
record: approving in any of them records that checkout's commands for all of them, in place of
the ones approved before.
The exception is a repo whose own checkout has a `.git` file or a symbolic link in place of
the `.git` folder (a submodule, a clone made with `--separate-git-dir`, or a `.git` linked
in from elsewhere): each of its worktrees asks again. It does not cover what the command
runs: a changed script behind the same command is not approved again. The secrets guard
keeps Claude's edit tools off the trust file, and blocks shell commands that name it or the
approve command; that second check is pattern matching, and best-effort (see Known limits).
The record is per person and per machine, and no environment variable stands in for it,
since a repo's own settings file could set one. In CI, run the approve command as a step of
the pipeline, before the session starts. `node <the kit's folder>/scripts/odyssey.mjs trust list`
shows every command you approved, in every repo, and `trust revoke`, run in a repo, drops that
repo's.

**Ponytail.** Setup offers ponytail, a separate plugin, in the same question as the status bar,
and gives its two install commands when you pick it. Why we recommend it is
[below](#why-we-recommend-ponytail).

Commit `.claude/odyssey.json`, `.claude/rules/` and `.gitignore`: the config is the project's
settings, shared with everyone who works on it.

### Status and doctor

- `/odyssey:setup status` — the hooks on in this repo, each configured command's trust, the
  config version, whether the kit-owned rule is up to date, edited or missing, and whether a
  handoff message is waiting, without showing it.
- `/odyssey:setup doctor` — Node 22 or later; the config valid against the bundled schema, with
  nothing in it that silently does nothing: a typecheck gate that is on names its command,
  `formatOnEdit` finds Prettier, and each `srcDirs` and `testDirs` entry is a folder in the repo,
  spelled as on disk; each command a switched-on hook runs is trusted, or the approve command
  to run; no settings file turning the hooks off (`disableAllHooks`); and, for each
  guard that is on, a test call it must block; when the status bar is on, that its script is
  in place (a copy from another kit version passes, with a note that setup replaces it); and
  when peek or the wrap-up band is on, that its copy is in place and matches this kit version,
  since an older peek may hold older secret-file patterns. It exits
  non-zero on any FAIL and says what fixes each one.

## The config: `.claude/odyssey.json`

What the kit runs or matches on, in one committed file. Only `version` is required; every other
key has a default, and an unknown key is an error, so a typo shows up in `doctor`. An invalid
file switches the opt-in hooks off and shows one notice, so a bad config never locks a session.

| Key | Holds | Default |
|---|---|---|
| `version` | The config format, `1` | required |
| `$schema` | The schema's URL, for editors; setup writes it | — |
| `project` | The project's name | none |
| `srcDirs`, `testDirs` | Source and test directories | `["src"]`, `["test"]` |
| `gate.stages` | The stages `/odyssey:local-gate` runs, and the commit gate before each commit, each `{ "name", "command" }` | for local-gate, the `package.json` scripts; the commit gate needs them named |
| `gate.fix` | The auto-fix commands its `fix` mode runs first | none |
| `db.schemaFile`, `db.seedFile`, `db.generate`, `db.migrate`, `db.seed` | The migration flow `/odyssey:db-migration` drives | none: the skill says there is no migration flow |
| `docs.plan` | A plan outside `docs/plans/`, which make-a-path and what-next read too | none |
| `docs.check` | The repo's own docs check, which the gate's docs stage runs after the kit's | none |
| `protect.secrets` | Extra secret-file patterns, added to the guard's defaults | none |
| `protect.manifests` | Extra dependency manifests, added to the defaults (npm's, Yarn's and pnpm's) | none |
| `protect.readOnly`, `protect.appendOnly` | File names only a human edits; file names Claude may only append to | none |
| `hooks.protectManifest`, `hooks.protectAppendOnly`, `hooks.formatOnEdit`, `hooks.esmImportExtension`, `hooks.loadLog` | The opt-in hooks' switches | off |
| `hooks.commitGate` | `false` turns the commit gate off | on when `gate.stages` is set |
| `hooks.typecheckGate` | `{ "enabled", "command", "timeoutSec" }` | off; `timeoutSec` 300 |

```json
{
  "$schema": "https://raw.githubusercontent.com/OdysseyStack/oncewright/main/schema/odyssey.v1.json",
  "version": 1,
  "project": "shop",
  "srcDirs": ["src"],
  "gate": { "stages": [{ "name": "typecheck", "command": "npm run typecheck" }, { "name": "test", "command": "npm test" }] },
  "protect": { "appendOnly": ["journal.md"] },
  "hooks": { "protectManifest": true, "protectAppendOnly": true, "typecheckGate": { "enabled": true, "command": "npx tsc --noEmit" } }
}
```

The schema ships in the plugin (`schema/odyssey.v1.json`), so `doctor` validates offline.

### Project rules

What Claude should know about the project lives in rules, not in the config:

- **`.claude/rules/sensitive-data.md`** — the categories and field names this project must
  never log, never a value, and where its credentials live, with the rule for reading one:
  confirm it is set, never print it. Always loaded.
- **`.claude/rules/hot-path.md`** — its `paths:` frontmatter names the latency-critical files,
  so it loads only when Claude works on them, and its body holds their invariants.

Setup writes each only when your answers name something for it. Everything else about the
project goes in `CLAUDE.md`, which is yours.

The kit's own rule is one file, `.claude/rules/odyssey/primary.md`, under 1 KB: scope, deciding
instead of asking, git, and how a reply ends. Its git rule holds the one approval given ahead:
while a PR is open, commits to that PR's own branch and normal pushes go ahead, never to the
default branch and never a force-push, a merge or a rebase. What a script can check is a hook
instead of a rule: the commit gate runs the gate before each commit, and the zsh guard blocks
the shell syntax Claude Code's safety check refuses ([Hooks](#hooks)).

## The status bar and the theme

Two of the extras `/odyssey:setup` offers for your machine, each with yes recommended, are a
status bar that shows what the session is using as you work, and spinner tips about the kit. A plugin
can't switch on a status line or tips by itself, so setup asks. Both go in your user settings,
`~/.claude/settings.json`, so they show in every project on this computer and are never
committed. The kit also ships a color theme, which nothing turns on for you.

### What the bar shows

```
[ODYSSEY]  ♾  ctx ██████░│░░░░░░░░░░░░░ 30%  Opus 5.5 · max  plan ≈ $1.84 at API rates · handoff waiting
5h █████░░░░░░░░░░░░░░░ 24% · resets 4:10pm  1w ██████░░░░░░░░░░░░░░ 31% · resets Mon 9am
```

Here `█` is a used cell and `░` a free one; the bar itself draws used cells in the logo's cyan
and free ones in navy.

| Part | What it shows |
|---|---|
| `[ODYSSEY]` | The kit's badge. |
| `♾` | The Odyssey logo, an emoji drawn by your terminal's emoji font. |
| `ctx` | How full Claude's context window is, as Claude Code reports it. Claude Code counts input tokens only, so a reply counts once the next request sends it back. Before the first reply it reads 0%. The `│` is the wrap-up mark. |
| `Opus 5.5 · max` | The model and the effort level, as Claude Code reports them. |
| the cost | An estimate of what the session has cost so far, and who pays: see [The cost](#the-cost). |
| `handoff waiting` | Shown in gold while the repo's handoff file holds a message for the next session, which `/odyssey:handoff` reads. |
| `5h`, `1w` | How much of your plan's five-hour and weekly usage limits is used, and when each starts again in your computer's local time: the five-hour one as a time of day (`4:10pm`), the weekly one with its day (`Mon 9am`). Claude Code sends these on Pro and Max plans, and only after Claude's first reply in a session; until then the row is left out. A bar turns gold at 80%. Claude Code sends no monthly figure, so the bar shows none. |
| `spend` | Behind a Claude apps gateway that sets you a spend limit: how much of it is used, which can pass 100%, and when it starts again. Gold at 80%, like the plan's limits. |

**Rows.** The bar takes up to three rows of its own, below any rows of a status line you kept,
each only when it has something to show: the first always; the messages (`handoff waiting` and
the wrap-up hint) at the end of the first row when they fit there whole, otherwise on a row of
their own below it; and the limits last. Claude Code cuts off whatever runs past the room it
gives the status line, the terminal's width less two columns on each side (as of 2.1.287), so
on a narrow terminal the bar shortens or drops parts to fit that room. Row by row, in this
order:

- the first row: the cost drops `at API rates` (or `billed`), then the model goes, then the
  context bar shrinks to ten cells, then the cost goes, and last a status line you kept in front
  moves to a row of its own above;
- the messages: the wrap-up hint becomes `wrap up now`, then `handoff waiting` goes;
- the limits: the reset times go, the last window's first, then the bars shrink to ten cells,
  then only the first window stays.

A terminal narrower than a row's shortest form still cuts that row, and a notification Claude
Code shows at the row's right end can cut it short.

**The wrap-up mark.** Past the mark (35% of the context window, never past 300k tokens), the
context bar turns gold and, in a repo setup has fitted (one with `directives/handoff/`), the
messages say `wrap up: /odyssey:wrap-up`. What that command does, why the mark sits there and how
to move it are in [Wrap-up and the launcher](#wrap-up-and-the-launcher-recommended).

**[ODYSSEY] and ponytail.** A status line you had before setup stays in front of the bar,
unchanged, with one exception: when it is ponytail's and prints ponytail's default badge,
`[PONYTAIL]`, the bar leaves that badge out and `[ODYSSEY]` stands in its place. Its
`[PONYTAIL:LITE]` and `[PONYTAIL:ULTRA]` badges still show, since they mean ponytail has changed
how Claude works. Ponytail offers its status line only when none is set, so if you install it
after the bar, it doesn't add its badge. [Why we recommend ponytail](#why-we-recommend-ponytail)
is unchanged.

### The cost

Claude Code gives the bar its own estimate of what the session has cost, at list prices. It can
differ from your bill, hence the `≈`, and it starts again at $0 after `/clear`. Claude Code
doesn't say how you pay, so the bar reads two signs:

- `plan ≈ $1.84 at API rates`: Claude Code sent your plan's 5-hour or 7-day usage, which it
  does on Pro and Max plans. Your plan covers the session; the figure is what the same work
  would cost at API prices.
- `API ≈ $1.84 billed`, in gold: the environment Claude Code gives the bar holds
  `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN`, or switches on Bedrock, Vertex or Foundry
  (`CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, `CLAUDE_CODE_USE_FOUNDRY`). That
  environment includes the `env` block of your settings. The spend is billed to that account.
- `≈ $1.84 est.`: neither sign. A Pro or Max session shows it until Claude's first reply, when
  the plan's figures arrive, and so does an API account you signed in to with `/login` while
  no key is in the environment.

On a narrow terminal the first two shorten to `plan ≈ $1.84` and `API ≈ $1.84`.

### Spinner tips

While Claude works, Claude Code shows a tip in the spinner line. Setup offers these about the kit,
added to Claude Code's own tips, which stay:

- Ending a session? `/odyssey:wrap-up` saves what this session decided and learned to memory,
  then writes the next session's handoff.
- Something broke? `/odyssey:heal-me` builds a check that fails on the bug, makes the fix with a
  regression test, and records what was learned.
- `/odyssey:setup status` shows which of the kit's hooks are on in this repo, and whether a
  handoff is waiting.
- CodeRabbit reviewed your PR? Run `/odyssey:cr-triage` with its number: it checks each finding
  against the code and accepts, rejects or defers it, or reports the PR ready to merge.
- A process you keep explaining? `/odyssey:create-directive` writes it down in `directives/`
  from the kit's template: its goal, inputs, outputs, steps and edge cases.
- The kit's secrets guard blocks Claude's writes to `.env` files, private keys and other secret
  files. To protect more, add patterns to `protect.secrets` in `.claude/odyssey.json`.

They're in your user settings under `spinnerTipsOverride`, each with an `id` that starts with
`odyssey-`.

### The Odyssey theme (optional)

The kit ships a color theme, Odyssey, made for dark terminals. Nothing turns it on: setup doesn't
ask about it, and Claude Code keeps the theme you use. To try it, run `/theme` and pick Odyssey,
marked as from the odyssey plugin; to go back, run `/theme` again. On a light background, keep a
light theme: there is no light version.

The theme recolors Claude Code itself, not text a status-line script colors on its own: the bar
keeps its colors under any theme.

### What it reads and runs

The bar reads what Claude Code passes it, and the repo's handoff file only to see whether it
holds anything. It runs the status line you had before, if any (on Windows, after `where git`
to find Git Bash for it), and nothing else. It sends nothing anywhere, and writes one file only
in a session the launcher started: the session's id, the context's percentage and the window's
size, in `~/.claude/odyssey-launch/`, where the kit's Stop hook reads them. It's one Node script,
which setup copies to `~/.claude/odyssey-statusline.mjs`: a copy, so it keeps working when the
plugin updates. Setup replaces it whenever this kit version's copy
differs, so don't edit it. `/odyssey:setup doctor` checks that it's there, and notes when it
differs from this kit version's.

### Removing the bar and the tips

They stay when you turn the plugin off or uninstall it, since they live in your user settings.
Remove them before you uninstall, while the kit's script is there, from any folder:

```
node <the kit's folder>/scripts/odyssey.mjs bar remove
node <the kit's folder>/scripts/odyssey.mjs tips remove
```

`bar remove` puts back the status line you had before setup, takes the bar out of `statusLine`
(and out of `subagentStatusLine`, where 1.0.0 also put it), and deletes
`~/.claude/odyssey-statusline.mjs` and its `.prev` file. `tips remove` takes out each tip whose
`id` starts with `odyssey-`, keeping your own. If you set `ODYSSEY_WRAPUP_PCT` in the `env`
block, delete it yourself. Your settings as they were before setup's first edit are in
`~/.claude/settings.json.before-odyssey`.

## Peek (experimental)

Peek shows a file in a pane inside Claude Code, so you can read it without minimizing the session window.
`/odyssey:setup` offers it. It needs Claude Code 2.1.288 or newer.

- `/peek <path>` shows a file from this repo or one of its worktrees: Markdown, code with line
  numbers, CSV as a table, JSON, the text of a PDF or Word file, a picture as a preview drawn in
  colored blocks, and an audio file's details with its waveform. `/peek <path>:<line>` opens at
  that line.
- `/peek` alone lists the files this session touched and the repo's newest, with a filter box
  over all of its files. `/peek diff` lists the files changed since the last commit and shows
  each one's diff.
- `/peek allow <folder>` lets it show a folder outside the repo, after you say yes;
  `/peek disallow <folder>` takes that back. It won't approve the top of a drive, your home
  folder or one that holds it, a system folder or one every user shares (such as `/tmp` itself),
  a key folder (`~/.ssh`, `~/.gnupg`, `~/.aws`), or Claude Code's own folder. Started in such a
  folder, or in a repo that is one, peek shows nothing from it and says why.
- In a file, `e` puts `In <path>: ` in the prompt for you to say what to change; Claude makes
  the change with its usual tools, in one turn. After Claude writes or edits a file, a line
  above the prompt offers `1` to open it and `2` to show its diff.

**Secret files.** Peek refuses every file the secrets guard protects (its list, plus your
`protect.secrets`), and a link that leads to one. The one exception is a `.env` file, which
opens in an editor that masks every value (`v` shows the selected one); the values stay in that
pane until a save, which writes them to the `.env` file through a temporary file beside it, in
a folder only you can open on macOS and Linux. Peek reads the patterns from a copy of the guard
in its own folder and refuses every file while that copy is missing.

**What it runs.** Git, to list files and diffs; `pdfinfo` and `pdftotext` for PDFs, `ffmpeg`
and `ffprobe` for pictures, audio and video, and, off macOS, `unzip` or `tar` for a Word or
OpenDocument file over 4 MiB, when they're installed; on macOS, its own `sips`, `afinfo` and
`textutil`; and, to save a `.env`, `stat`, `mktemp`, `chmod`, `mv`, `rm` and `rmdir`, or
PowerShell on Windows.
Each runs by its arguments, with a time limit, never through a shell. When a reader is missing,
peek names the command that installs it.

**How it's installed.** Peek is a mod, a plugin whose hooks run inside Claude Code and draw on
its screen. It loads from a folder named in `CLAUDE_CODE_PLUGIN_DIRS`, the list of plugin
folders Claude Code reads when a session starts, so peek starts with your next session. Setup
runs `scripts/odyssey.mjs mod install peek`, which copies peek and the guard to
`~/.claude/odyssey-peek` and adds that folder to the list in the `env` block of your user
settings, after the folders already there (on Windows the list is separated by `;`, elsewhere by
`:`). A list set only in the environment Claude Code starts from gives way to the one in your
settings, so the script names those folders for you to add. `mod status peek` says whether it's
on and current. Re-running setup replaces the copy when this kit version's differs, which is how
peek's secret-file patterns follow the kit's.

### Removing peek

Run `node <the kit's folder>/scripts/odyssey.mjs mod remove peek`, where the kit's folder is the
`installPath` that `claude plugin list --json` shows for `odyssey@odyssey-ai`. It takes
`~/.claude/odyssey-peek` out of `CLAUDE_CODE_PLUGIN_DIRS`, deleting the key when nothing else is
left in it, and deletes the folder. By hand, it's those two steps. Peek's scratch files and its
store of approved folders stay; [Removing it](#removing-it), step 5, names them.

## Hooks

Eleven hooks, each its own process. Ten are Node scripts wired in exec form (`node <script>`, no
shell), so they start the same way on macOS, Linux and Windows; `node-check` is a plain shell
script, since its job is to run where Node can't. Five are always on: the two file guards,
`node-check`, the session-start hook, and `bash-guard`'s zsh guard. `bash-guard`'s commit gate is on wherever the
config names gate stages; `wrap-up-stop` acts only in sessions the launcher started; the rest
are switched on per repo in `.claude/odyssey.json`. None adds to Claude's context until it
fires.

| Hook | Fires | Does | On | When it fails |
|---|---|---|---|---|
| `node-check` | when a session starts, resumes, is cleared or is compacted | prints nothing when `node` is 22 or later; otherwise shows you that the kit's hooks need Node.js 22 or later, that without `node` the secrets guard blocks every edit and shell command (Claude Code 2.1.295 or later), and that `claude plugin disable odyssey` turns the kit off. On Windows it runs under Git Bash, which Git for Windows installs | always | open |
| `session-start` | when a session starts, resumes, is cleared or is compacted | tells Claude, before its first turn, that the session was compacted or that a handoff message is waiting, without reading the message to it; and shows you a line for a waiting handoff, and one naming any copy setup made outside the plugin (the status bar, a mod, the launcher) that differs from this kit version's, except after a compaction | always | open |
| `load-log` | when Claude Code loads an instruction file: a `CLAUDE.md`, a rule, or a file one of them imports | writes one line naming the file, the session and why it loaded to `~/.claude/odyssey-loads/`, which the docs check and `/odyssey:audit` read; past 256 KB the log starts over. An `AGENTS.md` that Claude Code reads without an import sends no load event, so the log never lists it | `hooks.loadLog` | open: Claude Code ignores its result |
| `protect-env`, the secrets guard | before Edit, Write, MultiEdit, NotebookEdit, Bash, PowerShell and the MCP file tools | blocks a write to a secret file, and keeps Claude's tools off the trust file and the approve command | always | closed: an error inside it blocks, and so does a failure to start or a timeout (Claude Code 2.1.295 or later) |
| `protect-managed` | before Edit, Write, MultiEdit, NotebookEdit | blocks edits to a file `/odyssey:setup` stamped | always | open |
| `bash-guard` | before Bash and PowerShell | the zsh guard: blocks a Bash command that uses zsh's `${(P)…}` or `${(f)…}`, which Claude Code's safety check refuses, and names the plain test to use. The commit gate: before a `git commit` (`git -C <dir> commit` and a commit in a chain included), runs `gate.stages` and the docs stage, every one to its end, once trusted, and blocks the commit with the failing stages' names and the end of their output; a green gate is silent | the zsh guard always; the commit gate when `gate.stages` is set, unless `hooks.commitGate` is `false` | open |
| `protect-manifest` | before Edit, Write, MultiEdit, NotebookEdit | blocks hand edits to `package.json`, the npm, yarn and pnpm lockfiles, and `protect.manifests` | `hooks.protectManifest` | open |
| `protect-append-only` | before Edit, Write, MultiEdit, NotebookEdit | blocks any edit to `protect.readOnly`, and anything but an append to `protect.appendOnly` | `hooks.protectAppendOnly` | open |
| `post-edit` | after Edit, Write, MultiEdit | formats the edited file with the repo's own Prettier and ESLint (`hooks.formatOnEdit`, once trusted), then flags relative imports without a `.js` extension in TypeScript under `srcDirs` and `testDirs` (`hooks.esmImportExtension`) | each switch | open |
| `wrap-up-stop` | when Claude stops, in a session the [launcher](#the-launcher) started | past the wrap-up mark, asks Claude to run `/odyssey:wrap-up`, never twice in a row; after wrap-up's last step, tells the launcher to start the next session, once no background agent, workflow, teammate, shell task or Monitor is still running | in sessions the launcher started | open |
| `typecheck-gate` | when Claude stops while the working tree holds uncommitted TypeScript changes under `srcDirs` or `testDirs` | runs `hooks.typecheckGate.command`, once trusted; errors send Claude back to fix them, with the end of a long report kept, and a second failure yields to you. A change committed before the stop is not checked here: the commit gate covers commits | `hooks.typecheckGate.enabled` | open |

**Fail closed, fail open.** Claude Code lets a call through when a hook crashes, can't start (no
`node` on the PATH) or times out; `node-check` tells you at each session start when `node` is
missing or older than 22. The secrets guard is the exception: its entries in `hooks.json` carry
`"onFailure": "block"`, so from Claude Code 2.1.295 a guard that can't start or times out blocks
the call, and it catches every error of its own and blocks, so an unreadable payload or an
unresolvable path is a block, not a pass. The others fail open: on an
error of their own they let the call through without a message. An invalid config, or a start
folder that can't be read, is announced once per session; the opt-in hooks are then off and the
secrets guard keeps its default patterns, so neither locks a session. Timeouts are explicit: 10
seconds for `node-check`, the file guards, the session-start hook, the load log and
`wrap-up-stop`, 30 for `post-edit`, the typecheck gate's own `timeoutSec` (default 300, at most
590) under a 600-second ceiling, and 570 seconds for all the commit gate's stages together, under
`bash-guard`'s 600-second ceiling, which its zsh guard shares. A typecheck gate that
times out lets the turn end and says so; a commit gate stage still running at its limit fails
the gate, so the commit waits.

**Runs fully offline.** No hook sends anything anywhere. The network access in the kit is what
you run yourself: `gh`, CodeRabbit's CLI, and your own gate commands
([What it runs, writes and sends](#what-it-runs-writes-and-sends)).

**Subagents too.** Hooks fire on the tool calls of subagents, a fixer agent's included.

**Tests.** Each hook, the setup script and the status bar have tests under `hooks/` and `scripts/`, run with
`node --test "**/*.test.mjs"` from the plugin root (`node --test hooks/protect-env.test.mjs` for
the guard alone). Peek's and the wrap-up band's tests run with `claude plugin test mods/peek` and
`claude plugin test mods/wrap-up`. CI runs all of them on macOS, Linux and Windows, the
`node --test` ones on Node 22 and 24 (on macOS, 24 only).

### The secrets guard

**Files it protects**, in edits and commands alike, whatever the letter case: `.env*`; `*.pem`,
`*.key`, `*.p12`, `*.pfx`; `id_rsa*`, `id_ed25519*`, `id_ecdsa*`; `.aws/credentials`, `.netrc`,
`.pypirc`, `credentials.json`, `secrets.yaml`, `secrets.yml` and `secrets.json`. A name that
ends in `.example`, `.sample`, `.template`, `.dist` or `.pub` is left alone under every
pattern, as a template or a public key, so `.env.example` and `id_rsa.pub` stay writable, and
so does `.env.pub`. `protect.secrets` adds patterns (`.npmrc`, say, `config/*.local.yaml`, or
`**/*.secret`, where `**/` stands for any number of folders, none included) and never removes
one.

**Two branches, two guarantees.** For Edit, Write, MultiEdit, NotebookEdit and the MCP file
tools (`write_file`, `edit_file`, `move_file` and `edit_block`, through their `path`,
`filePath`, `file_path` and `destination` fields) the check is exact: it resolves the path to
the file a write would land on, so a symlinked file or folder can't disguise a `.env`, and a
`.env` that links to an innocent name is blocked too. For Bash and PowerShell it is pattern
matching on the command string, and best-effort by construction. It reads redirections, `tee`,
`touch`, `truncate`, the destination of `cp`, `mv`, `install`, `ln`, `rsync` and `scp` (for the
first four, a copy into a folder too, whether its name ends in a slash or names a folder that
exists in the session's working folder),
`sed -i`, `perl -i`, `ruby -i`, `dd of=`, a tool's own output flag (`openssl -out`, `curl -o`,
`wget -O`, `gpg --output`, `ssh-keygen -f` and the like, alone or closing a run of short flags,
as in `curl -sSLo`), and in PowerShell `Set-Content`, `Add-Content`, `Out-File`, `Tee-Object`,
`Copy-Item`, `Move-Item`, `Rename-Item`, `New-Item`, their aliases,
`Invoke-WebRequest -OutFile`, `>` and `>>`, and the .NET file writes. A quoted argument that
holds `;`, `|`, `&` or parentheses stays one argument, and a command continued over several
lines is read as one: a line ending in a backslash in Bash, or a backtick in PowerShell. Reading
a secret is left alone: the rule is about writing them. How Claude reads one without printing it
is a rule, not a hook: the credentials section of `.claude/rules/sensitive-data.md`, which
`/odyssey:setup` writes. The guard errs toward blocking, so a command that merely quotes one of
these writes is blocked with it; make such an edit through the Write tool, whose branch reads
the real path.

### Threat model

The secrets guard is a guardrail against Claude's mistakes in a workspace you trust. It is not
a boundary against a model or a repo set on getting around it, and it guards neither the
plugin's own files nor Claude Code's settings. The known ways around it:

- **`bypassPermissions` mode**, where nothing stops Claude from writing the settings that switch
  hooks off. In the default modes that write is refused or asks you.
- **A repo's own `.claude/settings.json`**, which can set `disableAllHooks`. In `claude -p`
  runs a repo's committed settings apply without a trust prompt.
- **An edited hook script** in the plugin's installed copy, or an edited file in peek's copy,
  `~/.claude/odyssey-peek`, whose code runs inside Claude Code with no guard checking it;
  `/odyssey:setup doctor` fails a peek that differs from the kit's.
- **Interpreter one-liners** (`node -e`, `python -c`) that open a secret file themselves, which
  the command branch can't see.

To enforce a guard across an organization, use Claude Code's managed settings: they can limit
hooks to those from managed settings and force-enabled plugins, and a repo or a session can't
turn them off. `/odyssey:setup doctor` reports a `disableAllHooks` setting when it finds one.

### Known limits

What the command branch leaves open, beyond the one-liners named above: a path in a variable
(`f=.env; echo x > "$f"`); archive extraction; recursive copies of `.ssh` or `.aws`;
`git restore`, `git checkout` and `git stash`, which write files git tracks; `awk -i inplace`;
CLIs that write secrets without naming a file (`vercel env pull`, `aws configure set`); quote
splicing (`echo x > .e""nv`); `scp host:.env .`; a copy into a folder with `rsync` or `scp`
(`rsync .env backup/`); an output flag that closes a run of short flags with its value attached
(`curl -sSLo.env`); `git add` and `git commit`, which the guard does not read; and a symlink
chain whose middle link has a secret name (`notes.txt → .env → settings.txt`). Each reopens if
it turns out to be a common vector.

The check that keeps shell commands off the trust file and the approve command is the same
pattern matching: a command that builds either name from a variable or a wildcard passes it.

The other three guards check Claude's edit tools only, so a shell command that writes the same
file passes them. The secrets guard checks four MCP tool names (`write_file`, `edit_file`,
`move_file` and `edit_block`); an MCP server that writes under another tool name is not
checked.

Every hook reads the config of the folder the session started in, with three exceptions for
another checkout of the same repo (a linked git worktree, or the repo's own checkout seen from a
session started in one): `post-edit` reads the config of the checkout the edited file is in, the
commit gate runs the gate stages of the checkout the commit goes into, and the typecheck gate
checks the checkout Claude's current folder is in. The gate follows that
folder only, so a TypeScript file edited in another checkout while Claude's folder stays in the
session's own gets the import check but not the gate. The formatter runs the Prettier and ESLint
installed in the edited file's checkout, so a worktree with no `node_modules` of its own is not
formatted.

The docs check lists what loads in a session started at the repo root under Claude Code's
default **Project instructions** setting. A session started in a subfolder, or a setting changed
in `/config`, loads another set; the load log shows what did load.

The commit gate reads a command the way a shell splits it, so it finds `git commit` after
`&&`, `;` or a pipe, with `-C` or other git options in front, and not in quoted text, a comment,
a heredoc body or `git commit-tree`. A commit inside `bash -c "…"`, a `$(…)` or a git alias is not
seen, and a commit into another repo is left to that repo's own sessions. It runs only the
stages the config names, never `package.json`'s scripts as a fallback, and has no `fix` mode.
A gate whose stages take more than 570 s in all fails every commit on time; keep the slow suites
for CI. A stage that leaves a background process holding its output keeps the gate waiting for
it.
The zsh guard matches the command's text, so a command that only quotes `${(P)…}`, in a commit
message say, is blocked too: write the message to a file and use `git commit -F`.

Four parts of the kit are for JavaScript and TypeScript: the typecheck gate fires on TypeScript
changes, the formatter runs Prettier and ESLint, the import check reads TypeScript imports, and
the manifest guard's defaults are npm's, Yarn's and pnpm's files (list others in
`protect.manifests`).

What it blocks by mistake: prose that names `touch .env` or `cp … .env` in a one-line commit
message or a heredoc body (use `git commit -F` or `--body-file` instead); `ls -o <key>` and
`ls -lo <key>`, whose `-o` reads as an output flag; and `grep -o '<secret-like pattern>'`.
`.envrc` is blocked, since `.env*` covers it.

## Windows notes

- The hooks run as `node <script>` with no shell, so paths with spaces need no quoting, and Git
  Bash is not required. CI runs the tests on `windows-latest`.
- The secrets guard reads the PowerShell tool's commands as well as Bash's, including the
  aliases (`sc`, `ac`, `ni`, `copy`, `move`, `ren`) and `[IO.File]::WriteAllText`.
- The trust command setup prints carries the script's full path in quotes. Run it in PowerShell
  or Git Bash, or with `!` in the session.
- A launcher's command is a `.cmd` file in `%USERPROFILE%\.local\bin`; add that folder to your
  PATH. When a session wraps up, the launcher ends Claude Code's whole process tree with
  `taskkill`, since Claude runs inside the shell that opens its `.cmd` shim.
- When the typecheck gate hits its `timeoutSec`, it stops waiting and the turn ends, but on
  Windows the command it started keeps running until it finishes on its own.
- The plugin's files are LF (`.gitattributes` pins it). A kit-owned rule's stamp hashes the file
  with line endings normalized, so a CRLF checkout of your repo still reads as untouched.
- `/odyssey:index-it`, and `/odyssey:remember-session`'s size check, need a `python3` command on
  the PATH.
- Peek's folder is added to `CLAUDE_CODE_PLUGIN_DIRS` with `;` between folders, the separator
  Claude Code reads that list with on Windows. A `.env` saved in peek's editor is swapped in by
  PowerShell's `File.Replace`, which keeps the file's permissions.
- The status bar's command names its script by the full path, with forward slashes and in
  quotes, as Claude Code's docs advise: on Windows, Claude Code runs a status line through Git
  Bash when it's installed, and through PowerShell otherwise.

## What it runs, writes and sends

The kit sends nothing and fetches nothing itself. Network access comes only from what Claude
runs for you, such as `gh` and CodeRabbit's CLI in the review loop, your own gate commands, and
the web pages a skill like `/odyssey:look-it-up` reads through Claude Code's own tools. The page
`/odyssey:untangle` writes loads Tailwind and Mermaid from their CDNs when you open it in a
browser, and an editor that fetches the config's `$schema` URL is the editor's doing.

What runs on your machine, part by part:

- **The hooks:** ten Node scripts Claude Code starts on its events; [Hooks](#hooks) lists each.
  They read the repo's config and the files a call names, and some run `git` to read the repo;
  `wrap-up-stop` also reads the last 256 KB of the session's transcript, for the token counts of
  the turn's last request.
  Three run your own commands, each only once you approve it: the commit gate runs
  `gate.stages` and `docs.check` through a shell, the typecheck gate runs its command, and
  the formatter runs your repo's Prettier and ESLint. Two write outside the repo: `load-log`,
  under `~/.claude/odyssey-loads/` when `hooks.loadLog` is on, and `wrap-up-stop`, which turns
  the flag wrap-up leaves in `~/.claude/odyssey-launch/` into the launcher's signal. A hook that
  shows you a notice once per session marks it shown with an empty file, `odyssey-notice-<id>`,
  in the system's temp folder.
- **Setup:** it runs each gate stage it proposes once, through Claude's shell tool, to time it,
  then its script, `scripts/odyssey.mjs`, writes the repo files listed under Fitting it to a
  repo, above. The approve command, which you run yourself, writes the trust record described
  under Trust, above.
- **The status bar:** the status line you had before, if any; in a session the launcher
  started, it also writes the context's percentage and the window's size to
  `~/.claude/odyssey-launch/`.
- **The launcher:** `claude` and `git`, with three small flag files in
  `~/.claude/odyssey-launch/` while it runs, and `taskkill` on Windows to end a session.
  `launcher install`, and `launcher status`, which setup runs each time to propose a free name,
  run `command -v <name>` in an interactive shell (`$SHELL -i`; `where` on Windows) to see
  whether a name is taken, so your shell's startup files run too, even if you add no launcher.
- **Peek:** the readers its section lists under What it runs, each with a time limit and never
  through a shell. The wrap-up band runs no program: its Wrap up button sends
  `/odyssey:wrap-up`.
- **Your user settings:** each machine extra you pick in setup edits `~/.claude/settings.json`,
  or the one in the folder `CLAUDE_CONFIG_DIR` names, after saving it once as
  `settings.json.before-odyssey`:

  | You pick | The edit | Files it adds, beside the settings file unless a folder is named |
  |---|---|---|
  | the status bar | `statusLine` runs the bar, with a status line you had in front of it | `odyssey-statusline.mjs`, and `odyssey-statusline.prev` with the line you had |
  | the tips | six tips, each `id` starting `odyssey-`, added to `spinnerTipsOverride.tips` | none |
  | the wrap-up band | its folder added to `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block | the band, in `odyssey-wrap-up/` |
  | peek | its folder added to `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block | peek and a copy of the secrets guard, in `odyssey-peek/` |
  | the launcher | none | `odyssey-launch.mjs`, and your command in `~/.local/bin` |

  [Removing it](#removing-it) says how to take each out.

## What's in it

```
oncewright/
  .claude-plugin/     plugin.json, marketplace.json and icon.png
  skills/             26 skills; each procedure sits beside the SKILL.md that reads it:
                      cr-triage (+ coderabbit_feedback_vetting.md)
                      local-gate (+ gate.md: the stages, the docs stage, the verdict)
                      grill-me, name-it (+ formats.md: the glossary and ADR formats)
                      prove-it (+ tests.md), shape-it (+ deepening.md),
                      untangle (+ html-report.md), review-me, heal-me
                      mage (+ template.sh, the script's library), try-it,
                      look-it-up, today-junior, write-for-claude (+ skills.md)
                      audit, db-migration, handoff (+ references/), remember-session,
                      index-it (+ scripts/survey.py and its test),
                      create-directive, setup, make-a-path, what-next, which-one,
                      wrap-up (+ references/), write-for-me
  hooks/              hooks.json; node-check.sh, session-start, load-log, protect-env,
                      protect-managed, protect-manifest, protect-append-only, bash-guard, post-edit,
                      typecheck-gate, wrap-up-stop;
                      their tests
  lib/                shared by the hooks and the script: config resolution, trust, the docs
                      check, the handoff file, what `next` and `open` read, the stamp, the
                      copies setup makes outside the plugin
  scripts/            odyssey.mjs: config | plan | apply | status | doctor | trust |
                      docs check | bar | tips | mod | launcher | next | open;
                      statusline.mjs, the status bar setup copies into ~/.claude;
                      launch.mjs, the launcher setup copies there;
                      their tests
  mods/peek/          peek, the experimental file viewer setup offers, and its tests
  mods/wrap-up/       the wrap-up band setup offers, and its tests
  scaffold/           what setup copies: the kit-owned rule and the handoff file
  schema/             odyssey.v1.json
  themes/             odyssey.json, the optional Odyssey theme
  .github/workflows/  ci.yml: node --test on three operating systems, its count checked
                      against the tests the files define; the mods' tests on the same three;
                      plugin validate; survey.py compiled and its size limits tested
  README.md  CREDITS.md  SECURITY.md  CHANGELOG.md  LICENSE  .gitattributes
```

## Why we recommend ponytail

The kit pushes toward the smallest change inside a declared scope: planned work stays inside the
files its plan names ([How a slice is made](#how-a-slice-is-made)), and a review round with
fewer findings closes sooner. [Ponytail](https://github.com/DietrichGebert/ponytail) applies the
same pressure while the code is being written: the standard library before a dependency, a
native feature before a library, one line before fifty, and a question of whether the change
needs to exist at all. Together they close the loop: the kit limits where Claude may write, and
ponytail limits how much. The kit never bundles it or declares it as a dependency, because it is
a separate project under its own license; `/odyssey:setup` offers its two install commands, and
you decide.

## Companion skills

These third-party skill packs fit the same workflow. The kit links them instead of copying
them, so you get upstream updates and each keeps its own license. Matt Pocock's skills are the
exception, and part of where the kit started: the ones that fit are rebuilt inside the kit (see
[Credits](#credits)), so you don't need his pack beside it.

| Pack | Author | License | Adds | Install (Claude Code) |
|---|---|---|---|---|
| [superpowers](https://github.com/obra/superpowers) | Jesse Vincent | MIT | brainstorming, systematic debugging, red/green TDD, subagent-driven development | `/plugin install superpowers@claude-plugins-official` |
| [ponytail](https://github.com/DietrichGebert/ponytail) | DietrichGebert | MIT | steers Claude to the smallest change that works — stdlib and native features first | `/plugin marketplace add DietrichGebert/ponytail`, then `/plugin install ponytail@ponytail` |

## What was deliberately left out

- **`settings.local.json`** — machine-local permission allowlists. They accumulate absolute
  paths, hostnames, scratch dirs, and occasionally a pasted API key. Let each machine grow
  its own.
- **`.mcp.json`** — not shipped; no skill needs an MCP server. If you add one, reference
  secrets as `${ENV_VAR}` only.
- **`CLAUDE.md` / `CONTEXT.md` / `GLOSSARY.md` / `.coderabbit.yaml`** — these describe your
  project. The kit reads them; write your own.
- **Third-party skill packs** — linked under Companion skills rather than copied, so each
  keeps its upstream updates and its own license. Matt Pocock's skills are the exception, rebuilt
  in the kit under its own names, with his license (see Credits).
- **A second model taking notes** — nothing runs beside the session to watch it or spend
  tokens on it: the session itself writes memory and the handoff, at wrap-up or when you ask. A
  waiting handoff never reaches Claude on its own either: the session-start hook says one is
  waiting, and it becomes instructions only through `/odyssey:handoff`, which you type or the
  launcher starts a session with.

## Security

See [SECURITY.md](SECURITY.md) for how to report a vulnerability privately. There is no email
address to write to: reports go through GitHub's private vulnerability reporting.

## Credits

### What we built

Odyssey designed and built the workflows and skills below; the design and the text are ours.
Where one of them took a line from someone else's work, the sections after this one name it.

**Long work that carries on by itself across sessions**

- The wrap-up mark (35% of the context window, never past 300k tokens; `ODYSSEY_WRAPUP_PCT`
  sets the percent) and `/odyssey:wrap-up`: one
  command that stops the session's scheduled jobs, waits for its background agents, saves its
  memory and writes the next session's handoff, then tidies the memory index when it is past
  its target.
- The wrap-up band, the mod that offers wrap-up at the mark, and the `wrap-up-stop` hook that
  starts it by itself in a session the launcher started.
- The launcher: one command per repo that closes a session at the mark and starts the next on
  its handoff, with nobody at the keyboard.
- The handoff relay: one file holds the next session's opening message, `/odyssey:handoff`
  reads and releases it or writes the next one, and the session-start hook says when one is
  waiting, without reading it, or when the session was compacted. One-shot timers that must
  fire in a later session wait in `directives/handoff/timers.md`, and `/odyssey:handoff` arms
  them again.

**Memory that keeps itself current**

- `/odyssey:remember-session`: saves each session's rulings, corrections, state and facts,
  updating the memory files that already cover them.
- `/odyssey:index-it` and its survey script: audit the memory store and keep its index under
  its target.
- The load log: one line for every instruction file Claude Code loads, naming the session and
  why it loaded.

**The CodeRabbit review cycle**

- `/odyssey:cr-triage` and its vetting procedure: every finding becomes an accept, defer or
  reject verdict, recorded in the `.resolved` file and answered on its thread; each learning
  CodeRabbit saved under a rejection or a deferral is named, with where to edit it; open items
  come first and the verdict last.
- The automated chain: triage hands the `.resolved` file to one fixer agent, which makes the
  accepted fixes, runs the gate and pushes; triage waits for CodeRabbit's next review and goes
  again, round after round, until the PR is ready to merge or something needs you.
- The standing approval for commits and pushes on an open PR, and the CodeRabbit settings the
  kit recommends.

**Scope, gates and guards**

- The kit's one always-on rule, `primary.md`, under 1 KB: scope, deciding instead of asking,
  git, and how a reply ends.
- Planned work that stays inside the files its plan names, with any file changed outside them
  named in Claude's reply.
- `/odyssey:local-gate`: runs every gate stage, CI's plus the docs stage, and says
  INDETERMINATE when a check didn't run.
- The docs check: a script, costing no model tokens, that checks every path, file, script and
  ADR the docs name exists.
- The commit gate: a hook that runs the repo's gate stages before each commit Claude makes and
  blocks the commit while one fails.
- The secrets guard, which blocks Claude's writes to `.env` and other secret files through
  edits, shell commands, PowerShell and MCP file tools, symlinks included; and the guards for
  the files setup stamped, for manifests and lockfiles, and for read-only and append-only files.
- The zsh guard, the post-edit formatter and import check, and the typecheck gate.
- `/odyssey:audit`: which instruction files load and when, rules that never load, claims the
  code disproves, and rules that clash.
- `/odyssey:db-migration`: a schema migration made, reviewed and applied with the repo's own
  tool, to a local database only.

**Finding your place**

- `/odyssey:make-a-path`, `/odyssey:what-next`, and the script's `next` and `open`, which read
  where the work stands from the repo instead of from memory.

**Setup, and your machine**

- `/odyssey:setup`: an interview, a dry run, then the rule, the config and the handoff file,
  created without overwriting what's there; rerun it to upgrade the kit's rule and retire what
  builds before this release left; `status` and `doctor`.
- The config, `.claude/odyssey.json`, with its schema; the project rules; and the trust model,
  which runs a repo's own commands only once you trust them.
- The status bar, the spinner tips and the Odyssey theme.
- Peek, the file viewer in a pane inside Claude Code.

**Writing**

- `/odyssey:write-for-me`: writes as you, from a profile a quiz of real situations builds.

**Proof**

- Tests for every hook, script and mod, which CI runs on macOS, Linux and Windows and checks
  that none was skipped; and the [benchmark](#the-benchmark), published with its harness and
  data.

**Our skills:** `/odyssey:cr-triage`, `/odyssey:local-gate`, `/odyssey:wrap-up`,
`/odyssey:handoff`, `/odyssey:remember-session`, `/odyssey:index-it`, `/odyssey:make-a-path`,
`/odyssey:what-next`, `/odyssey:audit`, `/odyssey:db-migration`, `/odyssey:setup` and
`/odyssey:write-for-me`. `/odyssey:create-directive` is ours too; the directive format it writes
follows Nick Saraev's DOE framework, below. In the 13 skills rebuilt from Matt Pocock's, what
each table in [CREDITS.md](CREDITS.md) lists as added and evolved is ours too.

### Nick Saraev's DOE framework

The directive format that `/odyssey:create-directive` writes and the self-annealing loop in
`/odyssey:heal-me` come from Nick Saraev's DOE ("agentic workflows") framework.

### Built from Matt Pocock's skills

The kit grew out of sessions that ran on [Matt Pocock's skills](https://github.com/mattpocock/skills)
alongside skills and workflows we designed ourselves; together they became this kit. The ones of
his that fit the kit are rebuilt here from his v1.3.1 (commit `24fe0ef`, MIT), so you don't need
to install his pack beside the kit. Each one names its source in its first lines:

| Kit skill | From his |
|---|---|
| `/odyssey:grill-me` | `grilling`, `grill-with-docs`, `to-questionnaire` and `to-spec` |
| `/odyssey:name-it` | `domain-modeling` |
| `/odyssey:prove-it` | `tdd` |
| `/odyssey:heal-me` | `diagnosing-bugs`, around the self-annealing loop from Nick Saraev's DOE framework |
| `/odyssey:review-me` | `code-review` |
| `/odyssey:shape-it` | `codebase-design` |
| `/odyssey:untangle` | `improve-codebase-architecture` |
| `/odyssey:try-it` | `prototype` |
| `/odyssey:look-it-up` | `research` |
| `/odyssey:today-junior` | `wait-what` |
| `/odyssey:write-for-claude` | `writing-for-agents` |
| `/odyssey:mage` | `wizard` |
| `/odyssey:which-one` | `ask-matt` |

`/odyssey:cr-triage` and `/odyssey:handoff` are ours, and took a line or two from his `pr` and
`handoff`. What each of the 13 rebuilt skills kept, added, removed and changed, and why, is in
[CREDITS.md](CREDITS.md), with his license.

### Thanks to pstack

**Thanks to pstack** (Lauren Tan, MIT) for the idea of triage settling a claim with one cheap
test run. The kit's text for it is its own, and no pstack file is included. Her license is in
[CREDITS.md](CREDITS.md).

## License

MIT — see [LICENSE](LICENSE). The copyright covers the original work listed under Credits;
the DOE framework is credited to Nick Saraev, the skills built from Matt Pocock's carry his
MIT notice, which [CREDITS.md](CREDITS.md) holds with pstack's, and the companion skills are
separate projects under their own licenses.
