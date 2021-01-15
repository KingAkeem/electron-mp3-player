import React from 'react'
import { render } from 'react-dom'
import { Folder } from './lib/file';
import App from './components/App'
import './App.css'

// Since we are using HtmlWebpackPlugin WITHOUT a template, we should create our own root node in the body element before rendering into it
let root = document.createElement('div')

root.id = 'root'
document.body.appendChild(root)

const folder = new Folder({
    id: 'music',
    name: 'music',
    path: 'music',
    type: 'folder',
    children: [],
});
folder.loadContents();
render(<App rootFolder={folder}/>, document.getElementById('root'))
