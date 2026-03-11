
import { useEffect, useMemo, useState } from "react";
import { supabase, hasSupabase } from "../services/supabaseClient";
import { importExcelToTable } from "../services/excelImporter";
import {
  fetchErgastLatestSeason,
  fetchJolpicaSeason,
  fetchOpenF1RaceWeekends,
} from "../services/f1Api";
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

