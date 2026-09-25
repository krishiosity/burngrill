# Tuning

The numbers that shape how the game feels, all near the top of the script in `index.html`.

## Tools (`TOOLS`)

| Tool | Mode | Damage | Notes |
| --- | --- | --- | --- |
| Match | tap | 30 total over 1.8 s | Timed source; keeps burning after the tap |
| Lighter | hold | 22 per second | Single slip under the pointer |
| Blowtorch | hold | 55 per second | Single slip, blue flame |
| Flamethrower | hold | 105 per second | Every slip within a 78 px radius |
| Hammer | tap | 34 per hit | Adds to `smash`; three hits destroy a fresh slip |

## Flame levels (`LEVELS`)

The slider value runs from 0 to 2. Values in between are interpolated linearly between the three anchor points.

| | Slow burn (0) | Normal (1) | Large fire (2) |
| --- | --- | --- | --- |
| Damage multiplier | 0.4 | 1 | 1.9 |
| Flame size | 0.7 | 1 | 1.8 |
| Particle count | 0.55 | 1 | 1.7 |
| Match / burst duration | 2.4× | 1× | 1× |
| Flamethrower radius | 0.8× | 1× | 1.5× |

## Other knobs

| Setting | Value | Where |
| --- | --- | --- |
| Max slip length | 90 characters | `maxlength` on the input and `addText` |
| Damage flush interval | 380 ms | `setInterval(flush, 380)` |
| Pile query limit | 300 slips | first `onSnapshot` in `connect()` |
| Particle cap | ~1,100 | `flame()` and `smoke()` |
| Suggestions shown | 8 at a time | `IDEA_N` |
