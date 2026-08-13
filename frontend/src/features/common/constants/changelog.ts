export interface ChangelogEntry {
  date: string;
  notes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-08-13",
    notes: [
      "Added the best of two map draft format",
      "Made pending selection visibility client side only",
    ],
  },
  {
    date: "2026-06-12",
    notes: ["Updated awakenings to match the June 12 patch"],
  },
  {
    date: "2026-06-04",
    notes: [
      "Fixed a bug where draft would break if both teams had the same name",
      "Made the logic around draft action sequences more robust",
    ],
  },
  {
    date: "2026-05-24",
    notes: [
      "Fixed a bug where teams could accidentally submit a pick for the opposing team",
    ],
  },
  {
    date: "2026-04-23",
    notes: ["Updated awakenings to match the April 23 patch"],
  },
  {
    date: "2026-04-20",
    notes: ["Added some cool new animations in draft"],
  },
  {
    date: "2026-04-19",
    notes: [
      "First pick is now chosen on a per map basis in map draft (I had incorrectly assumed it alternates, thanks Jack Limestone!)",
      "Fixed an issue where the locked in awakenings at the end of map draft UI would incorrectly pull from a user's storage instead of the lobby's locked awakenings",
      "Awakenings and map info added to striker draft lobby page",
    ],
  },
  {
    date: "2026-04-18",
    notes: [
      "Fixed a timer related bug where server/client timestamps were out of sync",
    ],
  },
  {
    date: "2026-04-17",
    notes: [
      "Added a 5 second counter to map/striker draft when both teams ready up",
      "Added team names to the configs for map draft setup",
      "Added config generation/loading to striker draft setup",
      "Changed the post map draft screen to allow users to create striker draft lobbies and go to them directly",
    ],
  },
  {
    date: "2026-04-16",
    notes: ["Updated default awakenings and exclusions to match the new patch"],
  },
  {
    date: "2026-04-10",
    notes: [
      "Added a changelog to the home screen",
      "Removed visible pending picks for the non-picking team",
      "Updated the visuals of the sidebar cards in map draft",
      "Fixed some styling consistency across map draft and striker draft",
      "Added functionality to copy/share map draft configs",
    ],
  },
];
