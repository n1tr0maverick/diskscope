export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TreeFileNode {
  name: string;
  size: number;
  type: 'file';
  ext: string;
  path: string;
  isVirtual?: boolean;
}

export interface TreeDirectoryNode {
  name: string;
  size: number;
  type: 'directory';
  children: TreeNode[];
  filesCount: number;
  foldersCount: number;
  path: string;
  error?: boolean;
}

export type TreeNode = TreeFileNode | TreeDirectoryNode;

export interface TreemapItem {
  rect: Rect;
  node: TreeFileNode;
  parentDirName: string;
  depth: number;
}

function worstAspectRatio(row: { area: number }[], rowArea: number, side: number): number | null {
  if (row.length === 0) return null;
  if (rowArea === 0 || side === 0) return Infinity;

  let minArea = Infinity;
  let maxArea = -Infinity;
  for (const item of row) {
    if (item.area < minArea) minArea = item.area;
    if (item.area > maxArea) maxArea = item.area;
  }

  const term1 = (side * side * maxArea) / (rowArea * rowArea);
  const term2 = (rowArea * rowArea) / (side * side * minArea);
  return Math.max(term1, term2);
}

export function squarify(
  elements: { size: number; data: any }[],
  container: Rect
): { rect: Rect; data: any }[] {
  const totalSize = elements.reduce((sum, el) => sum + el.size, 0);
  if (totalSize === 0 || container.w <= 0 || container.h <= 0) return [];

  const containerArea = container.w * container.h;
  const areaMultiplier = containerArea / totalSize;
  const items = elements.map(el => ({
    area: el.size * areaMultiplier,
    data: el.data
  }));

  const results: { rect: Rect; data: any }[] = [];
  const remaining = { ...container };

  let i = 0;
  while (i < items.length) {
    const row: typeof items = [];
    let rowArea = 0;

    const side = Math.min(remaining.w, remaining.h);
    
    while (i < items.length) {
      const nextItem = items[i];
      const nextRow = [...row, nextItem];
      const nextRowArea = rowArea + nextItem.area;

      const currentWorst = worstAspectRatio(row, rowArea, side);
      const nextWorst = worstAspectRatio(nextRow, nextRowArea, side);

      if (currentWorst === null || nextWorst <= currentWorst) {
        row.push(nextItem);
        rowArea = nextRowArea;
        i++;
      } else {
        break;
      }
    }

    const isHorizontal = remaining.w >= remaining.h;
    let rx = remaining.x;
    let ry = remaining.y;
    const rowThickness = side > 0 ? rowArea / side : 0;

    for (const item of row) {
      const itemLen = rowThickness > 0 ? item.area / rowThickness : 0;
      if (isHorizontal) {
        results.push({
          rect: { x: rx, y: ry, w: rowThickness, h: itemLen },
          data: item.data
        });
        ry += itemLen;
      } else {
        results.push({
          rect: { x: rx, y: ry, w: itemLen, h: rowThickness },
          data: item.data
        });
        rx += itemLen;
      }
    }

    if (isHorizontal) {
      remaining.x += rowThickness;
      remaining.w = Math.max(0, remaining.w - rowThickness);
    } else {
      remaining.y += rowThickness;
      remaining.h = Math.max(0, remaining.h - rowThickness);
    }
  }

  return results;
}

export function generateTreemapLayout(
  root: TreeNode,
  width: number,
  height: number
): TreemapItem[] {
  const results: TreemapItem[] = [];
  
  function layoutNode(node: TreeNode, rect: Rect, parentName: string, depth: number) {
    if (rect.w < 1 || rect.h < 1) return;

    if (node.type === 'file') {
      results.push({
        rect,
        node,
        parentDirName: parentName,
        depth
      });
      return;
    }

    if (node.type === 'directory' && node.children) {
      const children = node.children;
      if (children.length === 0) return;

      const elements = children.map(child => ({
        size: child.size,
        data: child
      }));

      // Apply padding: larger padding at root depth, smaller as it gets deeper
      const padding = depth === 0 ? 3 : depth === 1 ? 2 : 1;
      const innerRect = {
        x: rect.x + padding,
        y: rect.y + padding,
        w: Math.max(0, rect.w - padding * 2),
        h: Math.max(0, rect.h - padding * 2)
      };

      const subLayouts = squarify(elements, innerRect);

      for (const sub of subLayouts) {
        layoutNode(sub.data, sub.rect, node.name, depth + 1);
      }
    }
  }

  layoutNode(root, { x: 0, y: 0, w: width, h: height }, root.name, 0);
  
  return results;
}
