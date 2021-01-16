import React, { useState } from 'react'
import { TreeView, TreeItem } from '@material-ui/lab';
import { IconButton } from '@material-ui/core';
import { ExpandMore, ChevronRight, Delete, Stop, PlayCircleFilled, } from '@material-ui/icons';

import { UploadButton } from './UploadButton';

import fs from 'fs';

import { playAudio } from '../lib/media-player/audio';
import { isFolder } from '../lib/file';

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

    const handleNewFiles = ({ resolutions, rejections }) => {
        setFolder(folder.add(resolutions));
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
            <FolderView folder={folder} onNodeSelect={filePath => setCurrentFilePath(filePath)}/>
        </div>
    );
}

export default App
