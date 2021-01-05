import React, { useState } from 'react'
import { TreeView, TreeItem } from '@material-ui/lab';
import { IconButton } from '@material-ui/core';
import { ExpandMore, ChevronRight, Delete, Stop, PlayCircleFilled, } from '@material-ui/icons';

import { UploadButton } from './UploadButton';
import { isDirectory } from '../fileUtils';

import fs from 'fs';
import path from 'path';
import dataurl from 'dataurl';
import mime from 'mime-types';

/**
 * Converts file to an Audio object
 * @param {string} filePath - path to an audio file (mp3 currently)
 */
const toAudio = filePath => new Promise(function(resolve, reject) {
    fs.readFile(filePath, (err, data) => {
        if (err) reject(err);
        const songData = dataurl.convert({ data, mimetype: mime.lookup(filePath) });
        resolve(new Audio(songData));
    });
});

/**
 * Plays audio once audio is loaded, may need to add a timer in case audio never loads.
 * @param {Audio} audio - Audio object from built-in API
 */
const playAudio = audio => new Promise(function(resolve, reject) {
    audio.addEventListener('canplay', evt => {
        audio.play();
        resolve(audio, evt);
    });
});

const RecursiveTreeView = props => {
  const { tree, onNodeSelect } = props;
  const renderTree = nodes => (
    <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.displayName}>
      {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
    </TreeItem>
  );

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMore />}
      defaultExpanded={['root']}
      defaultExpandIcon={<ChevronRight />}
      onNodeSelect={(event, id) => onNodeSelect(id)}
    >
      {renderTree(tree)}
    </TreeView>
  );
};

const buildTree = (parentDir, tree = { id: 'root', displayName: 'tree', children: [] }, fileList = []) => {
    const fileNames = fs.readdirSync(parentDir);
    fileList.push(...fileNames);
    fileNames.sort().forEach(fileName => {
        const filePath = path.join(parentDir, fileName);
        if (isDirectory(filePath)) {
            console.log(filePath);
            const node = {
                id: filePath,
                displayName: fileName,
                children: []
            };
            tree.children.push(node);
            buildTree(filePath, node, fileList);
        } else {
            tree.children.push({
                id: filePath,
                displayName: fileName,
            });
        }
    });
    return { tree, fileList };
};

const App = () => {
    const { tree, fileList } = buildTree('music', { id: 'root', displayName: 'Music', children: [] });
    const [files, setFiles] = useState(fileList);
    const [track, setTrack] = useState(null);
    const [selectedSong, setSelectedSong] = useState(null);

    // Add new files
    const handleNewFiles = ({ folders: newFolders, files: newFiles }) => {
        setFiles([...files, ...newFiles]);
    };

    // Select new file
    const handleClick = file => setSelectedSong(file);


    const removeFileFromDisk = fileName => {
        const dest = path.join('music', fileName);
        fs.unlinkSync(dest);
    };
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
        const filePath = path.join('music', selectedSong);
        toAudio(filePath).then(audio => {
            playAudio(audio).then(() => {
                setTrack({
                    track: selectedSong,
                    audio,
                    playing: true
                });
            });
        })
    };

    const handleStop = () => stopAudio();

    const handleDelete = () => {
        const remainingFiles = files.filter(file => file !== selectedSong);
        setFiles(remainingFiles);
        removeFileFromDisk(selectedSong);
        if (isPlaying(selectedSong)) stopAudio();
        setSelectedSong(null);
    };

    const data = {
        id: 'root',
        name: 'Music',
        children: []
    };

    Array.from(new Set(files.sort())).forEach((file, index) => {
        data.children.push({ id: index.toString(), displayName: path.basename(file) });
    });

    return (
        <div className='app'>
            <RecursiveTreeView tree={tree} onNodeSelect={index => {
                    const file = files[index];
                    handleClick(file);
                }}/>
            <UploadButton onNewFiles={handleNewFiles}/>
            { track && track.playing ?
                <IconButton onClick={handleStop}>
                    <Stop/>
                </IconButton> :
                <IconButton onClick={handlePlay}>
                    <PlayCircleFilled/>
                </IconButton>
            }
            {
                selectedSong ?
                <IconButton onClick={handleDelete}>
                    <Delete/>
                </IconButton> : null
            }
        </div>
    );
}

export default App
