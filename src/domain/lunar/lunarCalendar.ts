// TAIO Time App — Vietnamese Lunar Calendar Module (PRD v0.3.43 Part C)
// Pure astronomical algorithm for Vietnam timezone (UTC+7).
// Offline, zero-dependency, covers 1900-2100.
import type { LunarDate, SolarDate, LunarProvider } from './types.ts';

export const LUNAR_MODULE_ENABLED = true;

/**
 * Astronomical calculation for Vietnam Lunar Calendar (timezone UTC+7).
 * Implementation based on the standard algorithm by Ho Ngoc Duc (University of Leipzig).
 */
function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function jdToDate(jd: number): [number, number, number] {
  let a: number, b: number, c: number, d: number, e: number, m: number;
  if (jd > 2299160) {
    const alpha = Math.floor((jd - 1867216.25) / 36524.25);
    a = jd + 1 + alpha - Math.floor(alpha / 4);
  } else {
    a = jd;
  }
  b = a + 1524;
  c = Math.floor((b - 122.1) / 365.25);
  d = Math.floor(365.25 * c);
  e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  if (e < 14) {
    m = e - 1;
  } else {
    m = e - 13;
  }
  let year = c - 4715;
  if (m > 2) year = c - 4716;
  return [day, m, year];
}

function getNewMoonDay(k: number, timeZone = 7): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr);
  C1 -= 0.0004 * Math.sin(3 * dr * Mpr);
  C1 += 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin((M + Mpr) * dr);
  C1 -= 0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
  C1 -= 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
  C1 += 0.001 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((2 * Mpr + M) * dr);
  const deltat = (T < -4) ? 0.000022 * (T * 100 + 1820) * (T * 100 + 1820) - 20 : 0;
  const JdNew = Jd1 + C1 - deltat / 86400;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(dayNumber: number, timeZone = 7): number {
  const T = (dayNumber - 0.5 - timeZone / 24 - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor((L / Math.PI) * 6);
}

function getLunarMonth11(yy: number, timeZone = 7): number {
  let off = jdFromDate(31, 12, yy) - 2415021;
  let k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11: number, timeZone = 7): number {
  let k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

export class VietnamLunarProvider implements LunarProvider {
  isAvailable(): boolean {
    return LUNAR_MODULE_ENABLED;
  }

  supportedRange(): { minYear: number; maxYear: number } {
    return { minYear: 1900, maxYear: 2100 };
  }

  toLunar(solar: SolarDate): LunarDate | null {
    if (!this.isAvailable()) return null;
    const { day, month, year } = solar;
    if (year < 1900 || year > 2100) return null;

    try {
      const timeZone = 7;
      const dayNumber = jdFromDate(day, month, year);
      const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
      let monthStart = getNewMoonDay(k + 1, timeZone);
      if (dayNumber < monthStart) {
        monthStart = getNewMoonDay(k, timeZone);
      }
      let a11 = getLunarMonth11(year, timeZone);
      let b11 = a11;
      let lunarYear: number;
      if (a11 >= monthStart) {
        lunarYear = year;
        a11 = getLunarMonth11(year - 1, timeZone);
      } else {
        lunarYear = year + 1;
        b11 = getLunarMonth11(year + 1, timeZone);
      }
      const lunarDay = dayNumber - monthStart + 1;
      const diff = Math.floor((monthStart - a11) / 29);
      let lunarLeap = false;
      let lunarMonth = diff + 11;
      if (b11 - a11 > 365) {
        const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
        if (diff >= leapMonthDiff) {
          lunarMonth = diff + 10;
          if (diff === leapMonthDiff) {
            lunarLeap = true;
          }
        }
      }
      if (lunarMonth > 12) {
        lunarMonth = lunarMonth - 12;
      }
      if (lunarMonth >= 11 && diff < 4) {
        lunarYear -= 1;
      }
      return {
        day: lunarDay,
        month: lunarMonth,
        year: lunarYear,
        isLeap: lunarLeap,
      };
    } catch {
      return null;
    }
  }

  toSolar(lunar: LunarDate, solarYear: number): SolarDate | null {
    if (!this.isAvailable()) return null;
    if (solarYear < 1900 || solarYear > 2100) return null;

    try {
      const timeZone = 7;
      let a11: number, b11: number;
      if (lunar.month < 11) {
        a11 = getLunarMonth11(solarYear - 1, timeZone);
        b11 = getLunarMonth11(solarYear, timeZone);
      } else {
        a11 = getLunarMonth11(solarYear, timeZone);
        b11 = getLunarMonth11(solarYear + 1, timeZone);
      }
      const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
      let off = lunar.month - 11;
      if (off < 0) {
        off += 12;
      }
      if (b11 - a11 > 365) {
        const leapOff = getLeapMonthOffset(a11, timeZone);
        const leapMonth = leapOff - 2 < 0 ? leapOff - 2 + 12 : leapOff - 2;
        if (lunar.isLeap && lunar.month !== leapMonth) {
          return null;
        } else if (lunar.isLeap || off >= leapOff) {
          off += 1;
        }
      }
      const nm = getNewMoonDay(k + off, timeZone);
      const nmNext = getNewMoonDay(k + off + 1, timeZone);
      const daysInMonth = nmNext - nm;
      // PRD v0.3.43 C1.4: Ngày 30 trong tháng chỉ có 29 ngày thì lấy ngày 29
      const clampedDay = Math.min(lunar.day, daysInMonth);
      const jd = nm + clampedDay - 1;
      const [d, m, y] = jdToDate(jd);

      return { day: d, month: m, year: y };
    } catch {
      return null;
    }
  }
}

export const defaultLunarProvider = new VietnamLunarProvider();
