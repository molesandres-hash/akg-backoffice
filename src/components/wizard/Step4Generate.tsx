import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  FileJson,
  FileText,
  Users,
  Calendar
} from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { mapCourseDataToPlaceholders, validatePlaceholders } from '@/services/mapping/placeholderMapper';
import { generateMultipleDocuments } from '@/services/generation/docxGenerator';
import { toast } from 'sonner';

export function Step4Generate() {
  const { 
    courseData, 
    selectedTemplateIds, 
    prevStep, 
    reset,
    isGenerating,
    setIsGenerating 
  } = useWizardStore();
  
  const [showPreview, setShowPreview] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);

  const placeholders = mapCourseDataToPlaceholders(courseData);
  const warnings = validatePlaceholders(placeholders);
  
  // Calculate total sessions across all modules
  const totalSessions = courseData.moduli.reduce((acc, m) => acc + m.sessioni.length, 0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      await generateMultipleDocuments(selectedTemplateIds, placeholders);
      setGenerationComplete(true);
      toast.success('Documenti generati con successo!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante la generazione';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewDocument = () => {
    reset();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold mb-2">
          Genera Documenti
        </h2>
        <p className="text-muted-foreground">
          Rivedi il riepilogo e genera i documenti finali
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-secondary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{selectedTemplateIds.length}</p>
                <p className="text-xs text-muted-foreground">Template selezionati</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courseData.partecipanti.length}</p>
                <p className="text-xs text-muted-foreground">Partecipanti</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSessions}</p>
                <p className="text-xs text-muted-foreground">Sessioni</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert variant="default" className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription>
            <p className="font-medium mb-1">Attenzione</p>
            <ul className="text-sm space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Course Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Riepilogo Corso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Titolo</p>
              <p className="font-medium">{courseData.corso.titolo || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ente</p>
              <p className="font-medium">{courseData.ente.nome || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ID Corso</p>
              <p className="font-medium">{courseData.corso.id || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ore Totali</p>
              <p className="font-medium">{courseData.corso.ore_totali || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Docente</p>
              <p className="font-medium">
                {courseData.trainer.nome_completo || 
                 [courseData.trainer.nome, courseData.trainer.cognome].filter(Boolean).join(' ') || '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tutor</p>
              <p className="font-medium">
                {courseData.tutor.nome_completo ||
                 [courseData.tutor.nome, courseData.tutor.cognome].filter(Boolean).join(' ') || '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JSON Preview */}
      <Collapsible open={showPreview} onOpenChange={setShowPreview}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              Debug: Anteprima Dati Mapping
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4">
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(placeholders, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Generation Complete */}
      {generationComplete && (
        <Alert className="bg-success/10 border-success">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription>
            Documenti generati con successo! Controlla la cartella download.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep} disabled={isGenerating} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </Button>
        
        <div className="flex gap-3">
          {generationComplete && (
            <Button variant="outline" onClick={handleNewDocument}>
              Nuovo Documento
            </Button>
          )}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || selectedTemplateIds.length === 0}
            size="lg"
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generazione...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Genera {selectedTemplateIds.length > 1 ? 'Documenti' : 'Documento'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
