import React, { useState } from 'react'
import { createMuiTheme, IconButton, Paper, ThemeProvider } from '@material-ui/core';
import {  Delete, Stop, PlayCircleFilled, } from '@material-ui/icons';

import { FileTree } from './FileTree';
import { UploadButton } from './UploadButton';

import { playAudio } from '../lib/media-player/audio';


const darkTheme = createMuiTheme({
    palette: {
        type: 'dark'
    }
});
const App = props => {
    const [track, setTrack] = useState(null);
    const [folder, setFolder] = useState(props.rootFolder);
    const [paths, setPaths] = useState([]);

    // Determines if song is currently being played
    const isPlaying = song => track && track.track === song;

    const stopAudio = () => {
        if (track && track.playing) {
            track.audio.pause();
            delete track.audio;
            setTrack({
                track: null,
                audio: null,
                playing: false
            });
        }
    };

    const handlePlay = () => {
        // If track is already playing then stop it and start new track.
        if (track && track.playing) stopAudio();
        playAudio(paths[0]).then(audio => {
            setTrack({
                track: paths[0],
                audio,
                playing: true
            });
        });
    };

    const handleStop = () => stopAudio();

    const handleDelete = () => {
        setFolder(folder.remove(paths));
        paths.forEach(currentPath => {
            if (isPlaying(currentPath)) stopAudio();
        });
    };

    const handleNewFiles = ({ resolutions: newFiles, rejections }) => {
        if (Array.isArray(rejections) && rejections.length) {
            rejections.forEach(rejection => {
                const { fileData, error } = rejection;
                console.error(`${JSON.stringify(fileData)} encountered error: ${error}`);
            });
        }
        setFolder(folder.add(newFiles));
    };

    return (
            <div className='app'>
                <ThemeProvider theme={darkTheme}>
                    <Paper>
                    <UploadButton onNewFiles={handleNewFiles}/>
                    {paths.length === 1 ? track && track.playing ?
                        <IconButton onClick={handleStop}>
                            <Stop/>
                        </IconButton> :
                        <IconButton onClick={handlePlay}>
                            <PlayCircleFilled/>
                        </IconButton> : null}
                    {paths.length > 0 ?
                        <IconButton onClick={handleDelete}>
                            <Delete/>
                        </IconButton> : null}
                        <FileTree root={folder} onNodeSelect={filePaths => {
                            setPaths(filePaths);
                        }}/>
                    </Paper>
                </ThemeProvider>
            </div>
    );
}

export default App
