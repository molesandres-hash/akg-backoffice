import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { CourseData, PlaceholderMap } from '@/types/extraction';
import { mapCourseDataToPlaceholders } from '@/services/mapping/placeholderMapper';
import { generateDocument } from './docxGenerator';
import { 
  generateRegistroPresenze, 
  generateListaPartecipanti, 
  generateReportCompleto,
  generateCalendarioLezioni 
} from './excelGenerator';
import { getAllTemplates, type UserTemplate } from '@/db/templateDb';

export interface ZipConfig {
  includeExcel: boolean;
  includeFadRegistries: boolean;
  includeCertificates: boolean;
  documentsFolderName: string;
  excelFolderName: string;
  fadFolderName: string;
  certificatesFolderName: string;
}

const defaultConfig: ZipConfig = {
  includeExcel: true,
  includeFadRegistries: true,
  includeCertificates: false,
  documentsFolderName: 'Documenti',
  excelFolderName: 'Excel',
  fadFolderName: 'Registri_FAD',
  certificatesFolderName: 'Certificati'
};

/**
 * Main ZIP generation function
 */
export async function generateCourseZip(
  data: CourseData,
  selectedTemplateIds: number[],
  config: Partial<ZipConfig> = {}
): Promise<void> {
  const cfg = { ...defaultConfig, ...config };
  const isMultiModule = data.moduli.length > 1;
  
  if (isMultiModule) {
    await generateMultiModuleZip(data, selectedTemplateIds, cfg);
  } else {
    const zip = await generateSingleModuleZip(data, selectedTemplateIds, 0, cfg);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const fileName = sanitizeFileName(`Corso_${data.corso.id}_${data.corso.titolo}.zip`);
    saveAs(zipBlob, fileName);
  }
}

/**
 * Generate ZIP for single module
 */
async function generateSingleModuleZip(
  data: CourseData,
  templateIds: number[],
  moduleIndex: number,
  config: ZipConfig
): Promise<JSZip> {
  const zip = new JSZip();
  const placeholders = mapCourseDataToPlaceholders(data, moduleIndex);
  const currentModule = data.moduli[moduleIndex];
  
  // 1. Generate Word documents from templates
  if (templateIds.length > 0) {
    const templates = await getAllTemplates();
    const selectedTemplates = templates.filter(t => templateIds.includes(t.id!));
    
    const docsFolder = zip.folder(config.documentsFolderName);
    if (docsFolder) {
      for (const template of selectedTemplates) {
        try {
          const docBlob = await generateDocument(template.fileBlob, placeholders, template.name);
          const fileName = `${template.name}_${data.corso.id}.docx`;
          docsFolder.file(fileName, docBlob);
        } catch (error) {
          console.error(`Error generating template ${template.name}:`, error);
        }
      }
    }
  }
  
  // 2. Generate Excel files
  if (config.includeExcel) {
    const excelFolder = zip.folder(config.excelFolderName);
    if (excelFolder) {
      const registroBlob = generateRegistroPresenze(data, moduleIndex);
      excelFolder.file(`Registro_Presenze_${data.corso.id}.xlsx`, registroBlob);
      
      const calendarioBlob = generateCalendarioLezioni(data, moduleIndex);
      excelFolder.file(`Calendario_Lezioni_${data.corso.id}.xlsx`, calendarioBlob);
      
      const partecipantiBlob = generateListaPartecipanti(data);
      excelFolder.file(`Partecipanti_${data.corso.id}.xlsx`, partecipantiBlob);
      
      const reportBlob = generateReportCompleto(data, moduleIndex);
      excelFolder.file(`Report_Completo_${data.corso.id}.xlsx`, reportBlob);
    }
  }
  
  // 3. Generate FAD registries (one per FAD session)
  if (config.includeFadRegistries) {
    const fadSessions = currentModule?.sessioni?.filter(s => s.is_fad) || [];
    
    if (fadSessions.length > 0) {
      const fadFolder = zip.folder(config.fadFolderName);
      if (fadFolder) {
        // Look for FAD template
        const templates = await getAllTemplates();
        const fadTemplate = templates.find(t => 
          t.name.toLowerCase().includes('fad') || 
          t.name.toLowerCase().includes('modello_a') ||
          t.name.toLowerCase().includes('modello_b')
        );
        
        if (fadTemplate) {
          for (let i = 0; i < fadSessions.length; i++) {
            const session = fadSessions[i];
            const sessionPlaceholders = createFadSessionPlaceholders(data, session, i, placeholders);
            
            try {
              const docBlob = await generateDocument(
                fadTemplate.fileBlob, 
                sessionPlaceholders as PlaceholderMap, 
                fadTemplate.name
              );
              const dateStr = session.data_completa.replace(/\//g, '-');
              fadFolder.file(`Registro_FAD_${dateStr}.docx`, docBlob);
            } catch (error) {
              console.error(`Error generating FAD registry for ${session.data_completa}:`, error);
            }
          }
        }
      }
    }
  }
  
  // 4. Generate certificates (one per participant)
  if (config.includeCertificates) {
    const templates = await getAllTemplates();
    const certTemplate = templates.find(t => 
      t.name.toLowerCase().includes('certificat') || 
      t.name.toLowerCase().includes('attestat')
    );
    
    if (certTemplate && data.partecipanti.length > 0) {
      const certFolder = zip.folder(config.certificatesFolderName);
      if (certFolder) {
        for (const partecipante of data.partecipanti) {
          const certPlaceholders = createCertificatePlaceholders(data, partecipante, placeholders);
          
          try {
            const docBlob = await generateDocument(
              certTemplate.fileBlob, 
              certPlaceholders as PlaceholderMap, 
              certTemplate.name
            );
            const fileName = `Certificato_${partecipante.cognome}_${partecipante.nome}.docx`;
            certFolder.file(sanitizeFileName(fileName), docBlob);
          } catch (error) {
            console.error(`Error generating certificate for ${partecipante.cognome}:`, error);
          }
        }
      }
    }
  }
  
  return zip;
}

/**
 * Generate ZIP for multi-module course
 */
async function generateMultiModuleZip(
  data: CourseData,
  templateIds: number[],
  config: ZipConfig
): Promise<void> {
  const mainZip = new JSZip();
  
  for (let i = 0; i < data.moduli.length; i++) {
    const modulo = data.moduli[i];
    const moduleFolderName = `Modulo_${i + 1}_${sanitizeFileName(modulo.titolo || '')}`;
    
    // Create scoped data for this module
    const scopedData: CourseData = {
      ...data,
      moduli: [modulo], // Only this module
      corso: {
        ...data.corso,
        data_inizio: modulo.data_inizio || data.corso.data_inizio,
        data_fine: modulo.data_fine || data.corso.data_fine,
        ore_totali: modulo.ore_totali || data.corso.ore_totali
      }
    };
    
    const moduleZip = await generateSingleModuleZip(scopedData, templateIds, 0, config);
    
    // Add module zip contents to main zip under module folder
    const moduleFolder = mainZip.folder(moduleFolderName);
    if (moduleFolder) {
      moduleZip.forEach((relativePath, file) => {
        if (!file.dir) {
          moduleFolder.file(relativePath, file.async('blob'));
        }
      });
    }
  }
  
  // Add shared files at root level
  const sharedFolder = mainZip.folder('Condivisi');
  if (sharedFolder) {
    const partecipantiBlob = generateListaPartecipanti(data);
    sharedFolder.file(`Partecipanti_Completo_${data.corso.id}.xlsx`, partecipantiBlob);
    
    const reportBlob = generateReportCompleto(data);
    sharedFolder.file(`Report_Corso_Completo_${data.corso.id}.xlsx`, reportBlob);
  }
  
  const zipBlob = await mainZip.generateAsync({ type: 'blob' });
  const fileName = sanitizeFileName(`Corso_${data.corso.id}_${data.corso.titolo}_MultiModulo.zip`);
  saveAs(zipBlob, fileName);
}

/**
 * Create placeholders specific to a FAD session
 */
function createFadSessionPlaceholders(
  data: CourseData,
  session: any,
  sessionIndex: number,
  basePlaceholders: PlaceholderMap
): Partial<PlaceholderMap> & Record<string, any> {
  return {
    ...basePlaceholders,
    // Session-specific overrides
    DATA_SESSIONE: session.data_completa,
    GIORNO_SESSIONE: session.giorno,
    MESE_SESSIONE: session.mese,
    ANNO_SESSIONE: session.anno,
    ORA_INIZIO_SESSIONE: session.ora_inizio,
    ORA_FINE_SESSIONE: session.ora_fine,
    DURATA_SESSIONE: session.durata || '',
    NUMERO_SESSIONE: sessionIndex + 1,
    // Participants with connection times
    PARTECIPANTI_SESSIONE: data.partecipanti.map((p, i) => ({
      numero: i + 1,
      nome: p.nome,
      cognome: p.cognome,
      nome_completo: `${p.nome} ${p.cognome}`.trim(),
      codice_fiscale: p.codiceFiscale,
      ora_connessione: session.ora_inizio,
      ora_disconnessione: session.ora_fine
    }))
  };
}

/**
 * Create placeholders specific to a certificate
 */
function createCertificatePlaceholders(
  data: CourseData,
  partecipante: any,
  basePlaceholders: PlaceholderMap
): Partial<PlaceholderMap> & Record<string, any> {
  return {
    ...basePlaceholders,
    // Participant-specific
    PARTECIPANTE_NOME: partecipante.nome,
    PARTECIPANTE_COGNOME: partecipante.cognome,
    PARTECIPANTE_NOME_COMPLETO: `${partecipante.nome} ${partecipante.cognome}`.trim(),
    PARTECIPANTE_CF: partecipante.codiceFiscale,
    PARTECIPANTE_EMAIL: partecipante.email || '',
    PARTECIPANTE_TELEFONO: partecipante.telefono || ''
  };
}

/**
 * Sanitize filename for filesystem compatibility
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

/**
 * Generate just Excel files as a simple ZIP
 */
export async function generateExcelOnlyZip(data: CourseData, moduleIndex: number = 0): Promise<void> {
  const zip = new JSZip();
  
  const registroBlob = generateRegistroPresenze(data, moduleIndex);
  zip.file(`Registro_Presenze_${data.corso.id}.xlsx`, registroBlob);
  
  const calendarioBlob = generateCalendarioLezioni(data, moduleIndex);
  zip.file(`Calendario_Lezioni_${data.corso.id}.xlsx`, calendarioBlob);
  
  const partecipantiBlob = generateListaPartecipanti(data);
  zip.file(`Partecipanti_${data.corso.id}.xlsx`, partecipantiBlob);
  
  const reportBlob = generateReportCompleto(data, moduleIndex);
  zip.file(`Report_Completo_${data.corso.id}.xlsx`, reportBlob);
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `Excel_${data.corso.id}.zip`);
}
