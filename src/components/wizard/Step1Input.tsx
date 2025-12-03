import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Loader2, FileText, AlertCircle } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { toast } from 'sonner';
import type { ExtractionResult } from '@/types/extraction';

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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extraction result with new structure
      const mockResult: ExtractionResult = {
        corso: {
          titolo: 'AI: Intelligenza Artificiale 100% FAD - Modulo 1',
          id: '144176',
          tipo: 'FAD',
          data_inizio: '22/09/2025',
          data_fine: '26/09/2025',
          durata_totale: '20 hours',
          ore_totali: '20',
          ore_rendicontabili: '20',
          capienza: '4/5',
          capienza_numero: 4,
          capienza_totale: 5,
          stato: 'Aperto',
          anno: '2025',
          programma: '',
          offerta_formativa: {
            codice: '1540',
            nome: 'GOL - FAD 100% - Offerta per Formazione mirata all\'inserimento lavorativo'
          }
        },
        moduli: [
          {
            titolo: 'AI: Intelligenza Artificiale 100% FAD - Modulo 1',
            id: 'AI: Intelligenza Artificiale 100% FAD - Modulo 1',
            id_corso: '50039',
            id_sezione: '144176',
            argomenti: [
              'Introduzione all\'Intelligenza Artificiale',
              'Fondamenti di Machine Learning',
              'Algoritmi di Apprendimento Supervisionato',
              'Reti Neurali e Deep Learning',
              'Elaborazione del Linguaggio Naturale (NLP)'
            ],
            data_inizio: '22/09/2025',
            data_fine: '26/09/2025',
            ore_totali: '20',
            ore_rendicontabili: '20',
            tipo_sede: 'Online',
            provider: '',
            capienza: '4/5',
            stato: 'Aperto',
            sessioni: [
              { numero: 1, data_completa: '22/09/2025', giorno: '22', mese: 'Settembre', mese_numero: '09', anno: '2025', giorno_settimana: 'Lunedì', ora_inizio: '14:00', ora_fine: '18:00', sede: '', tipo_sede: 'online', is_fad: true },
              { numero: 2, data_completa: '23/09/2025', giorno: '23', mese: 'Settembre', mese_numero: '09', anno: '2025', giorno_settimana: 'Martedì', ora_inizio: '14:00', ora_fine: '18:00', sede: '', tipo_sede: 'online', is_fad: true },
              { numero: 3, data_completa: '24/09/2025', giorno: '24', mese: 'Settembre', mese_numero: '09', anno: '2025', giorno_settimana: 'Mercoledì', ora_inizio: '14:00', ora_fine: '18:00', sede: '', tipo_sede: 'online', is_fad: true },
              { numero: 4, data_completa: '25/09/2025', giorno: '25', mese: 'Settembre', mese_numero: '09', anno: '2025', giorno_settimana: 'Giovedì', ora_inizio: '14:00', ora_fine: '18:00', sede: '', tipo_sede: 'online', is_fad: true },
              { numero: 5, data_completa: '26/09/2025', giorno: '26', mese: 'Settembre', mese_numero: '09', anno: '2025', giorno_settimana: 'Venerdì', ora_inizio: '14:00', ora_fine: '18:00', sede: '', tipo_sede: 'online', is_fad: true },
            ],
            sessioni_presenza: []
          }
        ],
        sede: {
          tipo: '',
          nome: 'Milano Porta Romana',
          modalita: '',
          indirizzo: 'Corso di Porta Romana 122'
        },
        ente: {
          nome: 'AK Group S.r.l',
          id: 'ent_1_sede_ak_3',
          indirizzo: 'Via Recanate 2 Milano MI',
          accreditato: {
            nome: 'AK Group S.r.l',
            via: 'Via Recanate 2',
            numero_civico: '',
            comune: 'Milano',
            cap: '20124',
            provincia: 'MI'
          }
        },
        trainer: {
          nome: 'Andres',
          cognome: 'Moles',
          nome_completo: 'Andres Moles',
          codice_fiscale: 'MLSNRS97S25F205C'
        },
        tutor: {
          nome: '',
          cognome: '',
          nome_completo: '',
          codice_fiscale: ''
        },
        direttore: {
          nome_completo: 'Hubbard Andrea',
          qualifica: 'Supervisore'
        },
        partecipanti: [
          { nome: 'FABRIZIO', cognome: 'VILCA CAMPOS', codiceFiscale: 'VLCFRZ01L30Z611L', email: '', telefono: '' },
          { nome: 'PAOLO', cognome: 'PERRONE', codiceFiscale: 'PRRPLA78C09F205R', email: '', telefono: '' },
          { nome: 'CLAUDIA', cognome: 'CANI', codiceFiscale: 'CNACLD79L52F205N', email: '', telefono: '' },
          { nome: 'Cristian', cognome: 'Agnelli', codiceFiscale: 'GNLCST90A01F205X', email: '', telefono: '' },
        ],
        fad_settings: {
          piattaforma: 'Microsoft Teams',
          modalita_gestione: 'Sincrona',
          modalita_valutazione: 'Test Scritto',
          obiettivi_didattici: '',
          zoom_meeting_id: '123213',
          zoom_passcode: '12323321312',
          zoom_link: 'https://teams.microsoft.com/meeting'
        }
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
