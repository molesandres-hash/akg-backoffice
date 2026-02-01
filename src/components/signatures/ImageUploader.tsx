import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
    onSave: (dataUrl: string) => void;
    type: 'signature' | 'stamp';
    maxSizeMB?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    onSave,
    type,
    maxSizeMB = 1
}) => {
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'image/png') {
            toast.error('Solo file PNG sono supportati');
            return;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`Il file supera la dimensione massimale di ${maxSizeMB}MB`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setPreview(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const clearSelection = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = () => {
        if (preview) {
            onSave(preview);
            clearSelection();
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png"
                    onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                    Formato consigliato: PNG trasparente.
                    {type === 'signature' ? ' 200x200px' : ' 300x300px'}
                </p>
            </div>

            {preview && (
                <div className="space-y-3 p-4 border rounded-md">
                    <p className="text-sm font-medium">Anteprima:</p>
                    <div className="border border-dashed p-4 flex justify-center bg-gray-50 rounded-md">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-40 object-contain mix-blend-multiply"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={clearSelection}>
                            <X className="w-4 h-4 mr-2" />
                            Annulla
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            <Upload className="w-4 h-4 mr-2" />
                            Carica {type === 'signature' ? 'Firma' : 'Timbro'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
