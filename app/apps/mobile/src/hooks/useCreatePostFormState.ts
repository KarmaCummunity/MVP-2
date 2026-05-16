// FR-POST-007 — Co-locates the Create Post form's local state so create.tsx
// can stay close to a composition root. Extracted from the screen file when
// adding draft autosave + resume to avoid blowing past the 300-line cap.
import { useCallback, useRef, useState } from 'react';
import type {
  Category,
  ItemCondition,
  LocationDisplayLevel,
  PostType,
  PostVisibility,
} from '@kc/domain';
import { POST_DRAFT_DEFAULTS } from '../lib/postDraftFormState';
import type { HydratedDraft } from './usePostDraftHydration';
import type { UploadedAsset } from '../services/imageUpload';

export function useCreatePostFormState() {
  const [type, setType] = useState<PostType>(POST_DRAFT_DEFAULTS.type);
  const [title, setTitle] = useState(POST_DRAFT_DEFAULTS.title);
  const [description, setDescription] = useState(POST_DRAFT_DEFAULTS.description);
  const [category, setCategory] = useState<Category>(POST_DRAFT_DEFAULTS.category);
  const [condition, setCondition] = useState<ItemCondition>(POST_DRAFT_DEFAULTS.condition);
  const [urgency, setUrgency] = useState(POST_DRAFT_DEFAULTS.urgency);
  const [locationDisplayLevel, setLocationDisplayLevel] = useState<LocationDisplayLevel>(
    POST_DRAFT_DEFAULTS.locationDisplayLevel,
  );
  const [visibility, setVisibility] = useState<PostVisibility>(POST_DRAFT_DEFAULTS.visibility);
  const [hideFromCounterparty, setHideFromCounterparty] = useState(
    POST_DRAFT_DEFAULTS.hideFromCounterparty,
  );
  const [uploads, setUploads] = useState<UploadedAsset[]>([]);

  const visibilityRef = useRef<PostVisibility>(visibility);
  visibilityRef.current = visibility;

  const applyDraft = useCallback((draft: HydratedDraft) => {
    setType(draft.type);
    setTitle(draft.title);
    setDescription(draft.description);
    setCategory(draft.category);
    setCondition(draft.condition);
    setUrgency(draft.urgency);
    setLocationDisplayLevel(draft.locationDisplayLevel);
    setVisibility(draft.visibility);
    setHideFromCounterparty(draft.hideFromCounterparty);
    // Strip the `missing` flag — the uploads array consumed by the publish
    // pipeline must still match UploadedAsset shape.
    setUploads(
      draft.uploads.map((u) => ({
        path: u.path,
        mimeType: u.mimeType,
        sizeBytes: u.sizeBytes,
        previewUri: u.previewUri,
      })),
    );
  }, []);

  return {
    type,
    setType,
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    condition,
    setCondition,
    urgency,
    setUrgency,
    locationDisplayLevel,
    setLocationDisplayLevel,
    visibility,
    setVisibility,
    visibilityRef,
    hideFromCounterparty,
    setHideFromCounterparty,
    uploads,
    setUploads,
    applyDraft,
  };
}
