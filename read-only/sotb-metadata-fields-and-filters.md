# Sum of the Brothers — Metadata Fields & Filters

## Metadata Architecture Overview

The system moves away from file-hierarchy-based organization toward a schema-driven metadata model. Artists are stored as a separate top-level object so their data can be referenced across any track. Tracks hold only identity-level fields. All musical and descriptive attributes live at the version level, since mood, genre, BPM, and key can shift between versions of the same track.

---

## Artist-Level Fields

Stored once per artist, referenced by machine name throughout the track data.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Machine name key (e.g. `cooljoe`, `sum`) |
| `displayName` | string | Human-readable name shown in UI |
| `bio` | string | Optional artist bio |
| `links` | array of objects | Custom links — each entry has a `label` and `url`. No predefined set; add or remove freely |
| `tags` | array | Custom tags for the artist — user-defined, freeform |

---

## Track-Level Fields

Applies to the track as a whole, across all its versions.

| Field | Type | Notes |
|---|---|---|
| `title` | string | Track name, matches folder/file naming |
| `artist` | string | References an artist `id` from the artists object |
| `uploadedDate` | date | When the track was first added — auto-set |
| `createdDate` | date | When the track was originally created |
| `releaseDate` | date | Public release date, if applicable |
| `duration` | number | Total duration in seconds — sum of all versions |
| `playlist` | string | Playlist assignment (e.g. `Latest Releases`) |
| `tags` | array | Custom tags — user-defined, freeform |

---

## Version-Level Fields

Each version of a track carries its own full set of descriptive metadata.

| Field | Type | Auto | Notes |
|---|---|---|---|
| `file` | string | yes | Filename (e.g. `floataway3.mp3`) |
| `version` | number | no | Parsed from filename as a default, but fully editable in the backend UI — user has final say |
| `displayTitle` | string | no | Optional custom title for this version (e.g. `Float Away (Final Mix)`) |
| `uploadedDate` | date | yes | When this version was uploaded |
| `releaseDate` | date | no | Release date specific to this version |
| `duration` | number | yes | Duration in seconds — extracted from file |
| `bitrate` | number | yes | Bitrate in kbps — extracted from file |
| `genre` | array | no | e.g. `["electronic", "ambient"]` |
| `mood` | array | no | e.g. `["chill", "dreamy"]` |
| `bpm` | array | no | e.g. `["120"]` — array to allow range or ambiguity |
| `key` | array | no | e.g. `["Am"]` |
| `artists` | array | no | Featured artists on this version — references artist `id`s |
| `tags` | array | no | Custom tags — user-defined, freeform |
| `lyrics` | string | no | Full lyrics text |
| `notes` | string | no | Any notes about this version |
| `playCount` | number | no | Number of times this version has been played — source of truth for all play count displays. Track-level and group-level totals are computed on the fly by summing the versions currently in view |
| `hasStems` | boolean | no | Whether stems are available for this version. Placeholder for now — no sort or filter tied to it yet |

---

## Empty Fields

Fields that haven't been filled in simply appear empty in the UI. The code may handle unfilled values differently under the hood (empty strings, null, empty arrays depending on type), but that's an implementation detail — the user never sees or thinks about it.

---

## Filter Options

Filters are organized into four categories in an "Add Filter" dropdown. Once a filter is selected, the user configures its condition inline as a chip (e.g. `Genre: [contains] [electronic] [×]`). Filtering is real-time — no apply button.

### Time

| Filter | Condition Options | Target |
|---|---|---|
| Uploaded | before / after / between | `uploadedDate` (track or version) |
| Created | before / after / between | `createdDate` (track) |
| Released | before / after / between | `releaseDate` (track or version) |

### Metadata

| Filter | Condition Options | Target |
|---|---|---|
| Artist | is / is not | `artist` (track) or `artists` (version) |
| Genre | contains / does not contain | `genre` (version) |
| Mood | contains / does not contain | `mood` (version) |
| BPM | equals / between | `bpm` (version) |
| Key | is / is not | `key` (version) |
| Tags | contains / does not contain | `tags` — searches across artist, track, and version levels |

### Version

| Filter | Behavior |
|---|---|
| Latest only | Shows only the highest-numbered version of each track |
| First only | Shows only v1 of each track |
| Specific # | User enters a version number; shows only that version where it exists |

### Other

| Filter | Behavior |
|---|---|
| Has lyrics | Shows only versions where `lyrics` is not empty |
| Has notes | Shows only versions where `notes` is not empty |

---

## Group By Options

Controls how tracks are visually grouped in the list. Default is Artist.

| Option | Behavior |
|---|---|
| Artist | Groups tracks by their primary artist (default) |
| Genre | Groups by version-level genre — a track may appear in multiple groups |
| Mood | Groups by version-level mood — same multi-group behavior |
| Playlist | Groups by track-level playlist assignment |
| Upload Date | Groups by upload month/year |
| None | Flat list, no grouping |

---

## Sort Options

Two dropdowns: field and direction.

| Sort Field | Direction Options |
|---|---|
| Upload Date | Newest / Oldest |
| Created Date | Newest / Oldest |
| Title | A–Z / Z–A |
| Duration | Longest / Shortest |
| BPM | Highest / Lowest |
| Play Count | Most / Least played |
| Random | Shuffles track order each time it's selected |

---

## Implementation Phases

**Phase 1 — Core Metadata (Editor)**
Build the metadata editor UI backed by the schema above. Add `displayTitle`, `createdDate`, and `modifiedDate` fields. Artist data stored and referenced separately.

**Phase 2 — Frontend Structure**
Single-version tracks display as flat rows. Multi-version tracks get collapsible containers with a 3-dot menu including "Download All."

**Phase 3 — Info Modal**
"View Info" on each version opens a modal showing all metadata. Lyrics and notes are in collapsible sections. Mobile-responsive.

**Phase 4 — Filter / Group / Sort**
Navbar with Filter, Group, and Sort controls. Active filters displayed as chips. Real-time filtering. All options driven by the schema — no hardcoded field lists.

**Phase 5 — Player Enhancements**
Autoplay toggle in footer with persisted preference.

**Phase 6 — Playlists**
`playlists.json` structure. Frontend reads and applies playlist filters. Playlist selector in navbar.
