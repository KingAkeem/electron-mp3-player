import React, { useState } from 'react'
import { Table, TableContainer, TableBody, TableRow, TableHead, TableCell, IconButton } from '@material-ui/core';
import { Delete, Stop, PlayCircleFilled, } from '@material-ui/icons';

import { FileManager, getSongPath } from '../lib/files';
import { UploadButton } from './UploadButton';
import fs from 'fs';
import dataurl from 'dataurl';
import mime from 'mime-types';

const toAudio = file => new Promise(function(resolve, reject) {
    fs.readFile(file, (err, data) => {
        if (err) reject(err);
        const songData = dataurl.convert({ data, mimetype: mime.lookup(file) });
        resolve(new Audio(songData));
    });
});

const playAudio = audio => new Promise(function(resolve, reject) {
    audio.addEventListener('canplay', evt => {
        audio.play();
        resolve(evt);
    });
});

const App = () => {
    const manager = new FileManager('music');
    const [files, setFiles] = useState(manager.files);
    const [track, setTrack] = useState(null);
    const [selectedSong, setSelectedSong] = useState(null);

    // Add new files
    const handleNewFiles = newFiles => {
        manager.insertFiles(newFiles);
        setFiles([...files, ...newFiles]);
    };

    // Select new file
    const handleClick = (evt, file) => {
        setSelectedSong(file);
    };

    const handlePlay = () => {
        if (!selectedSong) return;
        console.log('Playing', selectedSong);
        manager.playAudio(selectedSong).then(audio => {
            setTrack({
                track: selectedSong,
                audio,
                playing: true
            });
        })
    };

    const handleStop = () => {
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

    const handleDelete = () => {
        manager.removeFiles([selectedSong]);
        setFiles(manager.files);
        if (track && selectedSong === track.track) {
            track.audio.pause();
            delete track.audio;
            setTrack({
                track: null,
                audio: null,
                playing: false,
            });
        }
        setSelectedSong(null);
    };

    const renderFiles = files => {
        return Array.from(files).map((file, index) => {
            return (
                <TableRow
                    key={file}
                    hover
                    selected={file === selectedSong}
                    onClick={e => handleClick(e, file)}
                >
                    <TableCell key={index.toString()}>{file}</TableCell>
                </TableRow>
            );
        });
    };

	return (
		<div className='app'>
            <TableContainer style={{ maxHeight: '500px' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={2}>Name</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {renderFiles(files)}
                    </TableBody>
                </Table>
            </TableContainer>
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
