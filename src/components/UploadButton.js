import React from 'react';
import  { moveToDirectory, MusicDirectory } from '../lib/files';
import { MusicNote } from '@material-ui/icons';
import { IconButton } from '@material-ui/core';
import { remote } from 'electron';
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

const uploadFiles = () => {
    const filePaths = selectFiles();
    const copiedFiles = moveToDirectory(filePaths, MusicDirectory);
    return copiedFiles;
};

export const UploadButton = ({ onNewFiles }) => {
    const handleUpload = () => {
        const files = uploadFiles();
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