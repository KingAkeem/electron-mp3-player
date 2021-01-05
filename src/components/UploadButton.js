import React from 'react';
import fs from 'fs';
import path from 'path';
import { MusicNote } from '@material-ui/icons';
import { IconButton } from '@material-ui/core';
import { remote } from 'electron';
import { createDirectory, moveToDirectory } from '../fileUtils';
import { remove } from 'lodash';
const dialog = remote.dialog;

const selectFiles = () => {
    const dialgProperties = {
        title: 'Select Music',
        buttonLabel: 'Save Songs',
        filters: [{name: 'Music', extensions: ['mp3']}],
        properties: [ 'openFile', 'multiSelections']
    };
    const paths = dialog.showOpenDialogSync(dialgProperties);
    return paths || [];
};

const extractFolderPaths = filePaths => {
    return remove(filePaths, filePath => {
        const stats = fs.lstatSync(filePath);
        return stats.isDirectory();
    });
};

export const UploadButton = ({ onNewFiles }) => {
    const handleUpload = () => {
        const filePaths = selectFiles();
        const folderPaths = extractFolderPaths(filePaths);
        moveToDirectory(filePaths, 'music');
        moveToDirectory(folderPaths, 'music');
        onNewFiles({ folders: folderPaths, files: filePaths });
    };

    return (
        <React.Fragment>
            <IconButton size='small' onClick={handleUpload}>
                Upload Songs<MusicNote/>
            </IconButton>
        </React.Fragment>
    );
};
