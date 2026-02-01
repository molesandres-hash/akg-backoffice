import React, { useState, useEffect } from 'react';
import { SignatureItem, StampItem, SignerType } from '@/types/signatures';
import { signatureService } from '@/services/signatureService';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, User, PenTool, Upload as UploadIcon, MapPin } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { SignatureCanvas } from './SignatureCanvas';
import { ImageUploader } from './ImageUploader';
import { toast } from 'sonner';

interface SignatureManagerTabProps {
    type: SignerType | 'stamp';
    title: string;
    description: string;
}

export const SignatureManagerTab: React.FC<SignatureManagerTabProps> = ({
    type,
    title,
    description
}) => {
    const [items, setItems] = useState<(SignatureItem | StampItem)[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [personName, setPersonName] = useState('');

    // Refresh data
    const loadData = () => {
        if (type === 'stamp') {
            setItems(signatureService.getAllStamps());
        } else {
            setItems(signatureService.getSignaturesByType(type as SignerType));
        }
    };

    useEffect(() => {
        loadData();
    }, [type]);

    const handleDelete = (id: string) => {
        if (confirm('Sei sicuro di voler eliminare questo elemento?')) {
            if (type === 'stamp') {
                signatureService.deleteStamp(id);
            } else {
                signatureService.deleteSignature(id);
            }
            toast.success('Elemento eliminato');
            loadData();
        }
    };

    const handleSaveSignature = (dataUrl: string) => {
        if (!personName.trim()) {
            toast.error('Inserisci il nome del firmatario');
            return;
        }

        if (type === 'stamp') {
            signatureService.saveStamp({
                locationName: personName,
                imageUrl: dataUrl,
            });
        } else {
            signatureService.saveSignature({
                name: personName,
                type: type as SignerType,
                imageUrl: dataUrl,
            });
        }

        toast.success('Salvato con successo');
        setIsDialogOpen(false);
        setPersonName('');
        loadData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Aggiungi {type === 'stamp' ? 'Timbro' : 'Firma'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Aggiungi {type === 'stamp' ? 'Timbro Sede' : 'Nuova Firma'}</DialogTitle>
                            <DialogDescription>
                                {type === 'stamp'
                                    ? 'Carica il timbro della sede.'
                                    : 'Disegna o carica la firma per questo utente.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>{type === 'stamp' ? 'Nome Sede' : 'Nome e Cognome'}</Label>
                                <Input
                                    placeholder={type === 'stamp' ? 'Es. Sede Roma' : 'Es. Mario Rossi'}
                                    value={personName}
                                    onChange={(e) => setPersonName(e.target.value)}
                                />
                            </div>

                            <Tabs defaultValue={type === 'stamp' ? 'upload' : 'draw'}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="draw" disabled={type === 'stamp'}>
                                        <PenTool className="w-4 h-4 mr-2" />
                                        Disegna
                                    </TabsTrigger>
                                    <TabsTrigger value="upload">
                                        <UploadIcon className="w-4 h-4 mr-2" />
                                        Carica Immagine
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="draw" className="flex justify-center pt-4">
                                    <SignatureCanvas onSave={handleSaveSignature} />
                                </TabsContent>

                                <TabsContent value="upload" className="pt-4">
                                    <ImageUploader
                                        type={type === 'stamp' ? 'stamp' : 'signature'}
                                        onSave={handleSaveSignature}
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Nessun elemento presente.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    {type === 'stamp' ? <MapPin className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    {'name' in item ? item.name : item.locationName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center p-6 bg-slate-50">
                                <img
                                    src={item.imageUrl}
                                    alt="Signature"
                                    className="max-h-24 mix-blend-multiply"
                                />
                            </CardContent>
                            <CardFooter className="flex justify-between text-xs text-muted-foreground pt-4 bg-white">
                                <span>Aggiunto il: {new Date(item.createdAt).toLocaleDateString()}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
