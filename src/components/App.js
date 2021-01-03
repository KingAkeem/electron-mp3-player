import React, { useState } from 'react'
import { Menu, MenuItem, Table, TableContainer, TableBody, TableRow, TableHead, TableCell, TableFooter, IconButton } from '@material-ui/core';
import { MusicNote, MoreHoriz } from '@material-ui/icons';
import http from 'http';
import fs from 'fs';
import dataurl from 'dataurl';
import path from 'path';
import { remote }  from 'electron';
const dialog = remote.dialog;

const MusicDirectory = 'music';
const getSongPath = song => path.join(MusicDirectory, song);

const createDirectory = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
};

const moveToDirectory = (filePaths, dir) => {
    const copiedFiles = [];
    // Create directory if it doesn't exist.
    createDirectory(dir);
    filePaths.forEach(filePath => {
        const file = path.basename(filePath);
        // Join directory with file to create a new path.
        const newPath = path.join(dir, file);
        fs.copyFileSync(filePath, newPath);
        copiedFiles.push(file);
    });
    return copiedFiles;
};

const deleteFile = (file, dir) => {
    const dest = path.join(dir, file);
    fs.unlinkSync(dest);
};

const selectFiles = () => {
    const dialgProperties = {
        title: 'Select Music',
        buttonLabel: 'Save Songs',
        filters: [{name: 'Music', extensions: ['mp3']}, {name: 'Video', extensions: ['mp4']}],
        properties: [ 'openFile', 'multiSelections']
    };
    const paths = dialog.showOpenDialogSync(dialgProperties);
    return paths || [];
};

const uploadFiles = () => {
    const filePaths = selectFiles();
    const copiedFiles = moveToDirectory(filePaths, MusicDirectory);
    return copiedFiles;
};

const UploadButton = ({ onNewFiles }) => {
    const handleUpload = () => {
        const files = uploadFiles();
        onNewFiles(files);
    };

    return (
        <React.Fragment>
            <IconButton onClick={handleUpload}>
                Upload Songs<MusicNote/>
            </IconButton>
        </React.Fragment>
    );
};

const App = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [files, setFiles] = useState(new Set(fs.readdirSync(MusicDirectory)));
    const [playingSong, setPlayingSong] = useState(null);
    const [selectedSong, setSelectedSong] = useState(null);
    const [currentTrack, setTrack] = useState({ track: null, data: null, playing: false });

    // Close context menu
    const handleClose = () => setAnchorEl(null);

    // Add new files
    const handleNewFiles = newFiles => setFiles(new Set([...files, ...newFiles]));

    // Select new file
    const handleClick = (evt, file) => {
        setAnchorEl(evt.currentTarget);
        const filePath = getSongPath(file);
        setSelectedSong(filePath);
    };

    const handlePlay = () => {
        handleClose();
        console.log('Playing', selectedSong);
        fs.readFile(selectedSong, (err, data) => {
            if (err) throw err;
            const songData = dataurl.convert({data, mimetype: 'audio/mp3'});
            const audio = new Audio(songData);
            audio.addEventListener('canplay', () => {
                audio.play();
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
        setFiles(files.filter(file => file !== selectedSong));
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
