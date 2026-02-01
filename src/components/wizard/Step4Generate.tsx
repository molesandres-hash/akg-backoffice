import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  Calendar,
  FileArchive,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
  ChevronUp,
  Settings2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useWizardStore } from '@/store/wizardStore';
import { mapCourseDataToPlaceholders, validatePlaceholders } from '@/services/mapping/placeholderMapper';
import { generateMultipleDocuments } from '@/services/generation/docxGenerator';
import { generateCourseZip, generateExcelOnlyZip, type ZipConfig } from '@/services/generation/zipPackager';
import { toast } from 'sonner';

interface Step4Props {
  isEmbedded?: boolean;
}

export function Step4Generate({ isEmbedded = false }: Step4Props) {
  const {
    courseData,
    selectedTemplateIds,
    prevStep,
    reset,
    isGenerating,
    setIsGenerating,
    signature
  } = useWizardStore();

  const [showPreview, setShowPreview] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [exportMode, setExportMode] = useState<'docs' | 'zip' | 'excel'>('zip');

  // Experimental Mode (Default ON)
  const [useProgrammaticGeneration, setUseProgrammaticGeneration] = useState(true);

  // Advanced Options Visibility
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // ZIP options
  const [includeExcel, setIncludeExcel] = useState(true);
  const [includeFadRegistries, setIncludeFadRegistries] = useState(true);
  const [generateOnlyCustom, setGenerateOnlyCustom] = useState(false);

  const [includeCertificates, setIncludeCertificates] = useState(false);
  const [includeModulo5, setIncludeModulo5] = useState(true);
  const [includeModulo7, setIncludeModulo7] = useState(true);
  const [includeModulo8, setIncludeModulo8] = useState(true);
  const [includeRegistroCartaceo, setIncludeRegistroCartaceo] = useState(true);
  const [includeReadme, setIncludeReadme] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);

  const placeholders = mapCourseDataToPlaceholders(courseData);
  const warnings = validatePlaceholders(placeholders);

  const totalSessions = courseData.moduli.reduce((acc, m) => acc + m.sessioni.length, 0);
  const fadSessions = courseData.moduli.flatMap(m => m.sessioni.filter(s => s.is_fad));
  const presenzaSessions = courseData.moduli.flatMap(m => m.sessioni.filter(s => !s.is_fad));
  const beneficiari = courseData.partecipanti.filter(p => p.benefits);
  const isMultiModule = courseData.moduli.length > 1;

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Inject signature into placeholders if available
    const placeholdersWithSignature = {
      ...placeholders,
      FIRMA_DOCENTE: signature || ''
    };

    try {
      if (exportMode === 'docs') {
        await generateMultipleDocuments(selectedTemplateIds, placeholdersWithSignature);
      } else if (exportMode === 'excel') {
        await generateExcelOnlyZip(courseData);
      } else {
        const config: Partial<ZipConfig> = {
          includeExcel,
          includeFadRegistries: includeFadRegistries && fadSessions.length > 0,
          includeCertificates,
          includeModulo5: includeModulo5 && beneficiari.length > 0,
          includeModulo7: includeModulo7 && beneficiari.length > 0,
          includeModulo8: includeModulo8 && presenzaSessions.length > 0,
          includeRegistroCartaceo: includeRegistroCartaceo && presenzaSessions.length > 0,
          includeReadme,
          includeMetadata,
          useProgrammaticGeneration,
          onlyUserTemplates: generateOnlyCustom,
          includeSignatureImage: courseData.fad_settings.includeSignature
        };
        await generateCourseZip(courseData, selectedTemplateIds, config, signature);
      }

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-secondary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{selectedTemplateIds.length}</p>
                <p className="text-xs text-muted-foreground">Template</p>
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

        <Card className="bg-secondary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courseData.moduli.length}</p>
                <p className="text-xs text-muted-foreground">
                  {isMultiModule ? 'Moduli' : 'Modulo'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-module notice */}
      {isMultiModule && (
        <Alert className="bg-info/10 border-info">
          <Layers className="h-4 w-4" />
          <AlertDescription>
            Corso multi-modulo: verranno generati documenti separati per ogni modulo in sottocartelle.
          </AlertDescription>
        </Alert>
      )}

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

      {/* GENERATION MODE SELECTION */}
      <div className="space-y-6">
        {/* Primary Method: Experimental Generation */}
        <Card className={`border-2 transition-all ${useProgrammaticGeneration
          ? 'border-purple-500 bg-purple-50/50 shadow-md'
          : 'border-border opacity-70 hover:opacity-100'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2 text-purple-700">
                  <Sparkles className="w-5 h-5" />
                  Generazione Sperimentale (v2.0)
                </CardTitle>
                <CardDescription className="text-purple-600/80">
                  Nuovo motore di generazione intelligente. Più stabile, veloce e supporta tabelle dinamiche.
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-programmatic"
                  checked={useProgrammaticGeneration}
                  onCheckedChange={(checked) => {
                    setUseProgrammaticGeneration(checked);
                    if (checked) setExportMode('zip');
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="pl-7 space-y-3">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Include automaticamente ottimizzazioni per:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Gestione loghi e firme dinamica</li>
                  <li>Tabelle partecipanti e registri formattati correttamente</li>
                  <li>Calcolo automatico ore e sessioni</li>
                </ul>
              </div>

              {useProgrammaticGeneration && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-purple-100/50 rounded-lg border border-purple-200 text-purple-800 text-sm">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Questa modalità genererà un archivio ZIP completo con documenti Word ed Excel.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options Toggle */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2"
          >
            {showAdvancedOptions ? (
              <>Nascondi opzioni avanzate <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Mostra opzioni legacy e avanzate <ChevronDown className="w-3 h-3" /></>
            )}
          </Button>
        </div>

        {/* Legacy / Advanced Options */}
        {showAdvancedOptions && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <Card className="glass-card border-dashed">
              <CardHeader>
                <CardTitle className="text-lg text-muted-foreground flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Opzioni Avanzate & Legacy
                </CardTitle>
                <CardDescription>Vecchi metodi di esportazione e configurazioni manuali</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => { setExportMode('zip'); setUseProgrammaticGeneration(false); }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${exportMode === 'zip' && !useProgrammaticGeneration
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <FileArchive className="w-6 h-6 mb-2" />
                    <p className="font-medium">ZIP Legacy</p>
                    <p className="text-xs text-muted-foreground">Word + Excel (Vecchio motore)</p>
                  </button>

                  <button
                    onClick={() => setExportMode('docs')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${exportMode === 'docs'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <FileText className="w-6 h-6 mb-2" />
                    <p className="font-medium">Solo Word</p>
                    <p className="text-xs text-muted-foreground">Download singoli documenti</p>
                  </button>

                  <button
                    onClick={() => setExportMode('excel')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${exportMode === 'excel'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <FileSpreadsheet className="w-6 h-6 mb-2" />
                    <p className="font-medium">Solo Excel</p>
                    <p className="text-xs text-muted-foreground">Registri e report</p>
                  </button>
                </div>

                {/* ZIP Options */}
                {(exportMode === 'zip' || useProgrammaticGeneration) && (
                  <div className="pt-4 border-t space-y-4">
                    <p className="text-sm font-medium">Contenuto Archivio</p>

                    {/* Base options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeExcel"
                          checked={includeExcel}
                          onCheckedChange={(c) => setIncludeExcel(c === true)}
                        />
                        <Label htmlFor="includeExcel" className="text-sm">
                          Includi file Excel
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeFad"
                          checked={includeFadRegistries}
                          disabled={fadSessions.length === 0}
                          onCheckedChange={(c) => setIncludeFadRegistries(c === true)}
                        />
                        <Label htmlFor="includeFad" className="text-sm">
                          Registri FAD ({fadSessions.length})
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeCerts"
                          checked={includeCertificates}
                          onCheckedChange={(c) => setIncludeCertificates(c === true)}
                        />
                        <Label htmlFor="includeCerts" className="text-sm">
                          Certificati individuali
                        </Label>
                      </div>
                    </div>

                    <Separator />

                    {/* GOL/PNRR options */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        Beneficiari GOL/PNRR ({beneficiari.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="includeModulo5"
                            checked={includeModulo5}
                            disabled={beneficiari.length === 0}
                            onCheckedChange={(c) => setIncludeModulo5(c === true)}
                          />
                          <Label htmlFor="includeModulo5" className="text-sm">
                            Modulo 5 - Calendario Condizionalità
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="includeModulo7"
                            checked={includeModulo7}
                            disabled={beneficiari.length === 0}
                            onCheckedChange={(c) => setIncludeModulo7(c === true)}
                          />
                          <Label htmlFor="includeModulo7" className="text-sm">
                            Modulo 7 - Comunicazione Evento
                          </Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Presence options */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        Sessioni in presenza ({presenzaSessions.length})
                      </p>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeModulo8"
                          checked={includeModulo8}
                          disabled={presenzaSessions.length === 0}
                          onCheckedChange={(c) => setIncludeModulo8(c === true)}
                        />
                        <Label htmlFor="includeModulo8" className="text-sm">
                          Modulo 8 - Registro Giornaliero
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="includeRegistroCartaceo"
                          checked={includeRegistroCartaceo}
                          disabled={presenzaSessions.length === 0}
                          onCheckedChange={(c) => setIncludeRegistroCartaceo(c === true)}
                        />
                        <Label htmlFor="includeRegistroCartaceo" className="text-sm">
                          Registro Presenza Cartaceo (Head + Giorni)
                        </Label>
                      </div>
                    </div>

                    <Separator />

                    {/* Metadata options */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">File opzionali</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="includeReadme"
                            checked={includeReadme}
                            onCheckedChange={(c) => setIncludeReadme(c === true)}
                          />
                          <Label htmlFor="includeReadme" className="text-sm">
                            README.txt (riepilogo contenuto)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="includeMetadata"
                            checked={includeMetadata}
                            onCheckedChange={(c) => setIncludeMetadata(c === true)}
                          />
                          <Label htmlFor="includeMetadata" className="text-sm">
                            metadata.json (dati grezzi)
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Template Isolation Toggle (Test Mode) */}
                {(exportMode === 'zip' || useProgrammaticGeneration) && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <Checkbox
                        id="generateOnlyCustom"
                        checked={generateOnlyCustom}
                        onCheckedChange={(c) => setGenerateOnlyCustom(c === true)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="generateOnlyCustom" className="text-sm font-medium text-blue-900 cursor-pointer">
                          Genera solo i miei template personalizzati
                        </Label>
                        <p className="text-xs text-blue-700">
                          Utile per testare i tuoi template senza generare quelli di sistema (ignora registri, verbali standard, etc.)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

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
        {!isEmbedded && (
          <Button variant="outline" onClick={prevStep} disabled={isGenerating} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </Button>
        )}

        <div className={`flex gap-3 ${isEmbedded ? 'w-full justify-end' : ''}`}>
          {generationComplete && (
            <Button variant="outline" onClick={handleNewDocument}>
              Nuovo Documento
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              (exportMode === 'docs' && selectedTemplateIds.length === 0) ||
              (exportMode === 'zip' && generateOnlyCustom && selectedTemplateIds.length === 0)
            }
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
                {exportMode === 'zip' ? 'Genera ZIP' :
                  exportMode === 'excel' ? 'Genera Excel' :
                    `Genera ${selectedTemplateIds.length > 1 ? 'Documenti' : 'Documento'}`}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Warning for empty selection in Custom Only mode */}
      {exportMode === 'zip' && generateOnlyCustom && selectedTemplateIds.length === 0 && (
        <div className="mt-2 text-right">
          <p className="text-xs text-destructive">
            Seleziona almeno un template personalizzato nello step precedente o disabilita "Solo template personalizzati".
          </p>
        </div>
      )}
    </div>
  );
}