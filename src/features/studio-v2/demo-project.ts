import { createEmptyProjectV2, parseProjectV2, type ProjectDocumentV2, type ProjectNodeV2 } from "./core/document.schema.ts";
import { applyStudioCommand } from "./core/command-engine.ts";

const dark = "#263329";
const olive = "#707A5C";
const body = "#5D5A53";
const paper = "#FAF7EF";
type FontName = "serif" | "sans";
const textNode = (
  id: string, parentId: string, text: string, x: number, y: number,
  width: number, height: number, fontSize: number, opts: {
    color?: string; weight?: number; italic?: boolean; font?: FontName; align?: "left" | "center" | "right";
  } = {},
): ProjectNodeV2 => ({
  id, type: "text", parentId, x, y, width, height, rotation: 0, opacity: 1, visible: true, locked: false,
  runs: [{ text, style: {
    fontFamily: opts.font ?? "serif", fontSize, fontWeight: opts.weight ?? 400,
    italic: opts.italic ?? false, underline: false, strike: false, color: opts.color ?? dark,
  }}], textAlign: opts.align ?? "center", bindingKey: null,
});
const shapeNode = (id: string, parentId: string, x: number, y: number, width: number,
  height: number, fill: string, shape: "rectangle" | "circle" | "ellipse" = "rectangle"): ProjectNodeV2 => ({
  id, type: "shape", parentId, x, y, width, height, rotation: 0, opacity: 1,
  visible: true, locked: false, fill, shape, stroke: null, strokeWidth: 0,
});
const imageNode = (id: string, parentId: string, assetId: string,
  x: number, y: number, width: number, height: number): ProjectNodeV2 => ({
  id, type: "image", parentId, assetId, x, y, width, height, rotation: 0, opacity: 1,
  visible: true, locked: false, fit: "cover", focalX: 0.5, focalY: 0.5,
});

export function createStudioV2Demo(): ProjectDocumentV2 {
  let doc = createEmptyProjectV2("studio-v2-demo");
  doc.nodes["frame-1"] = {
    ...doc.nodes["frame-1"],
    name: "Обложка",
    background: paper,
  } as ProjectNodeV2;
  doc.pages[0] = { ...doc.pages[0], placement: { x: 0, y: 0 } };
  doc.assets = {
    "asset-couple": { id: "asset-couple", mimeType: "image/webp", name: "Свадебное фото", sizeBytes: 0, storageKey: "/images/riviera/couple.webp" },
    "asset-flowers": { id: "asset-flowers", mimeType: "image/webp", name: "Цветы", sizeBytes: 0, storageKey: "/images/riviera/flowers.webp" },
    "asset-villa": { id: "asset-villa", mimeType: "image/webp", name: "Вилла", sizeBytes: 0, storageKey: "/images/riviera/villa.webp" },
  };
  const pages = [
    { id: "page-details", frame: "frame-details", name: "Детали", x: 1280 },
    { id: "page-rsvp", frame: "frame-rsvp", name: "RSVP", x: 2560 },
    { id: "page-gallery", frame: "frame-gallery", name: "Галерея", x: 3840 },
    { id: "page-thanks", frame: "frame-thanks", name: "Благодарность", x: 5120 },
  ];
  const root = doc.nodes["frame-1"];
  if (root.type !== "frame") throw new Error("Demo root must be a frame");
  for (const p of pages) {
    doc = applyStudioCommand(doc, {
      kind: "createPage",
      page: { id: p.id, rootNodeId: p.frame, name: p.name, placement: { x: p.x, y: 0 } },
      root: { ...root, id: p.frame, name: p.name, children: [] },
    });
  }
  const nodes: ProjectNodeV2[] = [
    textNode("cover-label", "frame-1", "П Р И Г Л А Ш Е Н И Е   Н А   С В А Д Ь Б У", 100, 175, 880, 52, 28, { font: "sans", weight: 600 }),
    textNode("cover-names", "frame-1", "Алина & Тимур", 80, 360, 920, 250, 132, { italic: true }),
    imageNode("cover-photo", "frame-1", "asset-couple", 86, 720, 908, 640),
    textNode("cover-message", "frame-1", "МЫ ПРИГЛАШАЕМ ВАС РАЗДЕЛИТЬ С НАМИ ЭТОТ ОСОБЕННЫЙ ДЕНЬ", 120, 1400, 840, 110, 28, { font: "sans", weight: 500 }),
    textNode("cover-date", "frame-1", "14 ИЮНЯ 2027", 190, 1560, 700, 90, 58),
    shapeNode("cover-divider", "frame-1", 385, 1690, 310, 3, olive),

    imageNode("details-flowers", "frame-details", "asset-flowers", 740, 60, 280, 320),
    textNode("details-heading", "frame-details", "Детали", 130, 280, 820, 190, 132, { italic: true }),
    textNode("details-label-1", "frame-details", "ЦЕРЕМОНИЯ", 185, 630, 700, 65, 34, { font: "sans", weight: 600 }),
    textNode("details-time-1", "frame-details", "16:00", 185, 705, 700, 90, 68),
    textNode("details-place-1", "frame-details", "Вилла Riviera, Алматы", 150, 860, 780, 88, 40),
    shapeNode("details-divider", "frame-details", 350, 1030, 380, 3, olive),
    textNode("details-label-2", "frame-details", "ПРАЗДНИЧНЫЙ УЖИН", 185, 1150, 700, 65, 34, { font: "sans", weight: 600 }),
    textNode("details-time-2", "frame-details", "18:30", 185, 1240, 700, 90, 68),
    textNode("details-note", "frame-details", "Будем рады видеть вас рядом", 170, 1440, 740, 110, 40, { italic: true }),

    imageNode("rsvp-top-photo", "frame-rsvp", "asset-flowers", 0, 0, 1080, 530),
    textNode("rsvp-heading", "frame-rsvp", "RSVP", 170, 590, 740, 230, 170, { italic: true }),
    textNode("rsvp-message", "frame-rsvp", "Пожалуйста, подтвердите своё участие до 1 июня 2027 года", 180, 850, 720, 230, 44),
    shapeNode("rsvp-button", "frame-rsvp", 225, 1210, 630, 144, dark),
    textNode("rsvp-button-label", "frame-rsvp", "Подтвердить участие", 240, 1215, 600, 135, 43, { color: "#FFFFFF", font: "sans", weight: 600 }),
    textNode("rsvp-footer", "frame-rsvp", "С любовью, Алина и Тимур", 140, 1560, 800, 110, 44, { italic: true }),

    textNode("gallery-heading", "frame-gallery", "Наша история", 110, 170, 860, 180, 110, { italic: true }),
    imageNode("gallery-main", "frame-gallery", "asset-couple", 80, 410, 920, 720),
    imageNode("gallery-villa", "frame-gallery", "asset-villa", 80, 1170, 445, 530),
    imageNode("gallery-flowers", "frame-gallery", "asset-flowers", 555, 1170, 445, 530),

    imageNode("thanks-flowers", "frame-thanks", "asset-flowers", 0, 0, 1080, 520),
    textNode("thanks-heading", "frame-thanks", "Спасибо!", 100, 670, 880, 250, 156, { italic: true }),
    textNode("thanks-message", "frame-thanks", "Будем рады разделить с вами самый важный день нашей жизни", 175, 1010, 730, 240, 45),
    shapeNode("thanks-divider", "frame-thanks", 420, 1360, 240, 3, olive),
    textNode("thanks-signature", "frame-thanks", "Алина & Тимур", 130, 1490, 820, 145, 75, { italic: true }),
  ];
  for (const node of nodes) {
    doc = applyStudioCommand(doc, { kind: "insertNode", parentId: node.parentId!, node });
  }
  // This is a safe in-memory example; nothing is written to localStorage or published.
  return parseProjectV2({ ...doc, revision: 0 });
}
