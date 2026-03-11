const ERGAST_BASE = "https://api.jolpi.ca/ergast/f1";

async function requestErgast(path, params = {}) {
  const url = new URL(`${ERGAST_BASE}${path}.json`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, value);
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error("API request failed");
    }
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("API timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export { requestErgast };

export async function getDrivers() {
  const data = await requestErgast("/drivers", { limit: 1000 });
  if (!data?.MRData?.DriverTable) {
    throw new Error("Invalid API response");
  }
  const drivers = data.MRData.DriverTable.Drivers || [];
  if (!drivers.length) {
    throw new Error("No data returned");
  }
  return drivers;
}

export async function getConstructors() {
  const data = await requestErgast("/constructors", { limit: 1000 });
  if (!data?.MRData?.ConstructorTable) {
    throw new Error("Invalid API response");
  }
  const constructors = data.MRData.ConstructorTable.Constructors || [];
  if (!constructors.length) {
    throw new Error("No data returned");
  }
  return constructors;
}

export async function getCircuits() {
  const data = await requestErgast("/circuits", { limit: 1000 });
  if (!data?.MRData?.CircuitTable) {
    throw new Error("Invalid API response");
  }
  const circuits = data.MRData.CircuitTable.Circuits || [];
  if (!circuits.length) {
    throw new Error("No data returned");
  }
  return circuits;
}

export async function getSeasons() {
  const data = await requestErgast("/seasons", { limit: 1000 });
  if (!data?.MRData?.SeasonTable) {
    throw new Error("Invalid API response");
  }
  const seasons = data.MRData.SeasonTable.Seasons || [];
  if (!seasons.length) {
    throw new Error("No data returned");
  }
  return seasons;
}

export async function getSeasonRaces(season) {
  const data = await requestErgast(`/${season}`, { limit: 1000 });
  if (!data?.MRData?.RaceTable) {
    throw new Error("Invalid API response");
  }
  const races = data.MRData.RaceTable.Races || [];
  if (!races.length) {
    throw new Error("No data returned");
  }
  return races;
}

export async function getRaceResults(season, round) {
  const data = await requestErgast(`/${season}/${round}/results`, {
    limit: 1000,
  });
  if (!data?.MRData?.RaceTable) {
    throw new Error("Invalid API response");
  }
  const results = data.MRData.RaceTable.Races?.[0]?.Results || [];
  if (!results.length) {
    throw new Error("No data returned");
  }
  return results;
}

export async function getDriverStandings(season) {
  const data = await requestErgast(`/${season}/driverStandings`, {
    limit: 1000,
  });
  if (!data?.MRData?.StandingsTable) {
    throw new Error("Invalid API response");
  }
  const standings =
    data.MRData.StandingsTable.StandingsLists?.[0]?.DriverStandings || [];
  if (!standings.length) {
    throw new Error("No data returned");
  }
  return standings;
}

export async function getConstructorStandings(season) {
  const data = await requestErgast(`/${season}/constructorStandings`, {
    limit: 1000,
  });
  if (!data?.MRData?.StandingsTable) {
    throw new Error("Invalid API response");
  }
  const standings =
    data.MRData.StandingsTable.StandingsLists?.[0]?.ConstructorStandings || [];
  if (!standings.length) {
    throw new Error("No data returned");
  }
  return standings;
}

export async function getPitStops(season, round) {
  const data = await requestErgast(`/${season}/${round}/pitstops`, {
    limit: 1000,
  });
  if (!data?.MRData?.RaceTable) {
    throw new Error("Invalid API response");
  }
  const stops = data.MRData.RaceTable.Races?.[0]?.PitStops || [];
  if (!stops.length) {
    throw new Error("No data returned");
  }
  return stops;
}

export async function getQualifyingResults(season, round) {
  const data = await requestErgast(`/${season}/${round}/qualifying`, {
    limit: 1000,
  });
  if (!data?.MRData?.RaceTable) {
    throw new Error("Invalid API response");
  }
  const results = data.MRData.RaceTable.Races?.[0]?.QualifyingResults || [];
  if (!results.length) {
    throw new Error("No data returned");
  }
  return results;
}

export async function getFastestLap(season, round) {
  const data = await requestErgast(`/${season}/${round}/fastest/1/results`, {
    limit: 1000,
  });
  if (!data?.MRData?.RaceTable) {
    throw new Error("Invalid API response");
  }
  const result = data.MRData.RaceTable.Races?.[0]?.Results?.[0] || null;
  if (!result) {
    throw new Error("No data returned");
  }
  return result;
}
