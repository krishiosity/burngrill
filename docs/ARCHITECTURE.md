# Architecture

Everything lives in `index.html`: one `<style>` block, the markup, and one IIFE script. There's no framework and no build step.

## Layers

The grill (`#grill`) stacks four layers:

1. **`.slips`**: the paper slips, as absolutely positioned `<button>` elements. Position and rotation come from the stored document, so every viewer sees the same layout regardless of screen size (positions are fractions of the grill).
2. **`canvas.fx`**: all particles: flames, embers, smoke, sparks, and paper chips. It sits above the slips so fire draws over paper.
3. **`.cursors`**: your own tool cursor and other players' cursors.
4. **`.empty`**: the empty-state message.

## State

Each slip is one document in the `snippets` collection:

```js
{
  text: "Meetings that could be emails",  // 1–90 chars
  x: 0.41, y: 0.22,       // position as a fraction of the grill
  rot: -3.2,              // degrees
  createdAt: 1790000000000,
  scorch: 0,              // fire damage, 0–100
  smash: 0,               // hammer damage, 0–100
  burned: false,
  // set when destroyed:
  tool: "flamer", burnedAt: 1790000000000
}
```

A slip's health is `100 - scorch - smash`. When it reaches zero the slip is destroyed.

The page keeps two subscriptions:

- `where("burned", "==", false).limit(300)`: the live pile.
- `where("burned", "==", true).limit(1000)`: the ashes, used for the burned count and the latest casualty.

### Damage sync

Damage only ever goes up, so the client merges with `max(local, remote)` for both `scorch` and `smash`. Local damage is applied immediately, marked dirty, and flushed at most every 380 ms per slip. Writes to one document are chained so only one is in flight at a time.

Writes are last-writer-wins. If two people burn the same slip at the same moment, some damage can be lost. That's acceptable for a toy and avoids transactions.

When a slip dies locally, the client writes `burned: true` with the finishing tool and broadcasts a `kill` event so other viewers animate it right away rather than waiting for the snapshot.

## Live effects (`room`)

**Presence** (about 30 updates per second, coalesced by the platform):

```js
{ x, y, tool, lvl, firing, heat, h }
```

`x`/`y` are grill fractions, `lvl` is the flame level (0–2), `firing` is true while a hold tool is pressed, and `h` is a random hue for the cursor. Remote viewers render cursors from presence and spawn matching particles while `firing` is true. Presence never causes damage; only the person holding the tool writes damage.

**Events** on the `hit` topic (opened to Contributors):

- `{ kind: "tap", tool, x, y, lvl }`: a match strike or hammer hit, so others see sparks, flame, or a shake.
- `{ kind: "kill", id, tool }`: a slip was destroyed.

## Render loop

One `requestAnimationFrame` loop:

1. Applies damage from the local hold tool and any timed sources (matches, keyboard bursts).
2. Spawns particles for local and remote firing.
3. Updates remote cursors.
4. Steps and draws particles. Smoke and chips use normal blending; flames, embers, and sparks use additive (`lighter`) blending with pre-rendered radial gradient sprites.

Particles are capped at about 1,100. With `prefers-reduced-motion`, particle counts drop to 35% and shake and drop animations are off.

## Solo mode

If `window.claude` or the `db` capability is missing, the page keeps slips in memory only and shows a notice. The same code paths run; writes are skipped.

## Read-only viewers

A rejected write with `invalid_argument` or `revoked` switches the page to read-only: the text box, button, and suggestions are disabled, and damage is no longer applied locally.
