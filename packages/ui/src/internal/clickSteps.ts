/* A click on a divider without dragging (one pointer, WCAG 2.5.7): steps through preset sizes, the same as the column
   borders of DataTable. Shared by SplitPane, the Workbench borders and LayerGraph's height bar. */

/** A pointer that moves less than this (px) between down and up clicked; more is a drag. */
export const DRAG_MIN = 4;

/** The size after one click: the smallest preset larger than now, after the largest back to the smallest. Presets are
 *  rounded, sorted and kept unique; within 1 px of a preset counts as on it. */
export function nextPreset(now: number, presets: readonly number[]): number {
  const list = [...new Set(presets.map((v) => Math.round(v)))].sort((a, b) => a - b);
  return list.find((v) => v > now + 1) ?? list[0] ?? now;
}
