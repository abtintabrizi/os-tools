export interface ChangelogEntry {
  date: string;
  notes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-04-19",
    notes: [
      "First pick is now chosen on a per map basis in map draft (I had incorrectly assumed it alternates, thanks Jack Limestone!)",
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
