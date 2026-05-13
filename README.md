# World Clock — Windows Desktop App (Tauri v2)

Standalone Windows port of the World Clock side panel. Runs in its own window using
Microsoft WebView2 (already present on Windows 11). The final installer is ~5–10 MB.

## One-time setup (install these once on your machine)

Tauri needs three things to build on Windows:

1. **Microsoft Visual Studio Build Tools 2022** (for the MSVC compiler + Windows SDK)
   - Download: https://aka.ms/vs/17/release/vs_BuildTools.exe
   - In the installer, check **"Desktop development with C++"** and finish.
2. **Rust toolchain** (via rustup)
   - Download and run: https://rustup.rs/
   - Restart your terminal afterwards so `cargo`/`rustc` are on PATH.
3. **WebView2 runtime** — already installed on Windows 10/11; no action needed.

Verify everything is in place:

```powershell
cd d:\Workspace\clock-desktop
npx tauri info
```

All entries under `[✓] Environment` should be ticked.

## Build the .exe

```powershell
cd d:\Workspace\clock-desktop
npm install      # only on first run, or if package.json changes
npm run build
```

The first build downloads/compiles Rust dependencies and takes 5–10 minutes. Subsequent
builds are seconds.

### Where the outputs land

- Portable binary: `src-tauri\target\release\world-clock-desktop.exe`
- NSIS installer: `src-tauri\target\release\bundle\nsis\World Clock_1.0.0_x64-setup.exe`
- MSI installer: `src-tauri\target\release\bundle\msi\World Clock_1.0.0_x64_en-US.msi`

Ship the `.exe` (portable) or the `_setup.exe` (installer) — whichever fits.

## Dev mode (live reload while editing the frontend)

```powershell
npm run dev
```

Opens a dev window backed by the files in `src/`. Edits to `src/*.{html,css,js}` reflect
on the next reload.

## What changed vs. the Chrome extension

| Concern | Extension | Desktop |
| --- | --- | --- |
| Storage | `chrome.storage.local` | `localStorage` |
| Pin | Toggles `sidePanel` behavior | Toggles **always-on-top** via Tauri |
| Window position | Owned by Chrome's side panel | Auto-saved/restored by `tauri-plugin-window-state` |
| Window | Chrome side panel | Native Win32 window, 380×640, resizable, min 320×420 |

All other features (dark/light theme, 12h/24h, multiple clocks, country/city search, the
283-city dataset, manual Save button) are unchanged.

## Time-of-day indicator

Each clock card shows a small colored dot to the left of the time that reflects how
"comfortable" the current hour is in that timezone. The color is computed from the
clock's *local* time (not your machine's), so a 22:00 → 06:00 night band lights up the
Tokyo card red while London still shows green.

Defaults match a normal day:

| Time range (local) | Color  |
| ---                | ---    |
| 09:00 → 19:00      | green  |
| 19:00 → 22:00      | yellow |
| 22:00 → 06:00      | red    |
| 06:00 → 09:00      | yellow |

Colors blend smoothly across each boundary using a configurable transition window
(default ±30 min around the boundary).

### Customizing bands

Open **Settings → Time-of-day indicator**. Each row has:

- a label (free text, just for your reference)
- a start time in 24-hour `HH:MM` format — the band runs until the next band's start
- a color picker

The start-time field is a plain text input locked to 24-hour format regardless of your
Windows regional settings. You can type `09:00`, `0900`, or `9:00am`; the field
normalizes to `HH:MM` on blur. Invalid input shows a red border and the previous
value is restored.

Changes apply live to all clocks and are persisted to `localStorage`. The
**Gradient transition (min)** field controls how wide the blend window is; set it to
`0` for hard color switches.

## Project layout

```
clock-desktop/
├── package.json              # npm scripts: dev / build
├── src/                      # frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── scorpions.js         # mascot SVG models + color presets
│   └── timezones.js
└── src-tauri/                # native shell
    ├── Cargo.toml
    ├── tauri.conf.json       # window size, bundle targets, icons
    ├── build.rs
    ├── capabilities/default.json
    ├── src/main.rs
    └── icons/
        ├── icon.ico          # Windows icon used by the .exe
        ├── 32x32.png
        ├── 128x128.png
        ├── 128x128@2x.png
        └── make-tauri-icons.ps1  # regenerate icons any time
```

This project is fully self-contained. The companion Chrome extension lives at
`d:\Workspace\clock-extension\` and is built/loaded independently — there is no
shared code or shared build between the two.
