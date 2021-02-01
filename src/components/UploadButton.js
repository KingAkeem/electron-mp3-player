import React from 'react';
import { MusicNote } from '@material-ui/icons';
import { IconButton } from '@material-ui/core';

import { remote } from 'electron';
const dialog = remote.dialog;

import { File } from '../lib/file';

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

export const UploadButton = ({ onNewFiles }) => {
    const handleUpload = () => {
        const filePaths = selectFiles();
        const toFile = filePath => {
            const file = new File({
                filePath,
                id: filePath,
            });
            if (file.type === 'folder') {
                const folder = file.loadContents();
                return folder;
            }
            return file;
        };
        const files = filePaths.map(toFile);
        files.forEach(file => file.copy('music'));
        onNewFiles(files);
    };

    return (
        <React.Fragment>
            <IconButton size='small' onClick={handleUpload}>
                Upload Songs<MusicNote/>
            </IconButton>
        </React.Fragment>
    );
};
