# Sum of the Brothers - Music Player

A minimal, dark-themed music player with artist tabs, version tracking, and Cloudflare R2 streaming.

## 🎵 Live Site

**https://sumofthebrothers.com**

## Features

- 🎨 **Multi-artist catalog** - Joey (solo) + Sum (band)
- 📑 **Artist tabs** - All (grouped), Joey, Sum
- 📂 **Version tracking** - Multiple versions per track
- 🔍 **Live search** - Filter tracks instantly
- 📊 **Play counters** - Track + version level (persistent)
- 🔗 **Share links** - Direct links to specific versions
- 🔁 **Repeat modes** - Off, Track, Versions, All
- 🔀 **Shuffle modes** - Off, Versions, All
- 📱 **Mobile responsive**
- 🌙 **Dark theme**

## Project Structure

```
sumofthebrothers/
├── index.html              # Main player HTML
├── styles.css              # All CSS styles
├── tracks.js               # Track data (auto-generated)
├── tracks-metadata.json    # Source of truth for tracks
├── music/                  # Local copies (for scanning)
│   ├── joey/               # Solo artist
│   └── sum/                # Band tracks
├── generate-tracklist.js   # Auto-scanner
├── update-tracks.bat       # Quick update script
└── ignore/                 # Gitignored credentials
```

## Music Structure

```
music/
├── joey/                    # Solo artist
│   ├── floataway/
│   │   ├── floataway1.mp3
│   │   ├── floataway2.mp3
│   │   └── floataway3.mp3
│   ├── keepon/
│   └── ...
└── sum/                     # Band tracks
    ├── practice-jan28-2026/
    └── ...
```

## Workflow: Adding New Tracks

### 1. Add MP3s Locally
```
music/
  └── joey/
      └── newtrack/
          ├── newtrack1.mp3
          └── newtrack2.mp3
```

### 2. Upload to R2
1. Go to Cloudflare Dashboard → R2 → joeysmusic bucket
2. Create folder structure: `joey/newtrack/`
3. Upload MP3s to that folder

### 3. Update Track List
```bash
# Double-click this file:
update-tracks.bat

# Or run manually:
node generate-tracklist.js
```

This scans your `music/` folder and updates:
- `tracks-metadata.json` - Adds new tracks/versions
- `tracks.js` - Updates player data

### 4. Edit Metadata (Optional)
Edit `tracks-metadata.json` to set:
- Release dates
- Playlist assignments
- Custom titles

### 5. Deploy
```bash
git add .
git commit -m "Add new tracks"
git push
```

Site updates automatically on GitHub Pages within 1-2 minutes.

## File Organization (Modular)

**✅ NEW: Separated for easier maintenance!**

- **index.html** (833 lines) - HTML structure + JavaScript logic
- **styles.css** (481 lines) - All CSS styling
- **tracks.js** (139 lines) - Track data (auto-generated)

**Benefits:**
- Easier to find/edit styles
- Track data updates without touching HTML
- Cleaner, more maintainable code

## Configuration

**R2 Streaming:** `https://pub-0e0c68e5ff834507b8c6230ded77da2b.r2.dev`

**Domain:** `sumofthebrothers.com`

**GitHub Pages:** `sl3ndah.github.io/sumofthebrothers`

## Playback Logic

**Version Order:** v(highest) → v1 → v2 → v3 → ...
- Example: floataway3 → floataway1 → floataway2

**Repeat Modes:**
- Off - Play once, stop
- Repeat Track - Loop current version
- Repeat Versions - Loop all versions of track
- Repeat All - Loop entire catalog

**Shuffle Modes:**
- Off - Normal order
- Shuffle Versions - Randomize version order
- Shuffle All - Randomize everything

## URL Sharing

Share specific tracks:
```
https://sumofthebrothers.com/?track=floataway3.mp3
```

## Artist Tabs

- **All** - Grouped by artist (collapsed by default)
- **Joey** - Solo tracks only (flat list, expanded)
- **Sum** - Band tracks only (flat list, expanded)

## Play Counters

**Two levels:**
1. Track level - Total plays across all versions
2. Version level - Individual version plays

Storage: localStorage + IndexedDB + cookies (triple redundant)

## Tech Stack

- Pure HTML/CSS/JS (no frameworks)
- Cloudflare R2 (CDN storage)
- GitHub Pages (hosting)
- IndexedDB (play counter persistence)

## Custom Domain Setup

Domain managed through Cloudflare DNS:
- A records point to GitHub Pages IPs
- CNAME file in repo: `sumofthebrothers.com`
- HTTPS enforced

---

**Live Site:** [sumofthebrothers.com](https://sumofthebrothers.com)

**Status:** ✅ Complete, modular, and production-ready
