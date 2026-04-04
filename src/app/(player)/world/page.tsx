"use client";

import { useState, useMemo } from "react";
import { User, Building2, MapPin, BookOpen, Search, ChevronDown } from "lucide-react";
import { GameObjectCard } from "@/features/world/components/GameObjectCard";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGroups } from "@/features/world/hooks/useGroups";
import { useLocations } from "@/features/world/hooks/useLocations";
import { useStories } from "@/features/world/hooks/useStories";
import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { listCharacters } from "@/lib/api/services/characters";
import type { StoryStatus } from "@/lib/api/types";

// ── Tab definition ─────────────────────��────────────────────────────

type TabId = "characters" | "groups" | "locations" | "stories";

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "characters", label: "Characters", Icon: User },
  { id: "groups", label: "Groups", Icon: Building2 },
  { id: "locations", label: "Locations", Icon: MapPin },
  { id: "stories", label: "Stories", Icon: BookOpen },
];

// ── Characters tab ──────────────────────────────────────────────────

function CharactersTab() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.characters.list({ name: search || undefined }),
      queryFn: ({ pageParam }) =>
        listCharacters({ name: search || undefined, after: pageParam as string | undefined }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
      staleTime: 60_000,
    });

  const characters = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search characters..."
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <EmptyState title="Could not load characters" />
      ) : characters.length === 0 ? (
        <EmptyState
          icon={<User className="h-10 w-10" />}
          title="No characters found"
          description={search ? `No characters match "${search}"` : "No characters in the world yet."}
        />
      ) : (
        <div className="space-y-2">
          {characters.map((char) => (
            <GameObjectCard
              key={char.id}
              type="character"
              id={char.id}
              name={char.name}
              description={char.description}
              detailLevel={char.detail_level}
              showStar
            />
          ))}
          <LoadMoreButton
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
            hasMore={hasNextPage}
          />
        </div>
      )}
    </div>
  );
}

// ── Groups tab ──────────────────────────────────────────────────────

function GroupsTab() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGroups({ name: search || undefined });

  const groups = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search groups..."
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <EmptyState title="Could not load groups" />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10" />}
          title="No groups found"
          description={search ? `No groups match "${search}"` : "No groups in the world yet."}
        />
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <GameObjectCard
              key={group.id}
              type="group"
              id={group.id}
              name={group.name}
              description={group.description}
              tier={group.tier}
              memberCount={group.members.length}
              showStar
            />
          ))}
          <LoadMoreButton
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
            hasMore={hasNextPage}
          />
        </div>
      )}
    </div>
  );
}

// ── Locations tab ────────────────────────────────────────────────────

function LocationsTab() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLocations({ name: search || undefined });

  // Build a parent name lookup from the current page data
  const locations = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  const parentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const loc of locations) {
      map.set(loc.id, loc.name);
    }
    return map;
  }, [locations]);

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search locations..."
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <EmptyState title="Could not load locations" />
      ) : locations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-10 w-10" />}
          title="No locations found"
          description={search ? `No locations match "${search}"` : "No locations in the world yet."}
        />
      ) : (
        <div className="space-y-2">
          {locations.map((loc) => (
            <GameObjectCard
              key={loc.id}
              type="location"
              id={loc.id}
              name={loc.name}
              description={loc.description}
              parentName={loc.parent_id ? (parentNameMap.get(loc.parent_id) ?? null) : null}
              traitCount={loc.traits.length}
              showStar
            />
          ))}
          <LoadMoreButton
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
            hasMore={hasNextPage}
          />
        </div>
      )}
    </div>
  );
}

// ── Stories tab ──────────────────────────────────────────────────────

const STORY_STATUSES: { value: StoryStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "abandoned", label: "Abandoned" },
];

function StoriesTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StoryStatus | "all">("active");

  const filters = useMemo(
    () => ({
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [statusFilter]
  );

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useStories(filters);

  const stories = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.items) ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter((s) => s.name.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-48">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search stories..."
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StoryStatus | "all")}
            className="
              appearance-none rounded-lg border border-border-default bg-bg-surface
              pl-3 pr-8 py-2 text-sm text-text-primary
              focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal
            "
            aria-label="Filter by status"
          >
            {STORY_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
            aria-hidden="true"
          />
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <EmptyState title="Could not load stories" />
      ) : stories.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title="No stories found"
          description={search ? `No stories match "${search}"` : "No stories match the current filter."}
        />
      ) : (
        <div className="space-y-2">
          {stories.map((story) => (
            <GameObjectCard
              key={story.id}
              type="story"
              id={story.id}
              name={story.name}
              description={story.summary}
              status={story.status}
              tags={story.tags}
              entryCount={story.entries.length}
              showStar
            />
          ))}
          <LoadMoreButton
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
            hasMore={hasNextPage}
          />
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────��─────────

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full rounded-lg border border-border-default bg-bg-surface
          pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60
          focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal
        "
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 rounded-lg border border-border-default bg-bg-surface animate-pulse"
        />
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────

export default function WorldBrowserPage() {
  const [activeTab, setActiveTab] = useState<TabId>("characters");

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-4 pt-4 pb-0">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-4">World</h1>

        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="World browser tabs"
          className="flex gap-1 border-b border-border-default overflow-x-auto"
        >
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`tabpanel-${id}`}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${activeTab === id
                  ? "border-brand-teal text-brand-teal"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
                }
              `}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-label={TABS.find((t) => t.id === activeTab)?.label}
        >
          {activeTab === "characters" && <CharactersTab />}
          {activeTab === "groups" && <GroupsTab />}
          {activeTab === "locations" && <LocationsTab />}
          {activeTab === "stories" && <StoriesTab />}
        </div>
      </div>
    </div>
  );
}
