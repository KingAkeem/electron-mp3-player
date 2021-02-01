import React from 'react';
import { TreeView, TreeItem } from '@material-ui/lab';
import { Folder, FolderOpen } from '@material-ui/icons';
import path from 'path';

export const FileTree = props => {
  const { root, onNodeSelect, fileExtFilter } = props;
  // Check if the file passes the current filter
  const checkFilter = file => {
    if (file.type === 'folder') return true;
    const extension = path.extname(file.path);
    return !fileExtFilter || extension === fileExtFilter;
  };
  // render files that pass the filter
  const renderFile = file => {
    if (checkFilter(file)) {
      return (
        <TreeItem id={file.id} key={file.id} nodeId={file.id} label={file.name}>
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
      onNodeSelect={(event, ids) => {
        onNodeSelect(ids);
      }}
    >
      {root.children.map(subFolder => renderFile(subFolder))}
    </TreeView>
  );
};
