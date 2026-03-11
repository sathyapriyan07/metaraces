import * as XLSX from "xlsx";
import { supabase, hasSupabase } from "./supabaseClient";

const DATE_FIELDS = new Set(["date", "date_of_birth"]);

function excelDateToIso(value) {
  if (typeof value !== "number") return value;
  const parsed = XLSX.SSF.parse_date_code(value);
  if (!parsed) return value;
  const yyyy = String(parsed.y).padStart(4, "0");
  const mm = String(parsed.m).padStart(2, "0");
  const dd = String(parsed.d).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeRow(row) {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    if (value === "") {
      normalized[key] = null;
      return;
    }
    if (DATE_FIELDS.has(key)) {
      normalized[key] = excelDateToIso(value);
      return;
    }
    normalized[key] = value;
  });
  return normalized;
}

export async function importExcelToTable(file, tableName) {
  if (!hasSupabase()) {
    return { success: false, message: "Supabase is not configured." };
  }
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const rows = rawRows.map(normalizeRow);

  if (!rows.length) {
    return { success: false, message: "No rows found in the Excel sheet." };
  }

  const { error } = await supabase.from(tableName).insert(rows);
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, message: `Imported ${rows.length} rows.` };
}
