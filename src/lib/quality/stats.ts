import type Database from "better-sqlite3";
import { getDb } from "./db";

export interface Ranked {
  key: string;
  count: number;
  percent: number;
}

export interface CauseRankingResult {
  total: number;
  range: { from: string | null; to: string | null };
  causes: Ranked[];
  actions: Ranked[];
}

function rank(rows: { v: string | null; c: number }[], total: number): Ranked[] {
  return rows
    .filter((r) => r.v && r.v.trim().length > 0)
    .map((r) => ({
      key: r.v as string,
      count: r.c,
      percent: total > 0 ? Math.round((r.c / total) * 1000) / 10 : 0,
    }));
}

export function getCauseRanking(
  filter: { model?: string; defect?: string },
  db: Database.Database = getDb(),
): CauseRankingResult {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.model) { where.push("model_name = ?"); params.push(filter.model); }
  if (filter.defect) { where.push("defect = ?"); params.push(filter.defect); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = db.prepare(
    `SELECT COUNT(*) c, MIN(written_date) f, MAX(written_date) t FROM non_conformance ${whereSql}`,
  ).get(...params) as { c: number; f: string | null; t: string | null };

  const causeRows = db.prepare(
    `SELECT cause v, COUNT(*) c FROM non_conformance ${whereSql}
     GROUP BY cause ORDER BY c DESC`,
  ).all(...params) as { v: string | null; c: number }[];

  const actionRows = db.prepare(
    `SELECT action v, COUNT(*) c FROM non_conformance ${whereSql}
     GROUP BY action ORDER BY c DESC`,
  ).all(...params) as { v: string | null; c: number }[];

  return {
    total: totalRow.c,
    range: { from: totalRow.f, to: totalRow.t },
    causes: rank(causeRows, totalRow.c),
    actions: rank(actionRows, totalRow.c),
  };
}

export interface DefectDashboard {
  defect: string;
  model: string | null;
  total: number;
  recent30: number;
  modelCount: number;
  topModel: string | null;
  range: { from: string | null; to: string | null };
  monthly: { month: string; count: number }[];
  topModels: Ranked[];
  topCauses: Ranked[];
  topActions: Ranked[];
  recentRows: { nc_no: string; written_date: string; model_name: string; cause: string | null; action: string | null }[];
}

export function getDefectDashboard(
  filter: { defect: string; model?: string | null },
  db: Database.Database = getDb(),
): DefectDashboard {
  const where: string[] = ["defect = ?"];
  const params: unknown[] = [filter.defect];
  if (filter.model) { where.push("model_name = ?"); params.push(filter.model); }
  const whereSql = `WHERE ${where.join(" AND ")}`;

  const totalRow = db.prepare(
    `SELECT COUNT(*) c, MIN(written_date) f, MAX(written_date) t FROM non_conformance ${whereSql}`,
  ).get(...params) as { c: number; f: string | null; t: string | null };

  const recent30 = (db.prepare(
    `SELECT COUNT(*) c FROM non_conformance ${whereSql} AND written_date >= date('now','-30 days')`,
  ).get(...params) as { c: number }).c;

  const modelCount = (db.prepare(
    `SELECT COUNT(DISTINCT model_name) c FROM non_conformance ${whereSql}`,
  ).get(...params) as { c: number }).c;

  const topModelRow = db.prepare(
    `SELECT model_name v FROM non_conformance ${whereSql} GROUP BY model_name ORDER BY COUNT(*) DESC LIMIT 1`,
  ).get(...params) as { v: string } | undefined;

  const monthly = (db.prepare(
    `SELECT substr(written_date,1,7) m, COUNT(*) c FROM non_conformance
     ${whereSql} AND written_date >= date('now','-12 months')
     GROUP BY m ORDER BY m`,
  ).all(...params) as { m: string; c: number }[]).map((r) => ({ month: r.m, count: r.c }));

  const topModelsRows = db.prepare(
    `SELECT model_name v, COUNT(*) c FROM non_conformance ${whereSql}
     GROUP BY model_name ORDER BY c DESC LIMIT 50`,
  ).all(...params) as { v: string; c: number }[];

  const topCausesRows = db.prepare(
    `SELECT cause v, COUNT(*) c FROM non_conformance ${whereSql}
     AND cause IS NOT NULL AND cause != ''
     GROUP BY cause ORDER BY c DESC LIMIT 50`,
  ).all(...params) as { v: string; c: number }[];

  const topActionsRows = db.prepare(
    `SELECT action v, COUNT(*) c FROM non_conformance ${whereSql}
     AND action IS NOT NULL AND action != ''
     GROUP BY action ORDER BY c DESC LIMIT 50`,
  ).all(...params) as { v: string; c: number }[];

  const recentRows = db.prepare(
    `SELECT nc_no, written_date, model_name, cause, action FROM non_conformance ${whereSql}
     ORDER BY written_date DESC, nc_no DESC LIMIT 10`,
  ).all(...params) as { nc_no: string; written_date: string; model_name: string; cause: string | null; action: string | null }[];

  return {
    defect: filter.defect,
    model: filter.model ?? null,
    total: totalRow.c,
    recent30,
    modelCount,
    topModel: topModelRow?.v ?? null,
    range: { from: totalRow.f, to: totalRow.t },
    monthly,
    topModels: rank(topModelsRows, totalRow.c),
    topCauses: rank(topCausesRows, totalRow.c),
    topActions: rank(topActionsRows, totalRow.c),
    recentRows,
  };
}

export interface ModelDashboard {
  model: string;
  total: number;
  recent30: number;
  uniqueLots: number;
  topDefect: string | null;
  monthly: { month: string; count: number }[];
  topDefects: Ranked[];
  topCauses: Ranked[];
  recentRows: { nc_no: string; written_date: string; defect: string; cause: string | null }[];
}

export function getModelDashboard(
  model: string,
  db: Database.Database = getDb(),
): ModelDashboard {
  const total = (db.prepare(`SELECT COUNT(*) c FROM non_conformance WHERE model_name = ?`).get(model) as { c: number }).c;
  const recent30 = (db.prepare(
    `SELECT COUNT(*) c FROM non_conformance WHERE model_name = ? AND written_date >= date('now','-30 days')`,
  ).get(model) as { c: number }).c;
  const uniqueLots = (db.prepare(
    `SELECT COUNT(DISTINCT lot_no) c FROM non_conformance WHERE model_name = ? AND lot_no IS NOT NULL`,
  ).get(model) as { c: number }).c;
  const topDefectRow = db.prepare(
    `SELECT defect v FROM non_conformance WHERE model_name = ? GROUP BY defect ORDER BY COUNT(*) DESC LIMIT 1`,
  ).get(model) as { v: string } | undefined;

  const monthly = (db.prepare(
    `SELECT substr(written_date,1,7) m, COUNT(*) c FROM non_conformance
     WHERE model_name = ? AND written_date >= date('now','-12 months')
     GROUP BY m ORDER BY m`,
  ).all(model) as { m: string; c: number }[]).map((r) => ({ month: r.m, count: r.c }));

  const topDefectsRows = db.prepare(
    `SELECT defect v, COUNT(*) c FROM non_conformance WHERE model_name = ?
     GROUP BY defect ORDER BY c DESC LIMIT 50`,
  ).all(model) as { v: string; c: number }[];

  const topCausesRows = db.prepare(
    `SELECT cause v, COUNT(*) c FROM non_conformance
     WHERE model_name = ? AND cause IS NOT NULL AND cause != ''
     GROUP BY cause ORDER BY c DESC LIMIT 50`,
  ).all(model) as { v: string; c: number }[];

  const recentRows = db.prepare(
    `SELECT nc_no, written_date, defect, cause FROM non_conformance
     WHERE model_name = ? ORDER BY written_date DESC, nc_no DESC LIMIT 10`,
  ).all(model) as { nc_no: string; written_date: string; defect: string; cause: string | null }[];

  return {
    model,
    total,
    recent30,
    uniqueLots,
    topDefect: topDefectRow?.v ?? null,
    monthly,
    topDefects: rank(topDefectsRows, total),
    topCauses: rank(topCausesRows, total),
    recentRows,
  };
}

export interface GlobalDashboard {
  total: number;
  recent30: number;
  modelCount: number;
  handlerCount: number;
  topModels: Ranked[];
  topDefects: Ranked[];
  topCauses: Ranked[];
  monthly: { month: string; count: number }[];
  sourceRatio: { source: "excel" | "web"; count: number }[];
}

export function getGlobalDashboard(db: Database.Database = getDb()): GlobalDashboard {
  const total = (db.prepare(`SELECT COUNT(*) c FROM non_conformance`).get() as { c: number }).c;
  const recent30 = (db.prepare(
    `SELECT COUNT(*) c FROM non_conformance WHERE written_date >= date('now','-30 days')`,
  ).get() as { c: number }).c;
  const modelCount = (db.prepare(`SELECT COUNT(DISTINCT model_name) c FROM non_conformance`).get() as { c: number }).c;
  const handlerCount = (db.prepare(
    `SELECT COUNT(DISTINCT handler) c FROM non_conformance WHERE handler IS NOT NULL AND handler != ''`,
  ).get() as { c: number }).c;

  const topModelsRows = db.prepare(
    `SELECT model_name v, COUNT(*) c FROM non_conformance GROUP BY model_name ORDER BY c DESC LIMIT 50`,
  ).all() as { v: string; c: number }[];

  const topDefectsRows = db.prepare(
    `SELECT defect v, COUNT(*) c FROM non_conformance
     WHERE defect IS NOT NULL AND defect != '' GROUP BY defect ORDER BY c DESC LIMIT 50`,
  ).all() as { v: string; c: number }[];

  const topCausesRows = db.prepare(
    `SELECT cause v, COUNT(*) c FROM non_conformance
     WHERE cause IS NOT NULL AND cause != '' GROUP BY cause ORDER BY c DESC LIMIT 50`,
  ).all() as { v: string; c: number }[];

  const monthly = (db.prepare(
    `SELECT substr(written_date,1,7) m, COUNT(*) c FROM non_conformance
     WHERE written_date >= date('now','-12 months')
     GROUP BY m ORDER BY m`,
  ).all() as { m: string; c: number }[]).map((r) => ({ month: r.m, count: r.c }));

  const sourceRatio = db.prepare(
    `SELECT source, COUNT(*) count FROM non_conformance GROUP BY source`,
  ).all() as { source: "excel" | "web"; count: number }[];

  return {
    total,
    recent30,
    modelCount,
    handlerCount,
    topModels: rank(topModelsRows, total),
    topDefects: rank(topDefectsRows, total),
    topCauses: rank(topCausesRows, total),
    monthly,
    sourceRatio,
  };
}
