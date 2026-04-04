import Link from "next/link";
import { User, Building2, MapPin, BookOpen } from "lucide-react";
import type { GameObjectType } from "@/lib/api/types";

const TYPE_ICONS = {
  character: User,
  group: Building2,
  location: MapPin,
  story: BookOpen,
} as const;

const TYPE_ROUTES = {
  character: "/world/characters",
  group: "/world/groups",
  location: "/world/locations",
  story: "/world/stories",
} as const;

interface EntityLinkProps {
  type: GameObjectType | "story";
  id: string;
  name: string;
  isDeleted?: boolean;
}

/**
 * EntityLink — Clickable entity reference with type icon.
 * Faded styling when entity is soft-deleted.
 */
export function EntityLink({ type, id, name, isDeleted = false }: EntityLinkProps) {
  const Icon = TYPE_ICONS[type];
  const href = `${TYPE_ROUTES[type]}/${id}`;

  return (
    <Link
      href={href}
      className={`
        inline-flex items-center gap-1 text-sm font-medium transition-colors
        ${isDeleted
          ? "opacity-50 text-text-secondary hover:text-text-secondary"
          : "text-brand-teal hover:text-brand-teal-light"
        }
      `}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{name}</span>
    </Link>
  );
}
