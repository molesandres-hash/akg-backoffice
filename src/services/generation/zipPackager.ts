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
  includeSignatureImage?: boolean; // New flag
  includeRegistroCartaceo?: boolean;
  includeConvocazione?: boolean;
  convocazioneFolderName?: string;
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
  certificatesFolderName: 'Certificati',
  modulo5FolderName: 'modulo 5',
  modulo7FolderName: 'modulo 7',
  modulo8FolderName: 'modulo 8',
  useProgrammaticGeneration: false,
  onlyUserTemplates: false,
  includeSignatureImage: false,
  includeRegistroCartaceo: true,
  includeConvocazione: true,
  convocazioneFolderName: 'Condizionalità'
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
  const currentModule = data.moduli[moduleIndex];

  // --- ID FIX: Use Module ID as Course ID for documents if available ---
  // This ensures that all generated documents (placeholders + programmatic) use the Regional/Module ID
  // instead of the internal Course ID, effectively swapping "ID CORSO" with "ID MODULO".
  // --- ID FIX: Use Module ID as Course ID for documents if available ---
  // This ensures that all generated documents (placeholders + programmatic) use the Regional/Module ID
  // instead of the internal Course ID, effectively swapping "ID CORSO" with "ID MODULO".
  const effectiveData: CourseData = {
    ...data,
    corso: {
      ...data.corso,
      id: currentModule?.id || data.corso.id
    }
  };

  const basePlaceholders = mapCourseDataToPlaceholders(effectiveData, moduleIndex);
  const placeholders = {
    ...basePlaceholders,
    FIRMA_DOCENTE: signature || ''
  };

  console.log('📦 [zipPackager] Starting ZIP generation for module:', moduleIndex);
  console.log('📦 [zipPackager] Effective ID (Module/Course):', effectiveData.corso.id);

  // 1. Generate Word documents from user templates
  if (templateIds.length > 0) {
    const templates = await getAllTemplates();
    const selectedTemplates = templates.filter(t => templateIds.includes(t.id!));

    const docsFolder = zip.folder(config.documentsFolderName);
    if (docsFolder) {
      for (const template of selectedTemplates) {
        try {
          const docBlob = await generateDocument(template.fileBlob, placeholders, template.name);
          const fileName = `${template.name}_${effectiveData.corso.id}.docx`;
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
        zip.file(`Registro presenza ${effectiveData.corso.id}.docx`, docBlob);
        console.log('✅ [zipPackager] Added Registro Presenza to ZIP');
      } catch (error) {
        console.error('❌ [zipPackager] Error generating Registro Presenza:', error);
      }
    } else {
      console.warn('⚠️ [zipPackager] Skipping Registro Presenza - template not configured');
    }

    // Verbali Folder
    const verbaliFolder = zip.folder('Verbali');

    // Verbale Ammissione Esame (Template) - Move to Verbali
    const verbaleAmmissioneTemplate = await getSystemTemplate('verbale_ammissione');
    console.log('📄 [zipPackager] verbale_ammissione template:', verbaleAmmissioneTemplate ? `FOUND (${verbaleAmmissioneTemplate.name}, ${verbaleAmmissioneTemplate.fileBlob?.size} bytes)` : 'NOT FOUND');

    if (verbaleAmmissioneTemplate && verbaliFolder) {
      try {
        const docBlob = await generateDocument(verbaleAmmissioneTemplate.fileBlob, placeholders, verbaleAmmissioneTemplate.name);
        verbaliFolder.file(`Verbale_Ammissione_Esame_${effectiveData.corso.id}.docx`, docBlob);
        console.log('✅ [zipPackager] Added Verbale Ammissione to ZIP (Verbali folder)');
      } catch (error) {
        console.error('❌ [zipPackager] Error generating Verbale Ammissione:', error);
      }
    } else {
      console.warn('⚠️ [zipPackager] Skipping Verbale Ammissione - template not configured or folder missing');
    }

    // Verbale Ammissione Programmatico (New Request) - Move to Verbali
    if (config.useProgrammaticGeneration && verbaliFolder) {
      try {
        console.log('🤖 [zipPackager] Generating Programmatic Verbale Ammissione...');
        const generator = new ProgrammaticDocxGenerator();
        const docBlob = await generator.generateVerbaleAmmissione(effectiveData);
        verbaliFolder.file(`Verbale_Ammissione_Programmatico_${effectiveData.corso.id}.docx`, docBlob);
        console.log('✅ [zipPackager] Added Programmatic Verbale Ammissione to ZIP (Verbali folder)');
      } catch (error) {
        console.error('❌ [zipPackager] Error generating Programmatic Verbale Ammissione:', error);
      }
    }


    // 2. Generate Excel files
    if (config.includeExcel) {
      const excelFolder = zip.folder(config.excelFolderName);
      if (excelFolder) {
        const registroBlob = generateRegistroPresenze(effectiveData, moduleIndex);
        excelFolder.file(`Registro_Presenze_${effectiveData.corso.id}.xlsx`, registroBlob);

        const calendarioBlob = generateCalendarioLezioni(effectiveData, moduleIndex);
        excelFolder.file(`Calendario_Lezioni_${effectiveData.corso.id}.xlsx`, calendarioBlob);

        const partecipantiBlob = generateListaPartecipanti(effectiveData);
        excelFolder.file(`Partecipanti_${effectiveData.corso.id}.xlsx`, partecipantiBlob);

        const reportBlob = generateReportCompleto(effectiveData, moduleIndex);
        excelFolder.file(`Report_Completo_${effectiveData.corso.id}.xlsx`, reportBlob);
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
              const docBlob = await generator.generateModelloA(effectiveData);
              fadFolder.file(`Modello_A_FAD_Completo_${effectiveData.corso.id}.docx`, docBlob);
              console.log('✅ [zipPackager] Added Programmatic Modello A to ZIP');
            } catch (error) {
              console.error('❌ [zipPackager] Error generating Programmatic Modello A:', error);
            }

            // 2. Modello B (Registers - Merged into one Document)
            try {
              const docBlob = await generator.generateModelloB(effectiveData, !!config.includeSignatureImage);
              const fileName = `Modello_B_Registro_Unico_${effectiveData.corso.id}.docx`;
              fadFolder.file(sanitizeFileName(fileName), docBlob);
              console.log('✅ [zipPackager] Added Programmatic Modello B (Merged) to ZIP');
            } catch (error) {
              console.error('❌ [zipPackager] Error generating Programmatic Modello B:', error);
            }

          } else {
            // --- EXISTING LEGACY GENERATION ---
            const fadTemplate = await getSystemTemplate('modello_b_fad');
            console.log('📄 [zipPackager] modello_b_fad template:', fadTemplate ? `FOUND (${fadTemplate.name})` : 'NOT FOUND');

            if (fadTemplate) {
              for (let i = 0; i < fadSessions.length; i++) {
                const session = fadSessions[i];
                const sessionPlaceholders = createFadSessionPlaceholders(effectiveData, session, i, placeholders);

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
          for (const partecipante of effectiveData.partecipanti) {
            const certPlaceholders = createCertificatePlaceholders(effectiveData, partecipante, placeholders);

            try {
              const docBlob = await generateDocument(
                certTemplate.fileBlob,
                certPlaceholders as PlaceholderMap,
                certTemplate.name
              );
              const fileName = `Verbale Finale ${effectiveData.corso.id} - ${partecipante.cognome}_${partecipante.nome}.docx`;
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
            const benPlaceholders = createBeneficiarioPlaceholders(effectiveData, ben, placeholders);

            try {
              const docBlob = await generateDocument(
                calCondTemplate.fileBlob,
                benPlaceholders as PlaceholderMap,
                calCondTemplate.name
              );
              const fileName = `Calendario_condizionalita_${effectiveData.corso.id}_${ben.cognome}_${ben.nome}.docx`;
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

      // We don't check for template anymore as we use programmatic generation
      if (beneficiari.length > 0 && currentModule?.sessioni?.length > 0) {
        const mod7Folder = zip.folder(config.modulo7FolderName);
        if (mod7Folder) {
          // Instantiate generator if not already done (though we might want to reuse one if expensive, but it's cheap class)
          // Note: We used 'generator' variable in FAD section, check if it's available here or need new instance.
          // The FAD section is inside an 'if (includeFadRegistries)', so 'generator' might not be in scope. Creates new one.
          const generator = new ProgrammaticDocxGenerator();

          for (const sessione of currentModule.sessioni) {
            const folderName = formatDateForFolder(sessione.data_completa); // "7 novembre mercoledi"
            const dayFolder = mod7Folder.folder(folderName);

            if (dayFolder) {
              for (const ben of beneficiari) {
                try {
                  const docBlob = await generator.generateModulo7(effectiveData, sessione, ben);
                  // Filename: Comunicazione_Cpi_NOMECOGNOME.docx as per typical needs, or just per spec?
                  // Spec doesn't strictly specify filename, but previous code used name. Let's incorporate date too?
                  // User prompt said: "e poi un documento di questi per ogni partecipante."
                  // Let's stick to a clear naming: Comunicazione_CPI_{DATA}_{COGNOME}_{NOME}.docx
                  const dateStrSafe = sessione.data_completa.replace(/\//g, '-');
                  const fileName = `Comunicazione_CPI_${dateStrSafe}_${ben.cognome}_${ben.nome}.docx`;
                  dayFolder.file(sanitizeFileName(fileName), docBlob);
                } catch (error) {
                  console.error(`❌ [zipPackager] Error generating Modulo 7 for ${ben.cognome} on ${sessione.data_completa}:`, error);
                }
              }
            }
          }
        }
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
            const sessionPlaceholders = createSessionPlaceholders(effectiveData, sessione, placeholders);

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

  // 8. Registro Presenza Cartaceo (Folder con Head + Pagine Giorno)
  if (config.includeRegistroCartaceo) {
    const presenzaSessions = currentModule?.sessioni?.filter(s => !s.is_fad) || [];

    if (presenzaSessions.length > 0) {
      const folderName = config.modulo8FolderName || 'Registro_Presenza_Cartaceo';
      const regFolder = zip.folder(folderName);
      if (regFolder) {
        console.log('📂 [zipPackager] Generating Registro Presenza Cartaceo...');

        if (config.useProgrammaticGeneration) {
          // PROGRAMMATIC GENERATION
          console.log('🤖 [zipPackager] Using Programmatic Generation for Registro Cartaceo');
          const generator = new ProgrammaticDocxGenerator();

          // A. HEAD
          try {
            console.log('🤖 [zipPackager] Generating Registro Head (Programmatic)...');
            const headBlob = await generator.generateRegistroCartaceoHead(effectiveData);
            regFolder.file('00_Registro_Head.docx', headBlob);
            console.log('✅ [zipPackager] Added Registro Presenza Head (Programmatic)');
          } catch (error) {
            console.error('❌ [zipPackager] Error generating Programmatic Registro Head:', error);
          }

          // B. DAILY PAGES
          for (let i = 0; i < presenzaSessions.length; i++) {
            const session = presenzaSessions[i];
            console.log(`🔍 [zipPackager] Processing Session ${i + 1}:`, {
              data_completa: session.data_completa,
              giorno: session.giorno,
              mese: session.mese,
              anno: session.anno
            });

            const dateStrIndex = (i + 1).toString().padStart(2, '0');
            const dateSafe = (session.data_completa || "UNKNOWN_DATE").replace(/\//g, '-');
            try {
              const pageBlob = await generator.generateRegistroCartaceoPaginaGiorno(effectiveData, session, currentModule.id);
              regFolder.file(`${dateStrIndex}_Registro_Giorno_${dateSafe}.docx`, pageBlob);
            } catch (error) {
              console.error(`❌ [zipPackager] Error generating Programmatic Page for ${dateSafe}:`, error);
            }

          }
          console.log(`✅ [zipPackager] Added ${presenzaSessions.length} Daily Pages (Programmatic)`);

          // C. CONCATENATED FILE (Registro Presenza Cartaceo Completo)
          try {
            console.log('🤖 [zipPackager] Generating Concatenated Registro Presenza...');
            const completeBlob = await generator.generateRegistroPresenzaCompleto(effectiveData, presenzaSessions, currentModule.id);
            regFolder.file('Registro_Presenza_Cartaceo_Completo.docx', completeBlob);
            console.log('✅ [zipPackager] Added Concatenated Registro Presenza');
          } catch (error) {
            console.error('❌ [zipPackager] Error generating Concatenated Registro:', error);
          }

        } else {
          // LEGACY TEMPLATE GENERATION
          // LEGACY TEMPLATE GENERATION
          // A. Generate Head (Frontespizio) - FORCED PROGRAMMATIC
          try {
            // We instantiate the generator here just for this file if we are in legacy mode
            const generator = new ProgrammaticDocxGenerator();
            const headBlob = await generator.generateRegistroCartaceoHead(effectiveData);
            regFolder.file('00_Registro_Head.docx', headBlob);
            console.log('✅ [zipPackager] Added Registro Presenza Head (Programmatic Override)');
          } catch (error) {
            console.error('❌ [zipPackager] Error generating Registro Head:', error);
          }

          // B. Generate Daily Pages
          try {
            const pageTemplateBlob = await fetchTemplateBlob('/Templates_standard/Registro%20Presenza/registro_pagina_giorno.docx');

            for (let i = 0; i < presenzaSessions.length; i++) {
              const session = presenzaSessions[i];
              const dateStrIndex = (i + 1).toString().padStart(2, '0');
              const dateSafe = session.data_completa.replace(/\//g, '-');

              const sessionPlaceholders = {
                ...placeholders,
                GIORNO_PRES: session.giorno,
                MESE_PRES: session.mese,
                ANNO: session.anno,
              };

              const pageBlob = await generateDocument(pageTemplateBlob, sessionPlaceholders as PlaceholderMap, 'registro_page.docx');
              regFolder.file(`${dateStrIndex}_Registro_Giorno_${dateSafe}.docx`, pageBlob);
            }
            console.log(`✅ [zipPackager] Added ${presenzaSessions.length} Daily Pages`);

          } catch (error) {
            console.error('❌ [zipPackager] Error generating Registro Daily Pages:', error);
          }
        }
      }
    }
  }

  // 8.1 VERBALE FINE CORSO (Programmatic) - Check if Programmatic Generation is enabled
  if (config.useProgrammaticGeneration) {
    // This document is critical, so we try to generate it always if experimental mode is on
    // It was previously only inside FAD section.
    try {
      console.log('🤖 [zipPackager] Generating Programmatic Verbale Fine Corso...');
      const generator = new ProgrammaticDocxGenerator();
      const docBlob = await generator.generateVerbaleFineCorso(effectiveData, moduleIndex);
      const fileName = `Verbale_Fine_Corso_${effectiveData.corso.id}.docx`;

      const verbaliFolder = zip.folder('Verbali');
      if (verbaliFolder) {
        verbaliFolder.file(sanitizeFileName(fileName), docBlob);
        console.log('✅ [zipPackager] Added Programmatic Verbale Fine Corso to ZIP (Verbali folder)');
      }
    } catch (error) {
      console.error('❌ [zipPackager] Error generating Programmatic Verbale Fine Corso:', error);
    }
  }

  // 9. Convocazione Beneficiario - Cartella "Condizionalità"
  if (config.includeConvocazione) {
    const beneficiari = data.partecipanti.filter(p => p.benefits);
    if (beneficiari.length > 0) {
      const convFolder = zip.folder(config.convocazioneFolderName || 'Condizionalità');
      if (convFolder) {
        console.log('📄 [zipPackager] Generating Convocazione Beneficiario...');
        const generator = new ProgrammaticDocxGenerator();

        for (const ben of beneficiari) {
          try {
            const docBlob = await generator.generateConvocazione(effectiveData, ben);
            const fileName = `Convocazione_${ben.cognome}_${ben.nome}.docx`;
            convFolder.file(sanitizeFileName(fileName), docBlob);
          } catch (error) {
            console.error(`❌ [zipPackager] Error generating Convocazione for ${ben.cognome}:`, error);
          }
        }
        console.log(`✅ [zipPackager] Added ${beneficiari.length} Convocazione documents`);
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

  lines.push(`- ${config.modulo8FolderName}/ (registri giornalieri presenza)`);

  if (config.includeConvocazione) {
    lines.push(`- ${config.convocazioneFolderName}/ (convocazioni beneficiari)`);
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

  // Ensure date parts exist
  let giorno = sessione.giorno;
  let mese = sessione.mese;
  let anno = sessione.anno;

  if ((!giorno || !mese || !anno) && sessione.data_completa) {
    const parts = sessione.data_completa.split('/');
    if (parts.length === 3) {
      giorno = parts[0];
      const meseNum = parseInt(parts[1]);
      const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
      mese = mesi[meseNum - 1] || parts[1];
      anno = parts[2];
    }
  }

  return {
    ...basePlaceholders,
    DATA_SESSIONE: sessione.data_completa,
    GIORNO_SESSIONE: giorno,
    MESE_SESSIONE: mese,
    ANNO_SESSIONE: anno,
    ORA_INIZIO_SESSIONE: sessione.ora_inizio,
    ORA_FINE_SESSIONE: sessione.ora_fine,
    SEDE_SESSIONE: sessione.sede,
    DURATA_SESSIONE: durata.toString(),
    ARGOMENTO_SESSIONE: sessione.argomento || '',
    // Alias per registro giornaliero
    ARGOMENTO_GIORNO: sessione.argomento || '',
    MATERIA_GIORNO: sessione.argomento || '',
    CONTENUTI_GIORNO: sessione.argomento || '',

    // Legacy Aliases (critical for older templates)
    giorno: giorno,
    mese: mese,
    anno: anno,
    GIORNO_PRES: giorno,
    MESE_PRES: mese,
    ANNO: anno,
    data: sessione.data_completa,
    ora_inizio: sessione.ora_inizio,
    ora_fine: sessione.ora_fine,
    durata: durata.toString(),
    argomento: sessione.argomento || '',

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
  const currentModule = data.moduli[moduleIndex] || data.moduli[0];

  // --- ID FIX: Use Module ID as Course ID ---
  const effectiveData: CourseData = {
    ...data,
    corso: {
      ...data.corso,
      id: currentModule?.id || data.corso.id
    }
  };

  const zip = new JSZip();

  const registroBlob = generateRegistroPresenze(effectiveData, moduleIndex);
  zip.file(`Registro_Presenze_${effectiveData.corso.id}.xlsx`, registroBlob);

  const calendarioBlob = generateCalendarioLezioni(effectiveData, moduleIndex);
  zip.file(`Calendario_Lezioni_${effectiveData.corso.id}.xlsx`, calendarioBlob);

  const partecipantiBlob = generateListaPartecipanti(effectiveData);
  zip.file(`Partecipanti_${effectiveData.corso.id}.xlsx`, partecipantiBlob);

  const reportBlob = generateReportCompleto(effectiveData, moduleIndex);
  zip.file(`Report_Completo_${effectiveData.corso.id}.xlsx`, reportBlob);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `Excel_${effectiveData.corso.id}.zip`);
}

/**
 * Format date for folder name: "7 novembre mercoledi"
 */
function formatDateForFolder(dateStr: string): string {
  // dateStr is DD/MM/YYYY
  if (!dateStr) return "Data_Sconosciuta";
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr.replace(/\//g, '-');

  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);

  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return dateStr.replace(/\//g, '-');

  const day = date.getDate();
  const month = date.toLocaleString('it-IT', { month: 'long' });
  const weekday = date.toLocaleString('it-IT', { weekday: 'long' });

  return `${day} ${month} ${weekday}`;
}

/**
 * Helper to fetch template from public URL
 */
async function fetchTemplateBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch template from ${url}: ${response.statusText}`);
  }
  return await response.blob();
}