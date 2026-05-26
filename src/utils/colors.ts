export interface ExtensionCategory {
  name: string;
  color: string;
  extensions: string[];
}

export const CATEGORIES: ExtensionCategory[] = [
  {
    name: 'Videos',
    color: '#a855f7', // Purple
    extensions: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v']
  },
  {
    name: 'Images',
    color: '#22c55e', // Green
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.psd', '.ai', '.tiff', '.bmp', '.ico']
  },
  {
    name: 'Audio',
    color: '#06b6d4', // Cyan
    extensions: ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma']
  },
  {
    name: 'Archives & Installers',
    color: '#f97316', // Orange
    extensions: ['.zip', '.tar', '.gz', '.rar', '.7z', '.dmg', '.iso', '.pkg', '.tgz', '.bz2']
  },
  {
    name: 'Documents',
    color: '#3b82f6', // Blue
    extensions: ['.pdf', '.docx', '.txt', '.md', '.xlsx', '.pptx', '.csv', '.rtf', '.pages', '.numbers', '.key']
  },
  {
    name: 'Code & Data',
    color: '#eab308', // Yellow
    extensions: ['.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.py', '.go', '.rs', '.cpp', '.h', '.cs', '.java', '.sh', '.yaml', '.yml', '.xml']
  },
  {
    name: 'System & Executables',
    color: '#ef4444', // Red
    extensions: ['.sys', '.dll', '.dylib', '.so', '.app', '.bin', '.exe', '.bat', '.ini', '.cfg']
  },
  {
    name: 'Other Files & Temp',
    color: '#64748b', // Slate
    extensions: ['.other-small-files', '.log', '.tmp', '.bak', '.db', '.sqlite']
  }
];

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Keep hues away from being too dark or muddy; scale on HSL
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 75%, 55%)`;
}

export function getColorForExtension(ext: string): string {
  const normalizedExt = ext.toLowerCase();
  
  for (const cat of CATEGORIES) {
    if (cat.extensions.includes(normalizedExt)) {
      return cat.color;
    }
  }
  
  if (normalizedExt === 'none' || !normalizedExt) {
    return '#475569'; // Neutral gray-600
  }
  
  return stringToColor(normalizedExt);
}

export function getCategoryForExtension(ext: string): string {
  const normalizedExt = ext.toLowerCase();
  
  for (const cat of CATEGORIES) {
    if (cat.extensions.includes(normalizedExt)) {
      return cat.name;
    }
  }
  
  if (normalizedExt === 'none' || !normalizedExt) {
    return 'Uncategorized';
  }
  
  return 'Other (Unknown)';
}
