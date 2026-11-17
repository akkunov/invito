import { parseProjectV2, type ProjectDocumentV2 } from "./document.schema.ts";

/** Storage port; deliberately contains no browser, React or network dependencies. */
export interface StudioPersistenceAdapter {
  load(projectId: string): Promise<ProjectDocumentV2 | null>;
  save(document: ProjectDocumentV2, expectedRevision: number | null): Promise<void>;
}
export class StudioRevisionConflict extends Error {
  constructor() { super("Project changed in storage; reload or resolve conflict"); this.name = "StudioRevisionConflict"; }
}

/** Test/reference adapter, with compare-and-swap. Real backend must implement CAS atomically. */
export function createMemoryStudioPersistence(): StudioPersistenceAdapter {
  const store = new Map<string, ProjectDocumentV2>();
  const copy = <T,>(data: T): T => structuredClone(data);
  return {
    async load(id) {
      const document = store.get(id);
      return document ? copy(document) : null;
    },
    async save(value, expectedRevision) {
      const document = parseProjectV2(copy(value));
      const existing = store.get(document.id);
      if (existing === undefined) {
        if (expectedRevision !== null) throw new StudioRevisionConflict();
      } else if (expectedRevision !== existing.revision || document.revision <= existing.revision) {
        throw new StudioRevisionConflict();
      }
      store.set(document.id, copy(document));
    },
  };
}
/** Recovery validates stored bytes before exposing them to the editor. */
export async function recoverStudioDocument(storage: StudioPersistenceAdapter, id: string): Promise<ProjectDocumentV2 | null> {
  const saved = await storage.load(id);
  return saved === null ? null : parseProjectV2(saved);
}
