import { http, HttpResponse } from "msw";
import { paginatedList } from "../fixtures/helpers";
import { makeFeedEvent, makeFeedStoryEntry } from "../fixtures/feeds";

const API_BASE = "http://localhost:8000/api/v1";

export const silentFeedEvent = makeFeedEvent({
  id: "01EVT_SILENT0000000000000",
  event_type: "character.meter_updated",
  narrative: "Stress adjusted silently.",
  visibility: "silent",
});

export const feedHandlers = [
  http.get(`${API_BASE}/me/feed`, () => {
    return HttpResponse.json(
      paginatedList([
        makeFeedEvent({ id: "01EVT_A000000000000000000" }),
        makeFeedStoryEntry({ id: "01ENTRY_A00000000000000000" }),
      ])
    );
  }),

  http.get(`${API_BASE}/me/feed/starred`, () => {
    return HttpResponse.json(paginatedList([]));
  }),

  http.get(`${API_BASE}/me/feed/silent`, () => {
    return HttpResponse.json(paginatedList([silentFeedEvent]));
  }),

  http.get(`${API_BASE}/groups/:id/feed`, () => {
    return HttpResponse.json(
      paginatedList([makeFeedEvent({ id: "01EVT_GROUP000000000000000" })])
    );
  }),

  http.get(`${API_BASE}/locations/:id/feed`, () => {
    return HttpResponse.json(
      paginatedList([makeFeedEvent({ id: "01EVT_LOC00000000000000000" })])
    );
  }),
];
