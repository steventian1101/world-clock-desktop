# World Clock — Windows Desktop App (Tauri v2)

Standalone Windows port of the World Clock side panel. Runs in its own window using
Microsoft WebView2 (already present on Windows 10/11). Final installer is ~5–10 MB.

## One-time setup

Tauri needs three things to build on Windows:

1. **Microsoft Visual Studio Build Tools 2022** (for the MSVC compiler + Windows SDK)
   - Installer: <https://aka.ms/vs/17/release/vs_BuildTools.exe>
   - Check **"Desktop development with C++"** and finish.
2. **Rust toolchain** (via rustup)
   - <https://rustup.rs/>
   - Restart your terminal afterwards so `cargo` / `rustc` are on PATH.
3. **WebView2 runtime** — already installed on Windows 10/11; no action needed.

Verify the toolchain:

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

### Build outputs

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

## System tray, close-to-tray, and autostart

World Clock lives in the Windows system tray for as long as the process is running.

- **On launch** — a tray icon appears in the notification area. The main window opens
  normally unless the app was started by Windows autostart (see below).
- **Closing the window** — the `×` button **hides** the window. The app keeps running
  in the tray. Click the tray icon to bring it back.
- **Single-instance guard** — launching the app a second time just focuses the
  existing window instead of spawning a duplicate.

### Tray menu (right-click the tray icon)

| Item | Behavior |
| --- | --- |
| **Show World Clock** | Restores and focuses the window. Left-clicking the icon does the same. |
| **Hide Window** | Hides the window without quitting. |
| **Start with Windows** (checkbox) | Toggles autostart. When enabled, registers the app under `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` and passes a `--hidden` flag so it stays in the tray at sign-in. |
| **Settings...** | Opens the in-app settings panel. |
| **Exit** | Fully quits the app. |

The same **"Run at Windows startup"** toggle is also available under
**Settings → System**. The tray checkbox and the settings checkbox stay in sync via
event emissions.

Implementation notes:

- Tray, close-to-tray, autostart, and single-instance live in [src-tauri/src/main.rs](src-tauri/src/main.rs).
- The autostart plugin is `tauri-plugin-autostart` (registry-based on Windows).
- The window close event is intercepted with `api.prevent_close()` + `window.hide()`.
  `RunEvent::ExitRequested` is also guarded with `api.prevent_exit()` so the
  last-window-closed event doesn't terminate the process.

## App icon

The app icon is provided as a single source PNG which is resized into every format
Tauri / Windows needs.

```
src-tauri/icons/
├── source.png             # the master icon (ignored by git — provide your own)
├── 32x32.png              # generated
├── 128x128.png            # generated
├── 128x128@2x.png         # generated (256×256)
├── icon.png               # generated (256×256, used by the tray at runtime)
├── icon.ico               # generated (multi-resolution: 16/32/48/64/128/256)
└── make-tauri-icons.ps1   # high-quality bicubic resize script
```

To change the icon:

1. Drop a square PNG at `src-tauri/icons/source.png` (any size — 512×512 or 1024×1024
   is plenty).
2. Run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File "src-tauri\icons\make-tauri-icons.ps1"
   ```

3. Rebuild the app (`npm run build`) for the new icon to land in the `.exe` /
   installer. For dev mode, the next `npm run dev` already picks up the new files.

The script doesn't redraw anything — it just resizes `source.png` with high-quality
bicubic downsampling, so the artwork is preserved exactly.

## What changed vs. the Chrome extension

| Concern | Extension | Desktop |
| --- | --- | --- |
| Storage | `chrome.storage.local` | `localStorage` |
| Pin | Toggles `sidePanel` behavior | Toggles **always-on-top** via Tauri |
| Window position | Owned by Chrome's side panel | Auto-saved/restored by `tauri-plugin-window-state` |
| Window | Chrome side panel | Native Win32 window, 380×640, resizable, min 320×420 |
| Background presence | Service worker | Long-running tray process |
| Startup | Manual | Optional Windows autostart |

All other features (dark/light theme, 12h/24h, multiple clocks, country/city search,
the 283-city dataset, manual Save button) are unchanged.

## Time-of-day indicator

Each clock card shows a small colored dot to the left of the time that reflects how
"comfortable" the current hour is in that timezone. The color is computed from the
clock's *local* time (not your machine's), so a 22:00 → 06:00 night band lights up the
Tokyo card red while London still shows green.

Defaults:

| Time range (local) | Color  |
| --- | --- |
| 09:00 → 19:00 | green |
| 19:00 → 22:00 | yellow |
| 22:00 → 06:00 | red |
| 06:00 → 09:00 | yellow |

Colors blend smoothly across each boundary using a configurable transition window
(default ±30 min around the boundary).

### Customizing bands

Open **Settings → Time-of-day indicator**. Each row has:

- a label (free text, just for your reference)
- a start time in 24-hour `HH:MM` format — the band runs until the next band's start
- a color picker

The start-time field is a plain text input locked to 24-hour format regardless of your
Windows regional settings. You can type `09:00`, `0900`, or `9:00am`; the field
normalizes to `HH:MM` on blur. Invalid input shows a red border and the previous value
is restored.

Changes apply live to all clocks and are persisted to `localStorage`. The **Gradient
transition (min)** field controls how wide the blend window is; set it to `0` for
hard color switches.

## Project layout

```
clock-desktop/
├── package.json                 # npm scripts: dev / build
├── src/                         # frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   ├── app.js                   # main app + tray event listeners + autostart bridge
│   ├── scorpions.js             # mascot SVG models + color presets
│   └── timezones.js             # 283-city dataset
└── src-tauri/                   # native shell
    ├── Cargo.toml               # tauri 2 + window-state + autostart + single-instance
    ├── tauri.conf.json          # window size, bundle targets, icons
    ├── build.rs
    ├── capabilities/default.json
    ├── src/main.rs              # tray, close-to-tray, autostart, single-instance
    └── icons/
        ├── source.png           # (gitignored) master icon
        ├── icon.ico             # Windows .exe / taskbar
        ├── 32x32.png
        ├── 128x128.png
        ├── 128x128@2x.png
        ├── icon.png             # tray icon at runtime
        └── make-tauri-icons.ps1 # resize source.png into every variant
```

This project is fully self-contained. The companion Chrome extension lives at
`d:\Workspace\clock-extension\` and is built/loaded independently — there is no
shared code or shared build between the two.
