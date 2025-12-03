import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, FileText, Check, AlertCircle } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { getAllTemplates, type UserTemplate } from '@/db/templateDb';
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

export function Step3TemplateSelect() {
  const { selectedTemplateIds, toggleTemplateSelection, nextStep, prevStep } = useWizardStore();
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const allTemplates = await getAllTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedTemplateIds.length > 0) {
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

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold mb-2">
          Seleziona Template
        </h2>
        <p className="text-muted-foreground">
          Scegli uno o più template da generare. Puoi selezionarne diversi per creare più documenti.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Caricamento template...</div>
        </div>
      ) : templates.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nessun template disponibile. Vai alla sezione Template per caricarne uno.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-8">
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Badge className={cn("font-normal", categoryColors[category])}>
                  {categoryLabels[category]}
                </Badge>
                <span className="text-muted-foreground text-sm font-normal">
                  ({categoryTemplates.length} template)
                </span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isSelected ? "bg-accent text-accent-foreground" : "bg-secondary"
                            )}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{template.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {template.isDefault ? 'Template di sistema' : 'Personalizzato'}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                              <Check className="w-4 h-4 text-accent-foreground" />
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
      )}

      {selectedTemplateIds.length > 0 && (
        <div className="bg-accent/10 rounded-lg p-4 text-center">
          <p className="text-sm">
            <span className="font-medium">{selectedTemplateIds.length}</span> template selezionati
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
          disabled={selectedTemplateIds.length === 0}
          className="gap-2"
        >
          Avanti
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
