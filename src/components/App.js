import React, { useState } from 'react'
import { Table, TableContainer, TableBody, TableRow, TableHead, TableCell, IconButton } from '@material-ui/core';
import { Delete, Stop, PlayCircleFilled, } from '@material-ui/icons';

import { MusicDirectory, deleteFile, getSongPath } from '../lib/files';
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
    const [anchorEl, setAnchorEl] = useState(null);
    const [files, setFiles] = useState(new Set(fs.readdirSync(MusicDirectory)));
    const [playingSong, setPlayingSong] = useState(null);
    const [selectedSong, setSelectedSong] = useState(null);

    // Close context menu
    const handleClose = () => setAnchorEl(null);

    // Add new files
    const handleNewFiles = newFiles => setFiles(new Set([...files, ...newFiles]));

    // Select new file
    const handleClick = (evt, file) => {
        setAnchorEl(evt.currentTarget);
        setSelectedSong(file);
    };

    const handlePlay = () => {
        handleClose();
        if (!selectedSong) return;
        console.log('Playing', selectedSong);
        toAudio(getSongPath(selectedSong)).then(audio => {
            playAudio(audio).then(() => {
                setPlayingSong({
                    track: selectedSong,
                    audio,
                    playing: true
                });
            });
        });
    };

    const handleStop = () => {
        handleClose();
        if (playingSong && playingSong.audio) {
            playingSong.audio.pause();
            delete playingSong.audio;
            setPlayingSong({
                track: null,
                audio: null,
                playing: false
            });
        }
    };

    const handleDelete = () => {
        handleClose();
        deleteFile(selectedSong, MusicDirectory);
        setFiles(new Set(Array.from(files).filter(file => file !== selectedSong)));
        if (playingSong && selectedSong === playingSong.track) {
            playingSong.audio.pause();
            delete playingSong.audio;
            setPlayingSong({
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
            { playingSong && playingSong.playing ?
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
