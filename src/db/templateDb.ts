import Dexie, { type Table } from 'dexie';

// Interfaces
export interface UserTemplate {
  id?: number;
  name: string;
  category: 'registri' | 'attestati' | 'verbali' | 'altro';
  fileBlob: Blob;
  uploadDate: Date;
  isDefault: boolean;
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

  constructor() {
    super('MagicFormDB');
    
    this.version(1).stores({
      templates: '++id, name, category, uploadDate, isDefault',
      settings: '++id'
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
