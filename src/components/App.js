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

const FileExt = {
    MP3: '.mp3',
};

const App = props => {
    const [track, setTrack] = useState(null);
    const [folder, setFolder] = useState(props.rootFolder);
    const [selectedFilePaths, setSelectedFilePaths] = useState([]);

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
        const currentTrack = selectedFilePaths[0];
        playAudio(currentTrack).then(audio => {
            setTrack({
                track: currentTrack,
                audio,
                playing: true
            });
        });
    };

    const handleStop = () => stopAudio();

    const handleDelete = () => {
        setFolder(folder.remove(selectedFilePaths));
        selectedFilePaths.forEach(filePath => {
            if (isPlaying(filePath)) stopAudio();
        });
    };

    const handleNewFiles = newFiles => setFolder(folder.add(newFiles));


    const renderPlay = () => {
        // Only a single file can be played at a time and the play button isn't displayed if the file is being played.
        const displayPlayButton = selectedFilePaths.length === 1 && (!track || !track.playing);
        if (displayPlayButton) {
            return (
                <IconButton onClick={handlePlay}>
                    <PlayCircleFilled/>
                </IconButton>
            );
        }
    };

    const renderStop = () => {
        // Stop is displayed if a track is playing
        const displayStopButton = track && track.playing;
        if (displayStopButton) {
            return (
                <IconButton onClick={handleStop}>
                    <Stop/>
                </IconButton>
            );
        }
    }

    const renderDelete = () => {
        const displayDeleteButton = selectedFilePaths.length > 0; 
        if (displayDeleteButton) {
            return (
                <IconButton onClick={handleDelete}>
                    <Delete/>
                </IconButton> 
            );
        }
    }

    return (
            <div className='app'>
                <ThemeProvider theme={darkTheme}>
                    <Paper>
                    <UploadButton onNewFiles={handleNewFiles}/>
                    {renderPlay()}
                    {renderStop()}
                    {renderDelete()}
                    <FileTree root={folder} fileExtFilter={FileExt.MP3} onNodeSelect={filePaths => {
                        setSelectedFilePaths(filePaths);
                    }}/>
                    </Paper>
                </ThemeProvider>
            </div>
    );
}

export default App
