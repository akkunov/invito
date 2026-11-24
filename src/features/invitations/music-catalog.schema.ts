import {z} from "zod";

/** Catalog entries are administrator-curated. These URLs must be stable public audio
 * files, not signed URLs, preview-only streaming-service snippets or arbitrary user input. */
export const catalogAudioSourceSchema=z.string().max(1000).refine(value=>{
  try {
    const url=new URL(value);
    return url.protocol==="https:"&&!url.username&&!url.password&&!url.hash&&!url.search&&/\.(mp3|m4a|ogg|wav)$/i.test(url.pathname);
  } catch {return false;}
},"Expected a stable HTTPS audio URL");
export const musicTrackSchema=z.strictObject({
  id:z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/),
  title:z.string().trim().min(1).max(120),
  artist:z.string().trim().min(1).max(120),
  source:catalogAudioSourceSchema,
  license:z.string().trim().min(1).max(200),
  attributionUrl:z.url().refine(value=>value.startsWith("https://")).optional(),
  durationSeconds:z.number().int().min(1).max(1800).optional(),
});
export const musicCatalogSchema=z.array(musicTrackSchema).max(200).superRefine((items,ctx)=>{
  const ids=new Set<string>(),sources=new Set<string>();
  for(const [index,item] of items.entries()){
    if(ids.has(item.id)||sources.has(item.source))ctx.addIssue({code:"custom",path:[index],message:"Duplicate track ID or source"});
    ids.add(item.id);sources.add(item.source);
  }
});
export type MusicTrack=z.infer<typeof musicTrackSchema>;
