import React from 'react';
import { ChevronRight, ChevronDown, Folder, File, AlertCircle } from 'lucide-react';
import { TreeNode } from '../utils/treemapLayout.ts';
import { formatBytes, formatNumber } from '../utils/formatters.ts';

interface FolderTreeProps {
  tree: TreeNode;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  selectedPath: string | null;
  onSelectNode: (node: TreeNode) => void;
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  tree,
  expandedPaths,
  onToggleExpand,
  selectedPath,
  onSelectNode,
  onContextMenu,
}) => {
  const rootSize = tree.size;

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;
    const isDirectory = node.type === 'directory';
    const percent = rootSize > 0 ? (node.size / rootSize) * 100 : 0;
    
    // Virtual or small files node styling
    const isVirtual = node.type === 'file' && (node as any).isVirtual;

    // Build recursive rendering structure
    return (
      <div key={node.path}>
        {/* Row Container */}
        <div
          className={`tree-row ${isSelected ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectNode(node);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (isDirectory) {
              onToggleExpand(node.path);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectNode(node);
            onContextMenu(e, node);
          }}
          style={{
            cursor: 'pointer',
            paddingLeft: `${depth * 20 + 12}px`,
          }}
        >
          {/* Column 1: Name & Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isDirectory ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(node.path);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            ) : (
              <span style={{ width: '18px' }} />
            )}

            {isDirectory ? (
              <Folder size={16} color={(node as any).error ? 'var(--danger)' : '#a78bfa'} fill={(node as any).error ? 'none' : 'rgba(167, 139, 250, 0.2)'} style={{ flexShrink: 0 }} />
            ) : isVirtual ? (
              <AlertCircle size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            ) : (
              <File size={16} color="#64748b" style={{ flexShrink: 0 }} />
            )}

            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: isDirectory ? 600 : 400,
              color: isVirtual ? 'var(--text-muted)' : 'var(--text-primary)',
            }} title={node.name}>
              {node.name}
            </span>
          </div>

          {/* Column 2: Size */}
          <div style={{ color: 'var(--text-primary)', textAlign: 'right', fontFamily: 'monospace' }}>
            {formatBytes(node.size)}
          </div>

          {/* Column 3: Percentage Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
            <div className="size-bar-container">
              <div className="size-bar-fill" style={{ width: `${percent}%` }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right' }}>
              {percent.toFixed(1)}%
            </span>
          </div>

          {/* Column 4: Files Count */}
          <div style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>
            {isDirectory ? formatNumber((node as any).filesCount) : '—'}
          </div>

          {/* Column 5: Folders Count */}
          <div style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>
            {isDirectory ? formatNumber((node as any).foldersCount) : '—'}
          </div>
        </div>

        {/* Render Children (Recursively) */}
        {isDirectory && isExpanded && (node as any).children && (
          <div>
            {(node as any).children.map((child: TreeNode) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Tree Grid Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 100px 140px 100px 100px',
        alignItems: 'center',
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-secondary)',
        fontWeight: 600,
        userSelect: 'none',
      }}>
        <div>Name</div>
        <div style={{ textAlign: 'right' }}>Size</div>
        <div style={{ paddingLeft: '8px' }}>Percent</div>
        <div style={{ textAlign: 'right' }}>Files</div>
        <div style={{ textAlign: 'right' }}>Folders</div>
      </div>

      {/* Tree Grid Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
      }}>
        {renderNode(tree)}
      </div>
    </div>
  );
};
