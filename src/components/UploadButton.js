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
        title: 'Select MP3s',
        buttonLabel: 'Add Songs',
        filters: [{name: 'Music', extensions: ['mp3']}],
        properties: ['openFile', 'multiSelections']
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
        const fileResults = copyToFolder(filePaths, 'music');
        const folderResults = copyToFolder(folderPaths, 'music');
        const resolutions = [...fileResults.resolutions, ...folderResults.resolutions];
        const rejections = [...fileResults.rejections, ...folderResults.rejections];
        onNewFiles({ resolutions, rejections });
    };

    return (
        <React.Fragment>
            <IconButton size='small' onClick={handleUpload}>
                Upload Songs<MusicNote/>
            </IconButton>
        </React.Fragment>
    );
};
