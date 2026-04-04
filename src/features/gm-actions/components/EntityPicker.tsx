"use client";

import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listCharacters } from "@/lib/api/services/characters";
import { listGroups } from "@/lib/api/services/groups";
import { listLocations } from "@/lib/api/services/locations";
import { queryKeys } from "@/lib/hooks/query-keys";
import type { GameObjectType } from "@/lib/api/types";

interface EntityPickerProps {
  /** Which entity type to show */
  entityType: GameObjectType;
  value: string;
  onChange: (id: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
}

/**
 * EntityPicker — select dropdown for game objects (character/group/location).
 *
 * Loads the entity list and renders a <select>.
 */
export function EntityPicker({
  entityType,
  value,
  onChange,
  label,
  required = false,
  placeholder = "Select...",
  id,
}: EntityPickerProps) {
  const inputId = id ?? `entity-picker-${entityType}`;

  const { data: charactersData } = useQuery({
    queryKey: queryKeys.characters.list(),
    queryFn: () => listCharacters({ limit: 100 }),
    enabled: entityType === "character",
  });

  const { data: groupsData } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: () => listGroups({ limit: 100 }),
    enabled: entityType === "group",
  });

  const { data: locationsData } = useQuery({
    queryKey: queryKeys.locations.list(),
    queryFn: () => listLocations({ limit: 100 }),
    enabled: entityType === "location",
  });

  const options: Array<{ id: string; name: string }> = (() => {
    switch (entityType) {
      case "character":
        return (charactersData?.items ?? []).map((c) => ({
          id: c.id,
          name: c.name,
        }));
      case "group":
        return (groupsData?.items ?? []).map((g) => ({
          id: g.id,
          name: g.name,
        }));
      case "location":
        return (locationsData?.items ?? []).map((l) => ({
          id: l.id,
          name: l.name,
        }));
      default:
        return [];
    }
  })();

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          {label}
          {required && (
            <span className="text-meter-stress ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
