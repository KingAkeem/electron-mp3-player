import React from 'react';
import { TreeView, TreeItem } from '@material-ui/lab';
import { Folder, FolderOpen } from '@material-ui/icons';
import path from 'path';

export const FileTree = props => {
  const { root, onNodeSelect, fileExtFilter } = props;
  const checkFilter = file => {
    // Folders are always rendered
    if (file.type === 'folder') return true;
    const extension = path.extname(file.path);
    return !fileExtFilter || extension === fileExtFilter;
  };
  const renderFile = file => {
    // Only files passing the filter can be rendered
    if (checkFilter(file)) {
      return (
        <TreeItem key={file.id} nodeId={file.id} label={file.name}>
          {file.type === 'folder' ? file.children.map(file => renderFile(file)) : null}
        </TreeItem>
      );
    }
  };

  return (
    <TreeView
      multiSelect={true}
      defaultCollapseIcon={<Folder />}
      defaultExpanded={['root']}
      defaultExpandIcon={<FolderOpen />}
      onNodeSelect={(event, id) => onNodeSelect(id)}
    >
      {root.children.map(subFolder => renderFile(subFolder))}
    </TreeView>
  );
};
