import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';

function createDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
};

export function isDirectory(filePath) {
    const stat = fs.lstatSync(filePath);
    return stat.isDirectory();
};

function copyFile(srcFilePath, destDir) {
    const fileName = path.basename(srcFilePath);
    const destFilePath = path.join(destDir, fileName);
    if (isDirectory(srcFilePath)) {
        // Recursively copies files from folder
        fse.copySync(srcFilePath, destFilePath);
    } else {
        fs.copyFileSync(srcFilePath, destFilePath);
    }
    return destFilePath;
};

export const moveToDirectory = (filePaths, dir) => {
    const copiedFiles = [];
    // Create directory if it doesn't exist.
    createDirectory(dir);
    filePaths.forEach(filePath => {
        try {
            const newFilePath = copyFile(filePath, dir);
            const newFileName = path.basename(newFilePath);
            copiedFiles.push(newFileName);
        } catch(err) {
            console.error(err);
        }
    });
    return copiedFiles;
};
