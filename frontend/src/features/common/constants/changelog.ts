export interface ChangelogEntry {
  date: string;
  notes: string[];
}

export const changelog: ChangelogEntry[] = [
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
