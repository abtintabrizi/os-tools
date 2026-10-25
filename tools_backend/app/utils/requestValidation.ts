import { RequestError } from "./requestError.js";
import type { Team } from "../models/common.js";
import type {
  CreateMapDraftRoomRequest,
  MapDraftActionRequest,
  MapDraftPendingRequest,
  SetStrikerRoomRequest,
} from "../models/mapDraft.js";
import type {
  CreateStrikerDraftRoomRequest,
  StrikerDraftActionRequest,
  StrikerDraftPendingRequest,
} from "../models/strikerDraft.js";

// Preserve FastAPI's 422 + detail-array convention without introducing a schema library.
function invalid(field: string, message: string): never {
  throw new RequestError(422, [{ type: "value_error", loc: ["body", ...(field ? [field] : [])], msg: message }]);
}

function object(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) invalid("", "Input should be an object");

  return body as Record<string, unknown>;
}

function string(body: Record<string, unknown>, key: string): string {
  const value = body[key];

  if (typeof value !== "string") invalid(key, "Input should be a valid string");

  return value;
}

function nullableString(body: Record<string, unknown>, key: string): string | null {
  return body[key] == null ? null : string(body, key);
}

function strings(body: Record<string, unknown>, key: string): string[] {
  const value = body[key];

  if (!Array.isArray(value) || !value.every((item: unknown) => typeof item === "string")) {
    invalid(key, "Input should be a list of strings");
  }

  return value;
}

function integer(body: Record<string, unknown>, key: string): number {
  const value = body[key];
  // Pydantic accepts integer strings, booleans, and integral JSON numbers.
  const parsed =
    typeof value === "boolean"
      ? Number(value)
      : typeof value === "string" && /^[+-]?\d(?:_?\d)*(?:\.0+)?$/.test(value.trim())
        ? Number(value.replaceAll("_", ""))
        : value;

  if (typeof parsed !== "number" || !Number.isSafeInteger(parsed)) invalid(key, "Input should be a valid integer");

  return parsed;
}

function side(body: Record<string, unknown>): Team {
  const value = string(body, "side");

  if (value !== "blue" && value !== "red" && value !== "spectator")
    invalid("side", "Input should be 'blue', 'red' or 'spectator'");

  return value;
}

export function ready(body: unknown) {
  return { side: side(object(body)) };
}

export function createMap(body: unknown): CreateMapDraftRoomRequest {
  const b = object(body);

  return {
    bestOf: string(b, "bestOf"),
    blueName: string(b, "blueName"),
    redName: string(b, "redName"),
    maps: strings(b, "maps"),
  };
}

export function mapAction(body: unknown): MapDraftActionRequest {
  const b = object(body);

  return { map: string(b, "map"), step: integer(b, "step") };
}

export function mapPending(body: unknown): MapDraftPendingRequest {
  const b = object(body);

  return { side: side(b), map: nullableString(b, "map") };
}

export function strikerRoom(body: unknown): SetStrikerRoomRequest {
  const b = object(body);

  return {
    map: string(b, "map"),
    roomId: string(b, "roomId"),
    firstPick: string(b, "firstPick"),
    bannedAwakenings: strings(b, "bannedAwakenings"),
  };
}

export function createStriker(body: unknown): CreateStrikerDraftRoomRequest {
  const b = object(body);

  return {
    blueName: string(b, "blueName"),
    redName: string(b, "redName"),
    map: string(b, "map"),
    awakeningMode: string(b, "awakeningMode"),
    bannedStarts: b.bannedStarts === undefined ? [] : b.bannedStarts === null ? null : strings(b, "bannedStarts"),
    customAwakenings: b.customAwakenings == null ? null : strings(b, "customAwakenings"),
  };
}

export function strikerAction(body: unknown): StrikerDraftActionRequest {
  const b = object(body);

  return { striker: nullableString(b, "striker"), step: integer(b, "step") };
}

export function strikerPending(body: unknown): StrikerDraftPendingRequest {
  const b = object(body);

  return { side: side(b), striker: nullableString(b, "striker") };
}
