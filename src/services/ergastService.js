const ERGAST_BASE = "http://ergast.com/api/f1";

async function requestErgast(path, params = {}) {
  const url = new URL(`${ERGAST_BASE}${path}.json`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, value);
  });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch Ergast API data.");
  }
  return response.json();
}

export async function getDrivers() {
  const data = await requestErgast("/drivers", { limit: 1000 });
  return data?.MRData?.DriverTable?.Drivers || [];
}

export async function getConstructors() {
  const data = await requestErgast("/constructors", { limit: 1000 });
  return data?.MRData?.ConstructorTable?.Constructors || [];
}

export async function getCircuits() {
  const data = await requestErgast("/circuits", { limit: 1000 });
  return data?.MRData?.CircuitTable?.Circuits || [];
}

export async function getSeasons() {
  const data = await requestErgast("/seasons", { limit: 1000 });
  return data?.MRData?.SeasonTable?.Seasons || [];
}

export async function getSeasonRaces(season) {
  const data = await requestErgast(`/${season}`, { limit: 1000 });
  return data?.MRData?.RaceTable?.Races || [];
}

export async function getRaceResults(season, round) {
  const data = await requestErgast(`/${season}/${round}/results`, {
    limit: 1000,
  });
  return data?.MRData?.RaceTable?.Races?.[0]?.Results || [];
}

export async function getDriverStandings(season) {
  const data = await requestErgast(`/${season}/driverStandings`, {
    limit: 1000,
  });
  return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
}

export async function getConstructorStandings(season) {
  const data = await requestErgast(`/${season}/constructorStandings`, {
    limit: 1000,
  });
  return (
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || []
  );
}

export async function getPitStops(season, round) {
  const data = await requestErgast(`/${season}/${round}/pitstops`, {
    limit: 1000,
  });
  return data?.MRData?.RaceTable?.Races?.[0]?.PitStops || [];
}

export async function getQualifyingResults(season, round) {
  const data = await requestErgast(`/${season}/${round}/qualifying`, {
    limit: 1000,
  });
  return data?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults || [];
}

export async function getFastestLap(season, round) {
  const data = await requestErgast(`/${season}/${round}/fastest/1/results`, {
    limit: 1000,
  });
  return data?.MRData?.RaceTable?.Races?.[0]?.Results?.[0] || null;
}
