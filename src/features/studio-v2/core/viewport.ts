/** Pure, zoom-independent world coordinate math for Studio v2.
 * px in the viewport are CSS pixels; artboard positions are document units.
 */
export type Point = Readonly<{ x: number; y: number }>;
export type Rect = Readonly<{ x: number; y: number; width: number; height: number }>;
export type Viewport = Readonly<{ x: number; y: number; zoom: number }>;
export type Size = Readonly<{ width: number; height: number }>;

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const RULER_THICKNESS = 14;
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function screenToWorld(screen: Point, viewport: Viewport): Point {
  return { x: (screen.x - viewport.x) / viewport.zoom, y: (screen.y - viewport.y) / viewport.zoom };
}
export function worldToScreen(world: Point, viewport: Viewport): Point {
  return { x: world.x * viewport.zoom + viewport.x, y: world.y * viewport.zoom + viewport.y };
}
export function panViewport(viewport: Viewport, delta: Point): Viewport {
  return { ...viewport, x: viewport.x + delta.x, y: viewport.y + delta.y };
}
/** Keep the exact world point under the cursor when zooming. */
export function zoomAt(viewport: Viewport, zoom: number, anchor: Point): Viewport {
  const nextZoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  const world = screenToWorld(anchor, viewport);
  return { zoom: nextZoom, x: anchor.x - world.x * nextZoom, y: anchor.y - world.y * nextZoom };
}
export function viewportWorldBounds(viewport: Viewport, size: Size): Rect {
  const topLeft = screenToWorld({ x: 0, y: 0 }, viewport);
  return { ...topLeft, width: size.width / viewport.zoom, height: size.height / viewport.zoom };
}
export function unionRects(rects: readonly Rect[]): Rect {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const left = Math.min(...rects.map(r => r.x));
  const top = Math.min(...rects.map(r => r.y));
  const right = Math.max(...rects.map(r => r.x + r.width));
  const bottom = Math.max(...rects.map(r => r.y + r.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
export function fitBounds(bounds: Rect, size: Size, padding = 56): Viewport {
  const availableWidth = Math.max(1, size.width - padding * 2);
  const availableHeight = Math.max(1, size.height - padding * 2);
  const zoom = clamp(Math.min(availableWidth / Math.max(1, bounds.width), availableHeight / Math.max(1, bounds.height)), MIN_ZOOM, MAX_ZOOM);
  return { zoom,
    x: size.width / 2 - (bounds.x + bounds.width / 2) * zoom,
    y: size.height / 2 - (bounds.y + bounds.height / 2) * zoom };
}
export function getRulerStep(zoom: number): number {
  // At least 64 screen px between major ticks, using familiar 1/2/5 multiples.
  const minimum = 64 / zoom;
  const exponent = Math.pow(10, Math.floor(Math.log10(minimum)));
  for (const multiple of [1, 2, 5, 10]) {
    const step = multiple * exponent;
    if (step >= minimum) return step;
  }
  return 10 * exponent;
}
export type RulerMark = { value: number; position: number };
export function rulerMarks(viewport: Viewport, size: Size, axis: "x" | "y"): RulerMark[] {
  const step = getRulerStep(viewport.zoom);
  const offset = axis === "x" ? viewport.x : viewport.y;
  const length = axis === "x" ? size.width : size.height;
  const minimum = -offset / viewport.zoom;
  const maximum = (length - offset) / viewport.zoom;
  const marks: RulerMark[] = [];
  for (let n = Math.ceil(minimum / step); n <= Math.floor(maximum / step) && marks.length < 160; n++) {
    const value = n * step;
    marks.push({ value, position: value * viewport.zoom + offset });
  }
  return marks;
}
export function screenRectFromWorld(rect: Rect, viewport: Viewport): Rect {
  const origin = worldToScreen(rect, viewport);
  return { ...origin, width: rect.width * viewport.zoom, height: rect.height * viewport.zoom };
}
export function minimapProjection(artboards: readonly Rect[], viewport: Viewport, viewportSize: Size, mapSize: Size, padding = 12) {
  const visibleWorld = viewportWorldBounds(viewport, viewportSize);
  const scene = unionRects([...artboards, visibleWorld]);
  const scale = Math.min(
    (mapSize.width - padding * 2) / Math.max(1, scene.width),
    (mapSize.height - padding * 2) / Math.max(1, scene.height),
  );
  const horizontal = (mapSize.width - scene.width * scale) / 2;
  const vertical = (mapSize.height - scene.height * scale) / 2;
  const project = (rect: Rect): Rect => ({
    x: horizontal + (rect.x - scene.x) * scale,
    y: vertical + (rect.y - scene.y) * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  });
  return { scene, scale, project, artboards: artboards.map(project), viewport: project(visibleWorld),
    unproject: (point: Point): Point => ({ x: (point.x - horizontal) / scale + scene.x, y: (point.y - vertical) / scale + scene.y }) };
}
