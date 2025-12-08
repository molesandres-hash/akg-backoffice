import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, BookOpen, Users, Calendar, Building2, UserCog, Wifi } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';

import { CorsoForm } from './forms/CorsoForm';
import { ModuliForm } from './forms/ModuliForm';
import { EnteSedeForm } from './forms/EnteSedeForm';
import { PersonaleForm } from './forms/PersonaleForm';
import { PartecipantiTable } from './forms/PartecipantiTable';
import { FadSettingsForm } from './forms/FadSettingsForm';

import { SignatureInput } from '@/components/ui/SignatureInput';

export function Step2DataReview() {
  const { courseData, nextStep, prevStep, isSingleModule, isFadCourse, signature, setSignature } = useWizardStore();
  const totalSessions = courseData.moduli.reduce((acc, m) => acc + m.sessioni.length, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold mb-2">Revisione Dati</h2>
        <p className="text-muted-foreground">Verifica e correggi i dati estratti dall'AI</p>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          <Badge variant="outline">{isSingleModule() ? 'Modulo Singolo' : `${courseData.moduli.length} Moduli`}</Badge>
          <Badge variant={isFadCourse() ? 'default' : 'secondary'}>{courseData.corso.tipo || 'N/D'}</Badge>
          <Badge variant="outline">{courseData.partecipanti.length} Partecipanti</Badge>
          <Badge variant="outline">{totalSessions} Sessioni</Badge>
        </div>
      </div>

      <Tabs defaultValue="corso" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="corso" className="gap-2 py-2"><BookOpen className="w-4 h-4" /><span className="hidden sm:inline">Corso</span></TabsTrigger>
          <TabsTrigger value="moduli" className="gap-2 py-2"><Calendar className="w-4 h-4" /><span className="hidden sm:inline">Moduli</span></TabsTrigger>
          <TabsTrigger value="ente" className="gap-2 py-2"><Building2 className="w-4 h-4" /><span className="hidden sm:inline">Ente</span></TabsTrigger>
          <TabsTrigger value="personale" className="gap-2 py-2"><UserCog className="w-4 h-4" /><span className="hidden sm:inline">Personale</span></TabsTrigger>
          <TabsTrigger value="partecipanti" className="gap-2 py-2"><Users className="w-4 h-4" /><span className="hidden sm:inline">Studenti</span></TabsTrigger>
          {isFadCourse() && <TabsTrigger value="fad" className="gap-2 py-2"><Wifi className="w-4 h-4" /><span className="hidden sm:inline">FAD</span></TabsTrigger>}
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
      </Tabs>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep} className="gap-2"><ArrowLeft className="w-4 h-4" />Indietro</Button>
        <Button onClick={nextStep} className="gap-2">Avanti<ArrowRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
