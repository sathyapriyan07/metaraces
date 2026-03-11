
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, hasSupabase } from "../services/supabaseClient";
import { importExcelToTable } from "../services/excelImporter";
import {
  fetchErgastLatestSeason,
  fetchJolpicaSeason,
  fetchOpenF1RaceWeekends,
} from "../services/f1Api";
import {
  getCircuits,
  getConstructorStandings,
  getConstructors,
  getDriverStandings,
  getDrivers,
  getFastestLap,
  getPitStops,
  getQualifyingResults,
  getRaceResults,
  getSeasonRaces,
  getSeasons,
} from "../services/ergastService";
import {
  mapErgastCircuits,
  mapErgastConstructorStandings,
  mapErgastConstructors,
  mapErgastDriverStandings,
  mapErgastDrivers,
  mapErgastFastestLap,
  mapErgastPitStops,
  mapErgastQualifyingResults,
  mapErgastRaceCircuits,
  mapErgastRaces,
  mapErgastResults,
  mapErgastSeasons,
} from "../services/ergastMapper";
import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTable from "../components/AdminTable.jsx";
import AdminModal from "../components/AdminModal.jsx";

const excelTables = [
  "drivers",
  "constructors",
  "circuits",
  "seasons",
  "races",
  "results",
  "driver_standings",
  "constructor_standings",
  "driver_constructor_contracts",
];

const adminSections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "drivers", label: "Drivers" },
  { id: "constructors", label: "Constructors" },
  { id: "circuits", label: "Circuits" },
  { id: "seasons", label: "Seasons" },
  { id: "races", label: "Races" },
  { id: "results", label: "Results" },
  { id: "standings", label: "Standings" },
  { id: "driver_assignments", label: "Driver Assignments" },
  { id: "import", label: "Import Center" },
  { id: "ergast_import", label: "Ergast Import Center" },
  { id: "season_import", label: "Season Importer" },
  { id: "media", label: "Media Manager" },
];

const tableConfigs = {
  drivers: {
    table: "drivers",
    id: "driver_id",
    search: ["first_name", "last_name", "nationality", "driver_code"],
    columns: [
      { key: "driver_id", label: "driver_id", sortable: true },
      {
        key: "photo_url",
        label: "photo",
        render: (row) =>
          row.photo_url ? (
            <img
              src={row.photo_url}
              alt="driver"
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            "-"
          ),
      },
      { key: "first_name", label: "first_name", sortable: true },
      { key: "last_name", label: "last_name", sortable: true },
      { key: "nationality", label: "nationality", sortable: true },
      { key: "number", label: "number", sortable: true },
      { key: "debut_year", label: "debut_year", sortable: true },
    ],
    fields: [
      { key: "driver_id", label: "driver_id" },
      { key: "photo_url", label: "photo_url" },
      { key: "first_name", label: "first_name" },
      { key: "last_name", label: "last_name" },
      { key: "driver_code", label: "driver_code" },
      { key: "number", label: "number", type: "number" },
      { key: "nationality", label: "nationality" },
      { key: "date_of_birth", label: "date_of_birth", type: "date" },
      { key: "debut_year", label: "debut_year", type: "number" },
    ],
    required: ["driver_id", "first_name", "last_name"],
  },
  constructors: {
    table: "constructors",
    id: "constructor_id",
    search: ["name", "nationality", "base_location"],
    columns: [
      { key: "constructor_id", label: "constructor_id", sortable: true },
      {
        key: "logo_url",
        label: "logo",
        render: (row) =>
          row.logo_url ? (
            <img
              src={row.logo_url}
              alt="logo"
              className="h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            "-"
          ),
      },
      { key: "name", label: "name", sortable: true },
      { key: "nationality", label: "nationality", sortable: true },
      { key: "championships", label: "championships", sortable: true },
    ],
    fields: [
      { key: "constructor_id", label: "constructor_id" },
      { key: "name", label: "name" },
      { key: "nationality", label: "nationality" },
      { key: "base_location", label: "base_location" },
      { key: "championships", label: "championships", type: "number" },
      { key: "logo_url", label: "logo_url" },
    ],
    required: ["constructor_id", "name"],
  },
  circuits: {
    table: "circuits",
    id: "circuit_id",
    search: ["name", "country", "city"],
    columns: [
      { key: "circuit_id", label: "circuit_id", sortable: true },
      { key: "name", label: "name", sortable: true },
      { key: "country", label: "country", sortable: true },
      { key: "length_km", label: "length_km", sortable: true },
      { key: "first_grand_prix", label: "first_grand_prix", sortable: true },
    ],
    fields: [
      { key: "circuit_id", label: "circuit_id" },
      { key: "name", label: "name" },
      { key: "city", label: "city" },
      { key: "country", label: "country" },
      { key: "length_km", label: "length_km" },
      { key: "first_grand_prix", label: "first_grand_prix", type: "number" },
      { key: "track_map_url", label: "track_map_url" },
    ],
    required: ["circuit_id", "name"],
  },
  seasons: {
    table: "seasons",
    id: "season_id",
    search: ["year"],
    columns: [
      { key: "season_id", label: "season_id", sortable: true },
      { key: "year", label: "year", sortable: true },
      { key: "champion_driver_id", label: "champion_driver_id" },
      { key: "champion_constructor_id", label: "champion_constructor_id" },
      { key: "total_races", label: "total_races", sortable: true },
    ],
    fields: [
      { key: "season_id", label: "season_id" },
      { key: "year", label: "year", type: "number" },
      { key: "champion_driver_id", label: "champion_driver_id" },
      { key: "champion_constructor_id", label: "champion_constructor_id" },
      { key: "total_races", label: "total_races", type: "number" },
    ],
    required: ["season_id", "year"],
  },
  races: {
    table: "races",
    id: "race_id",
    search: ["race_name", "season_year", "circuit_id"],
    columns: [
      { key: "race_id", label: "race_id", sortable: true },
      { key: "race_name", label: "race_name", sortable: true },
      { key: "season_year", label: "season_year", sortable: true },
      { key: "round", label: "round", sortable: true },
      { key: "circuit_id", label: "circuit_id" },
      { key: "date", label: "date", sortable: true },
    ],
    fields: [
      { key: "race_id", label: "race_id" },
      { key: "season_year", label: "season_year", type: "number" },
      { key: "round", label: "round", type: "number" },
      { key: "race_name", label: "race_name" },
      { key: "circuit_id", label: "circuit_id" },
      { key: "date", label: "date", type: "date" },
      { key: "laps", label: "laps", type: "number" },
      { key: "banner_url", label: "banner_url" },
    ],
    required: ["race_id", "season_year", "race_name"],
  },
  results: {
    table: "results",
    id: "result_id",
    search: ["race_id", "driver_id", "constructor_id", "status"],
    columns: [
      { key: "result_id", label: "result_id", sortable: true },
      { key: "race_id", label: "race_id", sortable: true },
      { key: "driver_id", label: "driver_id", sortable: true },
      { key: "constructor_id", label: "constructor_id" },
      { key: "grid", label: "grid", sortable: true },
      { key: "position", label: "position", sortable: true },
      { key: "points", label: "points", sortable: true },
      { key: "status", label: "status" },
    ],
    fields: [
      { key: "result_id", label: "result_id" },
      { key: "race_id", label: "race_id" },
      { key: "driver_id", label: "driver_id" },
      { key: "constructor_id", label: "constructor_id" },
      { key: "grid", label: "grid", type: "number" },
      { key: "position", label: "position", type: "number" },
      { key: "points", label: "points" },
      { key: "laps", label: "laps", type: "number" },
      { key: "status", label: "status" },
    ],
    required: ["result_id", "race_id", "driver_id"],
  },
  driver_standings: {
    table: "driver_standings",
    id: "id",
    search: ["season_year", "driver_id"],
    columns: [
      { key: "id", label: "id", sortable: true },
      { key: "season_year", label: "season_year", sortable: true },
      { key: "driver_id", label: "driver_id", sortable: true },
      { key: "position", label: "position", sortable: true },
      { key: "wins", label: "wins", sortable: true },
      { key: "points", label: "points", sortable: true },
    ],
    fields: [
      { key: "id", label: "id" },
      { key: "season_year", label: "season_year", type: "number" },
      { key: "driver_id", label: "driver_id" },
      { key: "position", label: "position", type: "number" },
      { key: "wins", label: "wins", type: "number" },
      { key: "points", label: "points" },
    ],
    required: ["id", "season_year", "driver_id"],
  },
  constructor_standings: {
    table: "constructor_standings",
    id: "id",
    search: ["season_year", "constructor_id"],
    columns: [
      { key: "id", label: "id", sortable: true },
      { key: "season_year", label: "season_year", sortable: true },
      { key: "constructor_id", label: "constructor_id", sortable: true },
      { key: "position", label: "position", sortable: true },
      { key: "wins", label: "wins", sortable: true },
      { key: "points", label: "points", sortable: true },
    ],
    fields: [
      { key: "id", label: "id" },
      { key: "season_year", label: "season_year", type: "number" },
      { key: "constructor_id", label: "constructor_id" },
      { key: "position", label: "position", type: "number" },
      { key: "wins", label: "wins", type: "number" },
      { key: "points", label: "points" },
    ],
    required: ["id", "season_year", "constructor_id"],
  },
  driver_constructor_contracts: {
    table: "driver_constructor_contracts",
    id: "id",
    search: ["driver_id", "constructor_id", "season_year"],
    columns: [
      { key: "id", label: "id", sortable: true },
      { key: "driver_id", label: "driver", sortable: true },
      { key: "constructor_id", label: "constructor", sortable: true },
      { key: "season_year", label: "season_year", sortable: true },
      { key: "driver_number", label: "driver_number", sortable: true },
    ],
    fields: [
      { key: "id", label: "id" },
      { key: "driver_id", label: "driver", type: "select", options: [] },
      { key: "constructor_id", label: "constructor", type: "select", options: [] },
      { key: "season_year", label: "season_year", type: "number" },
      { key: "driver_number", label: "driver_number", type: "number" },
      { key: "start_round", label: "start_round", type: "number" },
      { key: "end_round", label: "end_round", type: "number" },
    ],
    required: ["id", "driver_id", "constructor_id", "season_year"],
  },
};

function toRaceRows(races) {
  return races.map((race) => ({
    race_id: `${race.season}-${race.round}`,
    season_year: Number(race.season),
    round: Number(race.round),
    race_name: race.raceName,
    circuit_id: race.Circuit?.circuitId || race.Circuit?.circuitName,
    date: race.date,
    laps: null,
    banner_url: null,
  }));
}

function dedupeBy(items, key) {
  const map = new Map();
  items.forEach((item) => {
    const value = item?.[key];
    if (!value) return;
    if (!map.has(value)) map.set(value, item);
  });
  return Array.from(map.values());
}

export default function Admin({ initialSection = "dashboard" }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [activeSection, setActiveSection] = useState(initialSection);
  const [tableName, setTableName] = useState("drivers");
  const [file, setFile] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [apiSource, setApiSource] = useState("races");
  const [apiCircuits, setApiCircuits] = useState([]);
  const [apiYear, setApiYear] = useState(new Date().getFullYear());
  const [ergastSeason, setErgastSeason] = useState(new Date().getFullYear());
  const [ergastRound, setErgastRound] = useState(1);
  const [ergastImportState, setErgastImportState] = useState({});
  const [seasonImportYear, setSeasonImportYear] = useState(
    new Date().getFullYear()
  );
  const [seasonImportLoading, setSeasonImportLoading] = useState(false);
  const [seasonImportProgress, setSeasonImportProgress] = useState({
    label: "",
    percent: 0,
  });
  const [seasonImportStats, setSeasonImportStats] = useState({});
  const [includeQualifying, setIncludeQualifying] = useState(false);
  const [includeFastestLap, setIncludeFastestLap] = useState(true);
  const [includePitStops, setIncludePitStops] = useState(false);
  const seasonImportAbortRef = useRef(false);
  const [mediaForm, setMediaForm] = useState({
    table: "drivers",
    id: "",
    column: "photo_url",
    url: "",
  });
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaResults, setMediaResults] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [tableRows, setTableRows] = useState([]);
  const [tableCount, setTableCount] = useState(0);
  const [tablePage, setTablePage] = useState(1);
  const [tableSearch, setTableSearch] = useState("");
  const [tableSort, setTableSort] = useState({ column: "", direction: "asc" });
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("edit");
  const [modalValues, setModalValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [standingsType, setStandingsType] = useState("driver_standings");
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentValues, setAssignmentValues] = useState({});
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [driverOptions, setDriverOptions] = useState([]);
  const [constructorOptions, setConstructorOptions] = useState([]);

  const isAuthed = useMemo(() => Boolean(session), [session]);
  const driverNameMap = useMemo(() => {
    const map = new Map();
    driverOptions.forEach((driver) => map.set(driver.value, driver.label));
    return map;
  }, [driverOptions]);
  const constructorNameMap = useMemo(() => {
    const map = new Map();
    constructorOptions.forEach((team) => map.set(team.value, team.label));
    return map;
  }, [constructorOptions]);
  const activeTable = useMemo(() => {
    if (activeSection === "standings") return standingsType;
    if (activeSection === "dashboard") return "drivers";
    if (activeSection === "driver_assignments")
      return "driver_constructor_contracts";
    if (activeSection === "import") return null;
    if (activeSection === "ergast_import") return null;
    if (activeSection === "season_import") return null;
    if (activeSection === "media") return null;
    return activeSection;
  }, [activeSection, standingsType]);
  useEffect(() => {
    if (!hasSupabase()) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) =>
      setSession(newSession)
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!hasSupabase()) return;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setStatus(error.message);
    if (data?.session) setStatus("Logged in.");
  };

  const handleLogout = async () => {
    if (!hasSupabase()) return;
    await supabase.auth.signOut();
    setSession(null);
    setStatus("Logged out.");
  };

  const handleImport = async () => {
    if (!file) {
      setStatus("Select an Excel file first.");
      return;
    }
    const res = await importExcelToTable(file, tableName);
    setStatus(res.message);
  };

  const handleApiImport = async () => {
    if (!hasSupabase()) return;
    if (!apiData.length) {
      setStatus("No API data loaded.");
      return;
    }
    if (apiSource !== "races") {
      if (!apiCircuits.length) {
        setStatus("OpenF1 data is missing circuit mappings.");
        return;
      }
      const circuitsRes = await supabase
        .from("circuits")
        .upsert(apiCircuits, { onConflict: "circuit_id" });
      if (circuitsRes.error) {
        setStatus(circuitsRes.error.message);
        return;
      }
      const racesRes = await supabase
        .from("races")
        .upsert(apiData, { onConflict: "race_id" });
      if (racesRes.error) {
        setStatus(racesRes.error.message);
        return;
      }
      setStatus(`Imported ${apiData.length} OpenF1 races.`);
      return;
    }
    const { error } = await supabase
      .from("races")
      .upsert(apiData, { onConflict: "race_id" });
    if (error) setStatus(error.message);
    else setStatus(`Imported ${apiData.length} races.`);
  };

  const handleLoadErgast = async () => {
    try {
      const races = await fetchErgastLatestSeason();
      setApiData(toRaceRows(races));
      setApiSource("races");
      setStatus(`Loaded ${races.length} races from Ergast.`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleLoadJolpica = async () => {
    try {
      const races = await fetchJolpicaSeason(apiYear);
      setApiData(toRaceRows(races));
      setApiSource("races");
      setStatus(`Loaded ${races.length} races for ${apiYear}.`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleLoadOpenF1 = async () => {
    try {
      const { sessions, meetings } = await fetchOpenF1RaceWeekends(apiYear);
      const meetingMap = new Map(
        meetings.map((meeting) => [meeting.meeting_key, meeting])
      );
      const raceSessions = sessions.filter(
        (session) =>
          session.session_name === "Race" || session.session_type === "Race"
      );
      const ordered = [...raceSessions].sort((a, b) => {
        const aTime = new Date(a.date_start || a.date_end || 0).getTime();
        const bTime = new Date(b.date_start || b.date_end || 0).getTime();
        return aTime - bTime;
      });
      const races = ordered.map((session, index) => {
        const meeting = meetingMap.get(session.meeting_key);
        const circuitKey = meeting?.circuit_key ?? session.circuit_key;
        return {
          race_id: `openf1-${apiYear}-${session.meeting_key || session.session_key}`,
          season_year: apiYear,
          round: index + 1,
          race_name:
            meeting?.meeting_name ||
            `${meeting?.country_name || session.country_name || "Grand Prix"}`,
          circuit_id: circuitKey ? `openf1-${circuitKey}` : null,
          date: session.date_start
            ? session.date_start.split("T")[0]
            : null,
          laps: null,
          banner_url: null,
        };
      });
      const circuits = meetings
        .filter((meeting) => meeting.circuit_key)
        .map((meeting) => ({
          circuit_id: `openf1-${meeting.circuit_key}`,
          name: meeting.circuit_short_name || meeting.circuit_name,
          city: meeting.location,
          country: meeting.country_name,
          length_km: null,
          first_grand_prix: null,
          track_map_url: meeting.circuit_image || null,
        }));
      const uniqueRaces = dedupeBy(races, "race_id");
      const uniqueCircuits = dedupeBy(circuits, "circuit_id");
      setApiData(uniqueRaces);
      setApiCircuits(uniqueCircuits);
      setApiSource("openf1");
      setStatus(`Loaded ${uniqueRaces.length} races from OpenF1.`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const setErgastState = (key, patch) => {
    setErgastImportState((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...patch },
    }));
  };

  const validateSeason = (value) => {
    const year = Number(value);
    const currentYear = new Date().getFullYear();
    if (!year || Number.isNaN(year)) return "Season must be a number.";
    if (year < 1950 || year > currentYear) {
      return `Season must be between 1950 and ${currentYear}.`;
    }
    return null;
  };

  const validateRound = (value) => {
    const round = Number(value);
    if (!round || Number.isNaN(round)) return "Round must be a number.";
    if (round <= 0) return "Round must be greater than 0.";
    return null;
  };

  const handleErgastError = (error, key) => {
    if (error?.message === "API timeout") {
      setErgastState(key, { error: "API unreachable (timeout)." });
      return;
    }
    if (error?.message === "API request failed") {
      setErgastState(key, { error: "API unreachable." });
      return;
    }
    if (error?.message === "No data returned") {
      setErgastState(key, { error: "No data returned." });
      return;
    }
    if (error?.message === "Invalid API response") {
      setErgastState(key, { error: "Invalid API response." });
      return;
    }
    if (
      error?.message?.toLowerCase().includes("network") ||
      error?.message?.toLowerCase().includes("failed to fetch")
    ) {
      setErgastState(key, { error: "Network error." });
      return;
    }
    if (error?.message?.toLowerCase().includes("supabase")) {
      setErgastState(key, { error: "Supabase insert error." });
      return;
    }
    setErgastState(key, { error: "API unreachable." });
  };

  const importDrivers = async () => {
    const key = "drivers";
    if (!hasSupabase()) return;
    setErgastState(key, {
      loading: true,
      error: "",
      log: ["Importing drivers..."],
      status: "",
    });
    try {
      const drivers = await getDrivers();
      setErgastState(key, {
        log: ["Importing drivers...", `Processing ${drivers.length} drivers...`],
      });
      const mapped = mapErgastDrivers(drivers);
      const { error } = await supabase.from("drivers").upsert(mapped, {
        onConflict: "driver_id",
      });
      if (error) throw new Error(`Supabase insert error: ${error.message}`);
      setErgastState(key, {
        status: "Imported successfully.",
        log: [
          "Importing drivers...",
          `Processing ${drivers.length} drivers...`,
          "Saving to database...",
          "Import completed.",
        ],
      });
    } catch (error) {
      handleErgastError(error, key);
    } finally {
      setErgastState(key, { loading: false });
    }
  };

  const importConstructors = async () => {
    const key = "constructors";
    if (!hasSupabase()) return;
    setErgastState(key, {
      loading: true,
      error: "",
      log: ["Importing constructors..."],
      status: "",
    });
    try {
      const constructors = await getConstructors();
      setErgastState(key, {
        log: [
          "Importing constructors...",
          `Processing ${constructors.length} constructors...`,
        ],
      });
      const mapped = mapErgastConstructors(constructors);
      const { error } = await supabase.from("constructors").upsert(mapped, {
        onConflict: "constructor_id",
      });
      if (error) throw new Error(`Supabase insert error: ${error.message}`);
      setErgastState(key, {
        status: "Imported successfully.",
        log: [
          "Importing constructors...",
          `Processing ${constructors.length} constructors...`,
          "Saving to database...",
          "Import completed.",
        ],
      });
    } catch (error) {
      handleErgastError(error, key);
    } finally {
      setErgastState(key, { loading: false });
    }
  };

  const importCircuits = async () => {
    const key = "circuits";
    if (!hasSupabase()) return;
    setErgastState(key, {
      loading: true,
      error: "",
      log: ["Importing circuits..."],
      status: "",
    });
    try {
      const circuits = await getCircuits();
      setErgastState(key, {
        log: [
          "Importing circuits...",
          `Processing ${circuits.length} circuits...`,
        ],
      });
      const mapped = mapErgastCircuits(circuits);
      const { error } = await supabase.from("circuits").upsert(mapped, {
        onConflict: "circuit_id",
      });
      if (error) throw new Error(`Supabase insert error: ${error.message}`);
      setErgastState(key, {
        status: "Imported successfully.",
        log: [
          "Importing circuits...",
          `Processing ${circuits.length} circuits...`,
          "Saving to database...",
          "Import completed.",
        ],
      });
    } catch (error) {
      handleErgastError(error, key);
    } finally {
      setErgastState(key, { loading: false });
    }
  };

  const importSeasons = async () => {
    const key = "seasons";
    if (!hasSupabase()) return;
    setErgastState(key, {
      loading: true,
      error: "",
      log: ["Importing seasons..."],
      status: "",
    });
    try {
      const seasons = await getSeasons();
      setErgastState(key, {
        log: ["Importing seasons...", `Processing ${seasons.length} seasons...`],
      });
      const mapped = mapErgastSeasons(seasons);
      const { error } = await supabase.from("seasons").upsert(mapped, {
        onConflict: "season_id",
      });
      if (error) throw new Error(`Supabase insert error: ${error.message}`);
      setErgastState(key, {
        status: "Imported successfully.",
        log: [
          "Importing seasons...",
          `Processing ${seasons.length} seasons...`,
          "Saving to database...",
          "Import completed.",
        ],
      });
    } catch (error) {
      handleErgastError(error, key);
    } finally {
      setErgastState(key, { loading: false });
    }
  };

  const importSeasonRaces = async () => {
    const key = "season_races";
    if (!hasSupabase()) return;
    const seasonError = validateSeason(ergastSeason);
    if (seasonError) {
      setErgastState(key, { error: seasonError });
      return;
    }
    setErgastState(key, {
      loading: true,
      error: "",
      log: [`Importing races for ${ergastSeason}...`],
      status: "",
    });
    try {
      const ergastRaces = await getSeasonRaces(ergastSeason);
      const races = mapErgastRaces(ergastRaces);
      setErgastState(key, {
        log: [
          `Importing races for ${ergastSeason}...`,
          `Processing ${races.length} races...`,
        ],
      });
      const circuitRows = mapErgastRaceCircuits(ergastRaces);
      if (circuitRows.length) {
        const { error } = await supabase.from("circuits").upsert(circuitRows, {
          onConflict: "circuit_id",
        });
        if (error) throw new Error(`Supabase insert error: ${error.message}`);
      }
      const { error } = await supabase.from("races").upsert(races, {
        onConflict: "race_id",
      });
      if (error) throw new Error(`Supabase insert error: ${error.message}`);
      setErgastState(key, {
        status: "Imported successfully.",
        log: [
          `Importing races for ${ergastSeason}...`,
          `Processing ${races.length} races...`,
          "Saving to database...",
          "Import completed.",
        ],
      });
    } catch (error) {
      handleErgastError(error, key);
    } finally {
      setErgastState(key, { loading: false });
    }
  };

  const importRaceResults = async () => {
    const key = "race_results";
    if (!hasSupabase()) return;
    const seasonError = validateSeason(ergastSeason);
    const roundError = validateRound(ergastRound);
    if (seasonError || roundError) {
      setErgastState(key, { error: seasonError || roundError });
      return;
    }
    setErgastState(key, {
      loading: true,
      error: "",
      log: [
        `Importing results for ${ergastSeason} round ${ergastRound}...`,
      ],
      status: "",
    });
    try {
      const [ergastRaces, ergastResults] = await Promise.all([
        getSeasonRaces(ergastSeason),
        getRaceResults(ergastSeason, ergastRound),
      ]);
      const raceId = `${ergastSeason}-${ergastRound}`;
      const races = mapErgastRaces(ergastRaces).filter(
        (race) => race.race_id === raceId
      );
      const results = mapErgastResults(
        ergastResults,
        ergastSeason,
        ergastRound
      );
      setErgastState(key, {
        log: [
          `Importing results for ${ergastSeason} round ${ergastRound}...`,
          `Processing ${results.length} results...`,
        ],
      });
      if (races.length) {
        const circuitRows = mapErgastRaceCircuits(ergastRaces);
        if (circuitRows.length) {
          const { error } = await supabase
            .from("circuits")
            .upsert(circuitRows, { onConflict: "circuit_id" });
          if (error) throw new Error(`Supabase insert error: ${error.message}`);
        }
        const { error } = await supabase.from("races").upsert(races, {
          onConflict: "race_id",
        });
        if (error) throw new Error(`Supabase insert error: ${error.message}`);
      }
      const { error } = await supabase.from("results").upsert(results, {
        onConflict: "result_id",
      });
      if (error) throw new Error(`Supabase insert error: ${error.message}`);
      setErgastState(key, {
        status: "Imported successfully.",
        log: [
          `Importing results for ${ergastSeason} round ${ergastRound}...`,
          `Processing ${results.length} results...`,
          "Saving to database...",
          "Import completed.",
        ],
      });
    } catch (error) {
      handleErgastError(error, key);
    } finally {
      setErgastState(key, { loading: false });
    }
  };

  const importDriverStandings = async () => {
    const key = "driver_standings";
    if (!hasSupabase()) return;
    const seasonError = validateSeason(ergastSeason);
    if (seasonError) {
      setErgastState(key, { error: seasonError });
      return;
    }
    setErgastState(key, {
      loading: true,
      error: "",
      log: [`Importing driver standings for ${ergastSeason}...`],
      status: "",
    });
    try {
      const standings = await getDriverStandings(ergastSeason);
      setErgastState(key, {
        log: [
          `Importing driver standings for ${ergastSeason}...`,
          `Processing ${standings.length} standings...`,
        ],
      });
      const mapped = mapErgastDriverStandings(standings, ergastSeason);
      const { error } = await supabase
        .from("driver_standings")
        .upsert(mapped, { onConflict: "id" });
      if (error) throw new Error(`Supabase insert error: ${error.message}`);
      setErgastState(key, {
        status: "Imported successfully.",
        log: [
          `Importing driver standings for ${ergastSeason}...`,
          `Processing ${standings.length} standings...`,
          "Saving to database...",
          "Import completed.",
        ],
      });
    } catch (error) {
      handleErgastError(error, key);
    } finally {
      setErgastState(key, { loading: false });
    }
  };

  const importConstructorStandings = async () => {
    const key = "constructor_standings";
    if (!hasSupabase()) return;
    const seasonError = validateSeason(ergastSeason);
    if (seasonError) {
      setErgastState(key, { error: seasonError });
      return;
    }
    setErgastState(key, {
      loading: true,
      error: "",
      log: [`Importing constructor standings for ${ergastSeason}...`],
      status: "",
    });
    try {
      const standings = await getConstructorStandings(ergastSeason);
      setErgastState(key, {
        log: [
          `Importing constructor standings for ${ergastSeason}...`,
          `Processing ${standings.length} standings...`,
        ],
      });
      const mapped = mapErgastConstructorStandings(standings, ergastSeason);
      const { error } = await supabase
        .from("constructor_standings")
        .upsert(mapped, { onConflict: "id" });
      if (error) throw new Error(`Supabase insert error: ${error.message}`);
      setErgastState(key, {
        status: "Imported successfully.",
        log: [
          `Importing constructor standings for ${ergastSeason}...`,
          `Processing ${standings.length} standings...`,
          "Saving to database...",
          "Import completed.",
        ],
      });
    } catch (error) {
      handleErgastError(error, key);
    } finally {
      setErgastState(key, { loading: false });
    }
  };

  const importPitStops = async () => {
    const key = "pit_stops";
    if (!hasSupabase()) return;
    const seasonError = validateSeason(ergastSeason);
    const roundError = validateRound(ergastRound);
    if (seasonError || roundError) {
      setErgastState(key, { error: seasonError || roundError });
      return;
    }
    setErgastState(key, {
      loading: true,
      error: "",
      log: [
        `Importing pit stops for ${ergastSeason} round ${ergastRound}...`,
      ],
      status: "",
    });
    try {
      const stops = await getPitStops(ergastSeason, ergastRound);
      setErgastState(key, {
        log: [
          `Importing pit stops for ${ergastSeason} round ${ergastRound}...`,
          `Processing ${stops.length} pit stops...`,
        ],
      });
      const mapped = mapErgastPitStops(stops, ergastSeason, ergastRound);
      const { error } = await supabase.from("pit_stops").upsert(mapped, {
        onConflict: "id",
      });
      if (error) throw new Error(`Supabase insert error: ${error.message}`);
      setErgastState(key, {
        status: "Imported successfully.",
        log: [
          `Importing pit stops for ${ergastSeason} round ${ergastRound}...`,
          `Processing ${stops.length} pit stops...`,
          "Saving to database...",
          "Import completed.",
        ],
      });
    } catch (error) {
      handleErgastError(error, key);
    } finally {
      setErgastState(key, { loading: false });
    }
  };

  const chunkArray = (items, size) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  };

  const fetchExistingIds = async (table, idKey, ids) => {
    const existing = new Set();
    const chunks = chunkArray(ids, 200);
    for (const chunk of chunks) {
      const { data, error } = await supabase
        .from(table)
        .select(idKey)
        .in(idKey, chunk);
      if (error) throw error;
      (data || []).forEach((row) => existing.add(row[idKey]));
    }
    return existing;
  };

  const insertNewRows = async (table, idKey, rows) => {
    if (!rows.length) return { inserted: 0, skipped: 0 };
    const ids = rows.map((row) => row[idKey]).filter(Boolean);
    const existing = await fetchExistingIds(table, idKey, ids);
    const freshRows = rows.filter(
      (row) => row[idKey] && !existing.has(row[idKey])
    );
    const skipped = rows.length - freshRows.length;
    if (!freshRows.length) return { inserted: 0, skipped };
    const chunks = chunkArray(freshRows, 500);
    let inserted = 0;
    for (const chunk of chunks) {
      const { error } = await supabase.from(table).insert(chunk);
      if (error) throw error;
      inserted += chunk.length;
    }
    return { inserted, skipped };
  };

  const handleSeasonImport = async () => {
    if (!hasSupabase()) return;
    const seasonYear = Number(seasonImportYear);
    const seasonError = validateSeason(seasonYear);
    if (seasonError) {
      setStatus(seasonError);
      return;
    }
    seasonImportAbortRef.current = false;
    setSeasonImportStats({});
    setSeasonImportLoading(true);
    setSeasonImportProgress({ label: "Fetching races", percent: 5 });
    try {
      const checkCancelled = () => {
        if (seasonImportAbortRef.current) {
          throw new Error("cancelled");
        }
      };
      const updateStats = (key, inserted, skipped) => {
        setSeasonImportStats((prev) => ({
          ...prev,
          [key]: {
            inserted: (prev[key]?.inserted || 0) + inserted,
            skipped: (prev[key]?.skipped || 0) + skipped,
          },
        }));
      };
      const fetchJsonWithTimeout = async (url) => {
        console.log("Season import endpoint:", url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) {
            throw new Error("API request failed");
          }
          const data = await res.json();
          return data;
        } catch (error) {
          if (error.name === "AbortError") {
            throw new Error("API unreachable");
          }
          if (error.message === "API request failed") {
            throw new Error("API unreachable");
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }
      };

      const fetchSeasonSchedule = async () => {
        const url = `https://ergast.com/api/f1/${seasonYear}.json?limit=1000`;
        const data = await fetchJsonWithTimeout(url);
        const races = data?.MRData?.RaceTable?.Races || [];
        console.log("Season import race count:", races.length);
        if (!races.length) {
          throw new Error("Season not available");
        }
        return races;
      };

      const fetchOpenF1Schedule = async () => {
        const { sessions, meetings } = await fetchOpenF1RaceWeekends(seasonYear);
        const meetingMap = new Map(
          meetings.map((meeting) => [meeting.meeting_key, meeting])
        );
        const raceSessions = sessions.filter(
          (session) =>
            session.session_name === "Race" || session.session_type === "Race"
        );
        const ordered = [...raceSessions].sort((a, b) => {
          const aTime = new Date(a.date_start || a.date_end || 0).getTime();
          const bTime = new Date(b.date_start || b.date_end || 0).getTime();
          return aTime - bTime;
        });
        const races = ordered.map((session, index) => {
          const meeting = meetingMap.get(session.meeting_key);
          const circuitKey = meeting?.circuit_key ?? session.circuit_key;
          return {
            race_id: `${seasonYear}-${index + 1}`,
            season_year: seasonYear,
            round: index + 1,
            race_name:
              meeting?.meeting_name ||
              `${meeting?.country_name || session.country_name || "Grand Prix"}`,
            circuit_id: circuitKey ? `openf1-${circuitKey}` : null,
            date: session.date_start ? session.date_start.split("T")[0] : null,
            laps: null,
            banner_url: null,
          };
        });
        const circuits = meetings
          .filter((meeting) => meeting.circuit_key)
          .map((meeting) => ({
            circuit_id: `openf1-${meeting.circuit_key}`,
            name: meeting.circuit_short_name || meeting.circuit_name,
            city: meeting.location,
            country: meeting.country_name,
            length_km: null,
            first_grand_prix: null,
            track_map_url: meeting.circuit_image || null,
          }));
        console.log("OpenF1 fallback race count:", races.length);
        return { races, circuits };
      };

      let ergastRaces = [];
      let fallbackCircuits = [];
      try {
        ergastRaces = await fetchSeasonSchedule();
      } catch (error) {
        if (error.message === "API unreachable") {
          console.log("Ergast unreachable, falling back to OpenF1");
          const fallback = await fetchOpenF1Schedule();
          ergastRaces = fallback.races.map((race) => ({
            season: String(seasonYear),
            round: String(race.round),
            raceName: race.race_name,
            date: race.date,
            Circuit: { circuitId: race.circuit_id },
          }));
          fallbackCircuits = fallback.circuits;
        } else {
          throw error;
        }
      }

      checkCancelled();
      console.log("Import progress: importing races");
      const races = mapErgastRaces(ergastRaces).map((race) => ({
        race_id: race.race_id,
        season_year: race.season_year,
        round: race.round,
        race_name: race.race_name,
        circuit_id: race.circuit_id,
        date: race.date,
      }));
      const raceInsert = await insertNewRows("races", "race_id", races);
      updateStats("races", raceInsert.inserted, raceInsert.skipped);

      setSeasonImportProgress({ label: "Importing circuits", percent: 15 });
      console.log("Import progress: importing circuits");
      let allCircuits = [];
      if (fallbackCircuits.length) {
        allCircuits = fallbackCircuits;
      } else {
        const circuitsUrl = "https://ergast.com/api/f1/circuits.json?limit=1000";
        const circuitsData = await fetchJsonWithTimeout(circuitsUrl);
        const circuits = circuitsData?.MRData?.CircuitTable?.Circuits || [];
        if (!circuits.length) {
          throw new Error("No race data returned");
        }
        allCircuits = mapErgastCircuits(circuits);
      }
      checkCancelled();
      const circuitInsert = await insertNewRows(
        "circuits",
        "circuit_id",
        allCircuits
      );
      updateStats("circuits", circuitInsert.inserted, circuitInsert.skipped);

      setSeasonImportProgress({ label: "Importing drivers", percent: 25 });
      console.log("Import progress: importing drivers");
      const driversUrl = "https://ergast.com/api/f1/drivers.json?limit=1000";
      const driversData = await fetchJsonWithTimeout(driversUrl);
      const drivers = driversData?.MRData?.DriverTable?.Drivers || [];
      if (!drivers.length) {
        throw new Error("No race data returned");
      }
      const allDrivers = mapErgastDrivers(drivers);
      checkCancelled();
      const driverInsert = await insertNewRows(
        "drivers",
        "driver_id",
        allDrivers
      );
      updateStats("drivers", driverInsert.inserted, driverInsert.skipped);

      setSeasonImportProgress({ label: "Importing constructors", percent: 35 });
      console.log("Import progress: importing constructors");
      const constructorsUrl =
        "https://ergast.com/api/f1/constructors.json?limit=1000";
      const constructorsData = await fetchJsonWithTimeout(constructorsUrl);
      const constructors =
        constructorsData?.MRData?.ConstructorTable?.Constructors || [];
      if (!constructors.length) {
        throw new Error("No race data returned");
      }
      const allConstructors = mapErgastConstructors(constructors);
      checkCancelled();
      const constructorInsert = await insertNewRows(
        "constructors",
        "constructor_id",
        allConstructors
      );
      updateStats(
        "constructors",
        constructorInsert.inserted,
        constructorInsert.skipped
      );

      const rounds = races.map((race) => race.round).filter(Boolean);
      if (!rounds.length) {
        setSeasonImportProgress({
          label: "Importing results",
          percent: 80,
        });
      } else {
        for (let i = 0; i < rounds.length; i += 1) {
          const round = rounds[i];
          const percent =
            35 + Math.round(((i + 1) / rounds.length) * 45);
          setSeasonImportProgress({
            label: `Importing results (Round ${round})`,
            percent,
          });
          console.log(`Import progress: importing results round ${round}`);
          const resultsUrl = `https://ergast.com/api/f1/${seasonYear}/${round}/results.json?limit=1000`;
          const resultsData = await fetchJsonWithTimeout(resultsUrl);
          const ergastResults =
            resultsData?.MRData?.RaceTable?.Races?.[0]?.Results || [];
          if (!ergastResults.length) {
            throw new Error("No race data returned");
          }
          checkCancelled();
          const results = mapErgastResults(ergastResults, seasonYear, round);
          const resultsInsert = await insertNewRows(
            "results",
            "result_id",
            results
          );
          updateStats(
            "results",
            resultsInsert.inserted,
            resultsInsert.skipped
          );

          const fastestLapResult = ergastResults.find(
            (result) => result?.FastestLap?.rank === "1"
          );
          if (fastestLapResult) {
            const fastestRow = mapErgastFastestLap(
              fastestLapResult,
              seasonYear,
              round
            );
            if (fastestRow) {
              const fastestInsert = await insertNewRows(
                "fastest_laps",
                "id",
                [fastestRow]
              );
              updateStats(
                "fastest_laps",
                fastestInsert.inserted,
                fastestInsert.skipped
              );
            }
          }

          if (includeQualifying) {
            const qualifyingUrl = `https://ergast.com/api/f1/${seasonYear}/${round}/qualifying.json?limit=1000`;
            const qualifyingData = await fetchJsonWithTimeout(qualifyingUrl);
            const qualifying =
              qualifyingData?.MRData?.RaceTable?.Races?.[0]
                ?.QualifyingResults || [];
            if (!qualifying.length) {
              throw new Error("No race data returned");
            }
            checkCancelled();
            const qualifyingRows = mapErgastQualifyingResults(
              qualifying,
              seasonYear,
              round
            );
            const qualifyingInsert = await insertNewRows(
              "qualifying_results",
              "id",
              qualifyingRows
            );
            updateStats(
              "qualifying_results",
              qualifyingInsert.inserted,
              qualifyingInsert.skipped
            );
          }

          if (includePitStops && seasonYear >= 2012) {
            const pitStopsUrl = `https://ergast.com/api/f1/${seasonYear}/${round}/pitstops.json?limit=1000`;
            const pitStopsData = await fetchJsonWithTimeout(pitStopsUrl);
            const stops =
              pitStopsData?.MRData?.RaceTable?.Races?.[0]?.PitStops || [];
            if (!stops.length) {
              throw new Error("No race data returned");
            }
            checkCancelled();
            const stopRows = mapErgastPitStops(stops, seasonYear, round);
            const pitInsert = await insertNewRows("pit_stops", "id", stopRows);
            updateStats("pit_stops", pitInsert.inserted, pitInsert.skipped);
          }
        }
      }

      setSeasonImportProgress({ label: "Importing standings", percent: 90 });
      console.log("Import progress: importing standings");
      const driverStandingsUrl = `https://ergast.com/api/f1/${seasonYear}/driverStandings.json?limit=1000`;
      const driverStandingsData =
        await fetchJsonWithTimeout(driverStandingsUrl);
      const driverStandings =
        driverStandingsData?.MRData?.StandingsTable?.StandingsLists?.[0]
          ?.DriverStandings || [];
      if (!driverStandings.length) {
        throw new Error("No race data returned");
      }
      checkCancelled();
      const driverRows = mapErgastDriverStandings(
        driverStandings,
        seasonYear
      );
      const driverStandingsInsert = await insertNewRows(
        "driver_standings",
        "id",
        driverRows
      );
      updateStats(
        "driver_standings",
        driverStandingsInsert.inserted,
        driverStandingsInsert.skipped
      );

      const constructorStandingsUrl = `https://ergast.com/api/f1/${seasonYear}/constructorStandings.json?limit=1000`;
      const constructorStandingsData = await fetchJsonWithTimeout(
        constructorStandingsUrl
      );
      const constructorStandings =
        constructorStandingsData?.MRData?.StandingsTable?.StandingsLists?.[0]
          ?.ConstructorStandings || [];
      if (!constructorStandings.length) {
        throw new Error("No race data returned");
      }
      checkCancelled();
      const constructorRows = mapErgastConstructorStandings(
        constructorStandings,
        seasonYear
      );
      const constructorStandingsInsert = await insertNewRows(
        "constructor_standings",
        "id",
        constructorRows
      );
      updateStats(
        "constructor_standings",
        constructorStandingsInsert.inserted,
        constructorStandingsInsert.skipped
      );

      setSeasonImportProgress({ label: "Complete", percent: 100 });
      setStatus(`Season ${seasonYear} imported successfully.`);
    } catch (error) {
      if (error?.message === "cancelled") {
        setStatus("Season import cancelled.");
        setSeasonImportProgress((prev) => ({
          ...prev,
          label: "Cancelled",
        }));
      } else if (error?.message === "Season not available") {
        setStatus("Season not available.");
      } else if (error?.message === "No race data returned") {
        setStatus("No race data returned.");
      } else if (error?.message === "API unreachable") {
        setStatus("API unreachable.");
      } else {
        setStatus("Failed to fetch season data from Ergast.");
      }
    } finally {
      setSeasonImportLoading(false);
      seasonImportAbortRef.current = false;
    }
  };

  const handleMediaUpdate = async () => {
    if (!hasSupabase()) return;
    if (!mediaForm.id || !mediaForm.url) {
      setStatus("Provide record id and URL.");
      return;
    }
    const { error } = await supabase
      .from(mediaForm.table)
      .update({ [mediaForm.column]: mediaForm.url })
      .eq(
        mediaForm.table === "drivers"
          ? "driver_id"
          : mediaForm.table === "constructors"
            ? "constructor_id"
            : mediaForm.table === "circuits"
              ? "circuit_id"
              : "race_id",
        mediaForm.id
      );
    if (error) setStatus(error.message);
    else setStatus("Media URL updated.");
  };

  const resetTableState = () => {
    setTablePage(1);
    setTableSearch("");
    setSelectedRows(new Set());
  };

  useEffect(() => {
    resetTableState();
  }, [activeSection, standingsType]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const loadOptions = async () => {
      const [driversRes, constructorsRes] = await Promise.all([
        supabase
          .from("drivers")
          .select("driver_id, first_name, last_name")
          .order("last_name", { ascending: true }),
        supabase
          .from("constructors")
          .select("constructor_id, name")
          .order("name", { ascending: true }),
      ]);
      if (!driversRes.error) {
        setDriverOptions(
          (driversRes.data || []).map((driver) => ({
            value: driver.driver_id,
            label: `${driver.first_name} ${driver.last_name}`,
          }))
        );
      }
      if (!constructorsRes.error) {
        setConstructorOptions(
          (constructorsRes.data || []).map((team) => ({
            value: team.constructor_id,
            label: team.name,
          }))
        );
      }
    };
    loadOptions();
  }, []);

  const fetchTableData = async () => {
    if (!hasSupabase()) return;
    if (!activeTable) return;
    const config = tableConfigs[activeTable];
    if (!config) return;
    setTableLoading(true);
    let query = supabase.from(config.table).select("*", { count: "exact" });
    if (tableSearch.trim().length > 0 && config.search?.length) {
      const term = tableSearch.trim();
      const filters = config.search
        .map((col) => `${col}.ilike.%${term}%`)
        .join(",");
      query = query.or(filters);
    }
    if (tableSort.column) {
      query = query.order(tableSort.column, {
        ascending: tableSort.direction === "asc",
      });
    }
    const from = (tablePage - 1) * 10;
    const to = from + 9;
    const { data, error, count } = await query.range(from, to);
    setTableLoading(false);
    if (error) {
      setStatus(error.message);
      setTableRows([]);
      setTableCount(0);
      return;
    }
    const rows = (data || []).map((row) => ({
      ...row,
      __id: row[config.id],
    }));
    setTableRows(rows);
    setTableCount(count || 0);
  };

  useEffect(() => {
    fetchTableData();
  }, [activeTable, tablePage, tableSearch, tableSort]);

  const handleSort = (column) => {
    setTableSort((prev) => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { column, direction: "asc" };
    });
  };

  const getModalFields = (overrideTable) => {
    const tableKey = overrideTable || activeTable;
    if (!tableKey) return [];
    const config = tableConfigs[tableKey];
    if (!config) return [];
    if (tableKey !== "driver_constructor_contracts") {
      return config.fields;
    }
    return config.fields.map((field) => {
      if (field.key === "driver_id") {
        return { ...field, options: driverOptions };
      }
      if (field.key === "constructor_id") {
        return { ...field, options: constructorOptions };
      }
      return field;
    });
  };

  const buildModalValues = (row = {}) => {
    if (!activeTable) return {};
    const config = tableConfigs[activeTable];
    if (!config) return {};
    const values = {};
    config.fields.forEach((field) => {
      values[field.key] = row[field.key] ?? "";
    });
    return values;
  };

  const handleEdit = (row) => {
    setModalMode("edit");
    setModalValues(buildModalValues(row));
    setModalOpen(true);
  };

  const handleCreate = () => {
    setModalMode("create");
    setModalValues(buildModalValues());
    setModalOpen(true);
  };

  const handleModalChange = (key, value) => {
    setModalValues((prev) => ({ ...prev, [key]: value }));
  };

  const normalizeValues = (fields, values) => {
    const normalized = {};
    fields.forEach((field) => {
      const raw = values[field.key];
      if (raw === "" || raw === undefined) {
        normalized[field.key] = null;
        return;
      }
      if (field.type === "number") {
        const num = Number(raw);
        normalized[field.key] = Number.isNaN(num) ? null : num;
        return;
      }
      normalized[field.key] = raw;
    });
    return normalized;
  };

  const handleAssignmentChange = (key, value) => {
    setAssignmentValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleModalSave = async () => {
    if (!activeTable) return;
    const config = tableConfigs[activeTable];
    if (!config) return;
    const normalized = normalizeValues(config.fields, modalValues);
    const missing = (config.required || []).filter(
      (field) => !normalized[field]
    );
    if (missing.length) {
      setStatus(`Missing required fields: ${missing.join(", ")}`);
      return;
    }
    setSaving(true);
    let result;
    if (modalMode === "create") {
      result = await supabase.from(config.table).insert(normalized);
    } else {
      result = await supabase
        .from(config.table)
        .update(normalized)
        .eq(config.id, normalized[config.id]);
    }
    setSaving(false);
    if (result.error) {
      setStatus(result.error.message);
      return;
    }
    setModalOpen(false);
    setStatus(modalMode === "create" ? "Record created." : "Record updated.");
    fetchTableData();
  };

  const handleAssignmentSave = async () => {
    if (!hasSupabase()) return;
    const config = tableConfigs.driver_constructor_contracts;
    const values = normalizeValues(config.fields, assignmentValues);
    if (!values.id) {
      if (values.driver_id && values.constructor_id && values.season_year) {
        values.id = `${values.driver_id}-${values.constructor_id}-${values.season_year}`;
      }
    }
    const missing = (config.required || []).filter((field) => !values[field]);
    if (missing.length) {
      setStatus(`Missing required fields: ${missing.join(", ")}`);
      return;
    }
    setAssignmentSaving(true);
    const { error } = await supabase
      .from(config.table)
      .upsert(values, { onConflict: "id" });
    setAssignmentSaving(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setAssignmentModalOpen(false);
    setStatus("Driver assignment saved.");
    if (activeTable === "driver_constructor_contracts") fetchTableData();
  };

  const handleDelete = async (row) => {
    if (!activeTable) return;
    const config = tableConfigs[activeTable];
    if (!config) return;
    const ok = window.confirm("Are you sure you want to delete this record?");
    if (!ok) return;
    const { error } = await supabase
      .from(config.table)
      .delete()
      .eq(config.id, row[config.id]);
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("Record deleted.");
    fetchTableData();
  };

  const handleToggleRow = (id) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = (checked) => {
    if (!checked) {
      setSelectedRows(new Set());
      return;
    }
    setSelectedRows(new Set(tableRows.map((row) => row.__id)));
  };

  const handleBulkDelete = async () => {
    if (!activeTable) return;
    const config = tableConfigs[activeTable];
    if (!config) return;
    if (!selectedRows.size) return;
    const ok = window.confirm(
      "Are you sure you want to delete selected records?"
    );
    if (!ok) return;
    const { error } = await supabase
      .from(config.table)
      .delete()
      .in(config.id, Array.from(selectedRows));
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("Selected records deleted.");
    setSelectedRows(new Set());
    fetchTableData();
  };

  const handleExportSelected = () => {
    if (!selectedRows.size) return;
    const data = tableRows.filter((row) => selectedRows.has(row.__id));
    const keys = Object.keys(data[0] || {}).filter((key) => key !== "__id");
    const csv = [
      keys,
      ...data.map((row) => keys.map((key) => JSON.stringify(row[key] ?? ""))),
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeTable}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const getMediaSearchConfig = (table) => {
    if (table === "drivers") {
      return {
        id: "driver_id",
        select: "driver_id, first_name, last_name, nationality",
        filter: (term) =>
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%`,
        format: (row) =>
          `${row.first_name} ${row.last_name} - ${row.nationality || "-"}`,
      };
    }
    if (table === "constructors") {
      return {
        id: "constructor_id",
        select: "constructor_id, name, nationality",
        filter: (term) => `name.ilike.%${term}%`,
        format: (row) => `${row.name} - ${row.nationality || "-"}`,
      };
    }
    if (table === "circuits") {
      return {
        id: "circuit_id",
        select: "circuit_id, name, country",
        filter: (term) => `name.ilike.%${term}%`,
        format: (row) => `${row.name} - ${row.country || "-"}`,
      };
    }
    return {
      id: "race_id",
      select: "race_id, race_name, season_year",
      filter: (term) => `race_name.ilike.%${term}%`,
      format: (row) => `${row.race_name} - ${row.season_year || "-"}`,
    };
  };

  const handleMediaSearch = async () => {
    if (!hasSupabase()) return;
    if (mediaSearch.trim().length < 2) {
      setStatus("Enter at least 2 characters to search.");
      return;
    }
    const config = getMediaSearchConfig(mediaForm.table);
    setMediaLoading(true);
    const { data, error } = await supabase
      .from(mediaForm.table)
      .select(config.select)
      .or(config.filter(mediaSearch.trim()))
      .limit(10);
    setMediaLoading(false);
    if (error) {
      setStatus(error.message);
      setMediaResults([]);
      return;
    }
    setMediaResults(data || []);
  };

  if (!hasSupabase()) {
    return (
      <div className="glass-panel rounded-3xl p-6 text-white/70">
        Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to access the
        admin panel.
      </div>
    );
  }

  const renderTableSection = (tableKey) => {
    const config = tableConfigs[tableKey];
    if (!config) return null;
    const columns =
      tableKey === "driver_constructor_contracts"
        ? config.columns.map((col) => {
            if (col.key === "driver_id") {
              return {
                ...col,
                render: (row) =>
                  driverNameMap.get(row.driver_id) || row.driver_id,
              };
            }
            if (col.key === "constructor_id") {
              return {
                ...col,
                render: (row) =>
                  constructorNameMap.get(row.constructor_id) ||
                  row.constructor_id,
              };
            }
            return col;
          })
        : config.columns;
    const totalPages = Math.max(1, Math.ceil(tableCount / 10));
    return (
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-f1bold text-xl uppercase tracking-[0.2em]">
              {tableKey.replace("_", " ")}
            </h2>
            <p className="text-xs text-white/60">
              Manage records with search, sorting, and inline actions.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="rounded-full bg-f1red px-4 py-2 text-xs uppercase tracking-[0.2em]"
          >
            Create New
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={tableSearch}
            onChange={(event) => setTableSearch(event.target.value)}
            placeholder="Search..."
            className="w-full max-w-xs rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-sm text-white"
          />
          <button
            onClick={() => setTablePage(1)}
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
          >
            Apply
          </button>
          <button
            onClick={handleBulkDelete}
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
          >
            Delete Selected
          </button>
          <button
            onClick={handleExportSelected}
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
          >
            Export Selected
          </button>
        </div>
        <div className="mt-4">
          {tableLoading ? (
            <div className="text-sm text-white/60">Loading...</div>
          ) : (
            <AdminTable
              columns={columns}
              rows={tableRows}
              sort={tableSort}
              onSort={handleSort}
              onEdit={handleEdit}
              onDelete={handleDelete}
              extraActions={
                tableKey === "drivers"
                  ? [
                      {
                        label: "Assign",
                        onClick: (row) => {
                          setAssignmentValues({
                            id: "",
                            driver_id: row.driver_id,
                            constructor_id: "",
                            season_year: new Date().getFullYear(),
                            driver_number: row.number || "",
                            start_round: "",
                            end_round: "",
                          });
                          setAssignmentModalOpen(true);
                        },
                      },
                    ]
                  : tableKey === "constructors"
                    ? [
                        {
                          label: "Assign",
                          onClick: (row) => {
                            setAssignmentValues({
                              id: "",
                              driver_id: "",
                              constructor_id: row.constructor_id,
                              season_year: new Date().getFullYear(),
                              driver_number: "",
                              start_round: "",
                              end_round: "",
                            });
                            setAssignmentModalOpen(true);
                          },
                        },
                      ]
                    : []
              }
              selected={selectedRows}
              onToggleRow={handleToggleRow}
              onToggleAll={handleToggleAll}
            />
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-white/60">
          <div>
            Page {tablePage} of {totalPages} - {tableCount} records
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTablePage(Math.max(1, tablePage - 1))}
              className="rounded-full border border-white/20 px-3 py-1"
            >
              Prev
            </button>
            <button
              onClick={() => setTablePage(Math.min(totalPages, tablePage + 1))}
              className="rounded-full border border-white/20 px-3 py-1"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    );
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-f1wide text-3xl uppercase tracking-[0.14em]">
            Admin Dashboard
          </h1>
          <p className="text-sm text-white/60">
            Secure management of Formula One archive data.
          </p>
        </div>
        {isAuthed && (
          <button
            onClick={handleLogout}
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
          >
            Logout
          </button>
        )}
      </div>

      {!isAuthed && (
        <form
          onSubmit={handleLogin}
          className="glass-panel rounded-3xl p-6 md:max-w-lg"
        >
          <h2 className="font-f1bold text-xl">Admin Login</h2>
          <div className="mt-4 grid gap-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-sm text-white"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-sm text-white"
            />
            <button
              type="submit"
              className="rounded-full bg-f1red px-4 py-2 text-xs uppercase tracking-[0.2em]"
            >
              Login
            </button>
          </div>
        </form>
      )}

      {isAuthed && (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <AdminSidebar
            sections={adminSections}
            active={activeSection}
            onChange={setActiveSection}
          />
          <div className="space-y-6">
            {activeSection === "dashboard" && (
              <section className="glass-panel rounded-3xl p-6">
                <h2 className="font-f1bold text-2xl">Dashboard Overview</h2>
                <p className="mt-2 text-sm text-white/60">
                  Use the sidebar to manage drivers, teams, circuits, seasons,
                  and race data. Imports appear instantly in the tables.
                </p>
              </section>
            )}

            {activeSection === "standings" && (
              <section className="glass-panel rounded-3xl p-6">
                <h2 className="font-f1bold text-xl">Standings Type</h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    onClick={() => setStandingsType("driver_standings")}
                    className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                      standingsType === "driver_standings"
                        ? "border-f1red text-white"
                        : "border-white/20 text-white/70"
                    }`}
                  >
                    Driver Standings
                  </button>
                  <button
                    onClick={() => setStandingsType("constructor_standings")}
                    className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                      standingsType === "constructor_standings"
                        ? "border-f1red text-white"
                        : "border-white/20 text-white/70"
                    }`}
                  >
                    Constructor Standings
                  </button>
                </div>
              </section>
            )}

            {activeTable && renderTableSection(activeTable)}

            {activeSection === "import" && (
              <>
                <section className="glass-panel rounded-3xl p-6">
                  <h2 className="font-f1bold text-xl">Excel Import Center</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                    <select
                      value={tableName}
                      onChange={(event) => setTableName(event.target.value)}
                      className="rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-sm text-white"
                    >
                      {excelTables.map((table) => (
                        <option key={table} value={table}>
                          {table}
                        </option>
                      ))}
                    </select>
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={(event) => setFile(event.target.files?.[0] || null)}
                      className="text-xs text-white/60"
                    />
                  </div>
                  <button
                    onClick={handleImport}
                    className="mt-4 rounded-full bg-f1red px-4 py-2 text-xs uppercase tracking-[0.2em]"
                  >
                    Import Excel
                  </button>
                </section>

                <section className="glass-panel rounded-3xl p-6">
                  <h2 className="font-f1bold text-xl">API Data Import</h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={handleLoadErgast}
                      className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
                    >
                      Load Ergast Current Season
                    </button>
                    <button
                      onClick={handleLoadOpenF1}
                      className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
                    >
                      Load OpenF1 Sessions
                    </button>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={apiYear}
                        onChange={(event) =>
                          setApiYear(Number(event.target.value))
                        }
                        className="w-24 rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs text-white"
                      />
                      <button
                        onClick={handleLoadJolpica}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
                      >
                        Load Jolpica Season
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-white/60">
                    Loaded rows: {apiData.length} · Source: {apiSource}
                  </div>
                  <button
                    onClick={handleApiImport}
                    className="mt-4 rounded-full bg-f1red px-4 py-2 text-xs uppercase tracking-[0.2em]"
                  >
                    Import API Data to Races
                  </button>
                </section>
              </>
            )}

            {activeSection === "ergast_import" && (
              <section className="glass-panel rounded-3xl p-6">
                <h2 className="font-f1bold text-xl">Ergast Import Center</h2>
                <p className="mt-2 text-sm text-white/60">
                  Fetch data from Ergast and store it in Supabase.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    value={ergastSeason}
                    onChange={(event) =>
                      setErgastSeason(Number(event.target.value))
                    }
                    className="w-28 rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs text-white"
                    placeholder="Season"
                  />
                  <input
                    type="number"
                    value={ergastRound}
                    onChange={(event) =>
                      setErgastRound(Number(event.target.value))
                    }
                    className="w-24 rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs text-white"
                    placeholder="Round"
                  />
                  <span className="text-xs text-white/50">
                    Season/Round used for race-level imports.
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={importDrivers}
                    disabled={ergastImportState.drivers?.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-50"
                  >
                    {ergastImportState.drivers?.loading
                      ? "Loading..."
                      : "Import Drivers"}
                  </button>
                  <button
                    onClick={importConstructors}
                    disabled={ergastImportState.constructors?.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-50"
                  >
                    {ergastImportState.constructors?.loading
                      ? "Loading..."
                      : "Import Constructors"}
                  </button>
                  <button
                    onClick={importCircuits}
                    disabled={ergastImportState.circuits?.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-50"
                  >
                    {ergastImportState.circuits?.loading
                      ? "Loading..."
                      : "Import Circuits"}
                  </button>
                  <button
                    onClick={importSeasons}
                    disabled={ergastImportState.seasons?.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-50"
                  >
                    {ergastImportState.seasons?.loading
                      ? "Loading..."
                      : "Import Seasons"}
                  </button>
                  <button
                    onClick={importSeasonRaces}
                    disabled={ergastImportState.season_races?.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-50"
                  >
                    {ergastImportState.season_races?.loading
                      ? "Loading..."
                      : "Import Season Races"}
                  </button>
                  <button
                    onClick={importRaceResults}
                    disabled={ergastImportState.race_results?.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-50"
                  >
                    {ergastImportState.race_results?.loading
                      ? "Loading..."
                      : "Import Race Results"}
                  </button>
                  <button
                    onClick={importDriverStandings}
                    disabled={ergastImportState.driver_standings?.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-50"
                  >
                    {ergastImportState.driver_standings?.loading
                      ? "Loading..."
                      : "Import Driver Standings"}
                  </button>
                  <button
                    onClick={importConstructorStandings}
                    disabled={ergastImportState.constructor_standings?.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-50"
                  >
                    {ergastImportState.constructor_standings?.loading
                      ? "Loading..."
                      : "Import Constructor Standings"}
                  </button>
                  <button
                    onClick={importPitStops}
                    disabled={ergastImportState.pit_stops?.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-50"
                  >
                    {ergastImportState.pit_stops?.loading
                      ? "Loading..."
                      : "Import Pit Stops"}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 text-xs text-white/60">
                  {Object.entries(ergastImportState).map(([key, state]) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-white/10 bg-black/60 p-3"
                    >
                      <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                        {key.replace(/_/g, " ")}
                      </div>
                      {state?.status && (
                        <div className="mt-2 text-white/80">
                          {state.status}
                        </div>
                      )}
                      {state?.error && (
                        <div className="mt-2 text-rose-200">
                          {state.error}
                        </div>
                      )}
                      {state?.log?.length ? (
                        <div className="mt-2 grid gap-1 text-white/60">
                          {state.log.map((line, index) => (
                            <div key={`${key}-${index}`}>{line}</div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "season_import" && (
              <section className="glass-panel rounded-3xl p-6">
                <h2 className="font-f1bold text-xl">Season Importer</h2>
                <p className="mt-2 text-sm text-white/60">
                  Import a complete season in one pass (races, results,
                  standings, drivers, constructors, and circuits).
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    value={seasonImportYear}
                    onChange={(event) =>
                      setSeasonImportYear(Number(event.target.value))
                    }
                    className="w-28 rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs text-white"
                    placeholder="Season"
                  />
                  <button
                    onClick={handleSeasonImport}
                    disabled={seasonImportLoading}
                    className="rounded-full bg-f1red px-4 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-60"
                  >
                    {seasonImportLoading
                      ? "Importing..."
                      : "Import Season Data"}
                  </button>
                  <button
                    onClick={() => {
                      seasonImportAbortRef.current = true;
                    }}
                    disabled={!seasonImportLoading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-40"
                  >
                    Cancel Import
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/70">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeQualifying}
                      onChange={(event) => setIncludeQualifying(event.target.checked)}
                    />
                    Include qualifying results
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeFastestLap}
                      onChange={(event) => setIncludeFastestLap(event.target.checked)}
                      disabled
                    />
                    Fastest laps included (from results)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includePitStops}
                      onChange={(event) => setIncludePitStops(event.target.checked)}
                    />
                    Include pit stops (2012+)
                  </label>
                </div>
                {seasonImportLoading && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-white/60">
                      {seasonImportProgress.label}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-f1red transition-all"
                        style={{ width: `${seasonImportProgress.percent}%` }}
                      />
                    </div>
                    <div className="grid gap-1 text-[11px] text-white/60">
                      {Object.entries(seasonImportStats).map(
                        ([key, value]) => (
                          <div key={key}>
                            {key.replace(/_/g, " ")}: {value.inserted} inserted,{" "}
                            {value.skipped} skipped
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === "media" && (
              <section className="glass-panel rounded-3xl p-6">
                <h2 className="font-f1bold text-xl">Media URL Manager</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select
                    value={mediaForm.table}
                    onChange={(event) =>
                      setMediaForm((prev) => ({
                        ...prev,
                        table: event.target.value,
                        id: "",
                      }))
                    }
                    onBlur={() => {
                      setMediaSearch("");
                      setMediaResults([]);
                    }}
                    className="rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-sm text-white"
                  >
                    <option value="drivers">drivers</option>
                    <option value="constructors">constructors</option>
                    <option value="circuits">circuits</option>
                    <option value="races">races</option>
                  </select>
                  <select
                    value={mediaForm.column}
                    onChange={(event) =>
                      setMediaForm((prev) => ({
                        ...prev,
                        column: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-sm text-white"
                  >
                    <option value="photo_url">photo_url</option>
                    <option value="logo_url">logo_url</option>
                    <option value="track_map_url">track_map_url</option>
                    <option value="banner_url">banner_url</option>
                  </select>
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-3">
                      <input
                        type="search"
                        value={mediaSearch}
                        onChange={(event) => setMediaSearch(event.target.value)}
                        placeholder={`Search ${mediaForm.table}...`}
                        className="w-full flex-1 rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-sm text-white"
                      />
                      <button
                        onClick={handleMediaSearch}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
                      >
                        {mediaLoading ? "Searching..." : "Search"}
                      </button>
                    </div>
                    {mediaResults.length > 0 && (
                      <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-black/80 p-3 text-xs text-white/70">
                        {mediaResults.map((row) => {
                          const config = getMediaSearchConfig(mediaForm.table);
                          return (
                            <button
                              key={row[config.id]}
                              onClick={() =>
                                setMediaForm((prev) => ({
                                  ...prev,
                                  id: row[config.id],
                                }))
                              }
                              className="rounded-lg bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
                            >
                              <div className="font-medium text-white">
                                {config.format(row)}
                              </div>
                              <div className="text-white/50">
                                ID: {row[config.id]}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={mediaForm.id}
                    onChange={(event) =>
                      setMediaForm((prev) => ({ ...prev, id: event.target.value }))
                    }
                    placeholder="Record ID"
                    className="rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-sm text-white"
                  />
                  <input
                    type="url"
                    value={mediaForm.url}
                    onChange={(event) =>
                      setMediaForm((prev) => ({ ...prev, url: event.target.value }))
                    }
                    placeholder="Media URL"
                    className="rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-sm text-white"
                  />
                </div>
                <button
                  onClick={handleMediaUpdate}
                  className="mt-4 rounded-full bg-f1red px-4 py-2 text-xs uppercase tracking-[0.2em]"
                >
                  Update Media URL
                </button>
              </section>
            )}
          </div>
        </div>
      )}

      {status && (
        <div className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-xs text-white/70">
          {status}
        </div>
      )}

      {activeTable && (
        <AdminModal
          open={modalOpen}
          title={modalMode === "create" ? "Create Record" : "Edit Record"}
          fields={getModalFields()}
          values={modalValues}
          onChange={handleModalChange}
          onClose={() => setModalOpen(false)}
          onSave={handleModalSave}
          saving={saving}
        />
      )}

      <AdminModal
        open={assignmentModalOpen}
        title="Assign Driver to Constructor"
        fields={getModalFields("driver_constructor_contracts")}
        values={assignmentValues}
        onChange={handleAssignmentChange}
        onClose={() => setAssignmentModalOpen(false)}
        onSave={handleAssignmentSave}
        saving={assignmentSaving}
      />
    </div>
  );
}

