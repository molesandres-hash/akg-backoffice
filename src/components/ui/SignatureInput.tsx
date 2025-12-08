import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eraser } from 'lucide-react';

interface SignatureInputProps {
    value: string | null;
    onChange: (value: string | null) => void;
}

export function SignatureInput({ value, onChange }: SignatureInputProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(!value);

    const handleClear = () => {
        sigCanvas.current?.clear();
        onChange(null);
        setIsEmpty(true);
    };

    const handleEnd = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            // Save as PNG data URL
            const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
            onChange(dataUrl);
            setIsEmpty(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Firma del Docente</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClear}
                        disabled={isEmpty}
                        className="h-8 gap-2"
                    >
                        <Eraser className="w-4 h-4" />
                        Pulisci
                    </Button>
                </CardTitle>
                <CardDescription>
                    Disegna la tua firma nel riquadro sottostante. Verrà inserita nei registri.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border-2 border-dashed rounded-lg bg-white cursor-crosshair touch-none">
                    <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{
                            className: "w-full h-40 rounded-lg",
                            style: { width: '100%', height: '160px' }
                        }}
                        onEnd={handleEnd}
                    />
                </div>
                {!isEmpty && (
                    <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
                        ✓ Firma acquisita
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
