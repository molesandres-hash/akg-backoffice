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
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
export function Step2DataReview() {
  const { courseData, nextStep: originalNextStep, prevStep, isSingleModule, isFadCourse, signature, setSignature } = useWizardStore();
  const totalSessions = courseData.moduli.reduce((acc, m) => acc + m.sessioni.length, 0);

  // Track visited tabs
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['corso']));
  const [activeTab, setActiveTab] = useState('corso');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Define all required tabs
  const requiredTabs = ['corso', 'moduli', 'ente', 'personale', 'partecipanti'];
  if (isFadCourse()) {
    requiredTabs.push('fad');
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setVisitedTabs(prev => new Set(prev).add(value));
  };

  const handleNextStep = () => {
    const missingTabs = requiredTabs.filter(tab => !visitedTabs.has(tab));
    if (missingTabs.length > 0) {
      setShowConfirmDialog(true);
    } else {
      originalNextStep();
    }
  };

  const isTabVisited = (value: string) => visitedTabs.has(value);

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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="corso" className="gap-2 py-2 relative">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Corso</span>
            {!isTabVisited('corso') && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />}
          </TabsTrigger>
          <TabsTrigger value="moduli" className="gap-2 py-2 relative">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Moduli</span>
            {!isTabVisited('moduli') && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />}
          </TabsTrigger>
          <TabsTrigger value="ente" className="gap-2 py-2 relative">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Ente</span>
            {!isTabVisited('ente') && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />}
          </TabsTrigger>
          <TabsTrigger value="personale" className="gap-2 py-2 relative">
            <UserCog className="w-4 h-4" />
            <span className="hidden sm:inline">Personale</span>
            {!isTabVisited('personale') && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />}
          </TabsTrigger>
          <TabsTrigger value="partecipanti" className="gap-2 py-2 relative">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Studenti</span>
            {!isTabVisited('partecipanti') && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />}
          </TabsTrigger>
          {isFadCourse() && (
            <TabsTrigger value="fad" className="gap-2 py-2 relative">
              <Wifi className="w-4 h-4" />
              <span className="hidden sm:inline">FAD</span>
              {!isTabVisited('fad') && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />}
            </TabsTrigger>
          )}
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
        <Button onClick={handleNextStep} className="gap-2">Avanti<ArrowRight className="w-4 h-4" /></Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler procedere?</AlertDialogTitle>
            <AlertDialogDescription>
              Non hai ancora visitato tutte le sezioni di revisione. È consigliabile controllare tutti i dati (Corso, Moduli, Personale, ecc.) per evitare errori nei documenti generati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Torna indietro</AlertDialogCancel>
            <AlertDialogAction onClick={() => originalNextStep()}>Procedi comunque</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
