import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai';
import { 
  SYSTEM_INSTRUCTION, 
  EXTRACTION_SCHEMA,
  STEP1_SCHEMA,
  STEP2_SCHEMA,
  STEP3_SCHEMA 
} from './extractionConfig';
import {
  STEP_1_SYSTEM,
  STEP_1_PROMPT,
  STEP_2_SYSTEM,
  STEP_2_PROMPT,
  STEP_3_SYSTEM,
  STEP_3_PROMPT
} from './extractionSteps';

const API_KEY_STORAGE_KEY = 'gemini_api_key';
const MODEL_NAME = 'gemini-2.5-flash';

export interface RawExtractionResult {
  corso?: {
    id?: string;
    titolo?: string;
    tipo?: string;
    data_inizio?: string;
    data_fine?: string;
    durata_totale?: string;
    ore_totali?: string;
    ore_rendicontabili?: string;
    capienza?: string;
    stato?: string;
    anno?: string;
    programma?: string;
  };
  offerta_formativa?: {
    codice?: string;
    nome?: string;
  };
  moduli?: Array<{
    id?: string;
    id_corso?: string;
    id_sezione?: string;
    titolo?: string;
    data_inizio?: string;
    data_fine?: string;
    ore_totali?: string;
    ore_rendicontabili?: string;
    tipo_sede?: string;
    provider?: string;
    capienza?: string;
    stato?: string;
    argomenti?: string[];
    sessioni_raw?: Array<{
      data: string;
      ora_inizio: string;
      ora_fine: string;
      sede?: string;
      tipo_sede?: string;
      is_fad?: boolean;
    }>;
  }>;
  moduli_ids?: Array<{
    titolo?: string;
    id?: string;
    id_corso?: string;
    id_sezione?: string;
  }>;
  partecipanti?: Array<{
    id?: string;
    nome?: string;
    cognome?: string;
    codice_fiscale?: string;
    email?: string;
    telefono?: string;
    cellulare?: string;
    programma?: string;
    ufficio?: string;
    case_manager?: string;
    benefits?: string;
    frequenza?: string;
  }>;
  trainer?: {
    nome?: string;
    cognome?: string;
    nome_completo?: string;
    codice_fiscale?: string;
  };
  tutor?: {
    nome?: string;
    cognome?: string;
    nome_completo?: string;
    codice_fiscale?: string;
  };
  direttore?: {
    nome_completo?: string;
    qualifica?: string;
  };
  responsabili?: {
    responsabile_certificazione?: {
      nome?: string;
      cognome?: string;
    };
    direttore?: {
      nome?: string;
      cognome?: string;
    };
    supervisore?: {
      nome?: string;
      cognome?: string;
    };
  };
  verbale?: {
    data?: string;
    ora?: string;
    luogo?: string;
    tipo_prova?: string;
    descrizione_prova?: string;
  };
  ente?: {
    id?: string;
    nome?: string;
    indirizzo?: string;
  };
  sede?: {
    nome?: string;
    indirizzo?: string;
    tipo?: string;
    modalita?: string;
  };
  fad_settings?: {
    piattaforma?: string;
    link?: string;
    meeting_id?: string;
    passcode?: string;
  };
  fad_info?: {
    piattaforma?: string;
    modalita_gestione?: string;
    modalita_valutazione?: string;
    id_riunione?: string;
    passcode?: string;
    link?: string;
  };
}

export class GeminiClient {
  private client: GoogleGenerativeAI | null = null;

  private getApiKey(): string | null {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  }

  public setApiKey(apiKey: string): void {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    this.client = null; // Reset client to use new key
  }

  public hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  private initClient(): GoogleGenerativeAI {
    if (this.client) return this.client;
    
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API Key non configurata. Vai nelle Impostazioni per inserirla.');
    }
    
    this.client = new GoogleGenerativeAI(apiKey);
    return this.client;
  }

  private async generateContent(
    systemInstruction: string,
    prompt: string,
    input: string,
    schema: object
  ): Promise<RawExtractionResult> {
    const client = this.initClient();
    
    const model = client.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      } as GenerationConfig,
    });

    const fullPrompt = `${prompt}\n\n---\nDATA INPUT:\n${input}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Gemini response:', text);
      throw new Error('Errore nel parsing della risposta AI. Riprova.');
    }
  }

  /**
   * Standard extraction - single API call for all data
   */
  async extractStandard(input: string): Promise<RawExtractionResult> {
    const prompt = `Analizza i seguenti dati e estrai tutte le informazioni sul corso, moduli, partecipanti e personale.
    
RICORDA: 
- Dai PRIORITÀ ASSOLUTA agli ID Corso e ID Sezione che trovi nella sezione "DATI MODULI (FONTE DI VERITÀ PER ID)"
- IGNORA gli ID presenti nella sezione "DATI CORSO PRINCIPALE" se differiscono da quelli nei moduli`;
    return this.generateContent(SYSTEM_INSTRUCTION, prompt, input, EXTRACTION_SCHEMA);
  }

  /**
   * Step 1: Extract calendar, schedule and module structure (no IDs)
   */
  async extractStep1(input: string): Promise<RawExtractionResult> {
    return this.generateContent(STEP_1_SYSTEM, STEP_1_PROMPT, input, STEP1_SCHEMA);
  }

  /**
   * Step 2: Extract IDs (Course ID, Section ID) and additional info
   */
  async extractStep2(input: string): Promise<RawExtractionResult> {
    return this.generateContent(STEP_2_SYSTEM, STEP_2_PROMPT, input, STEP2_SCHEMA);
  }

  /**
   * Step 3: Extract complete participant list
   */
  async extractStep3(input: string): Promise<RawExtractionResult> {
    return this.generateContent(STEP_3_SYSTEM, STEP_3_PROMPT, input, STEP3_SCHEMA);
  }
}

// Singleton instance
export const geminiClient = new GeminiClient();
