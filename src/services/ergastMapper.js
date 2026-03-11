export function raceIdFromSeasonRound(season, round) {
  return `${season}-${round}`;
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function mapErgastDrivers(drivers = []) {
  return drivers.map((driver) => ({
    driver_id: driver.driverId,
    first_name: driver.givenName,
    last_name: driver.familyName,
    driver_code: driver.code || null,
    number: null,
    nationality: driver.nationality || null,
    date_of_birth: driver.dateOfBirth || null,
    debut_year: null,
    photo_url: null,
  }));
}

export function mapErgastConstructors(constructors = []) {
  return constructors.map((team) => ({
    constructor_id: team.constructorId,
    name: team.name,
    nationality: team.nationality || null,
    base_location: null,
    championships: null,
    logo_url: null,
  }));
}

export function mapErgastCircuits(circuits = []) {
  return circuits.map((circuit) => ({
    circuit_id: circuit.circuitId,
    name: circuit.circuitName,
    city: circuit.Location?.locality || null,
    country: circuit.Location?.country || null,
    length_km: null,
    first_grand_prix: null,
    track_map_url: null,
  }));
}

export function mapErgastSeasons(seasons = []) {
  return seasons.map((season) => ({
    season_id: String(season.season),
    year: Number(season.season),
    champion_driver_id: null,
    champion_constructor_id: null,
    total_races: null,
  }));
}

export function mapErgastRaces(races = []) {
  return races.map((race) => ({
    race_id: raceIdFromSeasonRound(race.season, race.round),
    season_year: Number(race.season),
    round: Number(race.round),
    race_name: race.raceName,
    circuit_id: race.Circuit?.circuitId || null,
    date: race.date || null,
    laps: null,
    banner_url: null,
  }));
}

export function mapErgastRaceCircuits(races = []) {
  const map = new Map();
  races.forEach((race) => {
    const circuit = race.Circuit;
    if (!circuit?.circuitId) return;
    if (map.has(circuit.circuitId)) return;
    map.set(circuit.circuitId, {
      circuit_id: circuit.circuitId,
      name: circuit.circuitName,
      city: circuit.Location?.locality || null,
      country: circuit.Location?.country || null,
      length_km: null,
      first_grand_prix: null,
      track_map_url: null,
    });
  });
  return Array.from(map.values());
}

export function mapErgastResults(results = [], season, round) {
  const raceId = raceIdFromSeasonRound(season, round);
  return results.map((result) => ({
    result_id: `${raceId}-${result.Driver?.driverId}`,
    race_id: raceId,
    driver_id: result.Driver?.driverId || null,
    constructor_id: result.Constructor?.constructorId || null,
    grid: toNumber(result.grid),
    position: toNumber(result.position),
    points: result.points ?? null,
    laps: toNumber(result.laps),
    status: result.status || null,
  }));
}

export function mapErgastDriverStandings(standings = [], season) {
  return standings.map((row) => ({
    id: `${season}-${row.Driver?.driverId}`,
    season_year: Number(season),
    driver_id: row.Driver?.driverId || null,
    position: toNumber(row.position),
    wins: toNumber(row.wins),
    points: row.points ?? null,
  }));
}

export function mapErgastConstructorStandings(standings = [], season) {
  return standings.map((row) => ({
    id: `${season}-${row.Constructor?.constructorId}`,
    season_year: Number(season),
    constructor_id: row.Constructor?.constructorId || null,
    position: toNumber(row.position),
    wins: toNumber(row.wins),
    points: row.points ?? null,
  }));
}

export function mapErgastPitStops(stops = [], season, round) {
  const raceId = raceIdFromSeasonRound(season, round);
  return stops.map((stop) => ({
    id: `${raceId}-${stop.driverId}-${stop.stop}`,
    race_id: raceId,
    driver_id: stop.driverId || null,
    stop: toNumber(stop.stop),
    lap: toNumber(stop.lap),
    time: stop.time || null,
    duration: stop.duration || null,
  }));
}

export function mapErgastQualifyingResults(results = [], season, round) {
  const raceId = raceIdFromSeasonRound(season, round);
  return results.map((result) => ({
    id: `${raceId}-${result.Driver?.driverId}`,
    race_id: raceId,
    driver_id: result.Driver?.driverId || null,
    constructor_id: result.Constructor?.constructorId || null,
    position: toNumber(result.position),
    q1: result.Q1 || null,
    q2: result.Q2 || null,
    q3: result.Q3 || null,
  }));
}

export function mapErgastFastestLap(result, season, round) {
  if (!result) return null;
  const raceId = raceIdFromSeasonRound(season, round);
  return {
    id: `${raceId}-${result.Driver?.driverId}`,
    race_id: raceId,
    driver_id: result.Driver?.driverId || null,
    constructor_id: result.Constructor?.constructorId || null,
    lap: toNumber(result.FastestLap?.lap),
    time: result.FastestLap?.Time?.time || null,
    average_speed: result.FastestLap?.AverageSpeed?.speed || null,
    average_speed_units: result.FastestLap?.AverageSpeed?.units || null,
    position: toNumber(result.position),
    points: result.points ?? null,
  };
}
