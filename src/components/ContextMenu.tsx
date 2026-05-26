import React from 'react';
import { Eye, Trash2, AlertOctagon, Copy } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onReveal: () => void;
  onTrash: () => void;
  onDelete: () => void;
  node: {
    path: string;
    name: string;
    type: 'file' | 'directory';
  };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onReveal,
  onTrash,
  onDelete,
  node,
}) => {
  // Prevent clicks inside the menu from closing it immediately before triggers
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(node.path);
    onClose();
  };

  return (
    <>
      {/* Overlay to catch clicks outside the menu */}
      <div
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 998, // Just under the context menu but above everything else
          background: 'transparent',
        }}
      />

      {/* Actual Floating Menu */}
      <div
        className="context-menu"
        onClick={handleMenuClick}
        style={{
          left: `${x}px`,
          top: `${y}px`,
          zIndex: 999,
        }}
      >
        {/* Title / Info */}
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          padding: '6px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '220px',
        }} title={node.name}>
          {node.name}
        </div>

        {/* Reveal In Finder */}
        <div className="context-menu-item" onClick={() => { onReveal(); onClose(); }}>
          <Eye size={14} color="#a78bfa" />
          Reveal in Finder
        </div>

        {/* Copy Path */}
        <div className="context-menu-item" onClick={handleCopyPath}>
          <Copy size={14} color="#06b6d4" />
          Copy Path
        </div>

        <div className="context-menu-divider" />

        {/* Move to Trash */}
        <div
          className="context-menu-item"
          onClick={() => { onTrash(); onClose(); }}
          style={{ color: '#fb7185' }} // Rose-400
        >
          <Trash2 size={14} color="#fb7185" />
          Move to Trash
        </div>

        {/* Delete Permanently */}
        <div
          className="context-menu-item"
          onClick={() => { onDelete(); onClose(); }}
          style={{ color: '#f43f5e' }} // Rose-500
        >
          <AlertOctagon size={14} color="#f43f5e" />
          Delete Permanently
        </div>
      </div>
    </>
  );
};
