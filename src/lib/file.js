import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import {current, enableMapSet,immerable, produce} from 'immer';
enableMapSet();

/**
 * Represents file in memory
 */
export class File {
    constructor({ id, name, path }) {
        this[immerable] = true;
        this.id = id;
        this.name = name;
        this.path = path;
        this.type = 'file';
    }
}

/**
 * Deletes file from memoery 
 * @param {File} file 
 */
const deleteFile = file => {
    if (file.type === 'folder') fs.rmdirSync(file.path, {
        recursive: true
    });
    else fs.unlinkSync(file.path);
};

export class Folder extends File {
    constructor({ id, name, path, files }) {
        super({ id, name, path });
        this[immerable] = true;
        this.type = 'folder';
        this.files = Array.isArray(files) ? files : [];
        this.fileMap = new Map();
    }

    /**
     * Insert files into folder 
     * @param {Array<File>} files 
     * @returns {Folder} - this
     */
    add(files) {
        return produce(this, draft => {
            files.forEach(file => {
                if (!draft.fileMap.has(file.id)) {
                    draft.fileMap.set(file.id, file);
                    draft.files.push(file);
                }
            });
        });
    }

    getFiles() {
        return this.files;
    }

    /**
     * Removes file from memory and local state 
     * @param {File} file 
     */
    _removeFromMemory(file) {
        deleteFile(file);
        const files = this.getFiles();
        const index = files.findIndex(f => f.path === file.path);
        if (index === -1) return;
        const [removedFile] = files.splice(index, 1);
        this.fileMap.delete(removedFile.path)
    }

    /**
     * Remove files from this folder or any of it's subfolders 
     * @param {Array<string>} filePaths 
     * @returns {Folder} - this
     */
    remove(filePaths) {
        const removalSet = new Set(filePaths);
        return produce(this, currentFolder => {
            if (removalSet.size === 0) return;
            const files = currentFolder.getFiles();
            files.forEach(file => {
                if (removalSet.has(file.path)) {
                    currentFolder._removeFromMemory(file);
                    // Update removal set
                    removalSet.delete(file.path);
                }
                if (file.type === 'folder') file.remove(Array.from(removalSet));
            });
        });
    }

    /**
     * Builds folder tree structure
     * @returns {Folder} - this
     */
    loadContents() {
        const { folder, fileMap } = buildFolder(this);
        return produce(this, draft => {
            draft = Object.assign(draft, folder);
            draft.childMap = new Map(Object.entries(fileMap));
        });
    }
}

/**
 * Builds folder tree structure from memory 
 * @param {Folder} folder 
 * @param {Map<string, File>} fileMap 
 */
const buildFolder = (folder, fileMap = {}) => {
    // load contents before reading file
    fileMap[folder.id] = folder;
    const fileNames = fs.readdirSync(folder.path);
    fileNames.forEach(fileName => {
        const filePath = path.join(folder.path, fileName)
        if (isFolder(filePath)) {
            let subFolder = new Folder({
                id: filePath,
                path: filePath,
                name: fileName,
            });
            fileMap[subFolder.id] = subFolder;
            subFolder = subFolder.loadContents();
            folder = folder.add([subFolder]);
            buildFolder(subFolder);
        } else {
            const fileInFolder = new File({
                id: filePath,
                path: filePath,
                name: fileName,
            });
            fileMap[fileInFolder.id] = fileInFolder;
            folder = folder.add([fileInFolder]);
        }
    });
    return { folder, fileMap };
};

/**
 * Creates folder if it doesn't exist. 
 * @param {string} folderPath 
 */
function createFolder(folderPath) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
};

/**
 * Determines if path leads to a folder 
 * @param {string} filePath 
 * @returns {boolean}
 */
export function isFolder(filePath) {
    const stat = fs.lstatSync(filePath);
    return stat.isDirectory();
};

/**
 * Copies a list of files to a folder. 
 * @param {Array<string>} filePaths 
 * @param {string} folderPath 
 * @returns {Object} - how many resolutions and rejections (rejections contain an error message)
 */
export function copyToFolder(filePaths, folderPath) {
    const resolutions = [];
    const rejections = [];
    // Create folder if it doesn't exist.
    createFolder(folderPath);
    filePaths.forEach(filePath => {
        const fileName = path.basename(filePath);
        const destFilePath = path.join(folderPath, fileName);
        const metadata = {
            name: fileName,
            path: destFilePath,
            id: destFilePath
        };
        let fileData = isFolder(filePath) ? new Folder(metadata) : new File(metadata);
        try {
            // Recursively copies files from folder
            if (isFolder(filePath)) {
                fse.copySync(filePath, destFilePath)
                fileData = fileData.loadContents();
            } else {
                fs.copyFileSync(filePath, destFilePath)
            }
            resolutions.push(fileData);
        } catch(err) {
            rejections.push({ fileData, error: err });
        }
    });
    return { resolutions, rejections };
};
