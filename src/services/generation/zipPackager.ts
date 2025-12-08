import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { CourseData, PlaceholderMap, Partecipante, Sessione } from '@/types/extraction';
import { mapCourseDataToPlaceholders, calculateDurationWithLunchBreak } from '@/services/mapping/placeholderMapper';
import { generateDocument } from './docxGenerator';
import { ProgrammaticDocxGenerator } from './ProgrammaticDocxGenerator';
import {
  generateRegistroPresenze,
  generateListaPartecipanti,
  generateReportCompleto,
  generateCalendarioLezioni
} from './excelGenerator';
import { getAllTemplates, getSystemTemplate, type UserTemplate } from '@/db/templateDb';

export interface ZipConfig {
  includeExcel: boolean;
  includeFadRegistries: boolean;
  includeCertificates: boolean;
  includeModulo5: boolean;
  includeModulo7: boolean;
  includeModulo8: boolean;
  includeReadme: boolean;
  includeMetadata: boolean;
  documentsFolderName: string;
  excelFolderName: string;
  fadFolderName: string;
  certificatesFolderName: string;
  modulo5FolderName: string;
  modulo7FolderName: string;
  modulo8FolderName: string;
  useProgrammaticGeneration?: boolean;
  onlyUserTemplates?: boolean;
}

const defaultConfig: ZipConfig = {
  includeExcel: true,
  includeFadRegistries: true,
  includeCertificates: false,
  includeModulo5: false,
  includeModulo7: false,
  includeModulo8: false,
  includeReadme: false,
  includeMetadata: false,
  documentsFolderName: 'Documenti',
  excelFolderName: 'Excel',
  fadFolderName: 'Registri_FAD',
  certificatesFolderName: 'certificati AKG',
  modulo5FolderName: 'modulo 5',
  modulo7FolderName: 'modulo 7',
  modulo8FolderName: 'modulo 8',
  useProgrammaticGeneration: false,
  onlyUserTemplates: false
};

/**
 * Main ZIP generation function
 */
export async function generateCourseZip(
  data: CourseData,
  selectedTemplateIds: number[],
  config: Partial<ZipConfig> = {},
  signature: string | null = null
): Promise<void> {
  const cfg = { ...defaultConfig, ...config };
  const isMultiModule = data.moduli.length > 1;

  if (isMultiModule) {
    await generateMultiModuleZip(data, selectedTemplateIds, cfg, signature);
  } else {
    const zip = await generateSingleModuleZip(data, selectedTemplateIds, 0, cfg, signature);
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
  config: ZipConfig,
  signature: string | null = null
): Promise<JSZip> {
  const zip = new JSZip();
  const basePlaceholders = mapCourseDataToPlaceholders(data, moduleIndex);
  const placeholders = {
    ...basePlaceholders,
    FIRMA_DOCENTE: signature || ''
  };
  const currentModule = data.moduli[moduleIndex];

  console.log('📦 [zipPackager] Starting ZIP generation for module:', moduleIndex);
  console.log('📦 [zipPackager] Course ID:', data.corso.id);

  // 1. Generate Word documents from user templates
  if (templateIds.length > 0) {
    const templates = await getAllTemplates();
    const selectedTemplates = templates.filter(t => templateIds.includes(t.id!));

    const docsFolder = zip.folder(config.documentsFolderName);
    if (docsFolder) {
      for (const template of selectedTemplates) {
        try {
          const docBlob = await generateDocument(template.fileBlob, placeholders, template.name);
          const fileName = `${template.name}_${data.corso.id}.docx`;
          docsFolder.file(sanitizeFileName(fileName), docBlob);
        } catch (error) {
          console.error(`Error generating template ${template.name}:`, error);
        }
      }
    }
  }

  // SYSTEM TEMPLATES - Skippable if testing custom templates
  if (!config.onlyUserTemplates) {

    // ROOT FILES
    // Registro Presenza ID nella root
    const registroPresenzaTemplate = await getSystemTemplate('registro_presenza');
    console.log('📄 [zipPackager] registro_presenza template:', registroPresenzaTemplate ? `FOUND (${registroPresenzaTemplate.name}, ${registroPresenzaTemplate.fileBlob?.size} bytes)` : 'NOT FOUND');

    if (registroPresenzaTemplate) {
      try {
        const docBlob = await generateDocument(registroPresenzaTemplate.fileBlob, placeholders, registroPresenzaTemplate.name);
        zip.file(`Registro presenza ${data.corso.id}.docx`, docBlob);
        console.log('✅ [zipPackager] Added Registro Presenza to ZIP');
      } catch (error) {
        console.error('❌ [zipPackager] Error generating Registro Presenza:', error);
      }
    } else {
      console.warn('⚠️ [zipPackager] Skipping Registro Presenza - template not configured');
    }

    // Verbale Ammissione Esame nella root
    const verbaleAmmissioneTemplate = await getSystemTemplate('verbale_ammissione');
    console.log('📄 [zipPackager] verbale_ammissione template:', verbaleAmmissioneTemplate ? `FOUND (${verbaleAmmissioneTemplate.name}, ${verbaleAmmissioneTemplate.fileBlob?.size} bytes)` : 'NOT FOUND');

    if (verbaleAmmissioneTemplate) {
      try {
        const docBlob = await generateDocument(verbaleAmmissioneTemplate.fileBlob, placeholders, verbaleAmmissioneTemplate.name);
        zip.file(`Verbale_Ammissione_Esame_${data.corso.id}.docx`, docBlob);
        console.log('✅ [zipPackager] Added Verbale Ammissione to ZIP');
      } catch (error) {
        console.error('❌ [zipPackager] Error generating Verbale Ammissione:', error);
      }
    } else {
      console.warn('⚠️ [zipPackager] Skipping Verbale Ammissione - template not configured');
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
          if (config.useProgrammaticGeneration) {
            // --- NEW PROGRAMMATIC GENERATION FOR FAD REGISTRY ---
            console.log('🤖 [zipPackager] Using Programmatic Generation for FAD Registry (Modello A & Modello B)');
            const generator = new ProgrammaticDocxGenerator();

            // 1. Modello A (Modello A) - One per course/module? Actually it's one per course typically, or one per module?
            // The existing code did: fadFolder.file(`Modello_A_FAD_Completo_${data.corso.id}.docx`, docBlob);
            try {
              const docBlob = await generator.generateModelloA(data);
              fadFolder.file(`Modello_A_FAD_Completo_${data.corso.id}.docx`, docBlob);
              console.log('✅ [zipPackager] Added Programmatic Modello A to ZIP');
            } catch (error) {
              console.error('❌ [zipPackager] Error generating Programmatic Modello A:', error);
            }

            // 2. Modello B (Registers per session)
            // Loop through fadSeassions and generate Modello B for each
            for (let i = 0; i < fadSessions.length; i++) {
              const session = fadSessions[i];
              try {
                // Pass the index correctly. Note: generateModelloB expects index in the filtered array?
                // My implementation of generateModelloB used: const session = fadSessions[sessionIndex];
                // So passing 'i' is correct if 'fadSessions' is the same array.
                // Here 'fadSessions' is filtered: const fadSessions = currentModule?.sessioni?.filter(s => s.is_fad) || [];
                // Inside generateModelloB: const fadSessions = currentModule.sessioni.filter((s:any) => s.is_fad);
                // Yes, it matches.

                const docBlob = await generator.generateModelloB(data, i);
                const dateStr = session.data_completa.replace(/\//g, '-');
                fadFolder.file(`Modello_B_FAD_${dateStr}.docx`, docBlob); // Changed name to Modello_B to be clear
                console.log('✅ [zipPackager] Added Programmatic Modello B for', session.data_completa);
              } catch (error) {
                console.error(`❌ [zipPackager] Error generating Programmatic Modello B for ${session.data_completa}:`, error);
              }
            }

          } else {
            // --- EXISTING LEGACY GENERATION ---
            const fadTemplate = await getSystemTemplate('modello_b_fad');
            console.log('📄 [zipPackager] modello_b_fad template:', fadTemplate ? `FOUND (${fadTemplate.name})` : 'NOT FOUND');

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
                  fadFolder.file(`Modello_A_FAD_${dateStr}.docx`, docBlob);
                  console.log('✅ [zipPackager] Added FAD registry for', session.data_completa);
                } catch (error) {
                  console.error(`❌ [zipPackager] Error generating FAD registry for ${session.data_completa}:`, error);
                }
              }
            } else {
              console.warn('⚠️ [zipPackager] Template Modello B FAD non configurato nelle impostazioni');
            }
          }
        }
      }
    }

    // 4. Generate certificates (one per participant) - certificati AKG folder
    if (config.includeCertificates) {
      const certTemplate = await getSystemTemplate('certificato');
      console.log('📄 [zipPackager] certificato template:', certTemplate ? `FOUND (${certTemplate.name})` : 'NOT FOUND');

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
              const fileName = `Verbale Finale ${data.corso.id} - ${partecipante.cognome}_${partecipante.nome}.docx`;
              certFolder.file(sanitizeFileName(fileName), docBlob);
            } catch (error) {
              console.error(`❌ [zipPackager] Error generating certificate for ${partecipante.cognome}:`, error);
            }
          }
        }
      } else if (!certTemplate) {
        console.warn('⚠️ [zipPackager] Template Certificato non configurato nelle impostazioni');
      }
    }

    // 5. Modulo 5 - Calendario Condizionalità per beneficiari GOL/PNRR
    if (config.includeModulo5) {
      const beneficiari = data.partecipanti.filter(p => p.benefits);
      const calCondTemplate = await getSystemTemplate('calendario_condizionalita');
      console.log('📄 [zipPackager] calendario_condizionalita template:', calCondTemplate ? `FOUND (${calCondTemplate.name})` : 'NOT FOUND');

      if (calCondTemplate && beneficiari.length > 0) {
        const mod5Folder = zip.folder(config.modulo5FolderName);
        if (mod5Folder) {
          for (const ben of beneficiari) {
            const benPlaceholders = createBeneficiarioPlaceholders(data, ben, placeholders);

            try {
              const docBlob = await generateDocument(
                calCondTemplate.fileBlob,
                benPlaceholders as PlaceholderMap,
                calCondTemplate.name
              );
              const fileName = `Calendario_condizionalita_${data.corso.id}_${ben.cognome}_${ben.nome}.docx`;
              mod5Folder.file(sanitizeFileName(fileName), docBlob);
            } catch (error) {
              console.error(`❌ [zipPackager] Error generating Modulo 5 for ${ben.cognome}:`, error);
            }
          }
        }
      } else if (!calCondTemplate && beneficiari.length > 0) {
        console.warn('⚠️ [zipPackager] Template Calendario Condizionalità non configurato nelle impostazioni');
      }
    }

    // 6. Modulo 7 - Comunicazione Evento (per beneficiario per lezione)
    if (config.includeModulo7) {
      const beneficiari = data.partecipanti.filter(p => p.benefits);
      const comEventoTemplate = await getSystemTemplate('comunicazione_evento');
      console.log('📄 [zipPackager] comunicazione_evento template:', comEventoTemplate ? `FOUND (${comEventoTemplate.name})` : 'NOT FOUND');

      if (comEventoTemplate && beneficiari.length > 0 && currentModule?.sessioni?.length > 0) {
        const mod7Folder = zip.folder(config.modulo7FolderName);
        if (mod7Folder) {
          for (const sessione of currentModule.sessioni) {
            const dateStr = sessione.data_completa.replace(/\//g, '-');
            const dayFolder = mod7Folder.folder(`Giorno_${dateStr}`);

            if (dayFolder) {
              for (const ben of beneficiari) {
                const eventPlaceholders = createEventPlaceholders(data, sessione, ben, placeholders);

                try {
                  const docBlob = await generateDocument(
                    comEventoTemplate.fileBlob,
                    eventPlaceholders as PlaceholderMap,
                    comEventoTemplate.name
                  );
                  const fileName = `Comunicazione_evento_${dateStr}_${ben.cognome}_${ben.nome}.docx`;
                  dayFolder.file(sanitizeFileName(fileName), docBlob);
                } catch (error) {
                  console.error(`❌ [zipPackager] Error generating Modulo 7 for ${ben.cognome} on ${dateStr}:`, error);
                }
              }
            }
          }
        }
      } else if (!comEventoTemplate && beneficiari.length > 0) {
        console.warn('⚠️ [zipPackager] Template Comunicazione Evento non configurato nelle impostazioni');
      }
    }

    // 7. Modulo 8 - Registro Giornaliero per sessioni in presenza
    if (config.includeModulo8) {
      const presenzaSessions = currentModule?.sessioni?.filter(s => !s.is_fad) || [];
      const regGiornTemplate = await getSystemTemplate('registro_giornaliero');
      console.log('📄 [zipPackager] registro_giornaliero template:', regGiornTemplate ? `FOUND (${regGiornTemplate.name})` : 'NOT FOUND');

      if (regGiornTemplate && presenzaSessions.length > 0) {
        const mod8Folder = zip.folder(config.modulo8FolderName);
        if (mod8Folder) {
          for (const sessione of presenzaSessions) {
            const dateStr = sessione.data_completa.replace(/\//g, '-');
            const sessionPlaceholders = createSessionPlaceholders(data, sessione, placeholders);

            try {
              const docBlob = await generateDocument(
                regGiornTemplate.fileBlob,
                sessionPlaceholders as PlaceholderMap,
                regGiornTemplate.name
              );
              mod8Folder.file(`Registro_Giornaliero_${dateStr}.docx`, docBlob);
            } catch (error) {
              console.error(`❌ [zipPackager] Error generating Modulo 8 for ${dateStr}:`, error);
            }
          }
        }
      } else if (!regGiornTemplate && presenzaSessions.length > 0) {
        console.warn('⚠️ [zipPackager] Template Registro Giornaliero non configurato nelle impostazioni');
      }
    }
  } // END SYSTEM TEMPLATES

  return zip;
}

/**
 * Generate ZIP for multi-module course
 */
async function generateMultiModuleZip(
  data: CourseData,
  templateIds: number[],
  config: ZipConfig,
  signature: string | null = null
): Promise<void> {
  const mainZip = new JSZip();

  for (let i = 0; i < data.moduli.length; i++) {
    const modulo = data.moduli[i];
    const moduleFolderName = `Modulo_${i + 1}_${sanitizeFileName(modulo.titolo || '')}`;

    const scopedData: CourseData = {
      ...data,
      moduli: [modulo],
      corso: {
        ...data.corso,
        data_inizio: modulo.data_inizio || data.corso.data_inizio,
        data_fine: modulo.data_fine || data.corso.data_fine,
        ore_totali: modulo.ore_totali || data.corso.ore_totali
      }
    };

    const moduleZip = await generateSingleModuleZip(scopedData, templateIds, 0, config, signature);

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
 * Generate README content
 */
function generateReadmeContent(data: CourseData, config: ZipConfig): string {
  const lines = [
    '==========================================',
    `CORSO: ${data.corso.titolo}`,
    `ID: ${data.corso.id}`,
    '==========================================',
    '',
    `Data generazione: ${new Date().toLocaleDateString('it-IT')}`,
    `Ore totali: ${data.corso.ore_totali}`,
    `Partecipanti: ${data.partecipanti.length}`,
    `Moduli: ${data.moduli.length}`,
    '',
    'CONTENUTO ZIP:',
    '----------------------------------------',
  ];

  lines.push('- Registro presenza ID.docx');
  lines.push('- Verbale_Ammissione_Esame.docx');

  if (config.includeExcel) {
    lines.push(`- ${config.excelFolderName}/`);
    lines.push('  - Registro_Presenze.xlsx');
    lines.push('  - Calendario_Lezioni.xlsx');
    lines.push('  - Partecipanti.xlsx');
    lines.push('  - Report_Completo.xlsx');
  }

  if (config.includeFadRegistries) {
    lines.push(`- ${config.fadFolderName}/ (registri FAD per sessione)`);
  }

  if (config.includeCertificates) {
    lines.push(`- ${config.certificatesFolderName}/ (attestati individuali)`);
  }

  if (config.includeModulo5) {
    lines.push(`- ${config.modulo5FolderName}/ (calendari condizionalità beneficiari)`);
  }

  if (config.includeModulo7) {
    lines.push(`- ${config.modulo7FolderName}/ (comunicazioni evento per giorno)`);
  }

  if (config.includeModulo8) {
    lines.push(`- ${config.modulo8FolderName}/ (registri giornalieri presenza)`);
  }

  lines.push('');
  lines.push('==========================================');

  return lines.join('\n');
}

/**
 * Create placeholders specific to a FAD session
 */
function createFadSessionPlaceholders(
  data: CourseData,
  session: Sessione,
  sessionIndex: number,
  basePlaceholders: PlaceholderMap
): Partial<PlaceholderMap> & Record<string, any> {
  const durata = calculateDurationWithLunchBreak(session.ora_inizio, session.ora_fine);

  return {
    ...basePlaceholders,
    // Standard Uppercase
    DATA_SESSIONE: session.data_completa,
    GIORNO_SESSIONE: session.giorno,
    MESE_SESSIONE: session.mese,
    ANNO_SESSIONE: session.anno,
    ORA_INIZIO_SESSIONE: session.ora_inizio,
    ORA_FINE_SESSIONE: session.ora_fine,
    DURATA_SESSIONE: durata.toString(),
    ARGOMENTO_SESSIONE: session.argomento || '',
    NUMERO_SESSIONE: sessionIndex + 1,

    // Lowercase Aliases (requested by user template)
    giorno: session.giorno,
    mese: session.mese,
    anno: session.anno,
    data: session.data_completa,
    ora_inizio: session.ora_inizio,
    ora_fine: session.ora_fine,
    durata: durata.toString(),
    argomento: session.argomento || '',

    PARTECIPANTI_SESSIONE: data.partecipanti.map((p, i) => ({
      numero: i + 1,
      nome: p.nome,
      cognome: p.cognome,
      nome_completo: `${p.nome} ${p.cognome}`.trim(),
      codice_fiscale: p.codiceFiscale,
      ora_connessione: session.ora_inizio,
      ora_disconnessione: session.ora_fine,
      // Dati per il loop
      argomento: session.argomento || '',
      ora_inizio: session.ora_inizio,
      ora_fine: session.ora_fine,
      FIRMA_DOCENTE: (basePlaceholders as any).FIRMA_DOCENTE
    }))
  };
}

/**
 * Create placeholders specific to a certificate
 */
function createCertificatePlaceholders(
  data: CourseData,
  partecipante: Partecipante,
  basePlaceholders: PlaceholderMap
): Partial<PlaceholderMap> & Record<string, any> {
  return {
    ...basePlaceholders,
    PARTECIPANTE_NOME: partecipante.nome,
    PARTECIPANTE_COGNOME: partecipante.cognome,
    PARTECIPANTE_NOME_COMPLETO: `${partecipante.nome} ${partecipante.cognome}`.trim(),
    PARTECIPANTE_CF: partecipante.codiceFiscale,
    PARTECIPANTE_EMAIL: partecipante.email || '',
    PARTECIPANTE_TELEFONO: partecipante.telefono || ''
  };
}

/**
 * Create placeholders for beneficiario (Modulo 5)
 */
function createBeneficiarioPlaceholders(
  data: CourseData,
  beneficiario: Partecipante,
  basePlaceholders: PlaceholderMap
): Partial<PlaceholderMap> & Record<string, any> {
  return {
    ...basePlaceholders,
    BENEFICIARIO_NOME: beneficiario.nome,
    BENEFICIARIO_COGNOME: beneficiario.cognome,
    BENEFICIARIO_NOME_COMPLETO: `${beneficiario.nome} ${beneficiario.cognome}`.trim(),
    BENEFICIARIO_CF: beneficiario.codiceFiscale,
    BENEFICIARIO_EMAIL: beneficiario.email || '',
    BENEFICIARIO_TELEFONO: beneficiario.telefono || ''
  };
}

/**
 * Create placeholders for event communication (Modulo 7)
 */
function createEventPlaceholders(
  data: CourseData,
  sessione: Sessione,
  beneficiario: Partecipante,
  basePlaceholders: PlaceholderMap
): Partial<PlaceholderMap> & Record<string, any> {
  return {
    ...basePlaceholders,
    // Session data
    DATA_EVENTO: sessione.data_completa,
    GIORNO_EVENTO: sessione.giorno,
    MESE_EVENTO: sessione.mese,
    ANNO_EVENTO: sessione.anno,
    ORA_INIZIO_EVENTO: sessione.ora_inizio,
    ORA_FINE_EVENTO: sessione.ora_fine,
    SEDE_EVENTO: sessione.sede,
    // Beneficiario data
    BENEFICIARIO_NOME: beneficiario.nome,
    BENEFICIARIO_COGNOME: beneficiario.cognome,
    BENEFICIARIO_NOME_COMPLETO: `${beneficiario.nome} ${beneficiario.cognome}`.trim(),
    BENEFICIARIO_CF: beneficiario.codiceFiscale
  };
}

/**
 * Create placeholders for session (Modulo 8)
 */
function createSessionPlaceholders(
  data: CourseData,
  sessione: Sessione,
  basePlaceholders: PlaceholderMap
): Partial<PlaceholderMap> & Record<string, any> {
  const durata = calculateDurationWithLunchBreak(sessione.ora_inizio, sessione.ora_fine);

  return {
    ...basePlaceholders,
    DATA_SESSIONE: sessione.data_completa,
    GIORNO_SESSIONE: sessione.giorno,
    MESE_SESSIONE: sessione.mese,
    ANNO_SESSIONE: sessione.anno,
    ORA_INIZIO_SESSIONE: sessione.ora_inizio,
    ORA_FINE_SESSIONE: sessione.ora_fine,
    SEDE_SESSIONE: sessione.sede,
    DURATA_SESSIONE: durata.toString(),
    ARGOMENTO_SESSIONE: sessione.argomento || '',
    // Alias per registro giornaliero
    ARGOMENTO_GIORNO: sessione.argomento || '',
    MATERIA_GIORNO: sessione.argomento || '',
    CONTENUTI_GIORNO: sessione.argomento || '',
    PARTECIPANTI_SESSIONE: data.partecipanti.map((p, i) => ({
      numero: i + 1,
      nome: p.nome,
      cognome: p.cognome,
      nome_completo: `${p.nome} ${p.cognome}`.trim(),
      codice_fiscale: p.codiceFiscale
    }))
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