import React, { useState } from 'react'
import { TreeView, TreeItem } from '@material-ui/lab';
import { IconButton } from '@material-ui/core';
import { ExpandMore, ChevronRight, Delete, Stop, PlayCircleFilled, } from '@material-ui/icons';

import { UploadButton } from './UploadButton';

import fs from 'fs';
import { playAudio } from '../lib/media-player/audio';

const FolderView = props => {
  const { folder, onNodeSelect } = props;
  const renderFile = file => (
    <TreeItem key={file.id} nodeId={file.id} label={file.name}>
      {file.type === 'folder' ? file.children.map(file => renderFile(file)) : null}
    </TreeItem>
  );

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMore />}
      defaultExpanded={['root']}
      defaultExpandIcon={<ChevronRight />}
      onNodeSelect={(event, id) => onNodeSelect(id)}
    >
      {folder.children.map(subFolder => renderFile(subFolder))}
    </TreeView>
  );
};

const App = props => {
    const [track, setTrack] = useState(null);
    const [folder, setFolder] = useState(props.rootFolder);
    const [selectedSong, setSelectedSong] = useState(null);

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
        if (!selectedSong) return;
        console.log('Playing', selectedSong);
        playAudio(selectedSong).then(audio => {
            setTrack({
                track: selectedSong,
                audio,
                playing: true
            });
        });
    };

    const handleStop = () => stopAudio();

    const handleDelete = () => {
        fs.unlinkSync(selectedSong);
        if (isPlaying(selectedSong)) stopAudio();
        setSelectedSong(null);
    };

    const handleNewFiles = ({ folders, files}) => {
        console.log('New files', files);
        console.log('New folders', folders);
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
            {selectedSong ?
                <IconButton onClick={handleDelete}>
                    <Delete/>
                </IconButton> : null}
            <FolderView folder={folder} onNodeSelect={filePath => setSelectedSong(filePath)}/>
        </div>
    );
}

export default App
