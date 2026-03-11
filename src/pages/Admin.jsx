
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, hasSupabase } from "../services/supabaseClient";
import { importExcelToTable } from "../services/excelImporter";
import { importResults as importResultsService } from "../services/importer/importResults";
import {
  importConstructorStandings as importConstructorStandingsService,
  importDriverStandings as importDriverStandingsService,
} from "../services/importer/importStandings";
import { importSeason } from "../services/importer/importSeason";
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
  "qualifying",
  "pitstops",
  "driver_constructor_history",
  "driver_standings",
  "constructor_standings",
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
  { id: "season_import", label: "Season Importer" },
  { id: "admin_tools", label: "Admin Tools" },
  { id: "media", label: "Media Manager" },
];

const tableConfigs = {
  drivers: {
    table: "drivers",
    id: "id",
    search: ["driver_id", "given_name", "family_name", "nationality", "code"],
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
      { key: "given_name", label: "given_name", sortable: true },
      { key: "family_name", label: "family_name", sortable: true },
      { key: "nationality", label: "nationality", sortable: true },
      { key: "permanent_number", label: "permanent_number", sortable: true },
    ],
    fields: [
      { key: "id", label: "id" },
      { key: "driver_id", label: "driver_id" },
      { key: "photo_url", label: "photo_url" },
      { key: "given_name", label: "given_name" },
      { key: "family_name", label: "family_name" },
      { key: "code", label: "code" },
      { key: "permanent_number", label: "permanent_number", type: "number" },
      { key: "nationality", label: "nationality" },
      { key: "date_of_birth", label: "date_of_birth", type: "date" },
      { key: "url", label: "url" },
    ],
    required: ["driver_id"],
  },
  constructors: {
    table: "constructors",
    id: "id",
    search: ["constructor_id", "name", "nationality"],
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
    ],
    fields: [
      { key: "id", label: "id" },
      { key: "constructor_id", label: "constructor_id" },
      { key: "name", label: "name" },
      { key: "nationality", label: "nationality" },
      { key: "logo_url", label: "logo_url" },
      { key: "url", label: "url" },
    ],
    required: ["constructor_id", "name"],
  },
  circuits: {
    table: "circuits",
    id: "id",
    search: ["circuit_id", "name", "country", "locality"],
    columns: [
      { key: "circuit_id", label: "circuit_id", sortable: true },
      { key: "name", label: "name", sortable: true },
      { key: "country", label: "country", sortable: true },
      { key: "locality", label: "locality", sortable: true },
    ],
    fields: [
      { key: "id", label: "id" },
      { key: "circuit_id", label: "circuit_id" },
      { key: "name", label: "name" },
      { key: "locality", label: "locality" },
      { key: "country", label: "country" },
      { key: "lat", label: "lat" },
      { key: "lng", label: "lng" },
      { key: "url", label: "url" },
      { key: "map_url", label: "map_url" },
      { key: "image_url", label: "image_url" },
    ],
    required: ["circuit_id", "name"],
  },
  seasons: {
    table: "seasons",
    id: "id",
    search: ["year"],
    columns: [
      { key: "year", label: "year", sortable: true },
      { key: "url", label: "url" },
    ],
    fields: [
      { key: "id", label: "id" },
      { key: "year", label: "year", type: "number" },
      { key: "url", label: "url" },
    ],
    required: ["year"],
  },
  races: {
    table: "races",
    id: "id",
    search: ["race_id", "name", "season_year"],
    columns: [
      { key: "race_id", label: "race_id", sortable: true },
      { key: "name", label: "name", sortable: true },
      { key: "season_year", label: "season_year", sortable: true },
      { key: "round", label: "round", sortable: true },
      { key: "circuit_id", label: "circuit_id" },
      { key: "date", label: "date", sortable: true },
    ],
    fields: [
      { key: "id", label: "id" },
      { key: "race_id", label: "race_id" },
      { key: "season_year", label: "season_year", type: "number" },
      { key: "round", label: "round", type: "number" },
      { key: "name", label: "name" },
      { key: "circuit_id", label: "circuit_id" },
      { key: "date", label: "date", type: "date" },
      { key: "time", label: "time" },
      { key: "url", label: "url" },
    ],
    required: ["race_id", "season_year", "name"],
  },
  results: {
    table: "results",
    id: "id",
    search: ["race_id", "driver_id", "constructor_id", "status"],
    columns: [
      { key: "race_id", label: "race_id", sortable: true },
      { key: "driver_id", label: "driver_id", sortable: true },
      { key: "constructor_id", label: "constructor_id" },
      { key: "grid", label: "grid", sortable: true },
      { key: "position", label: "position", sortable: true },
      { key: "points", label: "points", sortable: true },
      { key: "status", label: "status" },
    ],
    fields: [
      { key: "id", label: "id" },
      { key: "race_id", label: "race_id" },
      { key: "driver_id", label: "driver_id" },
      { key: "constructor_id", label: "constructor_id" },
      { key: "grid", label: "grid", type: "number" },
      { key: "position", label: "position", type: "number" },
      { key: "points", label: "points" },
      { key: "laps", label: "laps", type: "number" },
      { key: "status", label: "status" },
      { key: "position_text", label: "position_text" },
      { key: "time", label: "time" },
      { key: "fastest_lap_rank", label: "fastest_lap_rank" },
      { key: "fastest_lap_time", label: "fastest_lap_time" },
      { key: "fastest_lap_speed", label: "fastest_lap_speed" },
    ],
    required: ["race_id", "driver_id"],
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
  driver_constructor_history: {
    table: "driver_constructor_history",
    id: "id",
    search: ["driver_id", "constructor_id", "season_year"],
    columns: [
      { key: "id", label: "id", sortable: true },
      { key: "driver_id", label: "driver", sortable: true },
      { key: "constructor_id", label: "constructor", sortable: true },
      { key: "season_year", label: "season_year", sortable: true },
      { key: "start_round", label: "start_round", sortable: true },
    ],
    fields: [
      { key: "id", label: "id" },
      { key: "driver_id", label: "driver", type: "select", options: [] },
      { key: "constructor_id", label: "constructor", type: "select", options: [] },
      { key: "season_year", label: "season_year", type: "number" },
      { key: "start_round", label: "start_round", type: "number" },
      { key: "end_round", label: "end_round", type: "number" },
      { key: "race_id", label: "race_id" },
    ],
    required: ["id", "driver_id", "constructor_id", "season_year"],
  },
};

// Legacy OpenF1/Ergast mapping helpers removed.

export default function Admin({ initialSection = "dashboard" }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [activeSection, setActiveSection] = useState(initialSection);
  const [tableName, setTableName] = useState("drivers");
  const [file, setFile] = useState(null);
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
  const [includePitStops, setIncludePitStops] = useState(false);
  const seasonImportAbortRef = useRef(false);
  const [toolsState, setToolsState] = useState({
    loading: false,
    log: [],
    error: "",
  });
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
      return "driver_constructor_history";
    if (activeSection === "import") return null;
    if (activeSection === "season_import") return null;
    if (activeSection === "admin_tools") return null;
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

  // Legacy API data import removed in favor of unified import services.

  const validateSeason = (value) => {
    const year = Number(value);
    const currentYear = new Date().getFullYear();
    if (!year || Number.isNaN(year)) return "Season must be a number.";
    if (year < 1950 || year > currentYear) {
      return `Season must be between 1950 and ${currentYear}.`;
    }
    return null;
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
      const logLines = [];
      const handleLog = (line) => {
        logLines.push(line);
        setSeasonImportStats((prev) => ({
          ...prev,
          log: logLines.slice(-6),
        }));
      };
      await importSeason(seasonYear, {
        includeQualifying,
        includePitStops,
        onProgress: (stage, percent) => {
          setSeasonImportProgress({ label: stage, percent });
        },
        onLog: handleLog,
        shouldAbort: () => seasonImportAbortRef.current,
      });
      setSeasonImportProgress({ label: "Complete", percent: 100 });
      setStatus(`Season ${seasonYear} imported successfully.`);
    } catch (error) {
      if (error?.message === "cancelled") {
        setStatus("Season import cancelled.");
        setSeasonImportProgress((prev) => ({
          ...prev,
          label: "Cancelled",
        }));
      } else {
        setStatus(error?.message || "Season import failed.");
      }
    } finally {
      setSeasonImportLoading(false);
      seasonImportAbortRef.current = false;
    }
  };

  const setTools = (patch) => {
    setToolsState((prev) => ({ ...prev, ...patch }));
  };

  const appendToolsLog = (line) => {
    setToolsState((prev) => ({
      ...prev,
      log: [...(prev.log || []), line].slice(-12),
    }));
  };

  const importAllSeasons = async () => {
    if (!hasSupabase()) return;
    const currentYear = new Date().getFullYear();
    setTools({ loading: true, error: "", log: [] });
    try {
      for (let year = 1950; year <= currentYear; year += 1) {
        appendToolsLog(`Importing season ${year}...`);
        try {
          await importSeason(year, {
            includeQualifying: true,
            includePitStops: year >= 2012,
            onLog: appendToolsLog,
          });
        } catch (error) {
          appendToolsLog(
            `Season ${year} failed (${error?.message || "unknown error"}).`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      appendToolsLog("All seasons imported.");
    } catch (error) {
      setTools({ error: error?.message || "Import all seasons failed." });
    } finally {
      setTools({ loading: false });
    }
  };

  const rebuildDriverTeamAssignments = async () => {
    if (!hasSupabase()) return;
    setTools({ loading: true, error: "", log: [] });
    try {
      appendToolsLog("Rebuilding driver-team assignments...");
      const batchSize = 1000;
      let from = 0;
      while (true) {
        const { data: resultsRows, error } = await supabase
          .from("results")
          .select("driver_id, constructor_id, race_id, race:races(season_year,round)")
          .range(from, from + batchSize - 1);
        if (error) throw new Error(`Supabase insert error: ${error.message}`);
        if (!resultsRows?.length) break;
        const rows = resultsRows.map((row) => ({
          driver_id: row.driver_id,
          constructor_id: row.constructor_id,
          season_year: row.race?.season_year || null,
          race_id: row.race_id,
          round: row.race?.round || null,
          start_round: row.race?.round || null,
          end_round: row.race?.round || null,
        }));
        const { error: upsertError } = await supabase
          .from("driver_constructor_history")
          .upsert(rows, {
            onConflict: "driver_id,constructor_id,season_year,race_id",
          });
        if (upsertError) {
          throw new Error(`Supabase insert error: ${upsertError.message}`);
        }
        appendToolsLog(`Processed ${from + resultsRows.length} results...`);
        from += batchSize;
      }
      appendToolsLog("Driver-team assignments rebuilt.");
    } catch (error) {
      setTools({ error: error?.message || "Rebuild assignments failed." });
    } finally {
      setTools({ loading: false });
    }
  };

  const rebuildStandings = async () => {
    if (!hasSupabase()) return;
    setTools({ loading: true, error: "", log: [] });
    try {
      const { data: seasons } = await supabase
        .from("seasons")
        .select("year")
        .order("year", { ascending: true });
      const years = (seasons || []).map((row) => row.year);
      for (const year of years) {
        appendToolsLog(`Rebuilding standings for ${year}...`);
        try {
          await importDriverStandingsService(year);
          await importConstructorStandingsService(year);
        } catch (error) {
          appendToolsLog(
            `Standings ${year} failed (${error?.message || "unknown error"}).`
          );
        }
      }
      appendToolsLog("Standings rebuild complete.");
    } catch (error) {
      setTools({ error: error?.message || "Rebuild standings failed." });
    } finally {
      setTools({ loading: false });
    }
  };

  const resyncMissingData = async () => {
    if (!hasSupabase()) return;
    setTools({ loading: true, error: "", log: [] });
    try {
      const { data: seasons } = await supabase
        .from("seasons")
        .select("year")
        .order("year", { ascending: true });
      const years = (seasons || []).map((row) => row.year);
      for (const year of years) {
        const { count: raceCount } = await supabase
          .from("races")
          .select("id", { count: "exact", head: true })
          .eq("season_year", year);
        if (!raceCount) {
          appendToolsLog(`Missing races for ${year}. Importing season...`);
          try {
            await importSeason(year, {
              includeQualifying: true,
              includePitStops: year >= 2012,
              onLog: appendToolsLog,
            });
          } catch (error) {
            appendToolsLog(
              `Season ${year} import failed (${error?.message || "unknown error"}).`
            );
          }
          continue;
        }

        const { data: raceRows } = await supabase
          .from("races")
          .select("id, race_id, round")
          .eq("season_year", year);
        const raceIds = (raceRows || []).map((row) => row.id);
        if (raceIds.length) {
          const { data: resultRows } = await supabase
            .from("results")
            .select("race_id")
            .in("race_id", raceIds);
          const resultSet = new Set(
            (resultRows || []).map((row) => row.race_id)
          );
          const missingRaces = (raceRows || []).filter(
            (row) => !resultSet.has(row.id)
          );
          for (const missing of missingRaces) {
            appendToolsLog(
              `Missing results for ${missing.race_id}. Importing results...`
            );
            const round = Number(missing.race_id.split("-")[1]);
            if (!Number.isNaN(round)) {
              try {
                await importResultsService(year, round);
              } catch (error) {
                appendToolsLog(
                  `Results ${year} round ${round} failed (${error?.message || "unknown error"}).`
                );
              }
            }
          }
        }

        const { count: driverStandingsCount } = await supabase
          .from("driver_standings")
          .select("id", { count: "exact", head: true })
          .eq("season_year", year);
        if (!driverStandingsCount) {
          appendToolsLog(`Missing driver standings for ${year}. Importing...`);
          try {
            await importDriverStandingsService(year);
          } catch (error) {
            appendToolsLog(
              `Driver standings ${year} failed (${error?.message || "unknown error"}).`
            );
          }
        }

        const { count: constructorStandingsCount } = await supabase
          .from("constructor_standings")
          .select("id", { count: "exact", head: true })
          .eq("season_year", year);
        if (!constructorStandingsCount) {
          appendToolsLog(
            `Missing constructor standings for ${year}. Importing...`
          );
          try {
            await importConstructorStandingsService(year);
          } catch (error) {
            appendToolsLog(
              `Constructor standings ${year} failed (${error?.message || "unknown error"}).`
            );
          }
        }
      }
      appendToolsLog("Resync complete.");
    } catch (error) {
      setTools({ error: error?.message || "Resync missing data failed." });
    } finally {
      setTools({ loading: false });
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
          .select("id, driver_id, given_name, family_name")
          .order("family_name", { ascending: true }),
        supabase
          .from("constructors")
          .select("id, constructor_id, name")
          .order("name", { ascending: true }),
      ]);
      if (!driversRes.error) {
        setDriverOptions(
          (driversRes.data || []).map((driver) => ({
            value: driver.id,
            label: `${driver.given_name} ${driver.family_name}`.trim(),
          }))
        );
      }
      if (!constructorsRes.error) {
        setConstructorOptions(
          (constructorsRes.data || []).map((team) => ({
            value: team.id,
            label: `${team.name} (${team.constructor_id})`,
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
    if (tableKey !== "driver_constructor_history") {
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
    const config = tableConfigs.driver_constructor_history;
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
    if (activeTable === "driver_constructor_history") fetchTableData();
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
        select: "driver_id, given_name, family_name, nationality",
        filter: (term) =>
          `given_name.ilike.%${term}%,family_name.ilike.%${term}%`,
        format: (row) =>
          `${row.given_name} ${row.family_name} - ${row.nationality || "-"}`,
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
      select: "race_id, name, season_year",
      filter: (term) => `name.ilike.%${term}%`,
      format: (row) => `${row.name} - ${row.season_year || "-"}`,
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
                tableKey === "driver_constructor_history"
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
              </>
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
                    {seasonImportStats.log?.length ? (
                      <div className="grid gap-1 text-[11px] text-white/60">
                        {seasonImportStats.log.map((line, index) => (
                          <div key={`season-log-${index}`}>{line}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            )}

            {activeSection === "admin_tools" && (
              <section className="glass-panel rounded-3xl p-6">
                <h2 className="font-f1bold text-xl">Admin Tools</h2>
                <p className="mt-2 text-sm text-white/60">
                  Bulk maintenance utilities for the relational archive.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={importAllSeasons}
                    disabled={toolsState.loading}
                    className="rounded-full bg-f1red px-4 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-60"
                  >
                    Import All Seasons
                  </button>
                  <button
                    onClick={rebuildDriverTeamAssignments}
                    disabled={toolsState.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-60"
                  >
                    Rebuild Driver-Team Assignments
                  </button>
                  <button
                    onClick={rebuildStandings}
                    disabled={toolsState.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-60"
                  >
                    Rebuild Standings
                  </button>
                  <button
                    onClick={resyncMissingData}
                    disabled={toolsState.loading}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 disabled:opacity-60"
                  >
                    Resync Missing Data
                  </button>
                </div>
                {toolsState.error && (
                  <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
                    {toolsState.error}
                  </div>
                )}
                {toolsState.log?.length ? (
                  <div className="mt-4 grid gap-1 text-[11px] text-white/60">
                    {toolsState.log.map((line, index) => (
                      <div key={`tools-log-${index}`}>{line}</div>
                    ))}
                  </div>
                ) : null}
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
                    <option value="map_url">map_url</option>
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
        fields={getModalFields("driver_constructor_history")}
        values={assignmentValues}
        onChange={handleAssignmentChange}
        onClose={() => setAssignmentModalOpen(false)}
        onSave={handleAssignmentSave}
        saving={assignmentSaving}
      />
    </div>
  );
}

