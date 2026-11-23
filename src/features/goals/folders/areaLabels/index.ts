// TAIO Time App — Goal Area Labels & Role Definitions (PRD v0.3.54 Part P)

import ownerDef from './owner.json';
import managerDef from './manager.json';
import technicalDef from './technical.json';
import adminDef from './admin.json';
import tradeDef from './trade.json';
import freelancerDef from './freelancer.json';

export interface RoleAreaLabelsDefinition {
  role: string;
  labels: {
    vi: Record<string, string>;
    en: Record<string, string>;
  };
  questions: {
    vi: Record<string, string>;
    en: Record<string, string>;
  };
}

export const ROLE_AREA_DEFINITIONS: Record<string, RoleAreaLabelsDefinition> = {
  owner: ownerDef as RoleAreaLabelsDefinition,
  manager: managerDef as RoleAreaLabelsDefinition,
  technical: technicalDef as RoleAreaLabelsDefinition,
  admin: adminDef as RoleAreaLabelsDefinition,
  trade: tradeDef as RoleAreaLabelsDefinition,
  freelancer: freelancerDef as RoleAreaLabelsDefinition,
};

/**
 * Register or override a role area definition dynamically.
 * Enables adding experiment/custom roles without editing GoalFolders.tsx (Acceptance P14).
 */
export function registerRoleAreaDefinition(def: RoleAreaLabelsDefinition): void {
  if (def && def.role) {
    ROLE_AREA_DEFINITIONS[def.role] = def;
  }
}

/**
 * Resolve the role definition, falling back to 'owner' if unknown.
 */
export function getAreaDefinitionForRole(role?: string): RoleAreaLabelsDefinition {
  if (role && ROLE_AREA_DEFINITIONS[role]) {
    return ROLE_AREA_DEFINITIONS[role];
  }
  return ROLE_AREA_DEFINITIONS.owner;
}

/**
 * Get the resolved label for an area code.
 * User custom names always take precedence over default role labels (Acceptance P4.4 / P11).
 */
export function getAreaLabel(
  area: string,
  role?: string,
  customNames?: Record<string, string>,
  language: string = 'vi'
): string {
  // 1. Check custom overrides
  if (customNames && customNames[area] && customNames[area].trim()) {
    return customNames[area].trim();
  }

  // 2. Resolve by role definition
  const def = getAreaDefinitionForRole(role);
  const langKey = language === 'en' ? 'en' : 'vi';
  const roleLabel = def.labels[langKey]?.[area] || def.labels.vi?.[area];
  if (roleLabel) {
    return roleLabel;
  }

  // 3. Fallback to default
  const defaultMap: Record<string, { vi: string; en: string }> = {
    Product: { vi: 'Sản phẩm', en: 'Product' },
    Business: { vi: 'Kinh doanh', en: 'Business' },
    Operations: { vi: 'Vận hành', en: 'Operations' },
    Personal: { vi: 'Cá nhân', en: 'Personal' },
    uncategorized: { vi: 'Chưa phân nhóm', en: 'Uncategorized' },
  };

  return defaultMap[area]?.[langKey] || area;
}

/**
 * Get the classification question for an area code.
 */
export function getAreaQuestion(
  area: string,
  role?: string,
  language: string = 'vi'
): string {
  const def = getAreaDefinitionForRole(role);
  const langKey = language === 'en' ? 'en' : 'vi';
  const question = def.questions[langKey]?.[area] || def.questions.vi?.[area];
  if (question) {
    return question;
  }

  if (area === 'uncategorized') {
    return language === 'en'
      ? 'Goals created without a designated category. Assign a group to organize them.'
      : 'Mục tiêu chưa được gán nhóm. Hãy chọn nhóm để sắp xếp ngăn nắp.';
  }

  return '';
}

/**
 * Default fallback names for legacy compatibility.
 */
export const LEGACY_DEFAULT_AREA_NAMES: Record<string, string> = {
  Product: 'Sản phẩm',
  Business: 'Kinh doanh',
  Operations: 'Vận hành',
  Personal: 'Cá nhân',
};
