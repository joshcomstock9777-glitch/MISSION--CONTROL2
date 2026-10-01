# Moonshadow Studio — Redesign Blueprint

**Date:** 2026-10-01
**Source:** Josh, spoken brief (this is the redesign direction `STAND_DOWN.md` was waiting on)

## Core idea

One studio, idea to published video. A **Concierge** AI lives inside the whole
studio (not just the editor). It can:

1. **Teach** — explain how a tool works.
2. **Do it** — run the tool for you.
3. **Work with you** — do it together and explain as it goes.

Rule: the studio should not just hand you AI output. It pulls your own
creativity out first.

## Opening

- You land on the studio and meet the Concierge first.
- Owner (Josh): skip setup.
- Other users: connect their accounts and grant permissions, then the Concierge
  walks them through the studio.

## The four pages (proposed mapping of the pipeline)

### Page 1 — Writers Room

Layout: big main screen in the middle, vertical button columns on both sides,
button row underneath.

Writers:
- Script writer
- Story writer
- Script repurposer
- Story repurposer
- Poetry writer
- Song writer
- Music writer
- Novel writer
- NSFW / erotica writer

**Muse Mode.** You bring a seed (song start, story, video idea, any idea). The
Concierge asks questions before writing: How did this make you feel? Where did
it come from? If it were a color, which one? A smell? Answers become the raw
material, and it builds with you.

**Dials.** Straightforward, off the wall, lean obscure, happy, sad, uncanny
valley (more later). The dial tilts everything the tools suggest.
- Proposal: dials are mixable sliders (e.g. 70% sad + 30% uncanny), not single picks.
- Proposal: a "How much AI?" dial — questions only / suggest lines / write the draft.

**Round Table.** Talk to the other AIs to brainstorm movies, projects, anything.
Can also be used for unrelated conversations. Results can be sent to other parts
of the studio.

**Uploads.** Upload files and photos; permanent copy/paste (a clipboard that sticks).

**Character Lock.** Upload a few photos of a character from different angles (real
person or cartoon). The studio locks onto that character for recognition. Label
it and assign it as a project's main character (or other role).

**Script Maker.** Brainstorm output goes into the script maker. When you approve
the script, it moves to the Storyboard.

### Page 2 — Storyboard

- Each scene pops up about 5 comic-book style images showing what it will look like.
- Yay, nay, or change.
- Most of the shaping work happens here.
- **Reference uploads:** when the AI gets something wrong, upload a photo to show it
  (a pose like "he should jump like this guy," a background, the kind of place he
  walks through). Show instead of explain.
- **Export:** packages everything, builds a very rough cut, and sends it to the
  Manual Editor.

### Page 3 — Manual Editor

- Work with the Concierge (teach / do it / work with you).
- Add things in, clip things out, add effects.
- Plugin system for effects, extras, and similar (add and remove).

### Page 4 — Finish & Publish

Two passes:
1. **Normal edit** — buff it, tighten it, make it look like an actual film. Watch it
   back and decide if it's ready.
2. **Finished edit** — full polish: music, lip sync ("mouths connected"), all the
   bells and whistles.

Then out the door: **Publisher / Promoter**.

## Pipeline at a glance

```
Concierge intro
  → Writers Room (Muse Mode + Dials + Round Table + Character Lock + Script Maker)
  → Storyboard (5 panels per scene + reference uploads) → Export rough cut
  → Manual Editor (Concierge + effect plugins)
  → Normal edit → Finished edit (music, lip sync)
  → Publish / Promote
```

## Open questions for Josh

- Confirm the four-page mapping above (or reassign pages).
- Which repo holds the existing manual editor (`moonshadow-cutter`?).
- The Concierge's name.
- The outline left on the Chromebook — paste it in when available.
