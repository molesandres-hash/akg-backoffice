import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import type { PlaceholderMap } from '@/types/extraction';
import { getTemplateById, type UserTemplate } from '@/db/templateDb';

/**
 * Generates a .docx file from a template blob and placeholder data
 */
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';

function base64Parser(dataURL: string) {
  if (typeof dataURL !== 'string' || !dataURL.startsWith('data:image/')) {
    return null;
  }
  const base64Regex = /^data:image\/(png|jpg|jpeg|svg|svg\+xml);base64,/;
  const base64Content = dataURL.replace(base64Regex, "");
  const binaryString = window.atob(base64Content);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates a .docx file from a template blob and placeholder data
 */
export async function generateDocument(
  templateBlob: Blob,
  placeholders: PlaceholderMap,
  outputFileName: string
): Promise<Blob> {
  // Read the template as ArrayBuffer
  const arrayBuffer = await templateBlob.arrayBuffer();

  // Load the template with PizZip
  const zip = new PizZip(arrayBuffer);

  // Configure Image Module
  const imageModule = new ImageModule({
    centered: false,
    getImage: (tagValue: string) => {
      return base64Parser(tagValue);
    },
    getSize: () => [200, 100], // Fixed size for signature
  });

  // Create Docxtemplater instance
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [imageModule],
    delimiters: { start: '{', end: '}' },
  });

  // Apply data to template
  doc.render(placeholders);

  // Generate output
  const output = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  return output;
}

/**
 * Generates and downloads a single document
 */
export async function generateAndDownload(
  templateId: number,
  placeholders: PlaceholderMap
): Promise<void> {
  const template = await getTemplateById(templateId);

  if (!template) {
    throw new Error('Template non trovato');
  }

  const outputFileName = generateFileName(template.name, placeholders.CORSO_TITOLO);
  const output = await generateDocument(template.fileBlob, placeholders, outputFileName);

  saveAs(output, outputFileName);
}

/**
 * Generates multiple documents and downloads them (or as zip if multiple)
 */
export async function generateMultipleDocuments(
  templateIds: number[],
  placeholders: PlaceholderMap
): Promise<void> {
  if (templateIds.length === 0) {
    throw new Error('Nessun template selezionato');
  }

  if (templateIds.length === 1) {
    await generateAndDownload(templateIds[0], placeholders);
    return;
  }

  // For multiple files, download them sequentially
  // In a future version, we could bundle them in a ZIP
  for (const templateId of templateIds) {
    await generateAndDownload(templateId, placeholders);
    // Small delay to prevent browser download blocking
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Generates a filename based on template name and course title
 */
function generateFileName(templateName: string, courseTitle: string): string {
  const sanitizedCourse = (courseTitle || 'documento')
    .replace(/[^a-zA-Z0-9àèéìòù\s]/g, '')
    .trim()
    .substring(0, 50);

  const date = new Date();
  const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

  return `${templateName}_${sanitizedCourse}_${dateStr}.docx`;
}

/**
 * Preview placeholders that would be applied to a template
 */
export function previewPlaceholders(placeholders: PlaceholderMap): string {
  return JSON.stringify(placeholders, null, 2);
}
