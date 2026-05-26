import React, { useRef, useEffect, useState } from 'react';
import { generateTreemapLayout, TreemapItem, TreeNode } from '../utils/treemapLayout.ts';
import { getColorForExtension } from '../utils/colors.ts';
import { formatBytes } from '../utils/formatters.ts';

interface TreemapProps {
  tree: TreeNode;
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  highlightedExtension: string | null;
  onContextMenu: (e: React.MouseEvent, node: any) => void;
}

export const Treemap: React.FC<TreemapProps> = ({
  tree,
  selectedPath,
  onSelectPath,
  highlightedExtension,
  onContextMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [layoutItems, setLayoutItems] = useState<TreemapItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<TreemapItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Handle ResizeObserver to make canvas fully responsive
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(100, Math.floor(width)),
        height: Math.max(100, Math.floor(height)),
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute treemap layout coordinates whenever dimensions or tree data changes
  useEffect(() => {
    if (!tree) return;
    const items = generateTreemapLayout(tree, dimensions.width, dimensions.height);
    setLayoutItems(items);
    setHoveredItem(null); // Reset hover
  }, [tree, dimensions]);

  // Draw the Treemap Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw all file blocks
    for (const item of layoutItems) {
      const { x, y, w, h } = item.rect;
      if (w < 1 || h < 1) continue;

      const ext = item.node.ext;
      const baseColor = getColorForExtension(ext);
      
      // Determine if this item is highlighted, dimmed, selected or hovered
      const isSelected = selectedPath === item.node.path;
      const isHovered = hoveredItem?.node.path === item.node.path;
      
      let fillStyle = baseColor;

      // Dimming logic if there is an active extension filter
      if (highlightedExtension) {
        const itemExt = item.node.ext.toLowerCase();
        const filterExt = highlightedExtension.toLowerCase();
        if (itemExt !== filterExt) {
          // Dim non-matching items
          ctx.globalAlpha = 0.15;
        } else {
          ctx.globalAlpha = 1.0;
        }
      } else {
        ctx.globalAlpha = 1.0;
      }

      // Draw main block fill
      ctx.fillStyle = fillStyle;
      ctx.fillRect(x, y, w, h);

      // Gradient overlay for a gorgeous 3D tile look
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Reset alpha for border drawing
      ctx.globalAlpha = 1.0;

      // Draw borders
      if (isSelected) {
        // Highlighting selected item
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, Math.max(1, w - 3), Math.max(1, h - 3));
      } else if (isHovered) {
        // Highlighting hovered item
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
      } else {
        // Normal border
        ctx.strokeStyle = 'rgba(5, 8, 16, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, Math.max(1, w - 1), Math.max(1, h - 1));
      }
    }
  }, [layoutItems, dimensions, selectedPath, hoveredItem, highlightedExtension]);

  // Find layout item under mouse coordinates
  const findItemAt = (clientX: number, clientY: number): TreemapItem | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (const item of layoutItems) {
      const r = item.rect;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return item;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const item = findItemAt(e.clientX, e.clientY);
    setHoveredItem(item);

    if (item) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        // Position tooltip near the cursor but offset
        setTooltipPos({
          x: e.clientX - rect.left + 15,
          y: e.clientY - rect.top + 15,
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    const item = findItemAt(e.clientX, e.clientY);
    if (item) {
      onSelectPath(item.node.path);
    }
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const item = findItemAt(e.clientX, e.clientY);
    if (item) {
      onSelectPath(item.node.path);
      onContextMenu(e, item.node);
    }
  };

  return (
    <div className="glass-panel" ref={containerRef} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      padding: '4px',
      background: 'rgba(0,0,0,0.4)',
    }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onContextMenu={handleCanvasContextMenu}
        style={{
          display: 'block',
          cursor: hoveredItem ? 'pointer' : 'default',
        }}
      />

      {/* Floating Tooltip */}
      {hoveredItem && (
        <div style={{
          position: 'absolute',
          left: `${tooltipPos.x}px`,
          top: `${tooltipPos.y}px`,
          pointerEvents: 'none',
          zIndex: 50,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '6px',
          padding: '10px 12px',
          fontSize: '0.8rem',
          maxWidth: '350px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <div style={{
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {hoveredItem.node.name}
          </div>
          <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
            <span>Size: <strong style={{ color: '#fff' }}>{formatBytes(hoveredItem.node.size)}</strong></span>
            <span>•</span>
            <span>Ext: <strong style={{ color: '#fff' }}>{hoveredItem.node.ext}</strong></span>
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: '#a78bfa',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}>
            {hoveredItem.node.path}
          </div>
        </div>
      )}
    </div>
  );
};
