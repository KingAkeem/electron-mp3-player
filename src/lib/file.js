import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import {enableMapSet,immerable, produce} from 'immer';
enableMapSet();

export class File {
    constructor({ id, name, path }) {
        this[immerable] = true;
        this.id = id;
        this.name = name;
        this.path = path;
        this.type = 'file';
    }
}

const deleteFile = filePath => {
    if (isFolder(filePath)) fs.rmdirSync(filePath, {
        recursive: true
    });
    else fs.unlinkSync(filePath);
};

export class Folder {
    constructor({ id, name, path, children }) {
        this[immerable] = true;
        this.id = id;
        this.name = name;
        this.path = path;
        this.type = 'folder';
        this.children = Array.isArray(children) ? children : [];
        this.childMap = new Map();
    }

    add(files) {
        return produce(this, draft => {
            files.forEach(file => {
                if (!draft.childMap.has(file.id)) {
                    draft.childMap.set(file.id, file);
                    draft.children.push(file);
                }
            });
        });
    }

    remove(filePaths) {
        return produce(this, draft => {
            filePaths.forEach(filePath => {
                for (let i = 0; i < draft.children.length; i++) {
                    let file = draft.children[i];
                    if (file.path === filePath) {
                        deleteFile(filePath);
                        const [removedFile] = draft.children.splice(i, 1);
                        draft.childMap.delete(removedFile.id);
                        return;
                    }
                    if (file.type === 'folder') file.remove(filePaths);
                }
            });
        });
    }

    loadContents() {
        const { folder, fileMap } = buildFolder(this);
        return produce(this, draft => {
            draft = Object.assign(draft, folder);
            draft.childMap = new Map(Object.entries(fileMap));
        });
    }
}

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

function createFolder(folderPath) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
};

export function isFolder(filePath) {
    const stat = fs.lstatSync(filePath);
    return stat.isDirectory();
};

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
