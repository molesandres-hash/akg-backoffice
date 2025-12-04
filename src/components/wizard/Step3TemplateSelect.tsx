import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, FileText, Check, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { getAllTemplates, getAllSystemTemplates, type UserTemplate, type SystemTemplate } from '@/db/templateDb';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const categoryLabels: Record<string, string> = {
  registri: 'Registri',
  attestati: 'Attestati',
  verbali: 'Verbali',
  altro: 'Altro',
};

const categoryColors: Record<string, string> = {
  registri: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  attestati: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  verbali: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  altro: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
};

const systemTemplateLabels: Record<string, string> = {
  modello_a_fad: 'Registro FAD Generale',
  modello_b_fad: 'Registro Giornaliero FAD',
  certificato: 'Attestato/Certificato',
  calendario_condizionalita: 'Calendario Condizionalità (M5)',
  verbale_ammissione: 'Verbale Ammissione',
  registro_presenza: 'Registro Presenze',
  verbale_finale: 'Verbale Finale',
  comunicazione_evento: 'Comunicazione Evento (M7)',
  registro_giornaliero: 'Registro Giornaliero (M8)',
  registro_didattico: 'Registro Didattico',
  verbale_scrutinio: 'Verbale Scrutinio',
};

export function Step3TemplateSelect() {
  const { selectedTemplateIds, toggleTemplateSelection, nextStep, prevStep } = useWizardStore();
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [systemTemplates, setSystemTemplates] = useState<SystemTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const [userTemplates, sysTemplates] = await Promise.all([
        getAllTemplates(),
        getAllSystemTemplates()
      ]);
      console.log('📂 [Step3] User templates:', userTemplates.length, 'System templates:', sysTemplates.length);
      setTemplates(userTemplates);
      setSystemTemplates(sysTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Permetti di continuare se ci sono system templates O user templates selezionati
    if (systemTemplates.length > 0 || selectedTemplateIds.length > 0) {
      nextStep();
    }
  };

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, UserTemplate[]>);

  const hasSystemTemplates = systemTemplates.length > 0;
  const hasUserTemplates = templates.length > 0;
  const canContinue = hasSystemTemplates || selectedTemplateIds.length > 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold mb-2">
          Template per la Generazione
        </h2>
        <p className="text-muted-foreground">
          I template di sistema vengono usati automaticamente. Puoi anche selezionare template personalizzati aggiuntivi.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Caricamento template...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* System Templates Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Template di Sistema
              <Badge variant="outline" className="font-normal ml-2">
                {systemTemplates.length} configurati
              </Badge>
            </h3>
            
            {hasSystemTemplates ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemTemplates.map((template) => (
                  <Card key={template.id} className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {systemTemplateLabels[template.type] || template.type}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {template.name}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nessun template di sistema configurato. Vai in <strong>Impostazioni → Template Sistema</strong> per caricarli.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* User Templates Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Template Personalizzati
              <Badge variant="secondary" className="font-normal ml-2">
                {templates.length} disponibili
              </Badge>
            </h3>
            
            {hasUserTemplates ? (
              <div className="space-y-6">
                {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    <Badge className={cn("font-normal mb-3", categoryColors[category])}>
                      {categoryLabels[category]} ({categoryTemplates.length})
                    </Badge>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryTemplates.map((template) => {
                        const isSelected = selectedTemplateIds.includes(template.id!);
                        
                        return (
                          <Card
                            key={template.id}
                            className={cn(
                              "cursor-pointer transition-all duration-200 hover:shadow-md",
                              isSelected 
                                ? "ring-2 ring-accent bg-accent/5" 
                                : "hover:bg-secondary/50"
                            )}
                            onClick={() => toggleTemplateSelection(template.id!)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                    isSelected ? "bg-accent text-accent-foreground" : "bg-secondary"
                                  )}>
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <p className="font-medium text-sm truncate">{template.name}</p>
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 text-accent-foreground" />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessun template personalizzato caricato</p>
                <p className="text-xs mt-1">Puoi aggiungerli in <strong>Gestione Template</strong></p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTemplateIds.length > 0 && (
        <div className="bg-accent/10 rounded-lg p-4 text-center">
          <p className="text-sm">
            <span className="font-medium">{selectedTemplateIds.length}</span> template personalizzati selezionati
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={!canContinue}
          className="gap-2"
        >
          Avanti
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
