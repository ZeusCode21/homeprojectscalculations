'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [state, setState] = useState<AppState | null>(null);
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [econ, setEcon] = useState<UnitEcon | null>(null);
  const [metrics, setMetrics] = useState<TopMetrics | null>(null);
  
  // Load on mount
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);
  
  // Recompute when scenario changes
  useEffect(() => {
    if (!state) return;
    
    const scenario = getCurrentScenario(state);
    const newSimResult = sim(scenario);
    const newEcon = unitEcon(scenario);
    const newMetrics = calcTopMetrics(scenario, newSimResult, newEcon);
    
    setSimResult(newSimResult);
    setEcon(newEcon);
    setMetrics(newMetrics);
  }, [state]);
  
  // Save on change
  useEffect(() => {
    if (state) {
      saveState(state);
    }
  }, [state]);
  
  const setBusinessId = useCallback((id: string) => {
    setState(s => s ? setCurrentBusiness(s, id) : s);
  }, []);
  
  const setScenarioId = useCallback((id: string) => {
    setState(s => s ? setCurrentScenario(s, id) : s);
  }, []);
  
  const saveAsNew = useCallback((name: string) => {
    setState(s => s ? createScenario(s, name) : s);
  }, []);
  
  const deleteCurrentScenario = useCallback(() => {
    setState(s => {
      if (!s) return s;
      const business = getCurrentBusiness(s);
      return deleteScenario(s, business.currentScenario);
    });
  }, []);
  
  const resetToDefaults = useCallback(() => {
    setState(s => s ? resetScenario(s) : s);
  }, []);
  
  const exportJson = useCallback(() => {
    if (!state) return '{}';
    return exportBusiness(state);
  }, [state]);
  
  const importJson = useCallback((json: string): boolean => {
    try {
      setState(s => s ? importScenarios(s, json) : s);
      return true;
    } catch {
      return false;
    }
  }, []);
  
  const updateScenarioField = useCallback(<K extends keyof Scenario>(key: K, value: Scenario[K]) => {
    setState(s => {
      if (!s) return s;
      const scenario = clone(getCurrentScenario(s));
      scenario[key] = value;
      normalizeScenario(scenario);
      return updateScenario(s, scenario);
    });
  }, []);
  
  const updateScenarioDeep = useCallback((updater: (s: Scenario) => void) => {
    setState(s => {
      if (!s) return s;
      const scenario = clone(getCurrentScenario(s));
      updater(scenario);
      normalizeScenario(scenario);
      return updateScenario(s, scenario);
    });
  }, []);
  
  const logChange = useCallback((what: string, oldVal: string, newVal: string, reason: 'use real rate' | 'manual') => {
    setState(s => s ? addChangeLog(s, what, oldVal, newVal, reason) : s);
  }, []);
  
  if (!state || !simResult || !econ || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
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
