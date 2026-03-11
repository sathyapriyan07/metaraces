const OPENF1_BASE = "https://api.openf1.org/v1";
const ERGAST_BASE = "https://api.jolpi.ca/ergast/f1";
const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

export async function fetchOpenF1RaceWeekends(year) {
  const [sessionsRes, meetingsRes] = await Promise.all([
    fetch(
      `${OPENF1_BASE}/sessions?year=${year}&session_name=Race`
    ),
    fetch(`${OPENF1_BASE}/meetings?year=${year}`),
  ]);
  if (!sessionsRes.ok) {
    throw new Error("Failed to fetch OpenF1 race sessions.");
  }
  if (!meetingsRes.ok) {
    throw new Error("Failed to fetch OpenF1 meetings.");
  }
  const sessions = await sessionsRes.json();
  const meetings = await meetingsRes.json();
  return { sessions, meetings };
}

export async function fetchOpenF1LatestSessions() {
  const response = await fetch(`${OPENF1_BASE}/sessions?year=2024`);
  if (!response.ok) {
    throw new Error("Failed to fetch OpenF1 sessions.");
  }
  return response.json();
}

export async function fetchErgastLatestSeason() {
  const response = await fetch(`${ERGAST_BASE}/current.json`);
  if (!response.ok) {
    throw new Error("Failed to fetch Ergast current season.");
  }
  const data = await response.json();
  return data?.MRData?.RaceTable?.Races || [];
}

export async function fetchJolpicaSeason(year) {
  const response = await fetch(`${JOLPICA_BASE}/${year}.json`);
  if (!response.ok) {
    throw new Error("Failed to fetch Jolpica season.");
  }
  const data = await response.json();
  return data?.MRData?.RaceTable?.Races || [];
}
