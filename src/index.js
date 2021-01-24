import React from 'react'
import { render } from 'react-dom'
import { File } from './lib/file';
import App from './components/App'
import './App.css'

// Since we are using HtmlWebpackPlugin WITHOUT a template, we should create our own root node in the body element before rendering into it
let root = document.createElement('div')

root.id = 'root'
document.body.appendChild(root)

const folder = new File({
    id: 'music',
    name: 'music',
    path: 'music',
});
render(<App rootFolder={folder.loadContents()}/>, document.getElementById('root'))
