export interface ChangelogEntry {
  date: string;
  notes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-04-10",
    notes: ["Added a changelog to the home screen"],
  },
];
