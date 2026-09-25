# Contributing

The whole game is `index.html`. Edit it and reload.

## Guidelines

- **Keep it one file.** No build step, no bundler. External scripts can only load from cdnjs, jsDelivr, the Tailwind play CDN, or code.jquery.com, and stylesheets only from Google Fonts. Anything else is blocked on claude.ai.
- **Treat shared data as untrusted.** Slip text and anything from `room` comes from other people. Set it with `textContent`, never `innerHTML`, and clamp numbers before using them.
- **Damage only goes up.** Keep the `max(local, remote)` merge so concurrent writes can't heal a slip.
- **Don't write on a timer.** Write to the database only when damage actually changed, through the existing `dirty` set and `flush()`.
- **Respect reduced motion.** New effects should scale with `PF` and skip non-essential animation when `prefers-reduced-motion` is set.

## Adding a tool

1. Add an icon to `ICONS` (24×24 viewBox, `currentColor` strokes).
2. Add an entry to `TOOLS` with `mode: 'tap'` or `'hold'`, its damage, a `done` label for the Ashes panel, and a `hint`.
3. Add its particles to `emitToolInner()`, and to `tap()` if it's a tap tool.
4. Update the rack's grid column count in the CSS if needed.
5. Document it in `README.md` and `docs/TUNING.md`, and note it in `CHANGELOG.md`.

## Testing

There's no test suite. Before publishing:

- Check the script parses: extract the `<script>` block and run `node --check` on it.
- Play in solo mode locally.
- Open the published page in two windows to check cursors, effects, and kills sync.
