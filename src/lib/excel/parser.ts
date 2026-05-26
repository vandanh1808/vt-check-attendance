import * as XLSX from "xlsx";

export interface ParsedExcel {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export function parseExcelBuffer(buffer: ArrayBuffer): ParsedExcel {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    firstSheet,
    { defval: "" },
  );

  if (jsonData.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const rawHeaders = Object.keys(jsonData[0]);
  const headers = rawHeaders.map((h) => h.replace(/\s*\*\s*$/, "").trim());
  const rows = jsonData.map((row) => {
    const record: Record<string, string> = {};
    for (let i = 0; i < rawHeaders.length; i++) {
      record[headers[i]] = String(row[rawHeaders[i]] ?? "").trim();
    }
    return record;
  });

  return { headers, rows, rowCount: rows.length };
}
