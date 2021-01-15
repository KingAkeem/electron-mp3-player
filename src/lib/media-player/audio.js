import fs from 'fs';
import dataurl from 'dataurl';
import mime from 'mime-types';

/**
 * Converts file to an Audio object
 * @param {string} filePath - path to an audio file (mp3 currently)
 */
const toAudio = filePath => new Promise(function(resolve, reject) {
    fs.readFile(filePath, (err, data) => {
        if (err) reject(err);
        const songData = dataurl.convert({ data, mimetype: mime.lookup(filePath) });
        resolve(new Audio(songData));
    });
});

/**
 * Plays audio once audio is loaded, may need to add a timer in case audio never loads.
 * @param {string} filePath - filePath to audio file
 */
export const playAudio = filePath => new Promise(function(resolve, reject) {
    toAudio(filePath).then(audio => {
        audio.addEventListener('canplay', evt => {
            audio.play();
            resolve(audio, evt);
        });
    });
});
