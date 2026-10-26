/**
 * State management for the Growth Model
 * Uses localStorage for persistence
 */

import {
  Scenario,
  DEFAULT_SCENARIO,
  clone,
  normalizeScenario,
  uid,
} from './model';

export interface ChangeLogEntry {
  id: string;
  scenarioId: string;
  what: string;
  oldValue: string;
  newValue: string;
  reason: 'use real rate' | 'manual';
  at: number;
}

export interface Business {
  id: string;
  name: string;
  scenarios: Record<string, Scenario>;
  currentScenario: string;
  changeLog: ChangeLogEntry[];
}

export interface AppState {
  currentBusiness: string;
  businesses: Record<string, Business>;
}

const STORE_KEY = 'growthModelV1';

// Create default businesses (also used for SSR / first client paint so hydration matches)
export function createDefaultState(): AppState {
  const homeProjectsScenario = clone(DEFAULT_SCENARIO);
  normalizeScenario(homeProjectsScenario);
  
  return {
    currentBusiness: 'home-projects',
    businesses: {
      'home-projects': {
        id: 'home-projects',
        name: 'Home Projects',
        scenarios: {
          'base': homeProjectsScenario
        },
        currentScenario: 'base',
        changeLog: []
      },
      'safemomma': {
        id: 'safemomma',
        name: 'SafeMomma',
        scenarios: {
          'base': clone(DEFAULT_SCENARIO)
        },
        currentScenario: 'base',
        changeLog: []
      }
    }
  };
}

// Load state from localStorage
export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return createDefaultState();
  }
  
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as AppState;
      // Ensure all scenarios are normalized
      Object.values(state.businesses).forEach(b => {
        Object.values(b.scenarios).forEach(s => normalizeScenario(s));
      });
      return state;
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  
  return createDefaultState();
}

// Save state to localStorage
export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// Get current business
export function getCurrentBusiness(state: AppState): Business {
  return state.businesses[state.currentBusiness];
}

// Get current scenario
export function getCurrentScenario(state: AppState): Scenario {
  const business = getCurrentBusiness(state);
  return business.scenarios[business.currentScenario];
}

// Set current business
export function setCurrentBusiness(state: AppState, businessId: string): AppState {
  return { ...state, currentBusiness: businessId };
}

// Set current scenario
export function setCurrentScenario(state: AppState, scenarioId: string): AppState {
  const newState = clone(state);
  newState.businesses[state.currentBusiness].currentScenario = scenarioId;
  return newState;
}

// Update scenario
export function updateScenario(state: AppState, scenario: Scenario): AppState {
  const newState = clone(state);
  const business = newState.businesses[state.currentBusiness];
  business.scenarios[business.currentScenario] = scenario;
  return newState;
}

// Create new scenario (save as)
export function createScenario(state: AppState, name: string): AppState {
  const newState = clone(state);
  const business = newState.businesses[state.currentBusiness];
  const currentScenario = business.scenarios[business.currentScenario];
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  let newId = slug || uid();
  if (business.scenarios[newId]) {
    newId = `${newId}-${uid().slice(-4)}`;
  }
  business.scenarios[newId] = clone(currentScenario);
  business.currentScenario = newId;
  return newState;
}

// Rename scenario
export function renameScenario(state: AppState, scenarioId: string, newName: string): AppState {
  // Names are stored as keys, so we need to create new entry and delete old
  const newState = clone(state);
  const business = newState.businesses[state.currentBusiness];
  
  if (scenarioId !== newName && business.scenarios[scenarioId]) {
    business.scenarios[newName] = business.scenarios[scenarioId];
    delete business.scenarios[scenarioId];
    if (business.currentScenario === scenarioId) {
      business.currentScenario = newName;
    }
  }
  
  return newState;
}

// Delete scenario
export function deleteScenario(state: AppState, scenarioId: string): AppState {
  const newState = clone(state);
  const business = newState.businesses[state.currentBusiness];
  const keys = Object.keys(business.scenarios);
  
  if (keys.length <= 1) {
    return state; // Keep at least one
  }
  
  delete business.scenarios[scenarioId];
  if (business.currentScenario === scenarioId) {
    business.currentScenario = Object.keys(business.scenarios)[0];
  }
  
  return newState;
}

// Reset scenario to defaults
export function resetScenario(state: AppState): AppState {
  const newState = clone(state);
  const business = newState.businesses[state.currentBusiness];
  const defaultScenario = clone(DEFAULT_SCENARIO);
  normalizeScenario(defaultScenario);
  business.scenarios[business.currentScenario] = defaultScenario;
  return newState;
}

// Add change log entry
export function addChangeLog(
  state: AppState,
  what: string,
  oldValue: string,
  newValue: string,
  reason: 'use real rate' | 'manual'
): AppState {
  const newState = clone(state);
  const business = newState.businesses[state.currentBusiness];
  
  business.changeLog.push({
    id: uid(),
    scenarioId: business.currentScenario,
    what,
    oldValue,
    newValue,
    reason,
    at: Date.now()
  });
  
  return newState;
}

// Export state for a business
export function exportBusiness(state: AppState): string {
  const business = getCurrentBusiness(state);
  return JSON.stringify({
    name: business.name,
    scenarios: business.scenarios,
    currentScenario: business.currentScenario,
    exportedAt: new Date().toISOString()
  }, null, 2);
}

// Import scenarios into current business
export function importScenarios(state: AppState, jsonStr: string): AppState {
  try {
    const data = JSON.parse(jsonStr);
    const newState = clone(state);
    const business = newState.businesses[state.currentBusiness];
    
    if (data.scenarios) {
      // Merge imported scenarios
      Object.entries(data.scenarios).forEach(([key, scenario]) => {
        const s = scenario as Scenario;
        normalizeScenario(s);
        const importKey = `imported-${key}-${Date.now().toString(36).slice(-4)}`;
        business.scenarios[importKey] = s;
      });
    } else if (data.chans && data.plans) {
      // Single scenario format (from reference implementation)
      const s = data as Scenario;
      normalizeScenario(s);
      const importKey = `imported-${Date.now().toString(36)}`;
      business.scenarios[importKey] = s;
      business.currentScenario = importKey;
    }
    
    return newState;
  } catch (e) {
    console.error('Failed to import:', e);
    return state;
  }
}

// Scenario names map (since we use IDs as keys, track display names separately)
export interface ScenarioMeta {
  id: string;
  displayName: string;
}

export function getScenarioMetas(state: AppState): ScenarioMeta[] {
  const business = getCurrentBusiness(state);
  return Object.keys(business.scenarios).map(id => ({
    id,
    displayName: formatScenarioName(id)
  }));
}

function formatScenarioName(id: string): string {
  if (id === 'base') return 'Base plan';
  if (id.startsWith('imported-')) {
    return 'Imported ' + id.slice(9, 13);
  }
  if (id.startsWith('x') && /^x[a-z0-9]+$/i.test(id)) {
    return 'Scenario ' + id.slice(1, 5);
  }
  // Slug ids from save-as: turn "aggressive-ugc" into "Aggressive ugc"
  return id
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
