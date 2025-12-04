import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, FileText, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { toast } from 'sonner';
import { extractionService, type ExtractionMode, type ExtractionResponse } from '@/services/extraction';
import { getSettings } from '@/db/templateDb';
import { useState } from 'react';

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

  const [extractionResponse, setExtractionResponse] = useState<ExtractionResponse | null>(null);

  const handleExtract = async () => {
    if (!rawInput.trim()) {
      toast.error('Inserisci del testo da analizzare');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    setExtractionResponse(null);

    try {
      // Get settings for extraction mode
      const settings = await getSettings();
      const mode: ExtractionMode = settings?.extractionMode || 'standard';
      
      // Check if API key is configured
      const apiKey = localStorage.getItem('gemini_api_key') || settings?.geminiApiKey;
      if (!apiKey) {
        throw new Error('Gemini API Key non configurata. Vai nelle Impostazioni > Generali per inserirla.');
      }
      
      // Sync to localStorage if from DB
      if (!localStorage.getItem('gemini_api_key') && settings?.geminiApiKey) {
        localStorage.setItem('gemini_api_key', settings.geminiApiKey);
      }

      // Perform extraction
      const response = await extractionService.extract(rawInput, mode);
      setExtractionResponse(response);
      setExtractionResult(response.result);

      // Show appropriate toast based on confidence
      if (response.confidence === 'excellent') {
        toast.success('Dati estratti con successo! Affidabilità: Eccellente');
      } else if (response.confidence === 'reliable') {
        toast.success('Dati estratti con successo! Affidabilità: Buona');
      } else if (response.confidence === 'review_needed') {
        toast.warning('Dati estratti - Revisione consigliata', {
          description: 'Sono state rilevate alcune discrepanze'
        });
      } else {
        toast.success('Dati estratti con successo!');
      }

      nextStep();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante l\'estrazione';
      setExtractionError(message);
      toast.error(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const getConfidenceBadge = () => {
    if (!extractionResponse?.confidence) return null;
    
    switch (extractionResponse.confidence) {
      case 'excellent':
        return (
          <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Eccellente ({extractionResponse.matchScore}%)
          </Badge>
        );
      case 'reliable':
        return (
          <Badge variant="default" className="bg-blue-500/20 text-blue-600 border-blue-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Affidabile ({extractionResponse.matchScore}%)
          </Badge>
        );
      case 'review_needed':
        return (
          <Badge variant="default" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Revisione ({extractionResponse.matchScore}%)
          </Badge>
        );
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
            {getConfidenceBadge()}
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
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{extractionError}</AlertDescription>
            </Alert>
          )}

          {extractionResponse?.warnings && extractionResponse.warnings.length > 0 && (
            <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-600">Discrepanze Rilevate</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  {extractionResponse.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
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

      <Alert variant="default" className="border-accent/30 bg-accent/5">
        <Info className="h-4 w-4 text-accent" />
        <AlertDescription className="text-sm">
          L'estrazione avviene in locale usando la tua API Key di Google Gemini. 
          Puoi configurare la modalità di estrazione nelle <strong>Impostazioni &gt; Generali</strong>.
        </AlertDescription>
      </Alert>

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
