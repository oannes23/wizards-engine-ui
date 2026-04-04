import type { RequestHandler } from "msw";
import { authHandlers } from "./auth";
import { usersHandlers } from "./users";
import { feedHandlers } from "./feeds";
import { characterHandlers } from "./characters";

export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...usersHandlers,
  ...feedHandlers,
  ...characterHandlers,
];
