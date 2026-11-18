# Simple Editor UI (#28.8.2–28.8.3 foundation)

Open Template Manager, choose a saved version, and select "Открыть Simple Editor". This is a designer-accessible customer-mode preview, not a public authenticated customer route. It operates on the chosen immutable version and its personalization contract. Existing templates without permissions are preview-only.

The editor has three independent zones: section navigation, focused content forms, and the continuously rendered invitation. On small screens it uses a horizontal section navigator and edit/preview modes. The UI is RU/KY; the invitation locale can change only within the contract. Responsive desktop/tablet/mobile views use the same StudioV2ProjectRenderer, including style tokens, bindings, responsive layout, measurement and preview-only invitation interactions. No second rendering engine is introduced.

SimpleField dispatches from the discriminated field contract. Localized text, date/time (Bishkek UTC+6), numeric and boolean values, existing image selection, gallery selection, schedule, approved music choices, RSVP constraints and themes have typed controls. The editor validates restricted patches before applying them to the source. Final review calls finalizePersonalization and lists invalid required fields. It does not submit RSVP or publish, and it cannot dispatch arbitrary Studio commands. The original template and source workspace remain unchanged.

This phase uses temporary in-memory edits, explicitly marked as a test session. Customer-specific upload ingestion, persistence/history, server authorization, catalog access and real publication are follow-up steps. In particular, listing existing template assets is not the finished personal photo upload workflow, and the customer UI is not a security boundary. No customer upload URLs or paths are accepted in the patch.

Browser checks use a portable template fixture with an approved image and bilingual text binding, verify live names and photograph changes, locale switch, tablet/mobile layout, final validation, close/reopen source isolation and capture desktop/mobile screenshots.
