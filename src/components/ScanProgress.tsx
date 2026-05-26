import React from 'react';
import { RefreshCw, ShieldAlert, Ban, Clock, Files, Folder } from 'lucide-react';
import { formatNumber, formatDuration } from '../utils/formatters.ts';

interface ScanProgressProps {
  currentPath: string;
  filesScanned: number;
  foldersScanned: number;
  unreadableCount: number;
  elapsedTime: number; // in ms
  onCancel: () => void;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  currentPath,
  filesScanned,
  foldersScanned,
  unreadableCount,
  elapsedTime,
  onCancel,
}) => {
  const totalItems = filesScanned + foldersScanned;
  const speed = elapsedTime > 0 ? Math.round((totalItems / (elapsedTime / 1000))) : 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    }}>
      <div className="glass-panel pulse-glow" style={{
        width: '450px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        textAlign: 'center',
      }}>
        {/* Loading Spinner */}
        <div style={{
          position: 'relative',
          width: '70px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '50%',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        }}>
          <RefreshCw size={32} color="#a78bfa" style={{
            animation: 'spin 1.5s linear infinite',
          }} />
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', fontFamily: 'var(--font-brand)' }}>
            Scanning File System
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Reading folders recursively...
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          width: '100%',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <Files size={18} color="#a78bfa" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Files</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatNumber(filesScanned)}</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <Folder size={18} color="#06b6d4" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Folders</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatNumber(foldersScanned)}</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <Clock size={18} color="#eab308" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Elapsed</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatDuration(elapsedTime)}</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <ShieldAlert size={18} color="#ef4444" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Skipped</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatNumber(unreadableCount)}</div>
            </div>
          </div>
        </div>

        {/* Speed Indicator */}
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '12px',
        }}>
          <span>Scanning speed:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatNumber(speed)} items/s</span>
        </div>

        {/* Current Folder Path */}
        <div style={{
          width: '100%',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: '#a78bfa',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          border: '1px solid rgba(139, 92, 246, 0.1)',
        }} title={currentPath}>
          {currentPath || 'Preparing...'}
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            borderRadius: '8px',
            fontSize: '0.9rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
          }}
        >
          <Ban size={16} />
          Cancel Scan
        </button>
      </div>
    </div>
  );
};
