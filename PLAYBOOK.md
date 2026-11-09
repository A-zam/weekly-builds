# Playbook

These are the rules of the game. Change them whenever they stop helping, but change them here so the change is on record.

## 1. The weekly cadence

| Day | What happens | Output |
|-----|--------------|--------|
| **Mon**: Pick | Choose a project from `BACKLOG.md`, pick a mode, agree on the MVP scope | `weeks/NN-slug/README.md` brief filled in |
| **Tue**: Skeleton | Repo folder, stack chosen, "hello world" runs end to end | Something runs, however ugly |
| **Wed – Thu**: Core | Build the one feature that makes the project worth having | The core loop works |
| **Fri**: Polish | UI pass, edge cases, sample data, screenshots | Demo-able |
| **Sat**: Buffer | Catch-up, or one stretch feature | — |
| **Sun**: Ship | Deploy or package it, write the retro, update the index table | ✅ in the main README |

**Hard rule:** whatever exists on Sunday ships. Scope gets cut, the deadline doesn't move. A project that isn't finished but is shipped honestly with a "what's missing" section still counts.

## 2. Participation modes

We rotate modes so the portfolio shows range and you actually pick up skills.

### 🤖 Autopilot: *"Here's an idea, make it real"*
- **You:** one paragraph describing the idea, then act as **product owner**: answer scoping questions, test builds, decide what gets cut.
- **Claude:** architecture, implementation, deployment, docs.
- **Your time:** about 1–2 hours a week.
- **Shows:** product sense, scoping, directing AI, quality control.

### 📐 Blueprint: *"Here's the structure, build on it"*
- **You:** the skeleton before Tuesday: screens or user flows (sketches are fine), the data model (what's stored), and the main features ranked by priority.
- **Claude:** builds within your structure, flags where it doesn't hold up, and proposes changes rather than making them silently.
- **Your time:** about 3–4 hours a week.
- **Shows:** system design, writing specs, owning architecture decisions.

### 🎓 Learn-along: *"Build it with me, teach me as we go"*
- **You:** write the key parts yourself with guidance: the model, the training loop, the core algorithm.
- **Claude:** explains concepts first, sets small exercises, reviews your code, and handles the boring scaffolding.
- **Your time:** about 6+ hours a week.
- **Output extra:** a `LEARNINGS.md` in your own words (what you can now explain to someone else).
- **Shows:** that you understand what's under the hood, not just the outputs.

**Default rotation:** 🤖 → 📐 → 🎓 → repeat. Break it whenever a project obviously suits a different mode, since an ML project fits Learn-along better than Autopilot.

## 3. Picking a project

On Monday, score 2–3 backlog candidates out of 5 on each of these:

1. **Demo-ability:** can someone understand it in 30 seconds from a link or GIF?
2. **One-week fit:** can a useful MVP really exist by Sunday?
3. **Range:** does it add a category or skill the portfolio doesn't have yet?
4. **Excitement:** do we actually want to build it?

The highest total wins. **Don't repeat a category two weeks in a row.**

## 4. Definition of done

A week counts as shipped when **all** of these are true:

- [ ] **Runs:** a live URL, or a single command that works from a fresh clone (`README` says exactly what it is)
- [ ] **Looks:** at least one screenshot or GIF in the project README
- [ ] **Explains:** the README covers the problem, the solution, the stack, how to run it, and what's missing
- [ ] **Credits honestly:** the "Who did what" section is filled in (see below)
- [ ] **Reflects:** the retro in `JOURNAL.md` is written
- [ ] **Indexed:** the row in the main README table is updated

## 5. "Who did what": the AI-engineering section

Every project README has this section, and it's what sets the portfolio apart. It covers:

- **Human decisions:** the problem, the scope cuts, the design calls, the trade-offs.
- **Delegated to AI:** which parts were generated, and from what kind of instruction.
- **Verification:** how we checked the AI's work (tests, manual QA, evaluation metrics, code review).
- **Where AI was wrong:** bugs, bad assumptions, hallucinated APIs, and how they were caught. Keep these, they're the most interesting part.

## 6. Tech defaults

These are just to avoid choice paralysis. Override them when the project calls for it.

| Kind of project | Default stack | Where it lives |
|-----------------|---------------|----------------|
| Web app / tool / game | Static HTML + JS (Vite if needed) | GitHub Pages |
| App with a backend / DB | Python FastAPI or Node + SQLite | Render / Fly.io free tier, or run locally |
| ML / data | Python, NumPy, PyTorch, Jupyter | Notebook + optional Gradio/Streamlit demo |
| Uses an LLM | Claude API | Key via env var, **never committed** |

Every project folder is self-contained: its own dependencies and its own README. If a project outgrows the week and turns into something real, it graduates to its own repo, with a link left behind here.

## 7. Repo conventions

- Folder name: `weeks/NN-short-slug` (e.g. `weeks/01-queue-booking`).
- Start a week with: `cp -r _templates/project weeks/NN-slug`.
- Commit messages: `wNN: what changed` (e.g. `w01: add booking form`).
- Secrets go in `.env` files, which are already ignored. Commit a `.env.example` instead.
