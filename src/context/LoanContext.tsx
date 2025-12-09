import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { LoanScenario, LoanInputs, LoanType, LoanCalculation, EmailTracking, VideoMessage } from '../types';
import { DEFAULT_INTEREST_RATES } from '../types';
import { calculateAllLoans } from '../utils/mortgageCalculations';
import { getSavedScenarios, saveScenario, deleteScenario } from '../utils/storage';
import { getSharedScenarioFromUrl, clearSharedScenarioFromUrl } from '../utils/urlSharing';
import { recordView } from '../utils/viewTracking';

interface LoanContextType {
  // Current scenario state
  currentScenario: LoanScenario;
  calculations: LoanCalculation[];

  // Client view mode (when opened from shared URL)
  isClientView: boolean;
  clientName: string | null;

  // Input handlers
  updateInputs: (updates: Partial<LoanInputs>) => void;
  updateInterestRate: (loanType: LoanType, rate: number) => void;

  // Loan type selection
  toggleLoanType: (loanType: LoanType) => void;
  isLoanTypeSelected: (loanType: LoanType) => boolean;

  // Scenario management
  savedScenarios: LoanScenario[];
  saveCurrentScenario: (name?: string) => void;
  loadScenario: (scenarioId: string) => void;
  deleteScenarioById: (scenarioId: string) => void;
  createNewScenario: () => void;
  updateScenarioName: (name: string) => void;
  updateClientName: (clientName: string) => void;
  updateTrackingId: (trackingId: string) => void;

  // Email tracking (mock)
  simulateEmailSent: () => void;
  simulateEmailOpened: () => void;

  // Video message
  updateVideoMessage: (videoMessage: VideoMessage) => void;
}

const defaultInputs: LoanInputs = {
  homePrice: 400000,
  downPayment: 20000,
  creditScore: '720-739',
  annualTaxes: 4800,
  annualInsurance: 1800,
  monthlyHOA: 0,
  interestRates: { ...DEFAULT_INTEREST_RATES },
  borrowerCount: 'single',
  firstTimeHomeBuyer: false,
  pmiOption: 'bpmi',
};

const defaultEmailTracking: EmailTracking = {
  sent: 0,
  opened: 0,
};

const createDefaultScenario = (): LoanScenario => ({
  id: uuidv4(),
  name: 'New Scenario',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  inputs: { ...defaultInputs },
  selectedLoanTypes: ['conventional30', 'conventional15', 'fha30', 'va30'],
  calculations: [],
  emailTracking: { ...defaultEmailTracking },
});

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export function LoanProvider({ children }: { children: ReactNode }) {
  const [currentScenario, setCurrentScenario] = useState<LoanScenario>(createDefaultScenario);
  const [savedScenarios, setSavedScenarios] = useState<LoanScenario[]>([]);
  const [calculations, setCalculations] = useState<LoanCalculation[]>([]);
  const [isClientView, setIsClientView] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);

  // Load saved scenarios on mount
  useEffect(() => {
    setSavedScenarios(getSavedScenarios());
  }, []);

  // Check for shared scenario in URL on mount
  useEffect(() => {
    const sharedData = getSharedScenarioFromUrl();
    if (sharedData) {
      // Record the view if tracking ID is present (async, fire and forget)
      if (sharedData.trackingId) {
        recordView(sharedData.trackingId, sharedData.clientName).catch(() => {
          // Ignore errors - view tracking is best effort
        });
      }

      // Create a new scenario with the shared data
      const sharedScenario: LoanScenario = {
        id: uuidv4(),
        name: sharedData.clientName ? `Scenario for ${sharedData.clientName}` : 'Your Loan Comparison',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        inputs: sharedData.inputs,
        selectedLoanTypes: sharedData.selectedLoanTypes,
        calculations: [],
        emailTracking: { ...defaultEmailTracking },
        videoMessage: sharedData.vimeoId ? { vimeoId: sharedData.vimeoId } : undefined,
      };
      setCurrentScenario(sharedScenario);
      setIsClientView(true);
      setClientName(sharedData.clientName || null);
      // Clear the URL parameter but keep client view active
      clearSharedScenarioFromUrl();
    }
  }, []);

  // Recalculate when inputs or selected loan types change
  useEffect(() => {
    const newCalculations = calculateAllLoans(currentScenario.inputs, currentScenario.selectedLoanTypes);
    setCalculations(newCalculations);
    setCurrentScenario((prev) => ({ ...prev, calculations: newCalculations }));
  }, [currentScenario.inputs, currentScenario.selectedLoanTypes]);

  const updateInputs = useCallback((updates: Partial<LoanInputs>) => {
    setCurrentScenario((prev) => ({
      ...prev,
      inputs: { ...prev.inputs, ...updates },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateInterestRate = useCallback((loanType: LoanType, rate: number) => {
    setCurrentScenario((prev) => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        interestRates: { ...prev.inputs.interestRates, [loanType]: rate },
      },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const toggleLoanType = useCallback((loanType: LoanType) => {
    setCurrentScenario((prev) => {
      const isSelected = prev.selectedLoanTypes.includes(loanType);
      let newSelectedTypes: LoanType[];

      if (isSelected) {
        // Don't allow deselecting if only one is selected
        if (prev.selectedLoanTypes.length <= 1) return prev;
        newSelectedTypes = prev.selectedLoanTypes.filter((t) => t !== loanType);
      } else {
        // Don't allow more than 4 selections
        if (prev.selectedLoanTypes.length >= 4) return prev;
        newSelectedTypes = [...prev.selectedLoanTypes, loanType];
      }

      return {
        ...prev,
        selectedLoanTypes: newSelectedTypes,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const isLoanTypeSelected = useCallback(
    (loanType: LoanType) => currentScenario.selectedLoanTypes.includes(loanType),
    [currentScenario.selectedLoanTypes]
  );

  const saveCurrentScenario = useCallback(
    (name?: string) => {
      const scenarioToSave = {
        ...currentScenario,
        name: name || currentScenario.name,
        updatedAt: new Date().toISOString(),
      };
      saveScenario(scenarioToSave);
      setSavedScenarios(getSavedScenarios());
    },
    [currentScenario]
  );

  const loadScenario = useCallback((scenarioId: string) => {
    const scenarios = getSavedScenarios();
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      setCurrentScenario(scenario);
    }
  }, []);

  const deleteScenarioById = useCallback((scenarioId: string) => {
    deleteScenario(scenarioId);
    setSavedScenarios(getSavedScenarios());
  }, []);

  const createNewScenario = useCallback(() => {
    setCurrentScenario(createDefaultScenario());
  }, []);

  const updateScenarioName = useCallback((name: string) => {
    setCurrentScenario((prev) => ({
      ...prev,
      name,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateClientName = useCallback((clientName: string) => {
    setCurrentScenario((prev) => ({
      ...prev,
      clientName,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateTrackingId = useCallback((trackingId: string) => {
    setCurrentScenario((prev) => ({
      ...prev,
      trackingId,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Mock email functions
  const simulateEmailSent = useCallback(() => {
    setCurrentScenario((prev) => ({
      ...prev,
      emailTracking: {
        ...prev.emailTracking,
        sent: prev.emailTracking.sent + 1,
        lastSentAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const simulateEmailOpened = useCallback(() => {
    setCurrentScenario((prev) => ({
      ...prev,
      emailTracking: {
        ...prev.emailTracking,
        opened: prev.emailTracking.opened + 1,
        lastOpenedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateVideoMessage = useCallback((videoMessage: VideoMessage) => {
    setCurrentScenario((prev) => ({
      ...prev,
      videoMessage: { ...prev.videoMessage, ...videoMessage },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const value: LoanContextType = {
    currentScenario,
    calculations,
    isClientView,
    clientName,
    updateInputs,
    updateInterestRate,
    toggleLoanType,
    isLoanTypeSelected,
    savedScenarios,
    saveCurrentScenario,
    loadScenario,
    deleteScenarioById,
    createNewScenario,
    updateScenarioName,
    updateClientName,
    updateTrackingId,
    simulateEmailSent,
    simulateEmailOpened,
    updateVideoMessage,
  };

  return <LoanContext.Provider value={value}>{children}</LoanContext.Provider>;
}

export function useLoan() {
  const context = useContext(LoanContext);
  if (context === undefined) {
    throw new Error('useLoan must be used within a LoanProvider');
  }
  return context;
}
