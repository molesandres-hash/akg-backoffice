import * as XLSX from 'xlsx';
import type { CourseData, Sessione } from '@/types/extraction';

/**
 * Interface for hourly blocks used in Calendario Lezioni
 */
interface HourlyBlock {
  data: string;
  ora_inizio: string;
  ora_fine: string;
  is_fad: boolean;
  id_sezione: string;
}

/**
 * Splits a session into 1-hour blocks, skipping lunch break (13:00-14:00)
 */
function splitIntoHourlyBlocks(sessione: Sessione, id_sezione: string): HourlyBlock[] {
  const blocks: HourlyBlock[] = [];
  
  const [startH, startM] = sessione.ora_inizio.split(':').map(Number);
  const [endH, endM] = sessione.ora_fine.split(':').map(Number);
  
  // Convert to minutes for easier calculation
  let currentMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);
  
  while (currentMinutes < endMinutes) {
    const currentHour = Math.floor(currentMinutes / 60);
    
    // Skip lunch break 13:00-14:00
    if (currentHour === 13) {
      currentMinutes = 14 * 60; // Jump to 14:00
      continue;
    }
    
    // Calculate block end (next hour or session end, whichever is first)
    let blockEndMinutes = (currentHour + 1) * 60;
    
    // If we're at 12:xx and would go to 13:xx, stop at 13:00
    if (currentHour === 12 && blockEndMinutes > 13 * 60) {
      blockEndMinutes = 13 * 60;
    }
    
    // Don't exceed session end
    if (blockEndMinutes > endMinutes) {
      blockEndMinutes = endMinutes;
    }
    
    // Only add if we have a full hour or significant portion
    const blockDuration = blockEndMinutes - currentMinutes;
    if (blockDuration >= 30) { // At least 30 minutes
      const startHour = Math.floor(currentMinutes / 60);
      const endHour = Math.floor(blockEndMinutes / 60);
      const endMin = blockEndMinutes % 60;
      
      blocks.push({
        data: sessione.data_completa,
        ora_inizio: `${startHour.toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`,
        ora_fine: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
        is_fad: sessione.is_fad,
        id_sezione: id_sezione,
      });
    }
    
    currentMinutes = blockEndMinutes;
  }
  
  return blocks;
}

/**
 * Generates Registro Presenze Excel with formulas including cumulative hours row
 */
export function generateRegistroPresenze(data: CourseData, moduleIndex: number = 0): Blob {
  const currentModule = data.moduli[moduleIndex] || data.moduli[0];
  const sessions = currentModule?.sessioni || [];
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.data_completa.split('/').reverse().join('-')).getTime() - 
    new Date(b.data_completa.split('/').reverse().join('-')).getTime()
  );
  
  const wb = XLSX.utils.book_new();
  
  // Header row: N., Cognome, Nome, CF, Date columns, Totale Ore
  const headers = ['N.', 'Cognome', 'Nome', 'Codice Fiscale'];
  sortedSessions.forEach(s => headers.push(s.data_completa));
  headers.push('Totale Ore');
  
  // Data rows with formulas
  const wsData: (string | number | { f: string })[][] = [headers];
  
  data.partecipanti.forEach((p, i) => {
    const row: (string | number | { f: string })[] = [
      i + 1,
      p.cognome || '',
      p.nome || '',
      p.codiceFiscale || ''
    ];
    
    // Empty cells for hours (columns E onwards)
    sortedSessions.forEach(() => row.push(''));
    
    // SUM formula for total hours (last column)
    const startCol = XLSX.utils.encode_col(4); // Column E
    const endCol = XLSX.utils.encode_col(4 + sortedSessions.length - 1);
    const rowNum = i + 2; // 1-indexed, +1 for header
    row.push({ f: `SUM(${startCol}${rowNum}:${endCol}${rowNum})` });
    
    wsData.push(row);
  });
  
  // Totals row (Totale Giorno)
  const totalsRowNum = data.partecipanti.length + 2;
  const totalsRow: (string | number | { f: string })[] = ['', '', '', 'TOTALE'];
  sortedSessions.forEach((_, colIdx) => {
    const col = XLSX.utils.encode_col(4 + colIdx);
    totalsRow.push({ f: `SUM(${col}2:${col}${data.partecipanti.length + 1})` });
  });
  // Grand total
  const lastDataCol = XLSX.utils.encode_col(4 + sortedSessions.length);
  totalsRow.push({ f: `SUM(${lastDataCol}2:${lastDataCol}${data.partecipanti.length + 1})` });
  wsData.push(totalsRow);
  
  // Cumulative hours row (Ore Cumulative)
  const cumulativeRowNum = totalsRowNum + 1;
  const cumulativeRow: (string | number | { f: string })[] = ['', '', '', 'ORE CUMULATIVE'];
  sortedSessions.forEach((_, colIdx) => {
    const col = XLSX.utils.encode_col(4 + colIdx);
    if (colIdx === 0) {
      // First column: same as daily total
      cumulativeRow.push({ f: `${col}${totalsRowNum}` });
    } else {
      // Subsequent columns: previous cumulative + current daily total
      const prevCol = XLSX.utils.encode_col(4 + colIdx - 1);
      cumulativeRow.push({ f: `${prevCol}${cumulativeRowNum}+${col}${totalsRowNum}` });
    }
  });
  // Final cumulative total (last column in cumulative row)
  const lastCumulativeCol = XLSX.utils.encode_col(4 + sortedSessions.length - 1);
  cumulativeRow.push({ f: `${lastCumulativeCol}${cumulativeRowNum}` });
  wsData.push(cumulativeRow);
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 4 },  // N.
    { wch: 20 }, // Cognome
    { wch: 15 }, // Nome
    { wch: 18 }, // CF
    ...sortedSessions.map(() => ({ wch: 12 })),
    { wch: 12 }  // Totale
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Registro Presenze');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generates Lista Partecipanti Excel
 */
export function generateListaPartecipanti(data: CourseData): Blob {
  const wb = XLSX.utils.book_new();
  
  const headers = ['N.', 'Cognome', 'Nome', 'Codice Fiscale', 'Email', 'Telefono'];
  const wsData = [headers];
  
  data.partecipanti.forEach((p, i) => {
    wsData.push([
      String(i + 1),
      p.cognome || '',
      p.nome || '',
      p.codiceFiscale || '',
      p.email || '',
      p.telefono || ''
    ]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  ws['!cols'] = [
    { wch: 4 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 25 },
    { wch: 15 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Partecipanti');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generates Report Completo Excel with multiple sheets
 */
export function generateReportCompleto(data: CourseData, moduleIndex: number = 0): Blob {
  const currentModule = data.moduli[moduleIndex] || data.moduli[0];
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Riepilogo
  const riepilogoData = [
    ['RIEPILOGO CORSO'],
    [],
    ['ID Corso', data.corso.id],
    ['Titolo', data.corso.titolo],
    ['Data Inizio', data.corso.data_inizio],
    ['Data Fine', data.corso.data_fine],
    ['Ore Totali', data.corso.ore_totali],
    ['Tipo', data.corso.tipo],
    ['Stato', data.corso.stato],
    [],
    ['Modulo', currentModule?.titolo || ''],
    ['ID Modulo', currentModule?.id || ''],
    ['ID Sezione', currentModule?.id_sezione || ''],
    [],
    ['Ente', data.ente.nome],
    ['Sede', data.sede.nome],
    ['Indirizzo Sede', data.sede.indirizzo],
    [],
    ['Docente', data.trainer.nome_completo],
    ['CF Docente', data.trainer.codice_fiscale],
    ['Direttore', data.direttore.nome_completo],
    [],
    ['N. Partecipanti', data.partecipanti.length],
    ['N. Sessioni', currentModule?.sessioni?.length || 0],
    ['N. Moduli', data.moduli.length]
  ];
  
  const wsRiepilogo = XLSX.utils.aoa_to_sheet(riepilogoData);
  wsRiepilogo['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsRiepilogo, 'Riepilogo');
  
  // Sheet 2: Partecipanti
  const partecipantiHeaders = ['N.', 'Cognome', 'Nome', 'Codice Fiscale', 'Email', 'Telefono'];
  const partecipantiData = [partecipantiHeaders];
  data.partecipanti.forEach((p, i) => {
    partecipantiData.push([
      String(i + 1),
      p.cognome || '',
      p.nome || '',
      p.codiceFiscale || '',
      p.email || '',
      p.telefono || ''
    ]);
  });
  
  const wsPartecipanti = XLSX.utils.aoa_to_sheet(partecipantiData);
  wsPartecipanti['!cols'] = [{ wch: 4 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsPartecipanti, 'Partecipanti');
  
  // Sheet 3: Sessioni
  const sessioniHeaders = ['N.', 'Data', 'Giorno', 'Ora Inizio', 'Ora Fine', 'Durata', 'Sede', 'Modalità'];
  const sessioniData = [sessioniHeaders];
  
  const sessions = currentModule?.sessioni || [];
  sessions.forEach((s, i) => {
    sessioniData.push([
      String(i + 1),
      s.data_completa || '',
      s.giorno_settimana || '',
      s.ora_inizio || '',
      s.ora_fine || '',
      s.durata || '',
      s.sede || data.sede.nome || '',
      s.is_fad ? 'FAD' : 'Presenza'
    ]);
  });
  
  const wsSessioni = XLSX.utils.aoa_to_sheet(sessioniData);
  wsSessioni['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, 
    { wch: 10 }, { wch: 8 }, { wch: 25 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSessioni, 'Sessioni');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generates Calendario Lezioni Excel with hourly blocks (Clean Excel format)
 * Each session is split into 1-hour blocks, skipping lunch break 13:00-14:00
 */
export function generateCalendarioLezioni(data: CourseData, moduleIndex: number = 0): Blob {
  const currentModule = data.moduli[moduleIndex] || data.moduli[0];
  const sessions = currentModule?.sessioni || [];
  
  // Sort sessions chronologically
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.data_completa.split('/').reverse().join('-')).getTime() - 
    new Date(b.data_completa.split('/').reverse().join('-')).getTime()
  );
  
  // Headers as per specification
  const headers = [
    'ID_SEZIONE',
    'DATA LEZIONE',
    'TOTALE_ORE',
    'ORA_INIZIO',
    'ORA_FINE',
    'TIPOLOGIA',
    'CODICE FISCALE DOCENTE',
    'MATERIA',
    'CONTENUTI MATERIA',
    'SEDE SVOLGIMENTO'
  ];
  
  const rows: string[][] = [];
  const idSezione = currentModule?.id_sezione || '';
  const cfDocente = data.trainer?.codice_fiscale || '';
  const materia = currentModule?.titolo || data.corso.titolo || '';
  
  // For each session, split into hourly blocks
  sortedSessions.forEach(sessione => {
    const blocks = splitIntoHourlyBlocks(sessione, idSezione);
    
    blocks.forEach(block => {
      rows.push([
        block.id_sezione,                    // ID_SEZIONE
        block.data,                          // DATA LEZIONE
        '1',                                 // TOTALE_ORE (always 1 per block)
        block.ora_inizio,                    // ORA_INIZIO
        block.ora_fine,                      // ORA_FINE
        block.is_fad ? '4' : '1',            // TIPOLOGIA (1=presenza, 4=FAD)
        cfDocente,                           // CODICE FISCALE DOCENTE
        materia,                             // MATERIA
        materia,                             // CONTENUTI MATERIA
        block.is_fad ? '' : '1'              // SEDE SVOLGIMENTO (1=presenza, ""=FAD)
      ]);
    });
  });
  
  // Use generateCleanExcel for clean format with all cells as text
  return generateCleanExcel(headers, rows, 'Calendario');
}

/**
 * Clean Excel mode - forces all cells as text, no styles
 */
export function generateCleanExcel(
  headers: string[], 
  rows: string[][], 
  sheetName: string = 'Dati'
): Blob {
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Force all cells as text
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr]) {
        ws[addr].t = 's'; // Force string type
        ws[addr].z = '@'; // Text format
      }
    }
  }
  
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
