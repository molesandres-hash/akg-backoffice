import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

/**
 * Validates a DOCX template by attempting to parse it with Docxtemplater.
 * This catches "Duplicate open tag", "Duplicate close tag", and other structural errors
 * that regex might miss or misinterpret.
 */
export async function validateDocxTemplate(file: File): Promise<ValidationResult> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = new PizZip(arrayBuffer);

        // We instantiate Docxtemplater and try to compile the template.
        // If there are syntax errors (like {{{ or }}}), the constructor or .compile() will throw.
        try {
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                delimiters: { start: '{', end: '}' },
            });

            // Force compilation to check for errors
            doc.compile();

            return { isValid: true, errors: [], warnings: [] };
        } catch (error: any) {
            console.error('Docxtemplater validation error:', error);
            // Docxtemplater throws errors with a 'properties' object containing details
            if (error.properties && error.properties.errors) {
                const messages = error.properties.errors.map((e: any) => {
                    const context = e.properties?.context || '';
                    const tag = e.properties?.xtag ? ` (tag: "${e.properties.xtag}")` : '';
                    return `${e.message}${tag} ${context ? `near "${context}"` : ''}`;
                });
                return { isValid: false, errors: messages, warnings: [] };
            }

            return { isValid: false, errors: [error.message || 'Errore di validazione nel template'], warnings: [] };
        }

    } catch (error: any) {
        console.error('Template validation error:', error);
        return { isValid: false, errors: ['Il file non è un documento Word valido (o è corrotto)'], warnings: [] };
    }
}
