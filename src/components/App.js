import React from 'react'
import { IconButton } from '@material-ui/core';
import MusicNoteIcon from '@material-ui/icons/MusicNote';
import fs from 'fs';
import path from 'path';
import { remote }  from 'electron';
const dialog = remote.dialog;

const MusicDirectory = 'music';
const createMusicDir = () => {
    if (!fs.existsSync(MusicDirectory)) {
        fs.mkdirSync(MusicDirectory);
    }
};

const startFileSelection =  () => {
    return new Promise(resolve => {
        const dialgProperties = {
            title: 'Select Music',
            buttonLabel: 'Save Songs',
            filters: [{name: 'Music', extensions: ['mp3']}, {name: 'Video', extensions: ['mp4']}],
            properties: [ 'openFile', 'multiSelections']
        };
        dialog.showOpenDialog(dialgProperties).then(({ filePaths, canceled }) => {
            if (canceled) resolve([]);
            resolve(filePaths);
        });
    });
};

const UploadButton = () => {
    const startUpload = () => {
        // Create music directory if it doesn't exist
        createMusicDir();
        startFileSelection().then(filePaths => {
            filePaths.forEach(filePath => {
                const fileName = path.basename(filePath);
                const newPath = path.join(MusicDirectory, fileName);
                fs.copyFileSync(filePath, newPath)
            });
        });
    };
    return (
        <React.Fragment>
            <IconButton onClick={startUpload}>
                Upload Songs<MusicNoteIcon/>
            </IconButton>
        </React.Fragment>
    )
};

const App = () => {
	return (
		<div className='app'>
            <UploadButton/>
		</div>
	)
}

export default App
