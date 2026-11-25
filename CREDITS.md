# Credits

The detail behind the README's [Credits](README.md#credits): what each skill rebuilt from Matt
Pocock's kept, added, removed and changed, and why; what else the kit took from his skills and
what it left; and the license notices that ship with the kit.

## Built from Matt Pocock's skills

These skills are rebuilt from [Matt Pocock's skills](https://github.com/mattpocock/skills) v1.3.1
(commit `24fe0ef`, MIT). Each one names its source in its first lines. For each, here is what the
kit kept, added, removed and changed, and why.

**`/odyssey:grill-me`**, from his `grilling`, `grill-with-docs`, `to-questionnaire` and `to-spec`:

| | What | Why |
|---|---|---|
| Included | The design tree and its frontier; a recommended answer with each question; facts looked up, never asked of you; done only when the frontier is empty and you agree | The core of his skill, kept as it works |
| Added | Each answer written to the plan's `## Grilling record` before the next question, and a resume from that record; a minimal plan in `docs/grills/` when none is named; open lines that name who to ask; a closing `Grilling done` line | His grilling keeps the answers only in the conversation, so a session that ends loses them; the kit keeps its records on disk |
| Removed | Asking the whole frontier in each round; to-spec's issue-tracker publishing and user stories; to-questionnaire's separate document | One question at a time lets each answer reshape the next; the kit has no issue tracker; an open line in the record carries the question to whoever can answer it |
| Evolved | Four skills folded into one; the glossary and ADR pass runs whenever the repo has a glossary or ADRs | One command for one job |

**`/odyssey:name-it`**, from his `domain-modeling`:

| | What | Why |
|---|---|---|
| Included | Challenging terms against the glossary, sharpening fuzzy words, testing with scenarios, checking the code, writing each term as it settles, the three tests for an ADR, the glossary and ADR formats | The core of his skill, kept as it works |
| Added | How the gate's docs stage uses the glossary and the ADRs; a design rejected in a grilling becomes an ADR when it passes the three tests | Ties the files into the kit's record |
| Removed | Nothing of substance; his two format files are one | Fewer files to read |
| Evolved | A new name, and it runs only when you type it or `/odyssey:grill-me` reads it | The name says what it does; a skill Claude can't start on its own stays out of the skill list every session carries |

**`/odyssey:prove-it`**, from his `tdd`:

| | What | Why |
|---|---|---|
| Included | Red before green; one vertical slice at a time; tests at agreed seams, through the public interface; his guides to good tests and to mocking | The core of his skill, kept as it works |
| Added | A second use, settling a claim with a Confirmed, Denied or Can't tell verdict and the command that shows it; seams settled before an agent takes the work, with the test files among the files it may change; both runs of each slice quoted in the report | "Is this true?" gets a check that could have failed, not a reading of the code; an agent can't stop to ask about seams |
| Removed | Sending refactors to his code-review skill | A refactor noticed mid-loop goes on a list for you, not into the diff |
| Evolved | A new name; his two guides are one file | The name says what it does; fewer files to read |

**`/odyssey:heal-me`**, from his `diagnosing-bugs` and the self-annealing loop from Nick
Saraev's DOE framework:

| | What | Why |
|---|---|---|
| Included | Redacting secrets; a check that fails on the bug before any hypothesis; reproduce, then shrink; three to five falsifiable hypotheses shown to you; tagged debug lines; a regression test at a seam that meets the bug, or a note that none exists; the right hypothesis in the commit | The core of his skill, kept as it works |
| Added | The self-annealing loop's last step, the lesson written where the next session reads it (a directive, an ADR, the project rules, the plan); the debug lines' removal checked with `git grep`; the fix recorded like any other change; from his `retro`, a check proposed before a written rule when a check could have caught the mistake | A fix that teaches nothing repeats; a search catches a debug line the eye misses; a check keeps catching what prose only asks for |
| Removed | His script template for steps a person must do; a shorter list of ways to build the check | A step only you can do comes as numbered commands to paste back |
| Evolved | Built around the self-annealing loop from Nick Saraev's DOE framework, under a new name; the fix is made in the session, inside the files it names | One skill for when something breaks, held to the scope rule planned work follows |

**`/odyssey:review-me`**, from his `code-review`:

| | What | Why |
|---|---|---|
| Included | Two axes, standards and spec, in parallel subagents and never merged; the code-smell baseline, each smell a judgment call the repo's rules override | The core of his skill, kept as it works |
| Added | The fixed point defaults to the slice's starting commit; uncommitted work counts; the ADRs count as standards | You rarely have to name a ref |
| Removed | The issue tracker as the spec's source; what tooling, the gate or CodeRabbit already checks | The spec is the plan; a second pass over what runs anyway is noise |
| Evolved | A new name; it runs only when you type it | Reviewing is your call, and it starts two subagents |

**`/odyssey:shape-it`**, from his `codebase-design`:

| | What | Why |
|---|---|---|
| Included | The words (module, interface, depth, seam, adapter, leverage, locality), the principles, the dependency categories, and designing an interface several ways in parallel | The core of his skill, kept as it works |
| Added | A design you turned down goes into the plan's decisions with its reason | So it isn't proposed again without that reason |
| Removed | Nothing of substance; his two extra guides are one file | Fewer files to read |
| Evolved | A new name; it runs when you type it or another kit skill reads it | The name says what it does |

**`/odyssey:untangle`**, from his `improve-codebase-architecture`:

| | What | Why |
|---|---|---|
| Included | Scoping to hot spots first; a subagent walk for friction; the deletion test; ranked candidates with before-and-after diagrams; the HTML page with Tailwind and Mermaid; an ADR raised only when worth reopening; no interfaces until you pick one | The core of his skill, kept as it works |
| Added | Hot spots also from the plans' deferred items; a Markdown record saved in `docs/untangle/` beside the page; a chosen candidate becomes a plan, then a grilling | The kit's records show where work keeps landing; the Markdown copy reads in a terminal and in git |
| Removed | Opening the page for you, and writing it to a temporary folder | Over SSH there is no browser to open; both paths are printed instead, and the files stay |
| Evolved | A new name; it runs only when you type it | The name says what it does |

**`/odyssey:try-it`**, from his `prototype`:

| | What | Why |
|---|---|---|
| Included | One question per prototype; a single HTML page driving a pure logic module by buttons and guided scenarios; three to five structurally different UI variants behind `?variant=` with a floating switcher; state in memory, no polish | The core of his skill, kept as it works |
| Added | The verdict written as a line in the plan's `## Grilling record`; the prototype's files counted as the request's scope, since they never reach the main branch | The answer lands where the plan's decisions live |
| Removed | Pointers to an issue on a tracker; opening the page for you | The plan holds the record; over SSH there is no browser |
| Evolved | It lives on a local `prototype/<name>` branch that is never pushed, or in the scratchpad; a new name; it runs only when you type it | Throwaway code never reaches the main branch or the remote |

**`/odyssey:look-it-up`**, from his `research`:

| | What | Why |
|---|---|---|
| Included | A background subagent reading primary sources, each claim followed to the source that owns it | The core of his skill, kept as it works |
| Added | A fixed home, `docs/research/<date>-<slug>.md`, with a source on every finding and an `Unverified` section; the plan cites the file | You can tell what was checked from what was only found |
| Removed | Choosing where to save it each time | One place to look |
| Evolved | A new name; it runs only when you type it | The name says what it does |

**`/odyssey:today-junior`**, from his `wait-what`:

| | What | Why |
|---|---|---|
| Included | Re-pitching the last message with context first, in Simplified Technical English, in the glossary's words | The core of his skill, kept as it works |
| Added | Each kit term spelled out once with the file on disk it refers to; what happens next | Kit words like "slice" or "G-line" only help when you can open the file |
| Removed | Nothing | It was already short |
| Evolved | A new name | The name says when to type it |

**`/odyssey:write-for-claude`**, from his `writing-for-agents`:

| | What | Why |
|---|---|---|
| Included | Pointers, the two loads, the ladder of steps and reference, completion criteria, when to split, leading words, stating the target instead of the ban, pruning, and the choice between model-invoked and typed skills | The core of his skill, kept as it works |
| Added | The kit's rule that a skill other skills only read by path stays typed; the YAML trap in descriptions; `/odyssey:audit` cites these rules in its findings | One rule for every skill in the kit, checked in every audit |
| Removed | Advice about instruction files for other tools | The kit writes for Claude Code |
| Evolved | A new name; it runs when you type it or the audit reads it | The name says what it does |

**`/odyssey:mage`**, from his `wizard`:

| | What | Why |
|---|---|---|
| Included | A bash script that walks a person through steps only they can do: stages with progress, links, visible and silent questions, `.env` writes, GitHub secrets, a closing summary; scoping from the repo first; never inventing a step | The core of his skill, kept as it works |
| Added | A record on disk of each stage (never a value), so a rerun skips finished stages; a check command per stage instead of "press Enter"; numbered steps, one command per block, naming the machine; a test of the template | A rerun shouldn't repeat finished work, and "done" should be proved; the record tells Claude what actually happened |
| Removed | Opening a browser when there is no display or the session is over SSH | The link is printed instead |
| Evolved | A stage that fails its check, and that you give up on, stops the run; a new name | Later stages build on earlier ones |

**`/odyssey:which-one`**, from his `ask-matt`:

| | What | Why |
|---|---|---|
| Included | A map from what you want to do to the skill that does it, with one answer given and the chains that link skills | The core of his router |
| Added | A "Not when" for each row; a test that the map names every kit skill; `odyssey.mjs next` deciding when the answer depends on where the repo stands; Claude can start it on its own | The map can't fall behind the kit, and Claude can point you to the skills it can't start itself |
| Removed | His flow essay, the issue tracker on-ramps, the precondition skill and the five-way guide to what to do at a phase boundary | A table scans faster than about 2,600 words; the kit has no issue tracker; `/odyssey:make-a-path` says where the next step runs |
| Evolved | A new name; the call at a phase boundary moved to `/odyssey:make-a-path`, which never makes compacting the default | Compacting summarizes away what the next step needs |

**A line or two each, in skills that are ours:** `/odyssey:cr-triage` took its one-line
merge-risk note (a one-way or two-way door, and what breaks) from his `pr`, and
`/odyssey:handoff` took the command to start with and the redaction rule from his `handoff`.
His `retro` also gave `/odyssey:heal-me` (above) its check-before-prose rule.

**Not taken:** `triage` and `wayfinder` (both need an issue-tracker setup and labels; his
`triage` moves issues and outside pull requests through triage states, and has nothing to do
with `/odyssey:cr-triage`), `teach` (it builds a workspace in the current folder),
`implement`, `implement-spec` and `to-tickets` (the kit makes a plan's slices one at a time,
from the plan itself), and his setup skill and his own `grill-me` (both only make sense inside
his pack; the kit's `/odyssey:grill-me` comes from his `grilling` and three others, above).

His license:

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## pstack

**Thanks to pstack** (Lauren Tan, MIT) for the idea of triage settling a claim with one cheap
test run. The kit's text for it is its own, and no pstack file is included. Her license:

```
MIT License

Copyright (c) 2026 Lauren Tan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
