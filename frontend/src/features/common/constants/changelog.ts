export interface ChangelogEntry {
  date: string;
  notes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-04-16",
    notes: [
      "Added a 5 second counter to map/striker draft when both teams ready up",
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
