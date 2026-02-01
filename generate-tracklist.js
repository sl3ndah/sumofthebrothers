const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');

const musicDir = path.join(__dirname, 'music');
const metadataPath = path.join(__dirname, 'tracks-metadata.json');

// Scan music folders and extract MP3 metadata
async function scanMusicFolders() {
    const scannedData = {};
    
    if (!fs.existsSync(musicDir)) {
        console.error(`Error: music/ folder not found at ${musicDir}`);
        return scannedData;
    }
    
    const artists = fs.readdirSync(musicDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    
    for (const artist of artists) {
        const artistPath = path.join(musicDir, artist);
        scannedData[artist] = {};
        
        const trackDirs = fs.readdirSync(artistPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        for (const trackDir of trackDirs) {
            const trackPath = path.join(artistPath, trackDir);
            const files = fs.readdirSync(trackPath)
                .filter(file => file.endsWith('.mp3'))
                .sort();
            
            scannedData[artist][trackDir] = [];
            
            // Extract metadata from each MP3
            for (const file of files) {
                const filePath = path.join(trackPath, file);
                
                try {
                    const metadata = await mm.parseFile(filePath);
                    
                    scannedData[artist][trackDir].push({
                        file: file,
                        duration: Math.round(metadata.format.duration || 0),
                        bitrate: Math.round((metadata.format.bitrate || 0) / 1000)
                    });
                } catch (error) {
                    console.error(`Error reading ${file}:`, error.message);
                    scannedData[artist][trackDir].push({
                        file: file,
                        duration: 0,
                        bitrate: 0
                    });
                }
            }
        }
    }
    
    return scannedData;
}

// Load existing metadata
function loadMetadata() {
    if (fs.existsSync(metadataPath)) {
        try {
            const content = fs.readFileSync(metadataPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error loading metadata:', error.message);
            return { artists: {}, tracks: {} };
        }
    }
    return { artists: {}, tracks: {} };
}

// Extract version number from filename
function extractVersion(filename) {
    const match = filename.match(/(\d+)\.mp3$/);
    return match ? parseInt(match[1]) : 1;
}

// Migrate old format to new format
function migrateOldFormat(oldData) {
    const newFormat = {
        artists: {},
        tracks: {}
    };
    
    // Create artists from old data
    for (const artist of Object.keys(oldData)) {
        newFormat.artists[artist] = {
            displayName: artist === 'cooljoe' ? 'Cool Joe' : artist === 'sum' ? 'Sum of the Brothers' : artist,
            bio: '',
            links: {
                website: '',
                instagram: '',
                spotify: '',
                soundcloud: '',
                bandcamp: '',
                youtube: ''
            }
        };
        
        newFormat.tracks[artist] = {};
        
        // Convert tracks
        for (const [trackKey, trackData] of Object.entries(oldData[artist])) {
            const totalDuration = trackData.versions?.reduce((sum, v) => sum + (v.duration || 0), 0) || 0;
            
            newFormat.tracks[artist][trackKey] = {
                title: trackData.title || trackKey,
                artist: artist,
                uploadedDate: trackData.releaseDate || '',  // Old releaseDate becomes uploadedDate
                releaseDate: [],
                duration: totalDuration,
                playlist: trackData.playlist || '',
                versions: trackData.versions?.map(v => ({
                    file: v.file,
                    version: v.version,
                    uploadedDate: v.releaseDate || '',
                    releaseDate: [],
                    duration: v.duration || 0,
                    bitrate: v.bitrate || 0,
                    genre: [],
                    mood: [],
                    bpm: [],
                    key: [],
                    artists: [artist],
                    lyrics: '',
                    notes: ''
                })) || []
            };
        }
    }
    
    return newFormat;
}

// Update metadata with scanned data
async function updateMetadata(scannedData, existingMetadata) {
    let metadata = existingMetadata;
    
    // Check if old format and migrate
    if (!metadata.artists && !metadata.tracks) {
        console.log('🔄 Migrating from old format to new format...');
        metadata = migrateOldFormat(existingMetadata);
    }
    
    // Ensure structure exists
    if (!metadata.artists) metadata.artists = {};
    if (!metadata.tracks) metadata.tracks = {};
    
    const today = new Date().toISOString().split('T')[0];
    
    for (const [artist, tracks] of Object.entries(scannedData)) {
        // Add artist if doesn't exist
        if (!metadata.artists[artist]) {
            metadata.artists[artist] = {
                displayName: artist === 'cooljoe' ? 'Cool Joe' : artist === 'sum' ? 'Sum of the Brothers' : artist,
                bio: '',
                links: {
                    website: '',
                    instagram: '',
                    spotify: '',
                    soundcloud: '',
                    bandcamp: '',
                    youtube: ''
                }
            };
        }
        
        // Ensure artist exists in tracks
        if (!metadata.tracks[artist]) {
            metadata.tracks[artist] = {};
        }
        
        for (const [trackName, files] of Object.entries(tracks)) {
            // Add track if doesn't exist
            if (!metadata.tracks[artist][trackName]) {
                metadata.tracks[artist][trackName] = {
                    title: trackName,
                    artist: artist,
                    uploadedDate: today,
                    releaseDate: [],
                    duration: 0,
                    playlist: 'Latest Releases',
                    versions: []
                };
            }
            
            // Update versions
            const existingVersions = new Map(
                (metadata.tracks[artist][trackName].versions || []).map(v => [v.file, v])
            );
            
            metadata.tracks[artist][trackName].versions = files.map(fileData => {
                if (existingVersions.has(fileData.file)) {
                    // Update existing version with new auto-extracted data
                    const existing = existingVersions.get(fileData.file);
                    return {
                        ...existing,
                        duration: fileData.duration,
                        bitrate: fileData.bitrate
                    };
                } else {
                    // New version
                    return {
                        file: fileData.file,
                        version: extractVersion(fileData.file),
                        uploadedDate: today,
                        releaseDate: [],
                        duration: fileData.duration,
                        bitrate: fileData.bitrate,
                        genre: [],
                        mood: [],
                        bpm: [],
                        key: [],
                        artists: [artist],
                        lyrics: '',
                        notes: ''
                    };
                }
            });
            
            // Update track duration (sum of all versions)
            metadata.tracks[artist][trackName].duration = metadata.tracks[artist][trackName].versions
                .reduce((sum, v) => sum + (v.duration || 0), 0);
        }
    }
    
    return metadata;
}

// Main execution
async function main() {
    console.log('🎵 Scanning music folders...\n');
    
    const scannedData = await scanMusicFolders();
    let totalTracks = 0;
    
    console.log('📁 Found artists and tracks:\n');
    for (const [artist, tracks] of Object.entries(scannedData)) {
        const trackCount = Object.keys(tracks).length;
        totalTracks += trackCount;
        console.log(`   ${artist} (${trackCount} track${trackCount !== 1 ? 's' : ''})`);
        for (const [track, files] of Object.entries(tracks)) {
            console.log(`      └─ ${track} (${files.length} version${files.length !== 1 ? 's' : ''})`);
        }
    }
    
    console.log(`\n📝 Total: ${totalTracks} tracks`);
    
    console.log('\n📝 Updating metadata...');
    const existingMetadata = loadMetadata();
    const updatedMetadata = await updateMetadata(scannedData, existingMetadata);
    
    // Save metadata
    fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2), 'utf8');
    console.log('✅ tracks-metadata.json updated');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ Done! Metadata extracted and updated.\n');
}

main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
