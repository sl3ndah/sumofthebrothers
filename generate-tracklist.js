const fs = require('fs');
const path = require('path');

// Paths
const musicDir = path.join(__dirname, 'music');
const metadataPath = path.join(__dirname, 'tracks-metadata.json');
const indexPath = path.join(__dirname, 'index.html');

// Read tracks from folder structure (artist/track/versions)
function scanMusicFolders() {
    const data = {};
    
    try {
        // Scan artist folders
        const artistFolders = fs.readdirSync(musicDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .sort();
        
        for (const artist of artistFolders) {
            data[artist] = {};
            const artistPath = path.join(musicDir, artist);
            
            // Scan track folders within artist
            const trackFolders = fs.readdirSync(artistPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)
                .sort();
            
            for (const track of trackFolders) {
                const trackPath = path.join(artistPath, track);
                const files = fs.readdirSync(trackPath)
                    .filter(file => file.toLowerCase().endsWith('.mp3'))
                    .sort();
                
                if (files.length > 0) {
                    data[artist][track] = files;
                }
            }
        }
        
        return data;
    } catch (error) {
        console.error('Error scanning music folders:', error.message);
        process.exit(1);
    }
}

// Load or create metadata
function loadMetadata() {
    try {
        if (fs.existsSync(metadataPath)) {
            return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }
    } catch (error) {
        console.warn('Could not load metadata, will create new one');
    }
    return {};
}

// Extract version number from filename
function extractVersion(filename) {
    const match = filename.match(/(\d+)\.mp3$/);
    return match ? parseInt(match[1]) : 1;
}

// Update metadata with discovered tracks
function updateMetadata(scannedData, existingMetadata) {
    const metadata = { ...existingMetadata };
    const today = new Date().toISOString().split('T')[0];
    
    for (const [artist, tracks] of Object.entries(scannedData)) {
        if (!metadata[artist]) {
            metadata[artist] = {};
        }
        
        for (const [trackName, files] of Object.entries(tracks)) {
            if (!metadata[artist][trackName]) {
                // New track - create entry
                metadata[artist][trackName] = {
                    title: trackName,
                    releaseDate: today,
                    playlist: "Latest Releases",
                    versions: []
                };
            }
            
            // Update versions
            const existingVersions = new Map(
                (metadata[artist][trackName].versions || []).map(v => [v.file, v])
            );
            
            metadata[artist][trackName].versions = files.map(file => {
                if (existingVersions.has(file)) {
                    return existingVersions.get(file);
                } else {
                    // New version
                    return {
                        file: file,
                        version: extractVersion(file),
                        releaseDate: today
                    };
                }
            });
            
            // Update track release date to latest version
            const latestVersion = metadata[artist][trackName].versions
                .sort((a, b) => b.version - a.version)[0];
            if (latestVersion) {
                metadata[artist][trackName].releaseDate = latestVersion.releaseDate;
            }
        }
    }
    
    return metadata;
}

// Update tracks.js
function updateTracksJS(metadata) {
    try {
        const tracksData = JSON.stringify(metadata, null, 2);
        const tracksString = `const tracksData = ${tracksData};`;
        
        fs.writeFileSync(path.join(__dirname, 'tracks.js'), tracksString, 'utf8');
        return true;
    } catch (error) {
        console.error('Error updating tracks.js:', error.message);
        return false;
    }
}

// Main execution
console.log('🎵 Scanning music folders...\n');

const scannedData = scanMusicFolders();
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
const updatedMetadata = updateMetadata(scannedData, existingMetadata);

// Save metadata
fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2), 'utf8');
console.log('✅ tracks-metadata.json updated');

console.log('\n📝 Updating tracks.js...');
if (updateTracksJS(updatedMetadata)) {
    console.log('✅ tracks.js updated');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ Done! Track list updated.\n');
} else {
    console.log('❌ Failed to update tracks.js');
}
