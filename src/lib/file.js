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
    constructor({ id, name, path, children }) {
        this[immerable] = true;
        this.id = id;
        this.name = name;
        this.path = path;
        this.type = isFolder(path) ? 'folder' : 'file';
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
        const { folder, childMap } = buildFile(this);
        return produce(this, draft => {
            draft = Object.assign(draft, folder);
            draft.childMap = new Map(Object.entries(childMap));
        });
    }
}

/**
 * Builds folder tree structure from memory 
 * @param {File} folder 
 * @param {Map<string, File>} childMap 
 */
const buildFile = (folder, childMap = {}) => {
    // load contents before reading file
    childMap[folder.id] = folder;
    const fileNames = fs.readdirSync(folder.path);
    fileNames.forEach(fileName => {
        const filePath = path.join(folder.path, fileName)
        if (isFolder(filePath)) {
            let subFile = new File({
                id: filePath,
                path: filePath,
                name: fileName,
            });
            childMap[subFile.id] = subFile;
            subFile = subFile.loadContents();
            folder = folder.add([subFile]);
            buildFile(subFile);
        } else {
            const fileInFile = new File({
                id: filePath,
                path: filePath,
                name: fileName,
            });
            childMap[fileInFile.id] = fileInFile;
            folder = folder.add([fileInFile]);
        }
    });
    return { folder, childMap };
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
        const file = new File({
            name: fileName,
            path: destFilePath,
            id: destFilePath
        });
        try {
            // Recursively copies children from folder
            if (file.type === 'folder') {
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
