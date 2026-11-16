// TAIO Time App — Lunar Calendar Interface (PRD v0.3.43 Part C1)
// Pure domain model: NO React dependencies.

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeap?: boolean;
}

export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

export interface LunarProvider {
  isAvailable(): boolean;
  supportedRange(): { minYear: number; maxYear: number };
  toSolar(lunarDate: LunarDate, solarYear: number): SolarDate | null;
  toLunar(solarDate: SolarDate): LunarDate | null;
}
