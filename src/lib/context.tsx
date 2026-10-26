'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Scenario,
  sim,
  unitEcon,
  calcTopMetrics,
  SimResult,
  UnitEcon,
  TopMetrics,
  normalizeScenario,
  clone,
} from './model';
import {
  AppState,
  loadState,
  saveState,
  createDefaultState,
  getCurrentBusiness,
  getCurrentScenario,
  setCurrentBusiness,
  setCurrentScenario,
  updateScenario,
  createScenario,
  deleteScenario,
  resetScenario,
  addChangeLog,
  exportBusiness,
  importScenarios,
  getScenarioMetas,
  ScenarioMeta,
  ChangeLogEntry,
} from './store';

interface ModelContextValue {
  // State
  state: AppState;
  scenario: Scenario;
  simResult: SimResult;
  econ: UnitEcon;
  metrics: TopMetrics;

  // Business
  currentBusinessId: string;
  currentBusinessName: string;
  setBusinessId: (id: string) => void;

  // Scenario
  scenarioMetas: ScenarioMeta[];
  currentScenarioId: string;
  setScenarioId: (id: string) => void;
  saveAsNew: (name: string) => void;
  deleteCurrentScenario: () => void;
  resetToDefaults: () => void;
  exportJson: () => string;
  importJson: (json: string) => boolean;

  // Updates
  updateScenarioField: <K extends keyof Scenario>(key: K, value: Scenario[K]) => void;
  updateScenarioDeep: (updater: (s: Scenario) => void) => void;

  // Change log
  changeLog: ChangeLogEntry[];
  logChange: (what: string, oldVal: string, newVal: string, reason: 'use real rate' | 'manual') => void;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  // Same defaults on server and first client paint → no hydration mismatch.
  // localStorage is applied after mount.
  const [state, setState] = useState<AppState>(() => createDefaultState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hydrate from localStorage after mount
    setState(loadState());
    setHydrated(true);
  }, []);

  const { simResult, econ, metrics } = useMemo(() => {
    const scenario = getCurrentScenario(state);
    const newSimResult = sim(scenario);
    const newEcon = unitEcon(scenario);
    const newMetrics = calcTopMetrics(scenario, newSimResult, newEcon);
    return { simResult: newSimResult, econ: newEcon, metrics: newMetrics };
  }, [state]);

  // Persist after hydration so we don't overwrite stored data with defaults
  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  const setBusinessId = useCallback((id: string) => {
    setState(s => setCurrentBusiness(s, id));
  }, []);

  const setScenarioId = useCallback((id: string) => {
    setState(s => setCurrentScenario(s, id));
  }, []);

  const saveAsNew = useCallback((name: string) => {
    setState(s => createScenario(s, name));
  }, []);

  const deleteCurrentScenario = useCallback(() => {
    setState(s => {
      const business = getCurrentBusiness(s);
      return deleteScenario(s, business.currentScenario);
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setState(s => resetScenario(s));
  }, []);

  const exportJson = useCallback(() => {
    return exportBusiness(state);
  }, [state]);

  const importJson = useCallback((json: string): boolean => {
    try {
      setState(s => importScenarios(s, json));
      return true;
    } catch {
      return false;
    }
  }, []);

  const updateScenarioField = useCallback(<K extends keyof Scenario>(key: K, value: Scenario[K]) => {
    setState(s => {
      const scenario = clone(getCurrentScenario(s));
      scenario[key] = value;
      normalizeScenario(scenario);
      return updateScenario(s, scenario);
    });
  }, []);

  const updateScenarioDeep = useCallback((updater: (s: Scenario) => void) => {
    setState(s => {
      const scenario = clone(getCurrentScenario(s));
      updater(scenario);
      normalizeScenario(scenario);
      return updateScenario(s, scenario);
    });
  }, []);

  const logChange = useCallback((what: string, oldVal: string, newVal: string, reason: 'use real rate' | 'manual') => {
    setState(s => addChangeLog(s, what, oldVal, newVal, reason));
  }, []);

  const business = getCurrentBusiness(state);
  const scenario = getCurrentScenario(state);

  const value: ModelContextValue = {
    state,
    scenario,
    simResult,
    econ,
    metrics,
    currentBusinessId: state.currentBusiness,
    currentBusinessName: business.name,
    setBusinessId,
    scenarioMetas: getScenarioMetas(state),
    currentScenarioId: business.currentScenario,
    setScenarioId,
    saveAsNew,
    deleteCurrentScenario,
    resetToDefaults,
    exportJson,
    importJson,
    updateScenarioField,
    updateScenarioDeep,
    changeLog: business.changeLog,
    logChange,
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) {
    throw new Error('useModel must be used within ModelProvider');
  }
  return ctx;
}
