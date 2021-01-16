import React, { useState } from 'react'
import { IconButton } from '@material-ui/core';
import {  Delete, Stop, PlayCircleFilled, } from '@material-ui/icons';

import { FileTree } from './FileTree';
import { UploadButton } from './UploadButton';

import { playAudio } from '../lib/media-player/audio';

const App = props => {
    const [track, setTrack] = useState(null);
    const [folder, setFolder] = useState(props.rootFolder);
    const [currentFilePath, setCurrentFilePath] = useState(null);

    // Determines if song is currently being played
    const isPlaying = song => track && track.track === song;

    const stopAudio = () => {
        if (track && track.audio) {
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
        if (!currentFilePath) return;
        console.log('Playing', currentFilePath);
        playAudio(currentFilePath).then(audio => {
            setTrack({
                track: currentFilePath,
                audio,
                playing: true
            });
        });
    };

    const handleStop = () => stopAudio();

    const handleDelete = () => {
        setFolder(folder.remove(currentFilePath));
        if (isPlaying(currentFilePath)) stopAudio();
        setCurrentFilePath(null);
    };

    const handleNewFiles = ({ resolutions: newFiles, rejections }) => {
        if (Array.isArray(rejections) && rejections.length) {
            rejections.forEach(rejection => {
                const { fileData, error } = rejection;
                console.error(`${fileData} encountered error: ${error}`);
            });
        }
        setFolder(folder.add(newFiles));
    };

    return (
        <div className='app'>
            <UploadButton onNewFiles={handleNewFiles}/>
            {track && track.playing ?
                <IconButton onClick={handleStop}>
                    <Stop/>
                </IconButton> :
                <IconButton onClick={handlePlay}>
                    <PlayCircleFilled/>
                </IconButton>}
            {currentFilePath ?
                <IconButton onClick={handleDelete}>
                    <Delete/>
                </IconButton> : null}
            <FileTree root={folder} onNodeSelect={filePath => setCurrentFilePath(filePath)}/>
        </div>
    );
}

export default App
