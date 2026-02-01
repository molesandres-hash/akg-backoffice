import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Users, Calendar, Building2, UserCog, Wifi, Download, FileText } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';

import { CorsoForm } from './forms/CorsoForm';
import { ModuliForm } from './forms/ModuliForm';
import { EnteSedeForm } from './forms/EnteSedeForm';
import { PersonaleForm } from './forms/PersonaleForm';
import { PartecipantiTable } from './forms/PartecipantiTable';
import { FadSettingsForm } from './forms/FadSettingsForm';

import { SignatureInput } from '@/components/ui/SignatureInput';
import { useState } from 'react';
import { Step3TemplateSelect } from './Step3TemplateSelect';
import { DataReviewSheet } from './DataReviewSheet';
import { Step4Generate } from './Step4Generate';

// ... existing imports

export function DashboardView() {
    const { courseData, prevStep, isSingleModule, isFadCourse, signature, setSignature } = useWizardStore();
    const totalSessions = courseData.moduli.reduce((acc, m) => acc + m.sessioni.length, 0);

    const [activeTab, setActiveTab] = useState('corso');

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-display font-semibold mb-2">Dashboard Corso</h2>
                    <div className="flex justify-center md:justify-start gap-2 mt-2 flex-wrap">
                        <Badge variant="outline">{isSingleModule() ? 'Modulo Singolo' : `${courseData.moduli.length} Moduli`}</Badge>
                        <Badge variant={isFadCourse() ? 'default' : 'secondary'}>{courseData.corso.tipo || 'N/D'}</Badge>
                        <Badge variant="outline">{courseData.partecipanti.length} Partecipanti</Badge>
                        <Badge variant="outline">{totalSessions} Sessioni</Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <DataReviewSheet />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 h-auto">
                    <TabsTrigger value="corso" className="gap-2 py-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Corso</span>
                    </TabsTrigger>
                    <TabsTrigger value="moduli" className="gap-2 py-2">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Moduli</span>
                    </TabsTrigger>
                    <TabsTrigger value="ente" className="gap-2 py-2">
                        <Building2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Ente</span>
                    </TabsTrigger>
                    <TabsTrigger value="personale" className="gap-2 py-2">
                        <UserCog className="w-4 h-4" />
                        <span className="hidden sm:inline">Personale</span>
                    </TabsTrigger>
                    <TabsTrigger value="partecipanti" className="gap-2 py-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Studenti</span>
                    </TabsTrigger>
                    {isFadCourse() && (
                        <TabsTrigger value="fad" className="gap-2 py-2">
                            <Wifi className="w-4 h-4" />
                            <span className="hidden sm:inline">FAD</span>
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="export" className="gap-2 py-2 bg-primary/5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline font-semibold">Esportazione</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="corso" className="mt-6"><Card className="glass-card"><CardHeader><CardTitle className="text-lg">Informazioni Corso</CardTitle><CardDescription>Dati generali del corso</CardDescription></CardHeader><CardContent><CorsoForm /></CardContent></Card></TabsContent>
                <TabsContent value="moduli" className="mt-6"><Card className="glass-card"><CardHeader><CardTitle className="text-lg">Moduli e Sessioni</CardTitle><CardDescription>{isSingleModule() ? 'Corso a modulo singolo' : `${courseData.moduli.length} moduli`}</CardDescription></CardHeader><CardContent><ModuliForm /></CardContent></Card></TabsContent>
                <TabsContent value="ente" className="mt-6"><EnteSedeForm /></TabsContent>
                <TabsContent value="personale" className="mt-6">
                    <PersonaleForm />
                    <div className="mt-6">
                        <SignatureInput value={signature} onChange={setSignature} />
                    </div>
                </TabsContent>
                <TabsContent value="partecipanti" className="mt-6"><Card className="glass-card"><CardHeader><CardTitle className="text-lg">Lista Partecipanti</CardTitle></CardHeader><CardContent><PartecipantiTable /></CardContent></Card></TabsContent>
                {isFadCourse() && <TabsContent value="fad" className="mt-6"><FadSettingsForm /></TabsContent>}

                {/* EXPORT TAB - COMBINES STEP 3 and STEP 4 */}
                <TabsContent value="export" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Template Selection */}
                        <div className="space-y-6">
                            <Card className="h-full border-primary/20 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        1. Scegli i Template
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Step3TemplateSelect isEmbedded={true} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Generation Settings */}
                        <div className="space-y-6">
                            <Card className="h-full border-green-500/20 bg-green-500/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Download className="w-5 h-5" />
                                        2. Genera Documenti
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Step4Generate isEmbedded={true} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-start pt-4">
                <Button variant="outline" onClick={prevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Torna all'Input
                </Button>
            </div>
        </div>
    );
}
