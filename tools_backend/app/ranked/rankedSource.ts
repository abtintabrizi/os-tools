import { createHash } from "node:crypto";
import { load } from "cheerio";

export const STATS_ORIGIN = "https://stats.omegastrikers.gg";

type Markup = ReturnType<ReturnType<typeof load>>;

export interface RankedProfile {
  rank: number;
  name: string | null;
  url: string;
}

interface LoadoutItem {
  name: string | null;
  asset: string | null;
}

interface Participant {
  team: "winner" | "loser";
  character: string;
  goals: number;
  assists: number;
  saves: number;
  kos: number;
  role: string | null;
  level: number | null;
  mvp: boolean;
  gear: LoadoutItem | null;
  awakenings: LoadoutItem[];
  player_id: string | null;
}

export interface RankedMatch {
  fingerprint: string;
  map: string;
  duration_seconds: number;
  bans: string[];
  average_tier: string | null;
  estimated_played_at: string | null;
  source_profile_url: string;
  observed_at: string;
  participants: Participant[];
}

export interface RankedPlayerSnapshot {
  source_player_id: string;
  name: string;
  rating: number | null;
  tier: string | null;
  observed_at: string;
}

const GEAR_NAMES = new Set([
  "Eject Button",
  "Magnetized Soles",
  "Momentum Boots",
  "Powerhouse Pauldrons",
  "Pummelers",
  "Siphoning Wand",
  "Slick Kicks",
  "Strike Shot",
  "Vicious Vambrace",
]);

const AGE_UNIT_SECONDS: Record<string, number> = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800 };

function text(element: Markup): string | null {
  return element.first().text().trim().replace(/\s+/gu, " ") || null;
}

function imageName(image: Markup): string | null {
  return image.attr("alt")?.trim() || image.attr("title")?.trim() || image.attr("aria-label")?.trim() || null;
}

function normalize(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

function estimatePlayedAt(age: string | null, observedAt: string): string | null {
  const label = age?.toLowerCase();
  if (label === "just now" || label === "moments ago") {
    return observedAt;
  }

  const parts = /^(?:(\d{1,5})|an?) (second|minute|hour|day|week)s? ago$/u.exec(label ?? "");
  const unit = AGE_UNIT_SECONDS[parts?.[2] ?? ""];
  if (!unit) {
    return null;
  }

  const ageMs = Number(parts?.[1] ?? 1) * unit * 1000;
  const estimate = new Date(Date.parse(observedAt) - ageMs);

  return Number.isFinite(estimate.getTime()) ? estimate.toISOString() : null;
}

function sourceUrl(href: string | undefined, base: string, path: RegExp): URL | null {
  if (!href) {
    return null;
  }

  const url = URL.parse(href, base);
  if (!url || url.origin !== STATS_ORIGIN || url.username || url.password || !path.test(url.pathname)) {
    return null;
  }

  url.hash = "";

  return url;
}

export function parseLeaderboard(html: string, url: string): RankedProfile[] {
  const $ = load(html);
  const profiles: RankedProfile[] = [];

  for (const row of $("table tr").toArray()) {
    const cells = $(row).children("td");
    const rank = /^#(\d+)$/u.exec(text(cells.eq(0)) ?? "")?.[1];
    const link = cells.eq(1).find("a[href]").first();
    const profile = sourceUrl(link.attr("href"), url, /^\/player\/[^/]+$/u);

    if (rank && profile) {
      profiles.push({ rank: Number(rank), name: text(link), url: profile.href });
    }
  }

  if (!profiles.length || !/ranked leaderboard/iu.test($("h1").text())) {
    throw new Error("Unrecognized ranked leaderboard markup");
  }

  return profiles;
}

function statLine(element: Markup): [number, number, number, number] {
  const match = /^(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)$/u.exec(text(element) ?? "");
  if (!match) {
    throw new Error("Missing or invalid participant G/A/S/K line");
  }

  return [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])];
}

function playerId(cell: Markup, url: string): string | null {
  const link = sourceUrl(cell.find('a[href*="/get_username/"]').attr("href"), url, /^\/get_username\/[\da-f]{24}$/iu);
  return link?.pathname.split("/").pop()?.toLowerCase() ?? null;
}

function parseParticipant(cells: Markup, offset: 0 | 5, team: Participant["team"], url: string): Participant {
  const player = cells.eq(offset);
  const character = imageName(player.find("img").first());
  if (!character) {
    throw new Error("Missing participant character");
  }

  const [goals, assists, saves, kos] = statLine(cells.eq(offset === 0 ? 2 : 3));
  const badges = player
    .find(".badge")
    .toArray()
    .map((badge) => {
      return badge.children
        .map((child) => {
          return child.type === "text" ? child.data : "";
        })
        .join("")
        .trim();
    });
  const level = badges.find((badge) => {
    return /^\d+$/u.test(badge);
  });
  const role = badges.find((badge) => {
    return badge === "Forward" || badge === "Goalie";
  });

  const awakenings: LoadoutItem[] = [];
  const icons = cells.eq(offset === 0 ? 1 : 4).find("img");
  icons.each((_index, element) => {
    const image = icons.filter(element);
    const asset =
      URL.parse(image.attr("src") ?? "", url)
        ?.pathname.split("/")
        .pop() || null;
    const name = imageName(image);
    if (!asset && !name) {
      throw new Error("Unrecognized loadout icon");
    }

    awakenings.push({ name, asset });
  });

  const gear = GEAR_NAMES.has(awakenings[0]?.name ?? "") ? (awakenings.shift() ?? null) : null;
  const isMvp =
    player.find(".mvp").length > 0 ||
    badges.some((badge) => {
      return badge.includes("⭐");
    });

  return {
    team,
    character,
    goals,
    assists,
    saves,
    kos,
    role: role ?? null,
    level: level ? Number(level) : null,
    mvp: isMvp,
    gear,
    awakenings,
    player_id: playerId(player, url),
  };
}

function participantSignature(player: Participant): string {
  return JSON.stringify([normalize(player.character), player.goals, player.assists, player.saves, player.kos]);
}

function findRoster(card: Markup) {
  const rows = card.find(".match-table > tbody > tr");
  const rowCells = rows.toArray().map((row) => {
    return rows.filter(row).children("td");
  });
  if (
    rowCells.length !== 3 ||
    rowCells.some((cells) => {
      return cells.length !== 6;
    })
  ) {
    throw new Error("Unexpected ranked roster columns");
  }

  const rosterSlots = rowCells.flatMap((cells) => {
    return [
      { cells, offset: 0 as const },
      { cells, offset: 5 as const },
    ];
  });
  const highlightedSlots = rosterSlots.filter(({ cells, offset }) => {
    const statsCell = cells.eq(offset === 0 ? 2 : 3);

    return (
      cells.eq(offset).is(".highlight-win, .highlight-loss, .highlight-lose, .highlight-defeat") ||
      statsCell.is('[class*="highlight-"]')
    );
  });

  const ownCharacter = imageName(card.find(".character-avatar").first());
  const ownStats = card
    .find(".match-stats .stat-line")
    .toArray()
    .map((line) => {
      return /:\s*(\d+)\s*$/u.exec(
        line.children
          .map((child) => {
            return child.type === "text" ? child.data : "";
          })
          .join(""),
      )?.[1];
    });
  const matchingSlots = rosterSlots.filter(({ cells, offset }) => {
    if (ownCharacter !== imageName(cells.eq(offset).find("img").first()) || ownStats.length !== 4) {
      return false;
    }

    const statsCell = cells.eq(offset === 0 ? 2 : 3);

    return ownStats.every((stat, index) => {
      return stat !== undefined && Number(stat) === statLine(statsCell)[index];
    });
  });

  const ownerSlots = highlightedSlots.length === 1 ? highlightedSlots : matchingSlots;
  const [owner] = ownerSlots;
  if (ownerSlots.length !== 1 || !owner) {
    throw new Error("Cannot identify the profile owner in the roster");
  }

  return { rowCells, owner };
}

function parseMatch(card: Markup, url: string, observedAt: string, roster: ReturnType<typeof findRoster>): RankedMatch {
  const { rowCells, owner } = roster;
  const map = text(card.find(".map-name"));
  const result = text(card.find(".result"));
  const duration = /^(?:(\d+)h\s+)?(?:(\d+)m\s+)?(\d+)s$/u.exec(text(card.find(".duration")) ?? "");
  if (!map || !duration || (result !== "Victory" && result !== "Defeat")) {
    throw new Error("Ranked card lacks a map, duration, or result");
  }

  const opponentOffset = owner.offset === 0 ? 5 : 0;
  const teamOffsets: [0 | 5, 0 | 5] =
    result === "Victory" ? [owner.offset, opponentOffset] : [opponentOffset, owner.offset];
  const teams = teamOffsets.map((offset, index) => {
    return rowCells
      .map((cells) => {
        return parseParticipant(cells, offset, index === 0 ? "winner" : "loser", url);
      })
      .sort((left, right) => {
        const leftSignature = participantSignature(left);
        const rightSignature = participantSignature(right);

        return leftSignature < rightSignature ? -1 : Number(leftSignature > rightSignature);
      });
  });

  const durationSeconds = Number(duration[1] ?? 0) * 3600 + Number(duration[2] ?? 0) * 60 + Number(duration[3]);
  if (!Number.isSafeInteger(durationSeconds) || durationSeconds <= 0) {
    throw new Error("Invalid match duration");
  }

  const identity = JSON.stringify([
    "v1",
    normalize(map),
    durationSeconds,
    teams.map((team) => {
      return team.map(participantSignature);
    }),
  ]);
  const fingerprint = `v1:${createHash("sha256").update(identity).digest("hex")}`;
  const bans = card
    .find(".ban-icons img")
    .toArray()
    .map((image) => {
      const name = image.attribs.alt?.trim() || image.attribs.title?.trim() || image.attribs["aria-label"]?.trim();
      if (!name) {
        throw new Error("Unrecognized ban icon");
      }
      return name;
    });

  return {
    fingerprint,
    map,
    duration_seconds: durationSeconds,
    bans,
    average_tier: text(card.find(".tier-name")),
    estimated_played_at: estimatePlayedAt(text(card.find(".time-ago")), observedAt),
    source_profile_url: url,
    observed_at: observedAt,
    participants: teams.flat(),
  };
}

export function parseProfile(html: string, url: string, observedAt: string) {
  const $ = load(html);
  const history = $(".match-history");
  const ownerName = $("h1.player-name").first().text().trim();
  if (!ownerName || history.length !== 1) {
    throw new Error("Unrecognized player profile markup");
  }

  const matches: RankedMatch[] = [];
  const ownerIds = new Set<string>();
  const skipped: { card: number; reason: string }[] = [];
  const cards = history.children('[class*="match-card-"]');
  if (!cards.length && !/\bno (?:recent )?(?:matches|games)\b/iu.test(history.text())) {
    throw new Error("No match cards or empty-history message found");
  }

  for (const [index, element] of cards.toArray().entries()) {
    const card = $(element);
    const mode = text(card.find(".mode-label"));

    try {
      if (mode !== "Ranked" && mode !== "Normal") {
        throw new Error("Unrecognized match mode");
      }

      const roster = findRoster(card);
      const ownerId = playerId(roster.owner.cells.eq(roster.owner.offset), url);
      if (ownerId) {
        ownerIds.add(ownerId);
      }
      if (mode === "Ranked") {
        matches.push(parseMatch(card, url, observedAt, roster));
      }
    } catch (error) {
      if (mode !== "Normal") {
        skipped.push({ card: index + 1, reason: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  if (ownerIds.size > 1) {
    throw new Error("Profile roster slots disagree on the owner's player ID");
  }

  const [ownerId] = ownerIds;
  const lp = /^(\d+|\d{1,3}(?:,\d{3})+) LP$/u.exec(text($(".rank-card .rank-lp")) ?? "")?.[1];
  const snapshot: RankedPlayerSnapshot | null = ownerId
    ? {
        source_player_id: ownerId,
        name: ownerName,
        rating: lp ? Number(lp.replaceAll(",", "")) : null,
        tier: text($(".rank-card .rank-name")),
        observed_at: observedAt,
      }
    : null;

  const next = history
    .find("a[rel=next], a[href]")
    .filter((_index, anchor) => {
      return $(anchor).is("[rel=next]") || /^(?:next|older)\b/iu.test(text($(anchor)) ?? "");
    })
    .first();
  const nextUrl = sourceUrl(next.attr("href"), url, /^\/player\/[^/]+$/u);
  if (next.length && (!nextUrl || nextUrl.pathname !== new URL(url).pathname)) {
    throw new Error("Unrecognized match history pagination link");
  }

  return { matches, snapshot, skipped, cards: cards.length, next: nextUrl?.href ?? null };
}
