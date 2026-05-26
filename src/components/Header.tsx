import React from 'react';
import { FolderOpen, Play, HardDrive, Files, Folder, Clock, AlertTriangle } from 'lucide-react';
import { formatBytes, formatNumber, formatDuration } from '../utils/formatters.ts';

interface HeaderProps {
  path: string;
  setPath: (path: string) => void;
  isScanning: boolean;
  onSelectFolder: () => void;
  onStartScan: () => void;
  stats: {
    totalSize: number;
    filesCount: number;
    foldersCount: number;
    skippedCount: number;
    duration: number;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({
  path,
  setPath,
  isScanning,
  onSelectFolder,
  onStartScan,
  stats,
}) => {
  return (
    <header className="glass-panel" style={{
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '16px',
    }}>
      {/* Brand & Input Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Logo & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '2rem',
            background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontFamily: 'var(--font-brand)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>📊</span>
            <span>DiskScope</span>
          </div>
          <span style={{
            background: 'rgba(139, 92, 246, 0.1)',
            color: '#a78bfa',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}>
            macOS Edition
          </span>
        </div>

        {/* Input Path Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 1,
          maxWidth: '650px',
        }}>
          <div style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              disabled={isScanning}
              placeholder="Enter directory path (e.g. /Users/username/Downloads)"
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent-primary)';
                e.target.style.boxShadow = '0 0 0 2px var(--accent-glow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <HardDrive size={16} color="var(--text-muted)" style={{
              position: 'absolute',
              left: '14px',
            }} />
          </div>

          <button
            onClick={onSelectFolder}
            disabled={isScanning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '0.85rem',
            }}
            onMouseEnter={(e) => {
              if (!isScanning) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              if (!isScanning) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <FolderOpen size={16} />
            <span>Select Folder</span>
          </button>

          <button
            onClick={onStartScan}
            disabled={isScanning || !path.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!isScanning) e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              if (!isScanning) e.currentTarget.style.filter = 'none';
            }}
          >
            <Play size={16} fill="white" />
            <span>Scan</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      {stats && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          padding: '12px 18px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
            <HardDrive size={16} color="#a78bfa" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Size</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{formatBytes(stats.totalSize)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}>
            <Files size={16} color="#22c55e" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Files</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{formatNumber(stats.filesCount)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}>
            <Folder size={16} color="#06b6d4" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Folders</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{formatNumber(stats.foldersCount)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
            <Clock size={16} color="#eab308" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan Duration</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{formatDuration(stats.duration)}</div>
            </div>
          </div>

          {stats.skippedCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px' }}>
              <AlertTriangle size={16} color="#ef4444" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unreadable Items</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ef4444' }}>{formatNumber(stats.skippedCount)}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
