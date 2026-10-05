import type { Migration } from "./runner";
import { v1Baseline } from "./v1";

/** Ordered by version; append new migrations, never edit a shipped one. */
export const MIGRATIONS: readonly Migration[] = [v1Baseline];
