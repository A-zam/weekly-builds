# Brief: "How a Transformer Works in a Power Supply" (vertical motion video)

> **Handoff document.** This brief was written in a planning session. Everything below has already been agreed with the owner. Do not re-ask settled questions. Ask only where this file says **ASK**.

---

## 0. Your task right now (Phase 1 only)

Make **15 still style frames** so the owner can choose a visual direction:

- **5 key moments** (section 4) × **3 skills** = 15 PNGs.
- The 3 skills are installed on this machine:
  1. `hyperframes` (HTML → video framework by HeyGen)
  2. `video-shotcraft` (Remotion shot recipes, 2.5D camera, cinematic)
  3. `lemo-opuscar`
- **Before starting, read each skill's `SKILL.md`** and follow its own conventions, templates and render commands. Each set of 5 frames should look like *that skill's* best work. The comparison is about craft and style, so keep the **content, layout of information and colour meanings** (section 5) the same across all three.
- If a skill only renders video, render a short clip and export the frame at the moment described for each shot (for example with `ffmpeg -ss <t> -frames:v 1`).
- When done, build the comparison page (section 7) and **stop**. Do **not** animate the full video until the owner picks a style.

---

## 1. Agreed decisions

| Item | Decision |
|---|---|
| Topic | How a transformer works, and where it sits in a power supply |
| Audience | Curious beginner. Two simple formulas are allowed on screen (turns ratio, power). No calculus, no jargon without a visual |
| Language | English |
| Format | **Vertical 9:16, 1080×1920, 60 fps**, H.264 MP4 |
| Length | **About 60 s** (65 s max) |
| Audio | **TTS voiceover** + on-screen **captions only where needed** (numbers, formulas, key terms), not full subtitles |
| Scope | Classic 50 Hz transformer, **plus** the closing beat on why chargers are tiny (switch-mode, ~100 kHz) |
| Project type | One-off. Not part of any portfolio/weekly structure |
| Process | Plan → **15 style frames (now)** → owner picks a style → full build → TTS + captions → final render |

---

## 2. Script with timing (target ~150 words)

Timings are targets. Final timing should follow the generated TTS audio.

| # | Time | Beat | Narration (VO) | On-screen caption |
|---|---|---|---|---|
| 1 | 0–5 s | **Hook** (see 2.1) | "There's no wire connecting your phone to the wall. Seriously. So how does the power get across?" | `no wire. seriously.` · small footnote `mains: 230 V (varies by country)` |
| 2 | 5–13 s | **AC keeps changing** | "To see how, let's open up a bigger one. Mains current isn't steady. It swings back and forth fifty times every second." | `50 Hz` |
| 3 | 13–21 s | **Current → magnetic field** | "Send current through a coil and you get a magnetic field. As the current reverses, the field grows, collapses and flips." | — |
| 4 | 21–29 s | **Induction** | "Place a second coil nearby, and that changing field pushes a voltage into it, with no wire between them. Feed it steady DC… and nothing. It only works with change." | `DC → 0 V` |
| 5 | 29–35 s | **Iron core** | "An iron core guides the field from one coil to the other, so almost none of it is wasted." | `laminated iron core` |
| 6 | 35–44 s | **Turns ratio** + country note | "The trick is in the turns. 1,150 turns in, 60 turns out: 230 volts becomes 12. Your country uses a different voltage? Then the maker just changes the turns." | `Vs / Vp = Ns / Np` · `230 × 60/1150 ≈ 12 V` · then a quick strip of chips: `230 V Europe/Asia` · `120 V USA` · `100 V Japan` with `different country = different turns` |
| 7 | 44–48 s | **Power conserved** | "Voltage goes down, current goes up. The power stays almost the same." | `Vp·Ip ≈ Vs·Is` |
| 8 | 48–51 s | **Isolation** (pays off the hook) | "And remember: the coils never touch. Only magnetism crosses the gap. That's what keeps mains away from you." | `no wire. just magnetism.` |
| 9 | 51–56 s | **Rest of the PSU** | "A rectifier, a capacitor and a regulator then smooth it into clean DC." | `AC → rectifier → capacitor → regulator → DC` |
| 10 | 56–63 s | **Back to the phone** (closes the loop) | "And the transformer inside your charger? Same trick, a hundred thousand times a second. That's why it fits on your fingertip." | `50 Hz → 100 kHz` |
| 11 | 63–65 s | **End card** | (no VO, or "That's the transformer.") | 3 recap lines (section 4.6) |

### 2.1 The hook (0–5 s)

**Chosen line (pure curiosity, no scare tactic):** "There's no wire connecting your phone to the wall. Seriously."

The viewer sees a phone, a cable and a wall socket, so the line sounds wrong. That mismatch is what makes people stay for the answer. It's answered in beat 8 (only magnetism crosses the gap) and the tiny transformer comes back in beat 10, so the video ends where it began.

**Rules for the hook:**
- Motion starts on **frame 1**: no fade-in from black, no title card, no logo.
- The first words are on screen by **0.5 s** and synced to the VO.
- The **first frame works as the thumbnail** (it's frame `01-hook.png`).
- The first VO sentence takes **2.5 s or less**.
- The line must be **corrected within the same 5 s**: viewers see that "wire" means "copper conductor all the way through". Do not let it stand as a bare falsehood.

**Hook shot plan:**

| Time | Picture | VO |
|---|---|---|
| 0.0–1.8 s | A phone charging on a table, with the cable running to a wall socket. The caption `no wire. seriously.` punches in. An orange glow of current traces the copper from the socket into the charger. | "There's no wire connecting your phone to the wall." |
| 1.8–3.2 s | Quick push-in; the charger shell goes x-ray. The orange copper path **stops dead** at a visible gap in the middle. On the far side, the cyan copper path continues to the phone cable. | "Seriously." |
| 3.2–5.0 s | Yellow-green magnetic sparks jump across the gap from the orange coil to the cyan coil. Caption: `so how does power get across?` | "So how does the power get across?" |

Small footnote on screen from 0.5 s: `mains: 230 V (varies by country)`. Keep it unobtrusive, roughly 36 px.

**Country voltages note (a must-have in the video):** mains differs by country, so say so on screen twice:
1. In the hook as the footnote above.
2. In beat 6, a 2–3 s strip of chips: `230 V Europe/Asia` · `120 V USA/Canada` · `100 V Japan`, with the line `different country = different turns`. Math example if there is room: 120 V → 12 V needs a 10 : 1 ratio, for example 600 turns : 60.
3. Frequency also varies (50 Hz or 60 Hz). Beat 2 shows `50 Hz` and can add `(60 Hz in the USA)` in small text. The explanation does not change.
---

## 3. Physics accuracy checklist (must hold in every frame and in the final video)

- 230 V × (60 / 1150) = **12.0 V**. Ratio ≈ 19.2 : 1. Use these exact numbers.
- Power example: 12 V × 1 A = 12 W on the secondary, so the primary carries ≈ **52 mA** (ignoring losses). If currents are shown, the secondary wire is drawn **thicker**.
- Transformers work only with **changing** current. DC input gives **0 V** output once the field is steady. Show this clearly in beat 4.
- Flux flows in a **closed loop through the core**. Primary and secondary sit on the same core, usually on opposite limbs in the diagram.
- Primary and secondary sine waves are **in phase** (ideal transformer, dot convention) and differ only in amplitude. Do not show a phase shift.
- Laminations reduce **eddy currents** (heat), not "leakage". Mention eddy currents only if the label fits.
- A phone charger does **not** use a 50 Hz transformer. It rectifies mains to high-voltage DC, switches it at roughly 100 kHz through a small **ferrite** transformer, then rectifies to 5 V. So the hook shows a **ferrite** transformer inside the charger. Beats 2–9 explain the principle on a classic 50 Hz transformer with a **12 V** output ("let's open up a bigger one"), and beat 10 brings back the ferrite one. Never show 12 V going into the phone.
- Hook claim and why it holds: in an isolated charger the mains side and the phone side share **no conductive path**; energy crosses only through the transformer's magnetic field. A cable does physically connect the phone to the wall, so the line is deliberately provocative: the 5 s payoff must show that the **copper stops** inside the charger. If the owner prefers a fully literal line, use: "There's no electrical connection between your phone and the wall."
- Mains voltage and frequency differ by country: 230 V/50 Hz (Europe, most of Asia, Africa, Australia), 120 V/60 Hz (USA, Canada), 100 V (Japan, 50 or 60 Hz depending on region). The main script uses 230 V as the worked example and always says it varies.
- Why higher frequency means a smaller core: for the same voltage, the needed core area × turns falls as frequency rises (V ≈ 4.44·f·N·A·B). On screen, a simple size comparison is enough.
- Rectified waveform order: sine → full-wave (all humps positive) → ripple DC (after capacitor) → flat line (after regulator).

---

## 4. The 5 key moments for the style frames

Each moment is one frame, the same 5 for every skill. Name the files `01-hook.png` … `05-tiny-charger.png`.

### 4.1 `01-hook.png`: beat 1, the 1.8–3.2 s moment (also the thumbnail)
A charger shown in x-ray: the **orange** copper path from the wall socket ends at a clear gap, and the **cyan** path to the phone begins on the other side, with yellow-green magnetic sparks in the gap. Caption `no wire. seriously.` at the top, small footnote `mains: 230 V (varies by country)`. It must read in under a second at thumbnail size. (Section 2.1 describes the full hook.)

### 4.2 `02-field.png`: beat 3
A single coil (primary, orange) with current dots moving along the wire. Magnetic field lines (yellow-green) loop around it, caught mid-growth. A small inset sine wave in the corner has a playhead marking the current point in the cycle.

### 4.3 `03-core.png`: beat 5
A laminated iron core (rectangular "window" shape; lamination lines visible). Primary coil on the left limb (orange), secondary on the right limb (cyan). Flux shown as animated-looking dashes or arrows travelling around the core loop. Optional ghost overlay of field lines leaking into the air, crossed out, to show "without core".

### 4.4 `04-turns-ratio.png`: beat 6 (the hero frame)
The core from 4.3, with turn counts labelled **1150** (primary) and **60** (secondary). Two stacked oscilloscope traces: orange `230 V` (tall) and cyan `12 V` (short), **in phase**. Formula caption `Vs / Vp = Ns / Np` and the result `≈ 12 V`.

### 4.5 `05-tiny-charger.png`: beat 10
Side-by-side size comparison: a big, heavy 50 Hz iron transformer next to a tiny ferrite transformer (or a phone charger opened up). Labels `50 Hz` and `100 kHz`. The tiny one should read as fingertip-sized (a fingertip silhouette for scale is fine).

### 4.6 End card content (not one of the 15 frames, used later)
1. A changing current makes a changing magnetic field.
2. The field induces voltage in a second coil.
3. The turns ratio sets the voltage, and the coils never touch.

---

## 5. Shared visual rules (all skills)

**Colour meanings (keep them the same; exact shades may follow the skill's style):**

| Meaning | Suggested |
|---|---|
| Background | very dark navy `#0B1020` (a skill may go lighter if that is its signature; keep contrast high) |
| Primary side / mains / 230 V | warm orange `#FF8A3D` |
| Secondary side / 12 V | cyan `#3DD6FF` |
| Magnetic flux / field | yellow-green `#C8F560` |
| Iron core | cool grey `#8A93A6`, with lamination lines |
| DC / output OK | soft white `#F2F5FA` |
| Warnings / "nothing happens" | muted red `#FF5A6A` |

**Vertical safe areas (Reels/Shorts/TikTok UI):**
- Keep key content inside **x 80–1000, y 220–1500**.
- Captions sit at about **y 1150–1450**, centred, max 2 lines, about 54–64 px, bold sans.
- Leave the bottom ~420 px and the right ~140 px free of essential content (that is where platform buttons and descriptions go).

**Typography:** one clean geometric or grotesk sans (for example Inter, Manrope or Space Grotesk) plus a monospace for numbers and formulas (for example JetBrains Mono). Numbers are always in monospace.

**Electrons:** small glowing dots moving along wires. Use the **same dot style** in every scene.

---

## 6. Phase 2+ (do NOT start until the owner picks a style)

1. **Full build** in the chosen skill: all 11 beats at 1080×1920@60, with smooth transitions that carry each element into the next beat (for example the core from beat 5 stays on screen for beats 6–8).
2. **TTS voiceover.** **ASK** the owner which engine to use, with this suggestion order: a local open-source voice (Kokoro or Piper) for zero cost; otherwise a TTS that a skill already supports (some skills bundle one). Use a calm, clear, mid-pace English voice. Generate the VO first, then **time the animation to the audio**.
3. **Captions** only as listed in section 2, timed to the VO and animated in (no full-sentence subtitles).
4. **Optional soft music bed** at about −24 LUFS under the VO, plus subtle SFX on reveals if the chosen skill provides them (video-shotcraft has an SFX library).
5. **Final render:** `transformer-explainer-vertical.mp4`, 1080×1920, 60 fps, H.264, AAC audio, about −14 LUFS integrated.
6. **QA before handing over:** watch the whole video at 1× once, re-check the section 3 physics list, check that all text is legible on a phone (preview at 360×640), and check the safe areas.

---

## 7. Deliverables for Phase 1

```
transformer-video/
├── frames/
│   ├── hyperframes/      01-hook.png … 05-tiny-charger.png
│   ├── video-shotcraft/  01-hook.png … 05-tiny-charger.png
│   └── lemo-opuscar/     01-hook.png … 05-tiny-charger.png
├── src/                  one subfolder per skill with the source used
└── compare.html          comparison page
```

**`compare.html`:** a single local page with 3 columns (one per skill) × 5 rows (one per moment). Each thumbnail is shown at phone-like size (about 270×480) and opens full-size on click. The skill name is the column header and the moment name is the row label. Under each column, add 1–2 lines on that skill's strengths and weaknesses for this video.

Then tell the owner, in a short message:
- where `compare.html` is;
- your one-line recommendation and why;
- any skill that could not do something (for example a skill that can't draw diagrams without screenshots), stated plainly.

---

## 8. Notes for each skill

- **video-shotcraft** is designed for *product* videos built from real webpage screenshots. For this video there is no product page, so render the diagrams as HTML/SVG "pages" and apply its shot recipes (2.5D camera moves, push-ins, beat-synced cuts) to them. Say so in the comparison notes if this fights the skill.
- **hyperframes** turns HTML into MP4. Diagrams map naturally to HTML/SVG. Use its own scene/timeline conventions.
- **lemo-opuscar** was not visible from the planning session, so nothing is assumed about it. Read its `SKILL.md` and use it as intended.
