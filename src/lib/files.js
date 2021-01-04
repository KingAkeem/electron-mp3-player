import fs from 'fs';
import path from 'path';
import dataurl from 'dataurl';
import mime from 'mime-types';

export const createDirectory = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
};

export const moveToDirectory = (filePaths, dir) => {
    const copiedFiles = [];
    // Create directory if it doesn't exist.
    createDirectory(dir);
    filePaths.forEach(filePath => {
        const file = path.basename(filePath);
        // Join directory with file to create a new path.
        const newPath = path.join(dir, file);
        fs.copyFileSync(filePath, newPath);
        copiedFiles.push(file);
    });
    return copiedFiles;
};

export const MusicDirectory = 'music';
export const getPath = song => path.join(MusicDirectory, song);

export class FileManager {
    constructor(folder) {
        this.loadData(folder);
    }

    loadData(folder) {
        this._folder = folder;
        const songFiles = fs.readdirSync(this._folder);
        this.files = songFiles;
    }

    insertFiles(files) {
        moveToDirectory(files, this._folder);
        this.files.append(files);
    }

    removeFiles(files) {
        const removeFile = file => {
            const dest = path.join(this._folder, file);
            fs.unlinkSync(dest);
            this.files = this.files.filter(f => f === file);
        };
        files.forEach(removeFile);
    }

    convertToAudio(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) reject(err);
                const songData = dataurl.convert({ data, mimetype: mime.lookup(filePath) });
                resolve(new Audio(songData));
            });
        });
    }

    playAudio(file) {
        return new Promise((resolve, reject) => {
            const filePath = getPath(file);
            this.convertToAudio(filePath).then(audio => {
                audio.addEventListener('canplay', evt => {
                    audio.play();
                    resolve(audio, evt);
                });
            });
        })
    }
}