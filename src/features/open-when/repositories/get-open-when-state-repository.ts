import "server-only";

import { CookieOpenWhenStateRepository } from "@/features/open-when/repositories/cookie-open-when-state-repository";
import type { OpenWhenStateRepository } from "@/features/open-when/repositories/open-when-state-repository";

export function getOpenWhenStateRepository(): OpenWhenStateRepository {
  return new CookieOpenWhenStateRepository();
}
