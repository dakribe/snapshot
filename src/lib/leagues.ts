export type LeagueId = "nhl" | "pwhl" | "ahl";

export type League = {
  id: LeagueId;
  /** short name shown in chips and lists */
  name: string;
  fullName: string;
  /** "live": data is wired up. "soon": listed but not yet available. */
  status: "live" | "soon";
};

export const LEAGUES: League[] = [
  { id: "nhl", name: "NHL", fullName: "National Hockey League", status: "live" },
  { id: "pwhl", name: "PWHL", fullName: "Professional Women's Hockey League", status: "soon" },
  { id: "ahl", name: "AHL", fullName: "American Hockey League", status: "soon" },
];

export const leagueById = (id: LeagueId) => LEAGUES.find((l) => l.id === id)!;
