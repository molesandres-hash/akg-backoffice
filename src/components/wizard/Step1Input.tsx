import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Loader2, FileText, AlertCircle } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { toast } from 'sonner';

export function Step1Input() {
  const { 
    rawInput, 
    setRawInput, 
    setExtractionResult, 
    nextStep, 
    isExtracting, 
    setIsExtracting,
    extractionError,
    setExtractionError
  } = useWizardStore();

  const handleExtract = async () => {
    if (!rawInput.trim()) {
      toast.error('Inserisci del testo da analizzare');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);

    try {
      // Simulate AI extraction for now
      // In production, this would call the Gemini API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extraction result
      const mockResult = {
        titoloCorso: 'Corso di Formazione sulla Sicurezza sul Lavoro',
        oreTotali: 16,
        idCorso: 'CRS-2024-001',
        idSezione: 'SEZ-A',
        ente: 'Ente Formativo Esempio',
        sede: 'Via Roma 123, Milano',
        docente: { nome: 'Mario', cognome: 'Rossi' },
        tutor: { nome: 'Laura', cognome: 'Bianchi' },
        moduli: [
          {
            titolo: 'Modulo 1 - Sicurezza Base',
            dataInizio: '15/01/2024',
            dataFine: '15/01/2024',
            oreTotali: 8,
            tipoSede: 'presenza' as const,
            sessioni: [
              { data: '15/01/2024', oraInizio: '09:00', oraFine: '13:00', argomento: 'Sicurezza sul lavoro' },
              { data: '15/01/2024', oraInizio: '14:00', oraFine: '18:00', argomento: 'Utilizzo DPI' },
            ],
          },
          {
            titolo: 'Modulo 2 - Primo Soccorso',
            dataInizio: '16/01/2024',
            dataFine: '16/01/2024',
            oreTotali: 8,
            tipoSede: 'presenza' as const,
            sessioni: [
              { data: '16/01/2024', oraInizio: '09:00', oraFine: '13:00', argomento: 'Primo soccorso' },
              { data: '16/01/2024', oraInizio: '14:00', oraFine: '18:00', argomento: 'Rischio incendio' },
            ],
          },
        ],
        partecipanti: [
          { nome: 'Giuseppe', cognome: 'Verdi', codiceFiscale: 'VRDGPP80A01H501X', email: 'g.verdi@email.it' },
          { nome: 'Anna', cognome: 'Neri', codiceFiscale: 'NRENNA85B02F205Y', email: 'a.neri@email.it' },
          { nome: 'Marco', cognome: 'Gialli', codiceFiscale: 'GLLMRC90C03L219Z', email: 'm.gialli@email.it' },
        ],
      };

      setExtractionResult(mockResult);
      toast.success('Dati estratti con successo!');
      nextStep();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante l\'estrazione';
      setExtractionError(message);
      toast.error(message);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold mb-2">
          Inserisci i Dati Grezzi
        </h2>
        <p className="text-muted-foreground">
          Incolla testo da email, PDF, Excel o qualsiasi fonte contenente le informazioni del corso
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-accent" />
            Dati di Input
          </CardTitle>
          <CardDescription>
            L'AI analizzerà il testo per estrarre automaticamente: partecipanti, date, orari e dettagli del corso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Incolla qui il testo contenente le informazioni del corso...&#10;&#10;Esempio:&#10;Corso: Formazione Sicurezza&#10;Data: 15-16 Gennaio 2024&#10;Partecipanti: Mario Rossi, Anna Bianchi..."
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            className="min-h-[300px] font-mono text-sm resize-none"
            disabled={isExtracting}
          />

          {extractionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{extractionError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleExtract}
              disabled={!rawInput.trim() || isExtracting}
              size="lg"
              className="gap-2"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizzando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Estrai con AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          title="Step 1"
          description="Estrazione Calendario"
          detail="Date, orari e struttura moduli"
        />
        <InfoCard
          title="Step 2"
          description="ID e Metadati"
          detail="Codici corso e informazioni tecniche"
        />
        <InfoCard
          title="Step 3"
          description="Partecipanti"
          detail="Lista completa con dati anagrafici"
        />
      </div>
    </div>
  );
}

function InfoCard({ title, description, detail }: { title: string; description: string; detail: string }) {
  return (
    <Card className="bg-secondary/50">
      <CardContent className="pt-4">
        <p className="text-xs font-medium text-accent mb-1">{title}</p>
        <p className="font-medium text-sm">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{detail}</p>
      </CardContent>
    </Card>
  );
}
