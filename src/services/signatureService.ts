import { SignatureItem, StampItem, SignatureStorageData, SignerType } from '@/types/signatures';

const STORAGE_KEY = 'akg_signatures_data';

const getStorageData = (): SignatureStorageData => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        return { signatures: [], stamps: [] };
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('Error parsing signature storage data', e);
        return { signatures: [], stamps: [] };
    }
};

const saveStorageData = (data: SignatureStorageData) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving signature storage data. Storage might be full.', e);
        throw new Error('Spazio di archiviazione pieno o errore di salvataggio.');
    }
};

export const signatureService = {
    // Signatures
    getAllSignatures: (): SignatureItem[] => {
        return getStorageData().signatures;
    },

    getSignaturesByType: (type: SignerType): SignatureItem[] => {
        return getStorageData().signatures.filter(s => s.type === type);
    },

    saveSignature: (signature: Omit<SignatureItem, 'id' | 'createdAt'>): SignatureItem => {
        const data = getStorageData();
        const newSignature: SignatureItem = {
            ...signature,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        data.signatures.push(newSignature);
        saveStorageData(data);
        return newSignature;
    },

    updateSignature: (id: string, updates: Partial<SignatureItem>): SignatureItem | null => {
        const data = getStorageData();
        const index = data.signatures.findIndex(s => s.id === id);
        if (index === -1) return null;

        const updated = { ...data.signatures[index], ...updates };
        data.signatures[index] = updated;
        saveStorageData(data);
        return updated;
    },

    deleteSignature: (id: string): void => {
        const data = getStorageData();
        data.signatures = data.signatures.filter(s => s.id !== id);
        saveStorageData(data);
    },

    // Stamps
    getAllStamps: (): StampItem[] => {
        return getStorageData().stamps;
    },

    saveStamp: (stamp: Omit<StampItem, 'id' | 'createdAt'>): StampItem => {
        const data = getStorageData();
        const newStamp: StampItem = {
            ...stamp,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        data.stamps.push(newStamp);
        saveStorageData(data);
        return newStamp;
    },

    deleteStamp: (id: string): void => {
        const data = getStorageData();
        data.stamps = data.stamps.filter(s => s.id !== id);
        saveStorageData(data);
    },

    // Backup / Export
    exportData: (): string => {
        const data = getStorageData();
        // Add timestamp to backup
        data.lastBackup = new Date().toISOString();
        return JSON.stringify(data, null, 2);
    },

    importData: (jsonString: string): boolean => {
        try {
            const parsed = JSON.parse(jsonString) as SignatureStorageData;
            if (!Array.isArray(parsed.signatures) || !Array.isArray(parsed.stamps)) {
                throw new Error('Invalid format');
            }
            saveStorageData(parsed);
            return true;
        } catch (e) {
            console.error('Import failed', e);
            return false;
        }
    }
};
