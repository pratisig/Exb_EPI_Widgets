var EpiMoteur = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // entry-preview.ts
  var entry_preview_exports = {};
  __export(entry_preview_exports, {
    aggregate: () => aggregate,
    aggregateByBoundary: () => aggregateByBoundary,
    compareYears: () => compareYears,
    parseEpiDate: () => parseEpiDate,
    periodFor: () => periodFor
  });

  // src/runtime/aggregation.ts
  var pad = (n) => String(n).padStart(2, "0");
  var utc = (y, m, d) => new Date(Date.UTC(y, m, d));
  function parseEpiDate(value, convention = "dmy") {
    if (value == null || value === "") return null;
    if (value instanceof Date && !isNaN(value.getTime())) return new Date(value.getTime());
    if (typeof value === "number" && isFinite(value)) {
      const d = value > 1e10 ? new Date(value) : new Date(Date.UTC(1899, 11, 30) + value * 864e5);
      return isNaN(d.getTime()) ? null : d;
    }
    const text = String(value).trim();
    if (!text) return null;
    const week = text.match(/^(?:week|wk|w|s)[ _-]?(\d{1,2})[ _/-]?(\d{4})$/i) || text.match(/^(\d{4})[ _/-]?(?:week|wk|w|s)[ _-]?(\d{1,2})$/i);
    if (week) {
      const weekNumber = +(week[1].length === 4 ? week[2] : week[1]);
      const year = +(week[1].length === 4 ? week[1] : week[2]);
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const day = jan4.getUTCDay() || 7;
      const monday = new Date(jan4);
      monday.setUTCDate(jan4.getUTCDate() - day + 1 + (weekNumber - 1) * 7);
      return monday;
    }
    const native = new Date(text);
    let m = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:\s+(\d{1,2}):?(\d{2})?)?$/);
    if (m) {
      let day = +m[1];
      let month = +m[2] - 1;
      if (convention === "mdy" || convention === "auto" && day <= 12 && +m[2] <= 12) {
        day = +m[2];
        month = +m[1] - 1;
      }
      if (+m[2] > 12) {
        day = +m[2];
        month = +m[1] - 1;
      }
      const d = new Date(Date.UTC(+m[3], month, day, +(m[4] || 0), +(m[5] || 0)));
      return d.getUTCDate() === day && d.getUTCMonth() === month ? d : null;
    }
    m = text.match(/^(\d{4})\s*[-/]?\s*(\d{1,2})$/);
    if (m) return utc(+m[1], +m[2] - 1, 1);
    return isNaN(native.getTime()) ? null : native;
  }
  function isoWeek(date) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const year = d.getUTCFullYear();
    const first = new Date(Date.UTC(year, 0, 1));
    return { year, week: Math.ceil(((d.getTime() - first.getTime()) / 864e5 + 1) / 7) };
  }
  function weekStart(d) {
    const x = new Date(d);
    const day = x.getUTCDay() || 7;
    x.setUTCDate(x.getUTCDate() - day + 1);
    return x;
  }
  function periodFor(date, period, weekMode = "iso", outbreak) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    if (period === "year") return { key: `${y}`, label: `${y}`, start: utc(y, 0, 1), end: utc(y + 1, 0, 1) };
    if (period === "month") return { key: `${y}-${pad(m + 1)}`, label: `${y}-${pad(m + 1)}`, start: utc(y, m, 1), end: utc(y, m + 1, 1) };
    if (period === "quarter") {
      const q = Math.floor(m / 3) + 1;
      return { key: `${y}-Q${q}`, label: `${y} T${q}`, start: utc(y, (q - 1) * 3, 1), end: utc(y, q * 3, 1) };
    }
    if (weekMode === "outbreak" && outbreak) {
      const start2 = weekStart(outbreak);
      const current = weekStart(date);
      const week = Math.max(1, Math.floor((current.getTime() - start2.getTime()) / (7 * 864e5)) + 1);
      const end = new Date(start2.getTime() + week * 7 * 864e5);
      return { key: `EPI-W${week}`, label: `EPI W${week}`, start: new Date(start2.getTime() + (week - 1) * 7 * 864e5), end };
    }
    const w = isoWeek(date);
    const start = weekStart(date);
    return { key: `${w.year}-W${pad(w.week)}`, label: `${w.year} S${w.week}`, start, end: new Date(start.getTime() + 7 * 864e5) };
  }
  function numericValue(value) {
    if (typeof value === "number" && isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const normalized = value.replace(/\s/g, "").replace(",", ".");
      const n = Number(normalized);
      return isFinite(n) ? n : null;
    }
    return null;
  }
  function calculate(records, valueField, statistic, valueType = "number") {
    if (statistic === "count") return records.length;
    const raw = records.map((record) => {
      const attrs = record?.getData ? record.getData() : record?.attributes || record;
      return valueField ? attrs?.[valueField] : null;
    }).filter((v) => v !== null && v !== void 0 && v !== "");
    if (statistic === "distinct") return new Set(raw.map((v) => String(v))).size;
    if (statistic === "first" || statistic === "last") return raw.length ? raw[statistic === "first" ? 0 : raw.length - 1] : "";
    if (valueType === "date" && (statistic === "min" || statistic === "max")) {
      const dates = raw.map((v) => parseEpiDate(v)).filter((v) => !!v);
      if (!dates.length) return "";
      return new Date((statistic === "min" ? Math.min : Math.max)(...dates.map((d) => d.getTime()))).toISOString();
    }
    const values = raw.map(numericValue).filter((v) => v !== null);
    if (!values.length) return 0;
    if (statistic === "sum") return values.reduce((a, b) => a + b, 0);
    if (statistic === "mean") return values.reduce((a, b) => a + b, 0) / values.length;
    if (statistic === "min") return Math.min(...values);
    if (statistic === "max") return Math.max(...values);
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }
  function aggregate(records, dateField, period, weekMode, outbreakStart, convention = "dmy", statistic = "count", valueField, valueType = "number", fillMissingPeriods = false) {
    const outbreak = parseEpiDate(outbreakStart, convention);
    const groups = /* @__PURE__ */ new Map();
    let invalid = 0;
    records.forEach((record) => {
      const attrs = record?.getData ? record.getData() : record?.attributes || record;
      const date = parseEpiDate(attrs?.[dateField], convention);
      if (!date) {
        invalid++;
        return;
      }
      const p = periodFor(date, period, weekMode, outbreak || void 0);
      const existing = groups.get(p.key);
      if (existing) {
        existing.count++;
        existing.records.push(record);
      } else groups.set(p.key, { ...p, count: 1, value: 0, records: [record] });
    });
    let rows = Array.from(groups.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
    rows.forEach((row) => {
      row.value = calculate(row.records, valueField, statistic, valueType);
    });
    if (fillMissingPeriods && rows.length > 1) {
      const existing = new Map(rows.map((row) => [row.key, row]));
      const complete = [];
      let cursor = new Date(rows[0].start);
      const last = rows[rows.length - 1].start;
      while (cursor.getTime() <= last.getTime()) {
        const p = periodFor(cursor, period, weekMode, outbreak || void 0);
        complete.push(existing.get(p.key) || { ...p, count: 0, value: 0, records: [] });
        if (period === "year") cursor = utc(cursor.getUTCFullYear() + 1, 0, 1);
        else if (period === "quarter") cursor = utc(cursor.getUTCFullYear(), cursor.getUTCMonth() + 3, 1);
        else if (period === "month") cursor = utc(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1);
        else cursor = new Date(cursor.getTime() + 7 * 864e5);
      }
      rows = complete;
    }
    return { rows, invalid };
  }

  // src/runtime/comparison.ts
  function compareYears(records, dateField, period, years, weekMode, statistic, valueField, valueType = "number", convention = "dmy", outbreakStart, referenceYear) {
    const selected = years.filter((year) => isFinite(year)).sort((a, b) => a - b);
    const groups = /* @__PURE__ */ new Map();
    selected.forEach((year) => {
      const yearRecords = records.filter((record) => {
        const attrs = record?.getData ? record.getData() : record?.attributes || record;
        const date = parseEpiDate(attrs?.[dateField], convention);
        return date?.getUTCFullYear() === year;
      });
      const result = aggregate(yearRecords, dateField, period, weekMode, outbreakStart, convention, statistic, valueField, valueType, false);
      result.rows.forEach((row) => {
        const comparisonKey = period === "year" ? "year" : period === "month" ? row.key.slice(5) : period === "quarter" ? row.key.slice(5) : row.key.slice(row.key.indexOf("-W") + 2);
        const existing = groups.get(comparisonKey) || { periodKey: comparisonKey, label: period === "epi-week" ? `S${comparisonKey}` : row.label, values: {} };
        existing.values[year] = Number(row.value) || 0;
        groups.set(comparisonKey, existing);
      });
    });
    const ref = referenceYear || selected[selected.length - 1];
    return Array.from(groups.values()).sort((a, b) => a.periodKey.localeCompare(b.periodKey, void 0, { numeric: true })).map((row) => {
      const base = row.values[ref];
      const current = row.values[selected[selected.length - 1]];
      return { ...row, change: base !== void 0 && current !== void 0 ? current - base : void 0, changePct: base ? (current - base) / base * 100 : void 0 };
    });
  }

  // src/runtime/spatialAggregation.ts
  function aggregateByBoundary(records, dateField, boundaryField, period, weekMode, statistic, valueField, valueType = "number", outbreakStart, convention = "dmy") {
    const groups = /* @__PURE__ */ new Map();
    records.forEach((record) => {
      const attrs = record?.getData ? record.getData() : record?.attributes || record;
      const key = attrs?.[boundaryField];
      if (key !== null && key !== void 0 && key !== "") {
        const name = String(key);
        groups.set(name, [...groups.get(name) || [], record]);
      }
    });
    const output = [];
    groups.forEach((groupRecords, boundary) => aggregate(groupRecords, dateField, period, weekMode, outbreakStart, convention, statistic, valueField, valueType, false).rows.forEach((row) => output.push({ ...row, boundary })));
    return output.sort((a, b) => a.start.getTime() - b.start.getTime() || a.boundary.localeCompare(b.boundary));
  }
  return __toCommonJS(entry_preview_exports);
})();
