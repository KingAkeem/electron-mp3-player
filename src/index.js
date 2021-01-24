import React from 'react'
import { render } from 'react-dom'
import { File, isFolder, createFolder } from './lib/file';
import App from './components/App'
import './App.css'

// Since we are using HtmlWebpackPlugin WITHOUT a template, we should create our own root node in the body element before rendering into it
let root = document.createElement('div')

root.id = 'root'
document.body.appendChild(root)

if (!isFolder('music')) createFolder('music'); 
const folder = new File({
    id: 'music',
    filePath: 'music',
});
render(<App rootFolder={folder.loadContents()}/>, document.getElementById('root'))
