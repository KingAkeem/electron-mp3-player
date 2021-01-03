import fs from 'fs';
import path from 'path';

export const MusicDirectory = 'music';
export const getSongPath = song => path.join(MusicDirectory, song);

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

export const deleteFile = (file, dir) => {
    const dest = path.join(dir, file);
    fs.unlinkSync(dest);
};