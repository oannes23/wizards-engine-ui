import type { RequestHandler } from "msw";
import { authHandlers } from "./auth";
import { usersHandlers } from "./users";
import { feedHandlers } from "./feeds";
import { characterHandlers } from "./characters";
import { proposalHandlers } from "./proposals";

export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...usersHandlers,
  ...feedHandlers,
  ...characterHandlers,
  ...proposalHandlers,
];
