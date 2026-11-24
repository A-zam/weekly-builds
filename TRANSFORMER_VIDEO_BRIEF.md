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
| 1 | 0–5 s | **Hook** (see 2.1) | "Your wall pushes 230 volts. Your phone would fry at a fraction of that. This tiny part is what saves it… and it isn't even wired to your phone." | `230 V` vs `5 V`, then `not even connected?` |
| 2 | 5–13 s | **AC keeps changing** | "To see how, let's open up a bigger one. Mains current isn't steady. It swings back and forth fifty times every second." | `50 Hz` |
| 3 | 13–21 s | **Current → magnetic field** | "Send current through a coil and you get a magnetic field. As the current reverses, the field grows, collapses and flips." | — |
| 4 | 21–29 s | **Induction** | "Place a second coil nearby, and that changing field pushes a voltage into it, with no wire between them. Feed it steady DC… and nothing. It only works with change." | `DC → 0 V` |
| 5 | 29–35 s | **Iron core** | "An iron core guides the field from one coil to the other, so almost none of it is wasted." | `laminated iron core` |
| 6 | 35–43 s | **Turns ratio** | "The trick is in the turns. 1,150 turns in, 60 turns out: 230 volts becomes 12." | `Vs / Vp = Ns / Np` · `230 × 60/1150 ≈ 12 V` |
| 7 | 43–48 s | **Power conserved** | "Voltage goes down, current goes up. The power stays almost the same." | `Vp·Ip ≈ Vs·Is` |
| 8 | 48–51 s | **Isolation** (pays off the hook) | "And remember: the coils never touch. Only magnetism crosses the gap. That's what keeps mains away from you." | `no wire. just magnetism.` |
| 9 | 51–56 s | **Rest of the PSU** | "A rectifier, a capacitor and a regulator then smooth it into clean DC." | `AC → rectifier → capacitor → regulator → DC` |
| 10 | 56–63 s | **Back to the phone** (closes the loop) | "And that tiny part in your charger? Same trick, a hundred thousand times a second. That's why it fits on your fingertip." | `50 Hz → 100 kHz` |
| 11 | 63–65 s | **End card** | (no VO, or "That's the transformer.") | 3 recap lines (section 4.6) |

### 2.1 The hook (0–5 s)

The first 2 seconds decide whether people keep watching. The hook uses **stakes** (your phone getting fried) followed by a **curiosity gap** (it isn't even wired to the phone). The gap is answered in beat 8, and the tiny part comes back in beat 10, so the video ends where it began.

**Rules for the hook:**
- Motion starts on **frame 1**: no fade-in from black, no title card, no logo.
- The first words are on screen by **0.5 s** and synced to the VO.
- The **first frame works as the thumbnail** (it's frame `01-hook.png`).
- The first VO line takes **2.5 s or less**.

**Hook shot plan:**

| Time | Picture | VO |
|---|---|---|
| 0.0–1.2 s | Extreme close-up of a phone's charging port. `230 V` slams in, orange, huge. The screen glitches and sparks flash red (the "what if"). | "Your wall pushes 230 volts." |
| 1.2–2.4 s | Freeze, then rewind. A small `5 V` appears in cyan next to the oversized `230 V`. | "Your phone would fry at a fraction of that." |
| 2.4–3.8 s | Fast pull-back through a charger shell that cuts open (x-ray). A tiny ferrite transformer glows. | "This tiny part is what saves it…" |
| 3.8–5.0 s | The two coil windings separate slightly, with a visible gap and a `?`. Caption: `not even connected?` | "…and it isn't even wired to your phone." |

**Other hook lines (same structure; swap in if the owner prefers):**
1. "Plug your phone straight into the wall and it's dead instantly. This is why it isn't."
2. "Your wall socket has 46 times the voltage your phone can take. One tiny part fixes that."
3. "There's no wire connecting your phone to the wall. Seriously." (pure curiosity, with no stakes up front)

---

## 3. Physics accuracy checklist (must hold in every frame and in the final video)

- 230 V × (60 / 1150) = **12.0 V**. Ratio ≈ 19.2 : 1. Use these exact numbers.
- Power example: 12 V × 1 A = 12 W on the secondary, so the primary carries ≈ **52 mA** (ignoring losses). If currents are shown, the secondary wire is drawn **thicker**.
- Transformers work only with **changing** current. DC input gives **0 V** output once the field is steady. Show this clearly in beat 4.
- Flux flows in a **closed loop through the core**. Primary and secondary sit on the same core, usually on opposite limbs in the diagram.
- Primary and secondary sine waves are **in phase** (ideal transformer, dot convention) and differ only in amplitude. Do not show a phase shift.
- Laminations reduce **eddy currents** (heat), not "leakage". Mention eddy currents only if the label fits.
- A phone charger does **not** use a 50 Hz transformer. It rectifies mains to high-voltage DC, switches it at roughly 100 kHz through a small **ferrite** transformer, then rectifies to 5 V. So the hook shows a **ferrite** transformer inside the charger. Beats 2–9 explain the principle on a classic 50 Hz transformer with a **12 V** output ("let's open up a bigger one"), and beat 10 brings back the ferrite one. Never show 12 V going into the phone.
- Hook claims and why they hold: a phone's 5 V USB input is far below 230 V (≈ 46×), so connecting it directly would destroy it. In an isolated charger, energy crosses from primary to secondary **only through the transformer's magnetic field**; there is no conductive path. Say "isn't wired to your phone", not "not connected to anything". Keep the 230 V reference (EU/Asia mains); if the owner targets the US, use 120 V and "24 times".
- Why higher frequency means a smaller core: for the same voltage, the needed core area × turns falls as frequency rises (V ≈ 4.44·f·N·A·B). On screen, a simple size comparison is enough.
- Rectified waveform order: sine → full-wave (all humps positive) → ripple DC (after capacitor) → flat line (after regulator).

---

## 4. The 5 key moments for the style frames

Each moment is one frame, the same 5 for every skill. Name the files `01-hook.png` … `05-tiny-charger.png`.

### 4.1 `01-hook.png`: beat 1, the 0.0–1.2 s moment (also the thumbnail)
Extreme close-up of a phone's charging port at the moment of the "what if": a huge orange `230 V` crashing into it, red sparks, and the phone screen glitching. A small cyan `5 V` label nearby makes the mismatch obvious. It should read in under a second at thumbnail size, with no paragraph of text. (Section 2.1 describes the full hook. The beat 9 power-supply block chain is no longer in the hook.)

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
