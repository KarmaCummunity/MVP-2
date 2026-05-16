import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import type {
  Category,
  ItemCondition,
  LocationDisplayLevel,
  PostType,
  PostVisibility,
} from '@kc/domain';
import { isPostError } from '@kc/application';
import { getCreatePostUseCase, getPostRepo } from '../services/postsComposition';
import { useFeedSessionStore } from '../store/feedSessionStore';
import { useLastAddressStore } from '../store/lastAddressStore';
import { usePostDraftStore } from '../store/postDraftStore';
import { buildCreatePostMissingFieldsToastMessage } from '../lib/createPostMissingFieldsToast';
import { mapPostErrorToHebrew } from '../services/postMessages';
import { invalidatePersonalStatsCaches } from '../lib/invalidatePersonalStatsCaches';
import { invalidateMyProfilePostQueries } from '../lib/invalidateMyProfilePostQueries';
import type { UploadedAsset } from '../services/imageUpload';
import type { PrePromptTrigger } from '../lib/notifications/usePushPermissionGate';

export type CreatePostCitySelection = { id: string; name: string } | null;

export function useCreatePostPublish(args: {
  ownerId: string | undefined;
  type: PostType;
  title: string;
  description: string;
  category: Category;
  city: CreatePostCitySelection;
  street: string;
  streetNumber: string;
  locationDisplayLevel: LocationDisplayLevel;
  condition: ItemCondition;
  isGive: boolean;
  urgency: string;
  uploads: UploadedAsset[];
  hideFromCounterparty: boolean;
  visibilityRef: { current: PostVisibility };
  setPublishFollowersOpen: (open: boolean) => void;
  requestSoftGate: (fn: () => void) => void;
  uploadingCount: number;
  presentPrePrompt: (trigger: PrePromptTrigger) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const checkedFirstPostRef = useRef(false);
  const prePublishOpenCountRef = useRef<number | null>(null);

  const publish = useMutation({
    mutationFn: async () => {
      const { ownerId } = args;
      if (!ownerId) throw new Error('not_authenticated');
      if (!args.city) throw new Error('city_required');
      if (!checkedFirstPostRef.current) {
        try {
          prePublishOpenCountRef.current = await getPostRepo().countOpenByUser(ownerId);
        } catch {
          // Non-critical — skip push gate on error.
        }
      }
      return getCreatePostUseCase().execute({
        ownerId,
        type: args.type,
        visibility: args.visibilityRef.current,
        title: args.title,
        description: args.description.trim() ? args.description : null,
        category: args.category,
        address: {
          city: args.city.id,
          cityName: args.city.name,
          street: args.street,
          streetNumber: args.streetNumber,
        },
        locationDisplayLevel: args.locationDisplayLevel,
        itemCondition: args.isGive ? args.condition : null,
        urgency: !args.isGive && args.urgency.trim() ? args.urgency : null,
        mediaAssets: args.uploads.map((u) => ({
          path: u.path,
          mimeType: u.mimeType,
          sizeBytes: u.sizeBytes,
        })),
        hideFromCounterparty: args.hideFromCounterparty,
      });
    },
    onSuccess: async () => {
      const { ownerId, city, street, streetNumber } = args;
      if (city) {
        useLastAddressStore.getState().setLastAddress({
          cityId: city.id,
          cityName: city.name,
          street,
          streetNumber,
        });
      }
      // FR-POST-007 AC4 — successful publish clears the local draft.
      usePostDraftStore.getState().clearDraft();
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      invalidateMyProfilePostQueries(queryClient, ownerId);
      await queryClient.invalidateQueries({ queryKey: ['openPostsCount'] });
      invalidatePersonalStatsCaches(queryClient, ownerId);
      useFeedSessionStore.getState().showEphemeralToast(t('post.publishSuccess'), 'success');
      if (!checkedFirstPostRef.current && ownerId) {
        checkedFirstPostRef.current = true;
        if (prePublishOpenCountRef.current === 0) {
          void args.presentPrePrompt('first-post-published');
        }
      }
      router.replace('/(tabs)');
    },
    onError: (err) => {
      const message = isPostError(err) ? mapPostErrorToHebrew(err.code) : t('post.networkError');
      useFeedSessionStore.getState().showEphemeralToast(t('post.publishFailed', { message }), 'error');
    },
  });

  const isPublishing = publish.isPending || args.uploadingCount > 0;

  const runPublishAfterGate = () => {
    args.requestSoftGate(() => publish.mutate());
  };

  const tryPublish = () => {
    if (isPublishing) return;
    const missingMsg = buildCreatePostMissingFieldsToastMessage({
      isGive: args.isGive,
      title: args.title,
      city: args.city,
      street: args.street,
      streetNumber: args.streetNumber,
      uploadsLength: args.uploads.length,
    });
    if (missingMsg.length > 0) {
      useFeedSessionStore.getState().showEphemeralToast(missingMsg, 'error', 2500);
      return;
    }
    if (args.visibilityRef.current === 'FollowersOnly') {
      args.setPublishFollowersOpen(true);
      return;
    }
    runPublishAfterGate();
  };

  return { publish, tryPublish, runPublishAfterGate, isPublishing };
}
