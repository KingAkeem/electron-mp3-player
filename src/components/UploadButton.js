import React from 'react';
import { MusicNote } from '@material-ui/icons';
import { IconButton } from '@material-ui/core';

import fs from 'fs';
import path from 'path';
import { remote } from 'electron';
const dialog = remote.dialog;
import { remove } from 'lodash';

import { isFolder, copyToFolder } from '../lib/file';

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
    return remove(filePaths, filePath => isFolder(filePath));
};

export const UploadButton = ({ onNewFiles }) => {
    const handleUpload = () => {
        const filePaths = selectFiles();
        const folderPaths = extractFolderPaths(filePaths);
        copyToFolder(filePaths, 'music');
        copyToFolder(folderPaths, 'music');
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
