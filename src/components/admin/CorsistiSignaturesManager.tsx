import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SignatureManagerTab } from '../signatures/SignatureManagerTab';
import { Users } from 'lucide-react';

export const CorsistiSignaturesManager = () => {
    return (
        <Card className="glass-card">
            <CardContent className="pt-6">
                <SignatureManagerTab
                    type="corsista"
                    title="Firme Corsisti"
                    description="Gestione firme dei partecipanti ai corsi"
                />
            </CardContent>
        </Card>
    );
};
