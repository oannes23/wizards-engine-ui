import { http, HttpResponse } from "msw";
import { paginatedList } from "../fixtures/helpers";
import { makeFeedEvent, makeFeedStoryEntry } from "../fixtures/feeds";

const API_BASE = "http://localhost:8000/api/v1";

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
    return HttpResponse.json(paginatedList([]));
  }),
];
