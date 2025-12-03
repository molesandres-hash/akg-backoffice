import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExtractionResult, CourseData, Partecipante, Sessione, Modulo } from '@/types/extraction';

interface WizardState {
  // Navigation
  currentStep: number;
  
  // Data
  rawInput: string;
  extractionResult: ExtractionResult | null;
  courseData: CourseData;
  selectedTemplateIds: number[];
  
  // Status
  isExtracting: boolean;
  isGenerating: boolean;
  extractionError: string | null;
  
  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  setRawInput: (input: string) => void;
  setExtractionResult: (result: ExtractionResult) => void;
  setCourseData: (data: Partial<CourseData>) => void;
  
  addPartecipante: (partecipante: Partecipante) => void;
  updatePartecipante: (index: number, partecipante: Partecipante) => void;
  removePartecipante: (index: number) => void;
  
  addSessione: (sessione: Sessione) => void;
  updateSessione: (index: number, sessione: Sessione) => void;
  removeSessione: (index: number) => void;
  
  setSelectedTemplates: (ids: number[]) => void;
  toggleTemplateSelection: (id: number) => void;
  
  setIsExtracting: (value: boolean) => void;
  setIsGenerating: (value: boolean) => void;
  setExtractionError: (error: string | null) => void;
  
  reset: () => void;
}

const initialCourseData: CourseData = {
  titoloCorso: '',
  idCorso: '',
  idSezione: '',
  ente: '',
  oreTotali: 0,
  sede: '',
  docenteNome: '',
  docenteCognome: '',
  tutorNome: '',
  tutorCognome: '',
  partecipanti: [],
  sessioni: [],
  moduli: [],
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 0,
      rawInput: '',
      extractionResult: null,
      courseData: initialCourseData,
      selectedTemplateIds: [],
      isExtracting: false,
      isGenerating: false,
      extractionError: null,
      
      // Navigation actions
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
      
      // Data actions
      setRawInput: (input) => set({ rawInput: input }),
      
      setExtractionResult: (result) => {
        // Convert extraction result to editable CourseData
        const courseData: CourseData = {
          titoloCorso: result.titoloCorso,
          idCorso: result.idCorso,
          idSezione: result.idSezione,
          ente: result.ente,
          oreTotali: result.oreTotali,
          sede: result.sede || '',
          docenteNome: result.docente?.nome || '',
          docenteCognome: result.docente?.cognome || '',
          tutorNome: result.tutor?.nome || '',
          tutorCognome: result.tutor?.cognome || '',
          partecipanti: result.partecipanti,
          sessioni: result.moduli.flatMap(m => m.sessioni),
          moduli: result.moduli,
        };
        
        set({ 
          extractionResult: result,
          courseData,
          extractionError: null,
        });
      },
      
      setCourseData: (data) => set((state) => ({
        courseData: { ...state.courseData, ...data }
      })),
      
      // Partecipanti actions
      addPartecipante: (partecipante) => set((state) => ({
        courseData: {
          ...state.courseData,
          partecipanti: [...state.courseData.partecipanti, partecipante]
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
      
      // Sessioni actions
      addSessione: (sessione) => set((state) => ({
        courseData: {
          ...state.courseData,
          sessioni: [...state.courseData.sessioni, sessione]
        }
      })),
      
      updateSessione: (index, sessione) => set((state) => ({
        courseData: {
          ...state.courseData,
          sessioni: state.courseData.sessioni.map((s, i) => 
            i === index ? sessione : s
          )
        }
      })),
      
      removeSessione: (index) => set((state) => ({
        courseData: {
          ...state.courseData,
          sessioni: state.courseData.sessioni.filter((_, i) => i !== index)
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
      
      // Status actions
      setIsExtracting: (value) => set({ isExtracting: value }),
      setIsGenerating: (value) => set({ isGenerating: value }),
      setExtractionError: (error) => set({ extractionError: error }),
      
      // Reset
      reset: () => set({
        currentStep: 0,
        rawInput: '',
        extractionResult: null,
        courseData: initialCourseData,
        selectedTemplateIds: [],
        isExtracting: false,
        isGenerating: false,
        extractionError: null,
      }),
    }),
    {
      name: 'magic-form-wizard',
      partialize: (state) => ({
        rawInput: state.rawInput,
        courseData: state.courseData,
        selectedTemplateIds: state.selectedTemplateIds,
      }),
    }
  )
);
