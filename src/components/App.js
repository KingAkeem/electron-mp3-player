import React, { useState } from 'react'
import { Menu, MenuItem, Table, TableContainer, TableBody, TableRow, TableHead, TableCell, TableFooter, IconButton } from '@material-ui/core';
import { MusicNote, MoreHoriz } from '@material-ui/icons';

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
        if (playingSong) {
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
                    hover={true}
                >
                    <TableCell key={index.toString()}>{file}</TableCell>
                    <TableCell>
                        <IconButton onClick={e => handleClick(e, file)}>
                            <MoreHoriz/>
                        </IconButton>
                        <Menu
                            id='simple-menu'
                            anchorEl={anchorEl}
                            getContentAnchorEl={null}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left'
                            }}
                            anchorOrigin={{
                                vertical: 'center',
                                horizontal: 'center'
                            }}
                            open={Boolean(anchorEl)}
                            keepMounted
                            onClose={handleClose}
                        >
                            <MenuItem id='play' onClick={handlePlay}>Play</MenuItem>
                            <MenuItem id='delete' onClick={handleDelete}>Delete</MenuItem>
                            <MenuItem id='stop' onClick={handleStop}>Stop</MenuItem>
                        </Menu>
                    </TableCell>
                </TableRow>
            );
        });
    };

	return (
		<div className='app'>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={2}>Name</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {renderFiles(files)}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={2} align='right'>
                                <UploadButton onNewFiles={handleNewFiles}/>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
		</div>
	);
}

export default App
