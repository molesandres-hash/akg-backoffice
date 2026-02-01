import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SignatureManagerTab } from '../signatures/SignatureManagerTab';

export const StampsManager = () => {
    return (
        <Card className="glass-card">
            <CardContent className="pt-6">
                <SignatureManagerTab
                    type="stamp"
                    title="Timbri Sedi"
                    description="Gestione timbri ufficiali per le sedi operative"
                />
            </CardContent>
        </Card>
    );
};
