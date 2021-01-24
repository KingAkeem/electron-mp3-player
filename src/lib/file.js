import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { enableMapSet,immerable, produce} from 'immer';
enableMapSet();

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

const createFolderMap = children => {
    const map = new Map();
    if (!Array.isArray(children)) return map;
    children.forEach(file => map.set(file.id, file));    
    return map;
};

export class File {
    constructor({ id, filePath, children }) {
        this[immerable] = true;
        this.id = id;
        this.name = path.basename(filePath);
        this.path = filePath;
        this.type = isFolder(filePath) ? 'folder' : 'file';
        // Files have no children
        this.children = this.type === 'folder' ? Array.isArray(children) ? children : [] : null;
        this.childMap = this.type === 'folder' ? createFolderMap(children) : null;
    }

    /**
     * Insert children into folder 
     * @param {Array<File>} children 
     * @returns {File} - this
     */
    add(children) {
        return produce(this, draft => {
            children.forEach(file => {
                if (!draft.childMap.has(file.id)) {
                    draft.childMap.set(file.id, file);
                    draft.children.push(file);
                }
            });
        });
    }

    getChildren() {
        return this.children;
    }

    /**
     * Removes file from memory and local state 
     * @param {File} file 
     */
    _removeFromMemory(file) {
        deleteFile(file);
        const children = this.getChildren();
        const index = children.findIndex(f => f.path === file.path);
        if (index === -1) return;
        const [removedFile] = children.splice(index, 1);
        this.childMap.delete(removedFile.path)
    }

    /**
     * Remove children from this folder or any of it's subfolders 
     * @param {Array<string>} filePaths 
     * @returns {File} - this
     */
    remove(filePaths) {
        const removalSet = new Set(filePaths);
        return produce(this, currentFile => {
            if (removalSet.size === 0) return;
            const children = currentFile.getChildren();
            children.forEach(file => {
                if (removalSet.has(file.path)) {
                    currentFile._removeFromMemory(file);
                    // Update removal set
                    removalSet.delete(file.path);
                }
                if (file.type === 'folder') file.remove(Array.from(removalSet));
            });
        });
    }

    /**
     * Builds folder tree structure
     * @returns {File} - this
     */
    loadContents() {
        if (isFolder(this.path)) {
            this.type = 'folder';
            this.children = [];
            this.childMap = new Map();
        } else {
            throw new Error(`File is not a folder. File ID: ${this.id}`);
        }
        const { folder } = buildFolder(this);
        return produce(this, draft => {
            draft = Object.assign(draft, folder);
        });
    }
}

/**
 * Builds folder tree structure from memory 
 * @param {File} folder 
 */
const buildFolder = folder => {
    const insertFile = file => folder = folder.add([file]);
    const insertFolder = subFolder => {
        const loadedFolder = subFolder.loadContents();
        buildFolder(loadedFolder);
        insertFile(loadedFolder);
    };
    // load contents before reading file
    const fileNames = fs.readdirSync(folder.path);
    fileNames.forEach(fileName => {
        const filePath = path.join(folder.path, fileName)
        const file = new File({
            id: filePath,
            filePath,
        });
        file.type === 'folder' ? insertFolder(file) : insertFile(file);
    });
    return { folder };
};

/**
 * Creates folder if it doesn't exist. 
 * @param {string} folderPath 
 */
export function createFolder(folderPath) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
};

/**
 * Determines if path leads to a folder 
 * @param {string} filePath 
 * @returns {boolean}
 */
export function isFolder(filePath) {
    try {
        const stat = fs.lstatSync(filePath);
        return stat.isDirectory();
    } catch (err) {
        return false;
    }
};

/**
 * Copies a list of children to a folder. 
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
        let file = new File({
            id: destFilePath,
            filePath: destFilePath
        });
        try {
            // Recursively copies children from folder
            if (isFolder(filePath)) {
                fse.copySync(filePath, destFilePath)
                file = file.loadContents();
            } else {
                fs.copyFileSync(filePath, destFilePath)
            }
            resolutions.push(file);
        } catch(err) {
            rejections.push({ fileData: file, error: err });
        }
    });
    return { resolutions, rejections };
};
