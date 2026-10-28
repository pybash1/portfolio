import type { InspoItem } from "../../components/inspo/types";
import { EditorError, env } from "./http";
import { database } from "../db/client";
import { createPostgresStore } from "./postgresStore";

export interface ItemStore {
  read(): Promise<InspoItem[]>;
  add(item: InspoItem): Promise<InspoItem>;
  remove(id: string): Promise<void>;
  asset(bytes: Buffer, extension: string, contentType: string): Promise<string>;
}

export function storageConfigured(): boolean {
  return !!env("DATABASE_URL");
}
export function itemStore(): ItemStore {
  if (!storageConfigured())
    throw new EditorError("Publishing has not been configured yet.", 503);
  return createPostgresStore(database());
}
