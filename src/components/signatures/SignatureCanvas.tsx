import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eraser, Save } from 'lucide-react';

interface SignatureCanvasProps {
    onSave: (dataUrl: string) => void;
    width?: number;
    height?: number;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
    onSave,
    width = 500,
    height = 200
}) => {
    const sigPad = useRef<SignaturePad>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigPad.current?.clear();
        setIsEmpty(true);
    };

    const save = () => {
        if (sigPad.current && !sigPad.current.isEmpty()) {
            // Trim whitespace and save
            // Use toDataURL directly as getTrimmedCanvas() causes a runtime error with current lib version
            const dataUrl = sigPad.current.toDataURL('image/png');
            onSave(dataUrl);
            clear();
        }
    };

    const handleEnd = () => {
        if (sigPad.current) {
            setIsEmpty(sigPad.current.isEmpty());
        }
    };

    return (
        <div className="flex flex-col gap-4 max-w-fit">
            <Card className="p-1 border-2 border-dashed border-gray-300 bg-white">
                <SignaturePad
                    ref={sigPad}
                    canvasProps={{
                        width,
                        height,
                        className: 'cursor-crosshair bg-white'
                    }}
                    onEnd={handleEnd}
                />
            </Card>

            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={clear}
                    disabled={isEmpty}
                    size="sm"
                >
                    <Eraser className="w-4 h-4 mr-2" />
                    Pulisci
                </Button>
                <Button
                    onClick={save}
                    disabled={isEmpty}
                    size="sm"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Salva Firma
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Disegna la tua firma nel riquadro sopra.
            </p>
        </div>
    );
};
