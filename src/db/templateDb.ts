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

export interface UserSettings {
  id?: number;
  defaultTrainerName: string;
  defaultTrainerSurname: string;
  defaultTutorName: string;
  defaultTutorSurname: string;
  defaultLocation: string;
  defaultEntityName: string;
  geminiApiKey: string;
}

// Database class
class TemplateDatabase extends Dexie {
  templates!: Table<UserTemplate, number>;
  settings!: Table<UserSettings, number>;
  systemTemplates!: Table<SystemTemplate, number>;

  constructor() {
    super('MagicFormDB');
    
    this.version(2).stores({
      templates: '++id, name, category, uploadDate, isDefault',
      settings: '++id',
      systemTemplates: '++id, &type, uploadDate'
    });
  }
}

// Database instance
export const db = new TemplateDatabase();

// Helper functions
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

// Clear all templates (for reset functionality)
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
