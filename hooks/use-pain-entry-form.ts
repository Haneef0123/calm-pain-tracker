'use client';

import { useReducer, useCallback, useMemo } from 'react';
import { type SpineRegion, type DiscEntry, validateDiscEntry } from '@/types/pain-entry';

// ============================================================================
// Types
// ============================================================================

export interface RegionFormData {
  discs: DiscEntry[];
  sensations: string[];
  radiation: string[];
  aggravators: string[];
  neuroSigns: string[];
}

export interface PainEntryFormState {
  spineRegion: SpineRegion | null;
  cervical: RegionFormData;
  lumbar: RegionFormData;
  painLevel: number;
  notes: string;
}

type FormAction =
  | { type: 'SET_REGION'; region: SpineRegion }
  | { type: 'SET_DISCS'; discs: DiscEntry[] }
  | { type: 'SET_SENSATIONS'; sensations: string[] }
  | { type: 'SET_RADIATION'; radiation: string[] }
  | { type: 'SET_AGGRAVATORS'; aggravators: string[] }
  | { type: 'SET_NEURO_SIGNS'; neuroSigns: string[] }
  | { type: 'SET_PAIN_LEVEL'; level: number }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'RESET' };

// ============================================================================
// Initial State
// ============================================================================

const emptyRegionData: RegionFormData = {
  discs: [],
  sensations: [],
  radiation: [],
  aggravators: [],
  neuroSigns: [],
};

const SMART_DEFAULTS: Record<SpineRegion, string> = {
  cervical: 'C5-C6',
  lumbar: 'L4-L5',
};

const initialFormState: PainEntryFormState = {
  spineRegion: null,
  cervical: { ...emptyRegionData },
  lumbar: { ...emptyRegionData },
  painLevel: 5,
  notes: '',
};

// ============================================================================
// Reducer
// ============================================================================

function formReducer(state: PainEntryFormState, action: FormAction): PainEntryFormState {
  switch (action.type) {
    case 'SET_REGION': {
      const newState = { ...state, spineRegion: action.region };
      // Smart default: auto-set primary disc if none selected for this region
      const regionData = newState[action.region];
      if (regionData.discs.length === 0) {
        const defaultLevel = SMART_DEFAULTS[action.region];
        newState[action.region] = {
          ...regionData,
          discs: [{ level: defaultLevel, role: 'primary' }],
        };
      }
      return newState;
    }

    case 'SET_DISCS': {
      if (!state.spineRegion) return state;
      return {
        ...state,
        [state.spineRegion]: {
          ...state[state.spineRegion],
          discs: action.discs,
        },
      };
    }

    case 'SET_SENSATIONS': {
      if (!state.spineRegion) return state;
      return {
        ...state,
        [state.spineRegion]: {
          ...state[state.spineRegion],
          sensations: action.sensations,
        },
      };
    }

    case 'SET_RADIATION': {
      if (!state.spineRegion) return state;
      return {
        ...state,
        [state.spineRegion]: {
          ...state[state.spineRegion],
          radiation: action.radiation,
        },
      };
    }

    case 'SET_AGGRAVATORS': {
      if (!state.spineRegion) return state;
      return {
        ...state,
        [state.spineRegion]: {
          ...state[state.spineRegion],
          aggravators: action.aggravators,
        },
      };
    }

    case 'SET_NEURO_SIGNS': {
      if (!state.spineRegion) return state;
      return {
        ...state,
        [state.spineRegion]: {
          ...state[state.spineRegion],
          neuroSigns: action.neuroSigns,
        },
      };
    }

    case 'SET_PAIN_LEVEL':
      return { ...state, painLevel: action.level };

    case 'SET_NOTES':
      return { ...state, notes: action.notes };

    case 'RESET':
      return { ...initialFormState };

    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function usePainEntryForm() {
  const [state, dispatch] = useReducer(formReducer, initialFormState);

  // Current region's data
  const currentRegionData = useMemo((): RegionFormData => {
    if (!state.spineRegion) return emptyRegionData;
    return state[state.spineRegion];
  }, [state]);

  // Primary disc from current selection
  const primaryDisc = useMemo(() => {
    return currentRegionData.discs.find((d) => d.role === 'primary');
  }, [currentRegionData.discs]);

  // Validation
  const validation = useMemo(() => {
    return validateDiscEntry({
      spineRegion: state.spineRegion ?? undefined,
      discs: currentRegionData.discs,
      painLevel: state.painLevel,
    });
  }, [state.spineRegion, currentRegionData.discs, state.painLevel]);

  // Actions
  const setSpineRegion = useCallback((region: SpineRegion) => {
    dispatch({ type: 'SET_REGION', region });
  }, []);

  const setDiscs = useCallback((discs: DiscEntry[]) => {
    dispatch({ type: 'SET_DISCS', discs });
  }, []);

  const setSensations = useCallback((sensations: string[]) => {
    dispatch({ type: 'SET_SENSATIONS', sensations });
  }, []);

  const setRadiation = useCallback((radiation: string[]) => {
    dispatch({ type: 'SET_RADIATION', radiation });
  }, []);

  const setAggravators = useCallback((aggravators: string[]) => {
    dispatch({ type: 'SET_AGGRAVATORS', aggravators });
  }, []);

  const setNeuroSigns = useCallback((neuroSigns: string[]) => {
    dispatch({ type: 'SET_NEURO_SIGNS', neuroSigns });
  }, []);

  const setPainLevel = useCallback((level: number) => {
    dispatch({ type: 'SET_PAIN_LEVEL', level });
  }, []);

  const setNotes = useCallback((notes: string) => {
    dispatch({ type: 'SET_NOTES', notes });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Entry data for submission
  const getEntryData = useCallback(() => {
    if (!state.spineRegion) return null;
    
    const regionData = state[state.spineRegion];
    
    return {
      painLevel: state.painLevel,
      // Legacy fields (populated for backward compat)
      locations: [] as string[],
      types: [] as string[],
      radiating: regionData.radiation.length > 0,
      notes: state.notes,
      // New disc-focused fields
      spineRegion: state.spineRegion,
      discs: regionData.discs,
      sensations: regionData.sensations,
      radiation: regionData.radiation,
      aggravatingPositions: regionData.aggravators,
      neurologicalSigns: regionData.neuroSigns,
    };
  }, [state]);

  return {
    // State values
    spineRegion: state.spineRegion,
    discs: currentRegionData.discs,
    sensations: currentRegionData.sensations,
    radiation: currentRegionData.radiation,
    aggravators: currentRegionData.aggravators,
    neuroSigns: currentRegionData.neuroSigns,
    painLevel: state.painLevel,
    notes: state.notes,

    // Computed values
    primaryDisc,
    isValid: validation.valid,
    validationError: validation.error,

    // Actions
    setSpineRegion,
    setDiscs,
    setSensations,
    setRadiation,
    setAggravators,
    setNeuroSigns,
    setPainLevel,
    setNotes,
    reset,
    getEntryData,
  };
}
