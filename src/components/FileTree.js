import React from 'react';
import { TreeView, TreeItem } from '@material-ui/lab';
import { Folder, FolderOpen } from '@material-ui/icons';

export const FileTree = props => {
  const { root, onNodeSelect } = props;
  const renderFile = file => (
    <TreeItem key={file.id} nodeId={file.id} label={file.name}>
      {file.type === 'folder' ? file.children.map(file => renderFile(file)) : null}
    </TreeItem>
  );

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
