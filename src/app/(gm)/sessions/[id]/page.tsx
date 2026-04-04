"use client";

import { SessionDetail } from "@/features/sessions/components/SessionDetail";

interface GmSessionDetailPageProps {
  params: { id: string };
}

/**
 * GmSessionDetailPage — `/gm/sessions/[id]`
 *
 * GM view of session detail. Renders lifecycle controls and full
 * participant management via the shared SessionDetail component.
 */
export default function GmSessionDetailPage({ params }: GmSessionDetailPageProps) {
  return <SessionDetail id={params.id} isGm={true} />;
}
