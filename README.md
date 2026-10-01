# The Era of Jonathan Schauer

A looping photo slideshow and collage generator for a farewell party. Built with Vite, React 19, TypeScript, Tailwind CSS v4 and Motion.

## Quick start

Requires Node 20.19+ or 22.12+ (Vite 8).

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + static site in dist/
npm run preview   # serve dist/ locally
npm run lint      # oxlint
```

1. Click **Choose the photo folder**, or drag a folder anywhere onto the page. Subfolders are included.
2. Click **Start the show**. It goes fullscreen automatically.

Photos never leave the browser: nothing is uploaded, and the built site works fully offline (fonts are bundled).

In **Chrome and Edge** the folder is remembered, so the next visit is a single **Use "…" again** click (the browser asks once to re-grant read access). Safari and Firefox fall back to a normal folder picker each time.

## Controls

| Key | Action |
| --- | --- |
| Space or K | Pause / resume |
| → or N | Skip to the next scene |
| E | Play the finale next |
| F | Toggle fullscreen |
| Esc | Back to the start screen (in fullscreen, the first Esc just exits fullscreen) |

Moving the mouse shows a small control bar in the bottom-right corner, with the same actions plus the current scene name and photo count. The bar and the cursor hide after 2.5 seconds of no movement.

## Photos

- **Formats:** JPG, PNG, GIF, WebP, AVIF, HEIC/HEIF. Videos (including Live Photo `.MP4`/`.MOV` clips) are ignored.
- **HEIC:** files are detected by their contents, not their extension. Google Photos exports often contain JPEGs named `.HEIC`, and those load directly. Real HEIC files are converted in the browser with `heic-to`, which takes about a second each the first time.
- **Processing:** every photo is downscaled to 2400px on its longest edge, with a 240px thumbnail and a tiny blur placeholder. Scenes always wait until their photos are fully decoded, and the rest of the folder is converted quietly in the background.
- **Dates:** taken from the filename when it contains `YYYYMMDD` (`20170811_174439.jpg`, `IMG-20171007-WA0006.jpg`, `PXL_20210422_…`), otherwise from EXIF. Dates drive the handwritten captions ("Aug 2017"), the orange `'17 8 11` stamps, the giant-year scene and the year range on the title card. Photos without a date get a playful caption instead ("a classic", "core memory", …).
- **Unreadable files** are skipped with a console warning, and the show carries on.

## How the show runs

- **No near repeats:** a photo never reappears within 2 minutes (plus 5 seconds of slack, since scene start times are estimated). Unseen photos are always used before anything repeats. With a very small folder the rule relaxes to "least recently shown".
- **Pacing:** most scenes last 7–9.5 seconds, and about 40% are collages. Each scene plays its exit animation, then the stage stays empty for 0.9–1.8 seconds before the next one. The same scene type never appears twice within 4 scenes.
- **Title card:** returns every 10–14 scenes. It picks a random entrance (wobble pop-in, drop, flip, scatter, zoom, wave, typewriter), a random exit (letter-by-letter fall, explode, blow away, shrink, rise) and a random backdrop (sunburst, confetti or both). The pop-in and the fall are weighted to show up most often.
- **Finale:** see below.

### Scenes

**Single photo:**

| Kind | Effect |
| --- | --- |
| `kenburns` | Slow pan and zoom; iris, wipe, diamond, zoom-blur or slam entrance |
| `drop` | Polaroid drops in with a bounce and tape, then swooshes off |
| `develop` | Polaroid ejects and develops from murky to full color |
| `flip` | 3D card flip from the back of the print |
| `spin` | Spins in over a rotating sunburst |
| `crt` | Retro wood TV with rabbit ears that powers on and off |
| `tiles` | Tiles fly together into the photo, then explode |
| `sweep` | Black-and-white to color sweep with a gold line |
| `year` | Giant outlined year with the photo beside it (falls back to Ken Burns for undated photos) |
| `shutter` | Viewfinder focuses, flash fires, shutter closes on exit |
| `magazine` | "SCHAUER" magazine cover with cover lines and a barcode |
| `vinyl` | Record slides out of its sleeve and spins |
| `newspaper` | *The Schauer Times* spins in like an old movie headline |
| `puzzle` | Jigsaw pieces scatter, snap together, then fall away |
| `ascii` | Falling characters resolve into colored ASCII art, then the photo |
| `projector` | Slide projector with a light beam, dust and a focus pull |

**Collages:**

| Kind | Photos | Effect |
| --- | --- | --- |
| `scatter` | 3–6 | Polaroids tossed onto the table |
| `mosaic` | 4–6 | Bento grid of tiles that flip in |
| `splits` | 2–4 | Split screens that wipe in, sometimes skewed |
| `filmstrip` | 5–7 | A 35mm strip scrolling across |
| `booth` | 4, 6 or 8 | Photo-booth strips |
| `screens` | 4–6 | A wall of TVs switching on |
| `carousel` | 5–7 | A rotating 3D ring of Polaroids |

**On top of everything:** random film filters (warm, black-and-white, faded, punchy, sepia, dreamy) on about half the scenes, light leaks on about 30%, plus film grain and a vignette throughout.

## Finale

The camera pulls back to a wall of every photo, and the wall breaks into hundreds of small tiles that swarm into **JONATHAN SCHAUER**. A gold shimmer sweeps across, confetti falls, and *"So long and thanks for all the (star)fish, Jon!"* writes itself in. It holds for about 15 seconds, then the show carries on.

The finale is part of the regular rotation:

- It never appears within 2 minutes of the previous finale, or of the show starting.
- It never comes directly after a title card.
- Once it's allowed, each scene has a 1-in-4 chance of being the finale, so it typically comes back every 2¼–3 minutes.
- Because it uses every photo as a tile, it doesn't count toward the 2-minute photo rule.

Press **E** or the 🎉 button to cue it as the very next scene, for example at the actual sendoff moment. This deliberately skips the 2-minute spacing.

## Customizing

| What | Where |
| --- | --- |
| No-repeat window | `NO_REPEAT_MS` in `src/lib/director.ts` |
| Collage frequency | `COLLAGE_CHANCE` in `src/lib/director.ts` |
| Scene lengths | `DURATION` in `src/lib/director.ts` (7s default) |
| Title card spacing | `TITLE_GAP` in `src/lib/director.ts` |
| Finale spacing and odds | `FINALE_GAP_MS`, `FINALE_CHANCE` in `src/lib/director.ts` |
| Film filters | `FILTERS` in `src/lib/director.ts` |
| Empty pause between scenes | `gapMs` in `src/components/Stage.tsx` |
| Finale name and message | `NAME_LINES` and the message text in `src/components/Finale.tsx` |
| Captions for undated photos | `NO_DATE_CAPTIONS` in `src/lib/display.ts` |
| Magazine and newspaper copy | `COVER_LINES`, `HEADLINES`, `SUBHEADS` in `src/scenes/extras.tsx` |
| Colors and fonts | `@theme` in `src/index.css` |

### Adding a scene

1. Write a component that takes `{ scene }: SceneProps` in `src/scenes/`. Wrap it in `SceneFrame` and give its motion elements `exit` animations. The stage waits for every exit to finish before the pause and the next scene.
2. Add its name to `SINGLE_KINDS` or `COLLAGE_KINDS` in `src/lib/director.ts`. For collages, also add the photo count range to `COLLAGE_COUNT`, and optionally a length to `DURATION`.
3. Register it in `SCENES` in `src/components/Stage.tsx`.

## Project layout

```
src/
  App.tsx              start screen: folder picking, drag and drop, resume
  lib/
    library.ts         folder reading, HEIC sniffing, filename dates
    prepare.ts         decode, downscale, thumbnails, EXIF dates, background warm-up
    director.ts        scene planning, no-repeat scheduling, title/finale cadence
    display.ts         layout helpers, captions, filters, fullscreen
  components/
    Stage.tsx          the show loop, keyboard controls, control bar, overlays
    Finale.tsx         the name mosaic finale
    Confetti.tsx       CSS confetti
    shared.tsx         Polaroid, backdrop, date stamp, light leak, tape
  scenes/
    singles.tsx        Ken Burns, Polaroid drop, develop, flip, spin, CRT, tiles, sweep, year, shutter
    extras.tsx         magazine, vinyl, newspaper, puzzle, ASCII, projector
    collages.tsx       scatter, mosaic, splits, filmstrip, booth, screens, carousel
    Title.tsx          the title card
  index.css            theme, grain, scanlines, confetti, and other keyframes
```

## On the day

- **Do a dry run** on the actual machine and screen. Run `npm run build && npm run preview`, or serve `dist/` from any static host.
- **Choose the folder before guests arrive.** The first pass converts any HEIC files; after that everything is instant.
- **Stop the screen from sleeping.** Turn off display sleep and screensavers in the OS; the browser doesn't prevent sleep on its own.
- **Use Chrome or Edge** for one-click resume of the remembered folder.
- **Cue the finale** with **E** when it's time for the sendoff.

## Development helpers

These only exist under `npm run dev`. In the browser console:

```js
__eraForce = 'tiles'; __eraNext()   // pin a scene kind (any SINGLE_KINDS / COLLAGE_KINDS, 'title' or 'finale') and jump to it
__eraForce = undefined              // back to random
__eraLoad(name, files)              // load File objects without the folder picker (for browser automation)
__eraDirector                       // the live scheduler, e.g. to simulate scheduling with __eraDirector.next(time)
```

Dependencies are kept current with [taze](https://github.com/antfu-collective/taze): `npx taze major -w && npm install`.
