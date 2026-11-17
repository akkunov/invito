"use client";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { ProjectDocumentV2, ProjectNodeV2 } from "@/features/studio-v2/core/document.schema.ts";

const fonts: Record<string, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "Arial, Helvetica, sans-serif",
};
function nodeStyle(node: ProjectNodeV2): CSSProperties {
  const base: CSSProperties = {
    position: "absolute",
    left: node.x, top: node.y,
    width: node.width, height: node.height,
    opacity: node.opacity,
    transform: node.rotation ? `rotate(${node.rotation}deg)` : undefined,
    transformOrigin: "center",
    pointerEvents: "none",
  };
  return base;
}
function renderNode(document: ProjectDocumentV2, id: string): React.ReactNode {
  const node = document.nodes[id];
  if (!node || !node.visible) return null;
  const style = nodeStyle(node);
  switch (node.type) {
    case "frame":
      return <div key={id} style={{
        ...style,
        background: node.background,
        overflow: node.clip ? "hidden" : "visible",
      }}>{node.children.map(child => renderNode(document, child))}</div>;
    case "text":
      return <div key={id} style={{
        ...style, textAlign: node.textAlign,
        display: "flex", alignItems: "center",
        justifyContent: node.textAlign === "left" ? "flex-start" : node.textAlign === "right" ? "flex-end" : "center",
        whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.14,
      }}><span>{node.runs.map((run, index) => <span key={index} style={{
        fontFamily: fonts[run.style.fontFamily], fontSize: run.style.fontSize,
        fontWeight: run.style.fontWeight, fontStyle: run.style.italic ? "italic" : "normal",
        textDecoration: [run.style.underline ? "underline" : "", run.style.strike ? "line-through" : ""].filter(Boolean).join(" "),
        color: run.style.color,
      }}>{run.text}</span>)}</span></div>;
    case "image": {
      const asset = document.assets[node.assetId];
      if (!asset || !asset.storageKey.startsWith("/images/")) return null;
      const path = `${process.env.NEXT_PUBLIC_PAGES_BASE_PATH ?? ""}${asset.storageKey}`;
      return <div key={id} style={{ ...style, overflow: "hidden" }}>
        <Image unoptimized draggable={false} src={path} alt={asset.name}
          fill sizes="(max-width: 900px) 300px, 500px"
          style={{ objectFit: node.fit, objectPosition: `${node.focalX * 100}% ${node.focalY * 100}%` }}/>
      </div>;
    }
    case "shape":
      return <div key={id} style={{
        ...style, background: node.fill,
        border: node.stroke ? `${node.strokeWidth}px solid ${node.stroke}` : undefined,
        borderRadius: node.shape === "circle" || node.shape === "ellipse" ? "50%" : 0,
        clipPath: node.shape === "triangle" ? "polygon(50% 0,100% 100%,0 100%)"
          : node.shape === "star" ? "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
          : node.shape === "heart" ? "polygon(50% 92%,6% 50%,0 28%,5% 11%,22% 3%,40% 12%,50% 26%,60% 12%,78% 3%,95% 11%,100% 28%,94% 50%)"
          : undefined,
      }}/>;
  }
}
export function StudioV2Artboard({ document, rootNodeId }: { document: ProjectDocumentV2; rootNodeId: string }) {
  const root = document.nodes[rootNodeId];
  if (!root || root.type !== "frame") return null;
  return <div className="studio-v2-artboard-content" style={{
    width: root.width, height: root.height, position: "relative", background: root.background,
    overflow: root.clip ? "hidden" : "visible",
  }}>
    {root.children.map(id => renderNode(document, id))}
  </div>;
}
