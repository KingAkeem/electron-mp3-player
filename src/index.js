import React from 'react'
import { render } from 'react-dom'
import fs from 'fs';
import path from 'path';
import { isDirectory } from './fileUtils';
import App from './components/App'
import './App.css'

// Since we are using HtmlWebpackPlugin WITHOUT a template, we should create our own root node in the body element before rendering into it
let root = document.createElement('div')

root.id = 'root'
document.body.appendChild(root)

// Now we can render our application into it
const fileList = [];
const buildTree = (parentDir, tree = { id: 'root', displayName: 'tree', children: [] }) => {
    const fileNames = fs.readdirSync(parentDir);
    fileNames.forEach(fileName => {
        const filePath = path.join(parentDir, fileName)
        if (isDirectory(filePath)) {
            const node = {
                id: filePath,
                displayName: fileName,
                children: []
            };
            tree.children.push(node);
            buildTree(filePath, node);
        } else {
            tree.children.push({
                id: filePath,
                displayName: fileName,
            });
        }
    });
    return tree;
};
render(<App files={fileList} tree={buildTree('music')}/>, document.getElementById('root'))
