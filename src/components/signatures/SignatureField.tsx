import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PenTool, Upload as UploadIcon, Trash2, X, Check } from 'lucide-react';
import { SignatureCanvas } from './SignatureCanvas';
import { ImageUploader } from './ImageUploader';
import { signatureService } from '@/services/signatureService';
import { SignerType, SignatureItem } from '@/types/signatures';
import { toast } from 'sonner';

interface SignatureFieldProps {
    name: string;
    type: SignerType;
    onUpdate?: () => void;
}

export const SignatureField: React.FC<SignatureFieldProps> = ({ name, type, onUpdate }) => {
    const [signature, setSignature] = useState<SignatureItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(name);

    useEffect(() => {
        loadSignature();
        setNewName(name);
    }, [name, type]);

    const loadSignature = () => {
        const signatures = signatureService.getSignaturesByType(type);
        // Find signature matching the name (case insensitive trim)
        const found = signatures.find(s => s.name.trim().toLowerCase() === name.trim().toLowerCase());
        setSignature(found || null);
    };

    const handleSave = (dataUrl: string) => {
        if (!newName.trim()) {
            toast.error('Nome mancante');
            return;
        }

        // If a signature already exists for this person, we might want to update it or delete old and create new
        // The service logic is simplified: saveSignature always adds new. 
        // We should check if we should update an existing one or remove the old one first.

        if (signature) {
            signatureService.deleteSignature(signature.id);
        }

        signatureService.saveSignature({
            name: newName,
            type: type,
            imageUrl: dataUrl,
        });

        toast.success('Firma salvata');
        setIsEditing(false);
        loadSignature();
        if (onUpdate) onUpdate();
    };

    const handleDelete = () => {
        if (!signature) return;
        if (confirm('Eliminare la firma?')) {
            signatureService.deleteSignature(signature.id);
            setSignature(null);
            toast.success('Firma eliminata');
            if (onUpdate) onUpdate();
        }
    };

    if (isEditing) {
        return (
            <div className="space-y-4 border rounded-md p-4 bg-slate-50">
                <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Modifica Firma</Label>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-2" />
                        Annulla
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nome e Cognome per la firma</Label>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Nome Cognome"
                        />
                    </div>

                    <Tabs defaultValue="draw" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="draw">
                                <PenTool className="w-4 h-4 mr-2" />
                                Disegna
                            </TabsTrigger>
                            <TabsTrigger value="upload">
                                <UploadIcon className="w-4 h-4 mr-2" />
                                Carica
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="draw" className="flex flex-col items-center pt-4 bg-white rounded-md border p-4">
                            <SignatureCanvas onSave={handleSave} />
                        </TabsContent>

                        <TabsContent value="upload" className="pt-4">
                            <ImageUploader
                                type="signature"
                                onSave={handleSave}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 border rounded-md p-4">
            <Label className="text-sm font-medium">Firma Digitale</Label>

            {signature ? (
                <div className="flex items-center justify-between gap-4">
                    <div className="border p-2 rounded-md bg-white flex-1 flex justify-center">
                        <img
                            src={signature.imageUrl}
                            alt="Firma"
                            className="h-16 object-contain mix-blend-multiply"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <PenTool className="w-4 h-4 mr-2" />
                            Modifica
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Elimina
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <div className="flex-1 text-sm text-muted-foreground italic">
                        Nessuna firma associata
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <PlusIcon />
                        Aggiungi Firma
                    </Button>
                </div>
            )}
        </div>
    );
};

const PlusIcon = () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2">
        <path d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    </svg>
);
