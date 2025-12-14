import Dexie, { type Table } from 'dexie';

// System Template Types - dedicated slots for specific document types
export type SystemTemplateType =
  | 'modello_a_fad'           // Registro Generale FAD
  | 'modello_b_fad'           // Registro Giornaliero FAD (per sessione)
  | 'certificato'             // Attestato/Certificato per partecipante
  | 'calendario_condizionalita' // Modulo 5 - GOL/PNRR
  | 'verbale_ammissione'      // Verbale ammissione esame
  | 'registro_presenza'       // Registro presenze cartaceo
  | 'verbale_finale'          // Verbale finale/scrutinio
  | 'comunicazione_evento'    // Modulo 7 - per beneficiario per lezione
  | 'registro_giornaliero'    // Modulo 8 - per sessione presenza
  | 'registro_didattico'      // Registro didattico del corso
  | 'verbale_scrutinio';      // Verbale scrutinio finale

// Interfaces
export interface UserTemplate {
  id?: number;
  name: string;
  category: 'registri' | 'attestati' | 'verbali' | 'altro';
  fileBlob: Blob;
  uploadDate: Date;
  isDefault: boolean;
}

export interface SystemTemplate {
  id?: number;
  type: SystemTemplateType;
  name: string;
  fileBlob: Blob;
  uploadDate: Date;
}

export type ExtractionMode = 'standard' | 'multi-step' | 'double-check';

export interface UserSettings {
  id?: number;
  defaultTrainerName: string;
  defaultTrainerSurname: string;
  defaultTutorName: string;
  defaultTutorSurname: string;
  defaultLocation: string;
  defaultEntityName: string;
  geminiApiKey: string;
  extractionMode: ExtractionMode;
}

// === Default Data Interfaces ===

export interface DefaultDocente {
  id?: number;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  email: string;
  telefono: string;
  isDefault: boolean;
}

export interface DefaultSupervisore {
  id?: number;
  nome: string;
  cognome: string;
  qualifica: string;
  isDefault: boolean;
}

export interface DefaultEnte {
  id?: number;
  nome: string;
  indirizzo: string;
  isDefault: boolean;
}

export interface DefaultSede {
  id?: number;
  nome: string;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  enteId?: number;
  isDefault: boolean;
}

export interface DefaultPiattaformaFad {
  id?: number;
  nome: string;
  linkBase: string;
  idRiunione?: string;
  password?: string;
  isDefault: boolean;
}

export interface ListaArgomenti {
  id?: number;
  nome: string;
  argomenti: string[];
}

// === NEW: Responsabile Certificazione con campi completi ===
export interface DefaultResponsabileCertificazione {
  id?: number;
  nome: string;
  cognome: string;
  dataNascita: string;
  luogoNascita: string;
  residenza: string;
  documento: string;
  isDefault: boolean;
}

// === NEW: Offerta Formativa GOL ===
export interface OffertaFormativaDB {
  id?: number;
  codice: string;
  nome: string;
  descrizione: string;
}

// Database class
class TemplateDatabase extends Dexie {
  templates!: Table<UserTemplate, number>;
  settings!: Table<UserSettings, number>;
  systemTemplates!: Table<SystemTemplate, number>;
  docenti!: Table<DefaultDocente, number>;
  supervisori!: Table<DefaultSupervisore, number>;
  enti!: Table<DefaultEnte, number>;
  sedi!: Table<DefaultSede, number>;
  piattaforme!: Table<DefaultPiattaformaFad, number>;
  listeArgomenti!: Table<ListaArgomenti, number>;
  responsabiliCertificazione!: Table<DefaultResponsabileCertificazione, number>;
  offerteFormative!: Table<OffertaFormativaDB, number>;

  constructor() {
    super('MagicFormDB');

    this.version(4).stores({
      templates: '++id, name, category, uploadDate, isDefault',
      settings: '++id',
      systemTemplates: '++id, &type, uploadDate',
      docenti: '++id, cognome, isDefault',
      supervisori: '++id, cognome, isDefault',
      enti: '++id, nome, isDefault',
      sedi: '++id, nome, enteId, isDefault',
      piattaforme: '++id, nome, isDefault',
      listeArgomenti: '++id, nome',
      responsabiliCertificazione: '++id, cognome, isDefault',
      offerteFormative: '++id, codice, nome'
    });
  }
}

// Database instance
export const db = new TemplateDatabase();

// Helper functions - User Templates
export async function getTemplatesByCategory(category: UserTemplate['category']): Promise<UserTemplate[]> {
  return db.templates.where('category').equals(category).toArray();
}

export async function getAllTemplates(): Promise<UserTemplate[]> {
  return db.templates.toArray();
}

export async function addTemplate(template: Omit<UserTemplate, 'id'>): Promise<number> {
  return db.templates.add(template);
}

export async function deleteTemplate(id: number): Promise<void> {
  return db.templates.delete(id);
}

export async function getTemplateById(id: number): Promise<UserTemplate | undefined> {
  return db.templates.get(id);
}

// Helper functions - Settings
export async function getSettings(): Promise<UserSettings | undefined> {
  const settings = await db.settings.toArray();
  return settings[0];
}

export async function saveSettings(settings: Omit<UserSettings, 'id'>): Promise<void> {
  const existing = await getSettings();
  if (existing?.id) {
    await db.settings.update(existing.id, settings);
  } else {
    await db.settings.add(settings);
  }
}

export async function hasTemplates(): Promise<boolean> {
  const count = await db.templates.count();
  return count > 0;
}

export async function clearAllTemplates(): Promise<void> {
  await db.templates.clear();
}

// System Template functions
export async function getSystemTemplate(type: SystemTemplateType): Promise<SystemTemplate | undefined> {
  return db.systemTemplates.where('type').equals(type).first();
}

export async function getAllSystemTemplates(): Promise<SystemTemplate[]> {
  return db.systemTemplates.toArray();
}

export async function setSystemTemplate(type: SystemTemplateType, file: File | Blob, name: string): Promise<void> {
  const existing = await getSystemTemplate(type);
  const fileBlob = file instanceof File ? file : file;

  if (existing?.id) {
    await db.systemTemplates.update(existing.id, {
      name,
      fileBlob,
      uploadDate: new Date()
    });
  } else {
    await db.systemTemplates.add({
      type,
      name,
      fileBlob,
      uploadDate: new Date()
    });
  }
}

export async function deleteSystemTemplate(type: SystemTemplateType): Promise<void> {
  const template = await getSystemTemplate(type);
  if (template?.id) {
    await db.systemTemplates.delete(template.id);
  }
}

// === Docenti Functions ===
export async function getAllDocenti(): Promise<DefaultDocente[]> {
  return db.docenti.toArray();
}

export async function addDocente(docente: Omit<DefaultDocente, 'id'>): Promise<number> {
  return db.docenti.add(docente);
}

export async function updateDocente(id: number, docente: Partial<DefaultDocente>): Promise<void> {
  await db.docenti.update(id, docente);
}

export async function deleteDocente(id: number): Promise<void> {
  await db.docenti.delete(id);
}

export async function getDefaultDocente(): Promise<DefaultDocente | undefined> {
  return db.docenti.where('isDefault').equals(1).first();
}

export async function setDefaultDocente(id: number): Promise<void> {
  await db.docenti.toCollection().modify({ isDefault: false });
  await db.docenti.update(id, { isDefault: true });
}

// === Supervisori Functions ===
export async function getAllSupervisori(): Promise<DefaultSupervisore[]> {
  return db.supervisori.toArray();
}

export async function addSupervisore(supervisore: Omit<DefaultSupervisore, 'id'>): Promise<number> {
  return db.supervisori.add(supervisore);
}

export async function updateSupervisore(id: number, supervisore: Partial<DefaultSupervisore>): Promise<void> {
  await db.supervisori.update(id, supervisore);
}

export async function deleteSupervisore(id: number): Promise<void> {
  await db.supervisori.delete(id);
}

export async function getDefaultSupervisore(): Promise<DefaultSupervisore | undefined> {
  return db.supervisori.where('isDefault').equals(1).first();
}

export async function setDefaultSupervisore(id: number): Promise<void> {
  await db.supervisori.toCollection().modify({ isDefault: false });
  await db.supervisori.update(id, { isDefault: true });
}

// === Enti Functions ===
export async function getAllEnti(): Promise<DefaultEnte[]> {
  return db.enti.toArray();
}

export async function addEnte(ente: Omit<DefaultEnte, 'id'>): Promise<number> {
  return db.enti.add(ente);
}

export async function updateEnte(id: number, ente: Partial<DefaultEnte>): Promise<void> {
  await db.enti.update(id, ente);
}

export async function deleteEnte(id: number): Promise<void> {
  await db.enti.delete(id);
  // Also delete associated sedi
  await db.sedi.where('enteId').equals(id).delete();
}

export async function getDefaultEnte(): Promise<DefaultEnte | undefined> {
  return db.enti.where('isDefault').equals(1).first();
}

export async function setDefaultEnte(id: number): Promise<void> {
  await db.enti.toCollection().modify({ isDefault: false });
  await db.enti.update(id, { isDefault: true });
}

// === Sedi Functions ===
export async function getAllSedi(): Promise<DefaultSede[]> {
  return db.sedi.toArray();
}

export async function getSediByEnte(enteId: number): Promise<DefaultSede[]> {
  return db.sedi.where('enteId').equals(enteId).toArray();
}

export async function addSede(sede: Omit<DefaultSede, 'id'>): Promise<number> {
  return db.sedi.add(sede);
}

export async function updateSede(id: number, sede: Partial<DefaultSede>): Promise<void> {
  await db.sedi.update(id, sede);
}

export async function deleteSede(id: number): Promise<void> {
  await db.sedi.delete(id);
}

export async function getDefaultSede(): Promise<DefaultSede | undefined> {
  return db.sedi.where('isDefault').equals(1).first();
}

export async function setDefaultSede(id: number): Promise<void> {
  await db.sedi.toCollection().modify({ isDefault: false });
  await db.sedi.update(id, { isDefault: true });
}

// === Piattaforme FAD Functions ===
export async function getAllPiattaforme(): Promise<DefaultPiattaformaFad[]> {
  return db.piattaforme.toArray();
}

export async function addPiattaforma(piattaforma: Omit<DefaultPiattaformaFad, 'id'>): Promise<number> {
  return db.piattaforme.add(piattaforma);
}

export async function updatePiattaforma(id: number, piattaforma: Partial<DefaultPiattaformaFad>): Promise<void> {
  await db.piattaforme.update(id, piattaforma);
}

export async function deletePiattaforma(id: number): Promise<void> {
  await db.piattaforme.delete(id);
}

export async function getDefaultPiattaforma(): Promise<DefaultPiattaformaFad | undefined> {
  return db.piattaforme.where('isDefault').equals(1).first();
}

export async function setDefaultPiattaforma(id: number): Promise<void> {
  await db.piattaforme.toCollection().modify({ isDefault: false });
  await db.piattaforme.update(id, { isDefault: true });
}

// === Liste Argomenti Functions ===
export async function getAllListeArgomenti(): Promise<ListaArgomenti[]> {
  return db.listeArgomenti.toArray();
}

export async function addListaArgomenti(lista: Omit<ListaArgomenti, 'id'>): Promise<number> {
  return db.listeArgomenti.add(lista);
}

export async function updateListaArgomenti(id: number, lista: Partial<ListaArgomenti>): Promise<void> {
  await db.listeArgomenti.update(id, lista);
}

export async function deleteListaArgomenti(id: number): Promise<void> {
  await db.listeArgomenti.delete(id);
}

export async function getListaArgomentiById(id: number): Promise<ListaArgomenti | undefined> {
  return db.listeArgomenti.get(id);
}

// === NEW: Responsabili Certificazione Functions ===
export async function getAllResponsabiliCertificazione(): Promise<DefaultResponsabileCertificazione[]> {
  return db.responsabiliCertificazione.toArray();
}

export async function addResponsabileCertificazione(resp: Omit<DefaultResponsabileCertificazione, 'id'>): Promise<number> {
  return db.responsabiliCertificazione.add(resp);
}

export async function updateResponsabileCertificazione(id: number, resp: Partial<DefaultResponsabileCertificazione>): Promise<void> {
  await db.responsabiliCertificazione.update(id, resp);
}

export async function deleteResponsabileCertificazione(id: number): Promise<void> {
  await db.responsabiliCertificazione.delete(id);
}

export async function getDefaultResponsabileCertificazione(): Promise<DefaultResponsabileCertificazione | undefined> {
  return db.responsabiliCertificazione.where('isDefault').equals(1).first();
}

export async function setDefaultResponsabileCertificazione(id: number): Promise<void> {
  await db.responsabiliCertificazione.toCollection().modify({ isDefault: false });
  await db.responsabiliCertificazione.update(id, { isDefault: true });
}

// === NEW: Offerte Formative Functions ===
export async function getAllOfferteFormative(): Promise<OffertaFormativaDB[]> {
  return db.offerteFormative.toArray();
}

export async function addOffertaFormativa(offerta: Omit<OffertaFormativaDB, 'id'>): Promise<number> {
  return db.offerteFormative.add(offerta);
}

export async function updateOffertaFormativa(id: number, offerta: Partial<OffertaFormativaDB>): Promise<void> {
  await db.offerteFormative.update(id, offerta);
}

export async function deleteOffertaFormativa(id: number): Promise<void> {
  await db.offerteFormative.delete(id);
}

export async function getOffertaFormativaByCodice(codice: string): Promise<OffertaFormativaDB | undefined> {
  return db.offerteFormative.where('codice').equals(codice).first();
}
