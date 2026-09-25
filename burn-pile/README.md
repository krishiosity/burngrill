# Burn pile

A multiplayer toy where people write short lines on paper slips, drop them on a shared grill, and destroy them together with matches, lighters, blowtorches, flamethrowers, and a hammer.

It's a single self-contained HTML file with no build step and no dependencies beyond two Google Fonts.

**Live version:** https://claude.ai/artifact/BxT9Hc13Ep3nSErEPqZ4uH

## How to play

1. Type something to burn (up to 90 characters) and choose **Add to pile**, or tap one of the suggestions under the text box.
2. Pick a tool from the rack under the grill.
3. Use it on a slip. When a slip's health runs out, it burns up or shatters for everyone at once. The most recent casualty appears in the **Ashes** panel.

| Tool | How to use it | Effect |
| --- | --- | --- |
| Match | Tap | Stays lit for a couple of seconds and keeps burning the slip |
| Lighter | Press and hold | Slow, steady flame |
| Blowtorch | Press and hold | Hot, narrow blue flame |
| Flamethrower | Press and hold, then sweep | Burns every slip near the nozzle |
| Hammer | Tap | Cracks the slip; three hits shatter it |

The **Flame** slider runs from *Slow burn* to *Large fire*. It changes flame size, particle density, damage, how long a match stays lit, and the flamethrower's reach. It doesn't affect the hammer.

### Keyboard

| Key | Action |
| --- | --- |
| `1` – `5` | Select a tool |
| `[` / `]` | Lower / raise the flame |
| `Tab` to a slip, then `Enter` | Use the current tool on it |
| Arrow keys in the tool rack | Move between tools |

## Multiplayer

On claude.ai the page uses two runtime capabilities:

- **`db`**: stores every slip and how damaged it is, so the pile survives reloads and everyone sees the same state.
- **`room`**: shares live cursors, flames, and hammer hits between people who have the page open at the same time.

Anyone with **Contributor** access or higher can add and burn slips. Viewers and Commenters can watch but can't change anything; the page tells them so.

## Running it locally

Open `index.html` in a browser, or serve the folder:

```sh
npx serve .
# or
python3 -m http.server
```

Outside claude.ai the multiplayer capabilities aren't available, so the page runs in **solo mode**: the pile lives in memory, only you can see it, and it resets on reload. Everything else works the same.

## Project layout

```
.
├── index.html            # the whole game: markup, styles, and script
├── docs/
│   ├── ARCHITECTURE.md   # data model, sync, rendering loop
│   └── TUNING.md         # tool and flame-level numbers
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

## License

MIT. See [LICENSE](LICENSE).
