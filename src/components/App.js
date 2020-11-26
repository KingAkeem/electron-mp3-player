import React, { useState } from 'react'
import { Menu, MenuItem, Table, TableContainer, TableBody, TableRow, TableHead, TableCell, TableFooter, IconButton } from '@material-ui/core';
import { MusicNote, MoreHoriz } from '@material-ui/icons';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import sanitize from 'sanitize-filename';
import { remote }  from 'electron';
const dialog = remote.dialog;

const MusicDirectory = 'music';
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
    return copiedFiles
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
    const [names, setNames] = useState(fs.readdirSync(MusicDirectory));
    const [selected, setSelected] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const handleNewFiles = (newNames) => setNames([...names, ...newNames]);

    const handleClick = (event, file) => {
        setAnchorEl(event.currentTarget);
        setSelected(file);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handlePlay = () => {
        handleClose();
        console.log('Playing', selected);
        const filePath = path.join(MusicDirectory, selected).replace(/(\s+)/g, '\\$1');
        const childProcess = exec(`mpg123 ${filePath}`);
        window.audio = childProcess;
        childProcess.kill('SIGINT');
    };

    const handleDelete = () => {
        handleClose();
        deleteFile(selected, MusicDirectory);
        setNames(names.filter(name => name !== selected));
        console.log('deleting', selected);
    };

    const renderFiles = files => {
        return files.map((file, index) => {
            return (
                <TableRow
                    key={file}
                    hover={true}
                >
                    <TableCell key={index.toString()}>{file}</TableCell>
                    <TableCell>
                        <IconButton onClick={(e) => handleClick(e, file)}>
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
                        {renderFiles(names)}
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
