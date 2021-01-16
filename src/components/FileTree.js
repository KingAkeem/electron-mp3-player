import React from 'react';
import { TreeView, TreeItem } from '@material-ui/lab';
import { ExpandMore, ChevronRight } from '@material-ui/icons';

export const FileTree = props => {
  const { root, onNodeSelect } = props;
  const renderFile = file => (
    <TreeItem key={file.id} nodeId={file.id} label={file.name}>
      {file.type === 'folder' ? file.children.map(file => renderFile(file)) : null}
    </TreeItem>
  );

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMore />}
      defaultExpanded={['root']}
      defaultExpandIcon={<ChevronRight />}
      onNodeSelect={(event, id) => onNodeSelect(id)}
    >
      {root.children.map(subFolder => renderFile(subFolder))}
    </TreeView>
  );
};
