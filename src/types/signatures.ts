export type SignerType = 'docente' | 'corsista' | 'team_leader' | 'responsabile' | 'altro';

export interface SignatureItem {
    id: string; // UUID
    name: string; // Nome della persona
    type: SignerType;
    imageUrl: string; // Base64 string
    createdAt: string; // ISO Date
    width?: number;
    height?: number;
}

export interface StampItem {
    id: string; // UUID
    locationName: string; // Nome della sede
    imageUrl: string; // Base64 string
    createdAt: string; // ISO Date
    width?: number;
    height?: number;
}

export interface SignatureStorageData {
    signatures: SignatureItem[];
    stamps: StampItem[];
    lastBackup?: string;
}
