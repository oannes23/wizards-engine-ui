"use client";

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import {
  listStories,
  getStory,
  getStoryEntries,
  addStoryEntry,
  editStoryEntry,
  deleteStoryEntry,
  type StoryListFilters,
  type AddEntryRequest,
  type EditEntryRequest,
} from "@/lib/api/services/stories";
import { useToast } from "@/lib/toast/useToast";

/**
 * useStories — Infinite query for GET /stories (paginated list).
 * 30s staleTime per stories.md spec.
 */
export function useStories(filters?: StoryListFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.stories.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      listStories({ ...filters, after: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    staleTime: 30_000,
  });
}

/**
 * useStory — Query for GET /stories/{id} (story detail).
 * 30s staleTime per stories.md spec.
 */
export function useStory(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.stories.detail(id ?? ""),
    queryFn: () => getStory(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * useStoryEntries — Infinite query for GET /stories/{id}/entries.
 * Used for "load older" pagination below the initial 20 entries.
 */
export function useStoryEntries(storyId: string | null | undefined) {
  return useInfiniteQuery({
    queryKey: ["stories", storyId ?? "", "entries"],
    queryFn: ({ pageParam }) =>
      getStoryEntries(storyId!, {
        after: pageParam as string | undefined,
        limit: 50,
      }),
    enabled: !!storyId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    staleTime: 30_000,
  });
}

/**
 * useAddStoryEntry — Mutation for POST /stories/{id}/entries.
 * Invalidates story detail to refresh the entries list.
 */
export function useAddStoryEntry(storyId: string) {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();

  return useMutation({
    mutationFn: (body: AddEntryRequest) => addStoryEntry(storyId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
    onError: () => {
      showError("Failed to add entry — please try again");
    },
  });
}

/**
 * useEditStoryEntry — Mutation for PATCH /stories/{id}/entries/{entryId}.
 * Invalidates story detail to refresh the entries list.
 */
export function useEditStoryEntry(storyId: string) {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();

  return useMutation({
    mutationFn: ({ entryId, body }: { entryId: string; body: EditEntryRequest }) =>
      editStoryEntry(storyId, entryId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
    onError: () => {
      showError("Failed to save changes — please try again");
    },
  });
}

/**
 * useDeleteStoryEntry — Mutation for DELETE /stories/{id}/entries/{entryId}.
 * Invalidates story detail to refresh the entries list.
 */
export function useDeleteStoryEntry(storyId: string) {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();

  return useMutation({
    mutationFn: (entryId: string) => deleteStoryEntry(storyId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
    onError: () => {
      showError("Failed to delete entry — please try again");
    },
  });
}
