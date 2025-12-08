import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CourseData,
  Partecipante,
  Sessione,
  Modulo,
  Corso,
  Ente,
  Sede,
  Persona,
  Responsabile,
  FadSettings,
  ExtractionResult
} from '@/types/extraction';
import {
  createEmptyCourseData,
  createEmptyModulo,
  createEmptySessione,
  createEmptyResponsabile,
  createEmptyResponsabileCertificazione,
  type ResponsabileCertificazione
} from '@/types/extraction';

interface WizardState {
  // Navigation
  currentStep: number;

  // Data - 3 blocchi separati per estrazione
  inputCorso: string;        // Blocco 1: Dati Corso Principale
  inputModuli: string;       // Blocco 2: Dati Moduli (CRITICO per ID)
  inputPartecipanti: string; // Blocco 3: Elenco Partecipanti

  extractionResult: ExtractionResult | null;
  courseData: CourseData;
  selectedTemplateIds: number[];
  selectedModuleIndices: number[];

  // Status
  isExtracting: boolean;
  isGenerating: boolean;
  extractionError: string | null;
  signature: string | null;

  // Computed helpers
  isSingleModule: () => boolean;
  isFadCourse: () => boolean;

  // Navigation actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Data actions - 3 input separati
  setInputCorso: (input: string) => void;
  setInputModuli: (input: string) => void;
  setInputPartecipanti: (input: string) => void;
  setExtractionResult: (result: ExtractionResult) => void;
  setCourseData: (data: Partial<CourseData>) => void;

  // Course updates
  updateCorso: (corso: Partial<Corso>) => void;
  updateEnte: (ente: Partial<Ente>) => void;
  updateSede: (sede: Partial<Sede>) => void;
  updateTrainer: (trainer: Partial<Persona>) => void;
  updateTutor: (tutor: Partial<Persona>) => void;
  updateDirettore: (direttore: Partial<{ nome_completo: string; qualifica: string }>) => void;
  updateSupervisore: (supervisore: Partial<Responsabile>) => void;
  updateResponsabileCertificazione: (responsabile: Partial<ResponsabileCertificazione>) => void;

  // Alias per updateSessioneInModulo
  updateSessione: (moduloIndex: number, sessioneIndex: number, sessione: Partial<Sessione>) => void;
  updateFadSettings: (settings: Partial<FadSettings>) => void;
  setNote: (note: string) => void;

  // Modulo actions
  addModulo: (modulo?: Modulo) => void;
  updateModulo: (index: number, modulo: Partial<Modulo>) => void;
  removeModulo: (index: number) => void;

  // Sessione actions (within modulo)
  addSessioneToModulo: (moduloIndex: number, sessione?: Sessione) => void;
  updateSessioneInModulo: (moduloIndex: number, sessioneIndex: number, sessione: Partial<Sessione>) => void;
  removeSessioneFromModulo: (moduloIndex: number, sessioneIndex: number) => void;

  // Partecipante actions
  addPartecipante: (partecipante?: Partecipante) => void;
  updatePartecipante: (index: number, partecipante: Partecipante) => void;
  removePartecipante: (index: number) => void;

  // Template selection
  setSelectedTemplates: (ids: number[]) => void;
  toggleTemplateSelection: (id: number) => void;

  // Module selection for generation
  setSelectedModuleIndices: (indices: number[]) => void;
  toggleModuleSelection: (index: number) => void;

  // Status actions
  setIsExtracting: (value: boolean) => void;
  setIsGenerating: (value: boolean) => void;
  setExtractionError: (error: string | null) => void;
  setSignature: (signature: string | null) => void;

  // Reset
  reset: () => void;
}

const initialCourseData = createEmptyCourseData();

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 0,
      inputCorso: '',
      inputModuli: '',
      inputPartecipanti: '',
      extractionResult: null,
      courseData: initialCourseData,
      selectedTemplateIds: [],
      selectedModuleIndices: [],
      isExtracting: false,
      isGenerating: false,
      extractionError: null,
      signature: null,

      // Computed helpers
      isSingleModule: () => get().courseData.moduli.length <= 1,
      isFadCourse: () => {
        const { corso, moduli } = get().courseData;
        if (corso.tipo === 'FAD') return true;
        return moduli.some(m =>
          m.tipo_sede.toLowerCase().includes('online') ||
          m.tipo_sede.toLowerCase().includes('fad')
        );
      },

      // Navigation
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

      // Data actions - 3 input separati
      setInputCorso: (input) => set({ inputCorso: input }),
      setInputModuli: (input) => set({ inputModuli: input }),
      setInputPartecipanti: (input) => set({ inputPartecipanti: input }),

      setExtractionResult: (result) => {
        const courseData = mapExtractionToCourseData(result);
        set({
          extractionResult: result,
          courseData,
          extractionError: null
        });
      },

      setCourseData: (data) => set((state) => ({
        courseData: { ...state.courseData, ...data }
      })),

      // Course updates
      updateCorso: (corso) => set((state) => ({
        courseData: {
          ...state.courseData,
          corso: { ...state.courseData.corso, ...corso }
        }
      })),

      updateEnte: (ente) => set((state) => ({
        courseData: {
          ...state.courseData,
          ente: {
            ...state.courseData.ente,
            ...ente,
            accreditato: ente.accreditato
              ? { ...state.courseData.ente.accreditato, ...ente.accreditato }
              : state.courseData.ente.accreditato
          }
        }
      })),

      updateSede: (sede) => set((state) => ({
        courseData: {
          ...state.courseData,
          sede: { ...state.courseData.sede, ...sede }
        }
      })),

      updateTrainer: (trainer) => set((state) => ({
        courseData: {
          ...state.courseData,
          trainer: { ...state.courseData.trainer, ...trainer }
        }
      })),

      updateTutor: (tutor) => set((state) => ({
        courseData: {
          ...state.courseData,
          tutor: { ...state.courseData.tutor, ...tutor }
        }
      })),

      updateDirettore: (direttore) => set((state) => ({
        courseData: {
          ...state.courseData,
          direttore: { ...state.courseData.direttore, ...direttore }
        }
      })),

      updateSupervisore: (supervisore) => set((state) => ({
        courseData: {
          ...state.courseData,
          supervisore: { ...state.courseData.supervisore, ...supervisore }
        }
      })),

      updateResponsabileCertificazione: (responsabile) => set((state) => ({
        courseData: {
          ...state.courseData,
          responsabile_certificazione: { ...state.courseData.responsabile_certificazione, ...responsabile }
        }
      })),

      updateFadSettings: (settings) => set((state) => ({
        courseData: {
          ...state.courseData,
          fad_settings: { ...state.courseData.fad_settings, ...settings }
        }
      })),

      setNote: (note) => set((state) => ({
        courseData: {
          ...state.courseData,
          note
        }
      })),

      // Modulo actions
      addModulo: (modulo) => set((state) => ({
        courseData: {
          ...state.courseData,
          moduli: [...state.courseData.moduli, modulo || createEmptyModulo()]
        }
      })),

      updateModulo: (index, modulo) => set((state) => ({
        courseData: {
          ...state.courseData,
          moduli: state.courseData.moduli.map((m, i) =>
            i === index ? { ...m, ...modulo } : m
          )
        }
      })),

      removeModulo: (index) => set((state) => ({
        courseData: {
          ...state.courseData,
          moduli: state.courseData.moduli.filter((_, i) => i !== index)
        }
      })),

      // Sessione actions
      addSessioneToModulo: (moduloIndex, sessione) => set((state) => ({
        courseData: {
          ...state.courseData,
          moduli: state.courseData.moduli.map((m, i) =>
            i === moduloIndex
              ? { ...m, sessioni: [...m.sessioni, sessione || createEmptySessione()] }
              : m
          )
        }
      })),

      updateSessioneInModulo: (moduloIndex, sessioneIndex, sessione) => set((state) => ({
        courseData: {
          ...state.courseData,
          moduli: state.courseData.moduli.map((m, i) =>
            i === moduloIndex
              ? {
                ...m,
                sessioni: m.sessioni.map((s, j) =>
                  j === sessioneIndex ? { ...s, ...sessione } : s
                )
              }
              : m
          )
        }
      })),

      // Alias per updateSessioneInModulo
      updateSessione: (moduloIndex, sessioneIndex, sessione) => set((state) => ({
        courseData: {
          ...state.courseData,
          moduli: state.courseData.moduli.map((m, i) =>
            i === moduloIndex
              ? {
                ...m,
                sessioni: m.sessioni.map((s, j) =>
                  j === sessioneIndex ? { ...s, ...sessione } : s
                )
              }
              : m
          )
        }
      })),

      removeSessioneFromModulo: (moduloIndex, sessioneIndex) => set((state) => ({
        courseData: {
          ...state.courseData,
          moduli: state.courseData.moduli.map((m, i) =>
            i === moduloIndex
              ? { ...m, sessioni: m.sessioni.filter((_, j) => j !== sessioneIndex) }
              : m
          )
        }
      })),

      // Partecipante actions
      addPartecipante: (partecipante) => set((state) => ({
        courseData: {
          ...state.courseData,
          partecipanti: [
            ...state.courseData.partecipanti,
            partecipante || { nome: '', cognome: '', codiceFiscale: '', email: '', telefono: '' }
          ]
        }
      })),

      updatePartecipante: (index, partecipante) => set((state) => ({
        courseData: {
          ...state.courseData,
          partecipanti: state.courseData.partecipanti.map((p, i) =>
            i === index ? partecipante : p
          )
        }
      })),

      removePartecipante: (index) => set((state) => ({
        courseData: {
          ...state.courseData,
          partecipanti: state.courseData.partecipanti.filter((_, i) => i !== index)
        }
      })),

      // Template selection
      setSelectedTemplates: (ids) => set({ selectedTemplateIds: ids }),

      toggleTemplateSelection: (id) => set((state) => {
        const ids = state.selectedTemplateIds;
        if (ids.includes(id)) {
          return { selectedTemplateIds: ids.filter(i => i !== id) };
        }
        return { selectedTemplateIds: [...ids, id] };
      }),

      // Module selection
      setSelectedModuleIndices: (indices) => set({ selectedModuleIndices: indices }),
      toggleModuleSelection: (index) => set((state) => ({
        selectedModuleIndices: state.selectedModuleIndices.includes(index)
          ? state.selectedModuleIndices.filter(i => i !== index)
          : [...state.selectedModuleIndices, index]
      })),

      // Status actions
      setIsExtracting: (value) => set({ isExtracting: value }),
      setIsGenerating: (value) => set({ isGenerating: value }),
      setExtractionError: (error) => set({ extractionError: error }),
      setSignature: (signature) => set({ signature }),

      // Reset
      reset: () => set({
        currentStep: 0,
        inputCorso: '',
        inputModuli: '',
        inputPartecipanti: '',
        extractionResult: null,
        courseData: createEmptyCourseData(),
        selectedTemplateIds: [],
        selectedModuleIndices: [],
        isExtracting: false,
        isGenerating: false,
        extractionError: null,
        signature: null,
      }),
    }),
    {
      name: 'magic-form-wizard',
      partialize: (state) => ({
        inputCorso: state.inputCorso,
        inputModuli: state.inputModuli,
        inputPartecipanti: state.inputPartecipanti,
        courseData: state.courseData,
        selectedTemplateIds: state.selectedTemplateIds,
        selectedModuleIndices: state.selectedModuleIndices,
        signature: state.signature,
      }),
    }
  )
);

// Helper function to map extraction result to CourseData
function mapExtractionToCourseData(result: ExtractionResult): CourseData {
  const base = createEmptyCourseData();

  return {
    corso: {
      ...base.corso,
      ...result.corso,
      offerta_formativa: result.corso?.offerta_formativa || base.corso.offerta_formativa,
    } as Corso,
    moduli: (result.moduli?.length ? result.moduli : [createEmptyModulo()]).map((m, index) => ({
      ...createEmptyModulo(),
      ...m,
      sessioni: m.sessioni?.map((s, i) => ({
        ...createEmptySessione(),
        ...s,
        numero: s.numero || i + 1,
      })) || [],
      sessioni_presenza: m.sessioni_presenza || [],
    })) as Modulo[],
    sede: {
      ...base.sede,
      ...result.sede,
    } as Sede,
    ente: {
      ...base.ente,
      ...result.ente,
      accreditato: {
        ...base.ente.accreditato,
        ...result.ente?.accreditato,
      },
    } as Ente,
    trainer: {
      ...base.trainer,
      ...result.trainer,
    } as Persona,
    tutor: {
      ...base.tutor,
      ...result.tutor,
    } as Persona,
    direttore: {
      ...base.direttore,
      ...result.direttore,
    },
    supervisore: createEmptyResponsabile(),
    responsabile_certificazione: createEmptyResponsabileCertificazione(),
    partecipanti: result.partecipanti || [],
    fad_settings: {
      ...base.fad_settings,
      ...result.fad_settings,
    } as FadSettings,
    note: '',
  };
}
