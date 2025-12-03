import type { LoanScenario } from '../types';

const STORAGE_KEY = 'mortgage_scenarios';

/**
 * Get all saved scenarios from localStorage
 */
export function getSavedScenarios(): LoanScenario[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading scenarios from localStorage:', error);
    return [];
  }
}

/**
 * Save a scenario to localStorage
 */
export function saveScenario(scenario: LoanScenario): void {
  try {
    const scenarios = getSavedScenarios();
    const existingIndex = scenarios.findIndex((s) => s.id === scenario.id);

    if (existingIndex >= 0) {
      scenarios[existingIndex] = { ...scenario, updatedAt: new Date().toISOString() };
    } else {
      scenarios.push(scenario);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch (error) {
    console.error('Error saving scenario to localStorage:', error);
  }
}

/**
 * Delete a scenario from localStorage
 */
export function deleteScenario(scenarioId: string): void {
  try {
    const scenarios = getSavedScenarios();
    const filtered = scenarios.filter((s) => s.id !== scenarioId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting scenario from localStorage:', error);
  }
}

/**
 * Get a specific scenario by ID
 */
export function getScenarioById(scenarioId: string): LoanScenario | null {
  const scenarios = getSavedScenarios();
  return scenarios.find((s) => s.id === scenarioId) ?? null;
}

/**
 * Update email tracking for a scenario
 */
export function updateEmailTracking(
  scenarioId: string,
  updates: Partial<{ sent: number; opened: number; lastSentAt: string; lastOpenedAt: string }>
): void {
  try {
    const scenarios = getSavedScenarios();
    const scenario = scenarios.find((s) => s.id === scenarioId);

    if (scenario) {
      scenario.emailTracking = { ...scenario.emailTracking, ...updates };
      scenario.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    }
  } catch (error) {
    console.error('Error updating email tracking:', error);
  }
}
