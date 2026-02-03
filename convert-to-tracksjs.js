const fs = require('fs');
const path = require('path');

const metadataPath = path.join(__dirname, 'tracks-metadata.json');
const tracksJsPath = path.join(__dirname, 'tracks.js');

function convertToTracksJs(metadata) {
    // Convert new format back to old format for tracks.js
    const tracksData = {};
    
    if (!metadata.tracks) {
        console.error('Error: No tracks data found in metadata');
        return tracksData;
    }
    
    for (const [artist, tracks] of Object.entries(metadata.tracks)) {
        tracksData[artist] = {};
        
        for (const [trackKey, trackData] of Object.entries(tracks)) {
            tracksData[artist][trackKey] = {
                title: trackData.title,
                releaseDate: trackData.uploadedDate,
                playlist: trackData.playlist,
                duration: trackData.duration,
                versions: (trackData.versions || []).map(v => ({
                    file: v.file,
                    version: v.version,
                    releaseDate: v.uploadedDate,
                    duration: v.duration,
                    bitrate: v.bitrate,
                    genre: v.genre,
                    mood: v.mood,
                    bpm: v.bpm,
                    key: v.key,
                    lyrics: v.lyrics,
                    notes: v.notes
                }))
            };
        }
    }
    
    return tracksData;
}

function main() {
    console.log('📝 Converting tracks-metadata.json to tracks.js...');
    
    if (!fs.existsSync(metadataPath)) {
        console.error('Error: tracks-metadata.json not found');
        process.exit(1);
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const tracksData = convertToTracksJs(metadata);
    
    const output = `const tracksData = ${JSON.stringify(tracksData, null, 2)};\n`;
    fs.writeFileSync(tracksJsPath, output, 'utf8');
    
    console.log('✅ tracks.js updated');
}

main();
