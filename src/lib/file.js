import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';

export class File {
    constructor({ id, name, path, type }) {
        this.id = id;
        this.name = name;
        this.path = path;
        this.type = 'file';
    }
}

export class Folder {
    constructor({ id, name, path, type, children }) {
        this.id = id;
        this.name = name;
        this.path = path;
        this.type = 'folder';
        this.children = Array.isArray(children) ? children : [];
        this.childMap = new Map();
    }

    loadContents() {
        const { folder, fileMap } = buildFolder({
            id: this.id,
            name: this.name,
            path: this.path,
            type: this.type,
            children: this.children
        });
        Object.assign(this, folder);
        this.childMap = new Map(Object.entries(fileMap));
    }
}

const buildFolder = (folder, fileMap = {}) => {
    fileMap[folder.id] = folder;
    const fileNames = fs.readdirSync(folder.path);
    fileNames.forEach(fileName => {
        const filePath = path.join(folder.path, fileName)
        if (isFolder(filePath)) {
            const subFolder = new Folder({
                id: filePath,
                path: filePath,
                name: fileName,
            });
            fileMap[subFolder.id] = subFolder;
            folder.children.push(subFolder);
            buildFolder(subFolder);
        } else {
            const fileInFolder = new File({
                id: filePath,
                path: filePath,
                name: fileName,
            });
            fileMap[fileInFolder.id] = fileInFolder;
            folder.children.push(fileInFolder);
        }
    });
    return { folder, fileMap };
};

function createFolder(folderPath) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
};

export function isFolder(filePath) {
    const stat = fs.lstatSync(filePath);
    return stat.isDirectory();
};

function copyData(srcFilePath, destFolder) {
    const fileName = path.basename(srcFilePath);
    const destFilePath = path.join(destFolder, fileName);
    if (isFolder(srcFilePath)) {
        // Recursively copies files from folder
        fse.copySync(srcFilePath, destFilePath);
    } else {
        fs.copyFileSync(srcFilePath, destFilePath);
    }
    return destFilePath;
};

export function copyToFolder(filePaths, folderPath) {
    const copiedFiles = [];
    // Create folder if it doesn't exist.
    createFolder(folderPath);
    filePaths.forEach(filePath => {
        try {
            const newFilePath = copyData(filePath, folderPath);
            const newFileName = path.basename(newFilePath);
            copiedFiles.push(newFileName);
        } catch(err) {
            console.error(err);
        }
    });
    return copiedFiles;
};
