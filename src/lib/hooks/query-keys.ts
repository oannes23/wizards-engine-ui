/**
 * Centralized query key factory.
 * Source of truth: spec/architecture/data-fetching.md
 *
 * All TanStack Query hooks import keys from this file.
 * No inline key strings allowed.
 */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  players: {
    all: ["players"] as const,
  },
  characters: {
    all: ["characters"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["characters", "list", filters] as const,
    summary: ["characters", "summary"] as const,
    detail: (id: string) => ["characters", id] as const,
    feed: (id: string, filters?: Record<string, unknown>) =>
      ["characters", id, "feed", filters] as const,
  },
  proposals: {
    all: ["proposals"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["proposals", "list", filters] as const,
    detail: (id: string) => ["proposals", id] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    list: ["sessions", "list"] as const,
    active: ["sessions", "active"] as const,
    detail: (id: string) => ["sessions", id] as const,
    timeline: (id: string, filters?: Record<string, unknown>) =>
      ["sessions", id, "timeline", filters] as const,
  },
  groups: {
    all: ["groups"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["groups", "list", filters] as const,
    detail: (id: string) => ["groups", id] as const,
    feed: (id: string, filters?: Record<string, unknown>) =>
      ["groups", id, "feed", filters] as const,
  },
  locations: {
    all: ["locations"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["locations", "list", filters] as const,
    detail: (id: string) => ["locations", id] as const,
    feed: (id: string, filters?: Record<string, unknown>) =>
      ["locations", id, "feed", filters] as const,
  },
  stories: {
    all: ["stories"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["stories", "list", filters] as const,
    detail: (id: string) => ["stories", id] as const,
  },
  events: {
    list: (filters?: Record<string, unknown>) =>
      ["events", filters] as const,
  },
  feed: {
    me: (filters?: Record<string, unknown>) =>
      ["feed", "me", filters] as const,
    starred: (filters?: Record<string, unknown>) =>
      ["feed", "me", "starred", filters] as const,
    silent: (filters?: Record<string, unknown>) =>
      ["feed", "me", "silent", filters] as const,
  },
  clocks: {
    all: ["clocks"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["clocks", "list", filters] as const,
    detail: (id: string) => ["clocks", id] as const,
  },
  traitTemplates: {
    all: ["trait-templates"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["trait-templates", "list", filters] as const,
  },
  starred: {
    all: ["starred"] as const,
  },
  gm: {
    dashboard: ["gm", "dashboard"] as const,
    queueSummary: ["gm", "queue-summary"] as const,
  },
  invites: {
    all: ["invites"] as const,
  },
} as const;
