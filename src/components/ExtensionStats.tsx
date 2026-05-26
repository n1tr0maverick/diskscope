import React, { useMemo } from 'react';
import { TreeNode } from '../utils/treemapLayout.ts';
import { formatBytes, formatNumber } from '../utils/formatters.ts';
import { getColorForExtension, getCategoryForExtension } from '../utils/colors.ts';

interface ExtensionStatsProps {
  tree: TreeNode;
  highlightedExtension: string | null;
  onHighlightExtension: (ext: string | null) => void;
}

interface ExtRowData {
  ext: string;
  size: number;
  count: number;
  color: string;
  category: string;
}

export const ExtensionStats: React.FC<ExtensionStatsProps> = ({
  tree,
  highlightedExtension,
  onHighlightExtension,
}) => {
  // Aggregate file extensions from the tree recursively
  const extensions = useMemo(() => {
    const map = new Map<string, { ext: string; size: number; count: number }>();

    const traverse = (node: TreeNode) => {
      if (node.type === 'file') {
        const ext = node.ext || 'none';
        const current = map.get(ext) || { ext, size: 0, count: 0 };
        current.size += node.size;
        current.count += 1;
        map.set(ext, current);
      } else if (node.type === 'directory' && node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(tree);

    const list: ExtRowData[] = Array.from(map.values()).map(item => ({
      ext: item.ext,
      size: item.size,
      count: item.count,
      color: getColorForExtension(item.ext),
      category: getCategoryForExtension(item.ext),
    }));

    // Sort by cumulative size descending
    list.sort((a, b) => b.size - a.size);
    return list;
  }, [tree]);

  const totalSize = tree.size;

  // Split into Top Extensions and "Other Extensions" if the list is too long
  const displayedExtensions = useMemo(() => {
    if (extensions.length <= 15) return extensions;
    
    const top = extensions.slice(0, 14);
    const others = extensions.slice(14);
    
    const othersSize = others.reduce((sum, item) => sum + item.size, 0);
    const othersCount = others.reduce((sum, item) => sum + item.count, 0);
    
    top.push({
      ext: 'others',
      size: othersSize,
      count: othersCount,
      color: '#64748b', // Slate
      category: 'Various Small Extensions',
    });
    
    return top;
  }, [extensions]);

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-secondary)',
        fontWeight: 600,
        userSelect: 'none',
      }}>
        File Type Statistics
      </div>

      {/* Table grid scroll area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.85rem',
          textAlign: 'left',
        }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}>
              <th style={{ padding: '8px 12px' }}>Extension</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Size</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>% Space</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Files</th>
            </tr>
          </thead>
          <tbody>
            {displayedExtensions.map((item) => {
              const percent = totalSize > 0 ? (item.size / totalSize) * 100 : 0;
              const isHighlighted = highlightedExtension === item.ext;
              const isVirtualOthers = item.ext === 'others';

              return (
                <tr
                  key={item.ext}
                  onClick={() => {
                    if (isVirtualOthers) return;
                    if (isHighlighted) {
                      onHighlightExtension(null); // Toggle off
                    } else {
                      onHighlightExtension(item.ext);
                    }
                  }}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    cursor: isVirtualOthers ? 'default' : 'pointer',
                    background: isHighlighted ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isVirtualOthers && !isHighlighted) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isVirtualOthers && !isHighlighted) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {/* Extension Indicator & Name */}
                  <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      backgroundColor: item.color,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }} />
                    <span style={{
                      fontWeight: 600,
                      color: isHighlighted ? 'var(--accent-secondary)' : 'var(--text-primary)',
                    }}>
                      {item.ext === 'none' ? 'No Ext' : item.ext}
                    </span>
                  </td>
                  {/* Cumulative Size */}
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {formatBytes(item.size)}
                  </td>
                  {/* Percent of space */}
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {percent.toFixed(1)}%
                  </td>
                  {/* Total Files count */}
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {formatNumber(item.count)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
