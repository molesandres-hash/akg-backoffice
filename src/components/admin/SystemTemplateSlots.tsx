import { useEffect, useState } from 'react';
import { 
  FileText, FileSpreadsheet, Award, Calendar, 
  ClipboardCheck, ClipboardList, FileCheck,
  Upload, Download, Trash2, Check, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  type SystemTemplateType, 
  type SystemTemplate,
  getSystemTemplate, 
  setSystemTemplate, 
  deleteSystemTemplate,
  getAllSystemTemplates
} from '@/db/templateDb';
import { toast } from 'sonner';

interface TemplateSlotConfig {
  type: SystemTemplateType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SYSTEM_TEMPLATE_SLOTS: TemplateSlotConfig[] = [
  {
    type: 'modello_a_fad',
    label: 'Modello A FAD',
    description: 'Registro generale FAD - generato 1 volta per corso',
    icon: FileSpreadsheet,
  },
  {
    type: 'modello_b_fad',
    label: 'Modello B FAD',
    description: 'Registro giornaliero FAD - generato per ogni sessione FAD',
    icon: FileText,
  },
  {
    type: 'certificato',
    label: 'Certificato/Attestato',
    description: 'Attestato di partecipazione - generato per ogni partecipante',
    icon: Award,
  },
  {
    type: 'calendario_condizionalita',
    label: 'Calendario Condizionalità',
    description: 'Modulo 5 per beneficiari GOL/PNRR',
    icon: Calendar,
  },
  {
    type: 'verbale_ammissione',
    label: 'Verbale Ammissione Esame',
    description: 'Verbale per ammissione alle prove finali',
    icon: ClipboardCheck,
  },
  {
    type: 'registro_presenza',
    label: 'Registro Presenza',
    description: 'Registro presenze cartaceo',
    icon: ClipboardList,
  },
  {
    type: 'verbale_finale',
    label: 'Verbale Finale/Scrutinio',
    description: 'Verbale di chiusura corso e valutazione',
    icon: FileCheck,
  },
];

export function SystemTemplateSlots() {
  const [templates, setTemplates] = useState<Record<SystemTemplateType, SystemTemplate | null>>({} as any);
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<SystemTemplateType | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const allTemplates = await getAllSystemTemplates();
      const templateMap: Record<string, SystemTemplate | null> = {};
      
      SYSTEM_TEMPLATE_SLOTS.forEach(slot => {
        templateMap[slot.type] = allTemplates.find(t => t.type === slot.type) || null;
      });
      
      setTemplates(templateMap as Record<SystemTemplateType, SystemTemplate | null>);
    } catch (error) {
      console.error('Error loading system templates:', error);
      toast.error('Errore nel caricamento dei template');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (type: SystemTemplateType, file: File) => {
    setUploadingSlot(type);
    try {
      await setSystemTemplate(type, file, file.name);
      await loadTemplates();
      toast.success('Template caricato');
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('Errore nel caricamento');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDownload = (template: SystemTemplate) => {
    const url = URL.createObjectURL(template.fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (type: SystemTemplateType) => {
    try {
      await deleteSystemTemplate(type);
      await loadTemplates();
      toast.success('Template eliminato');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  const triggerFileInput = (type: SystemTemplateType) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx,.doc';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleUpload(type, file);
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Template di Sistema</h2>
        <p className="text-muted-foreground mt-1">
          Configura i template per ogni tipo di documento generato automaticamente nello ZIP
        </p>
      </div>

      <div className="grid gap-4">
        {SYSTEM_TEMPLATE_SLOTS.map((slot) => {
          const template = templates[slot.type];
          const isUploading = uploadingSlot === slot.type;
          const Icon = slot.icon;

          return (
            <Card key={slot.type} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{slot.label}</h3>
                      {template ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <Check className="w-3 h-3 mr-1" />
                          Configurato
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Non configurato
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {slot.description}
                    </p>
                    
                    {template && (
                      <p className="text-xs text-muted-foreground truncate">
                        📄 {template.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {template ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerFileInput(slot.type)}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(template)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(slot.type)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerFileInput(slot.type)}
                        disabled={isUploading}
                        className="gap-2"
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Carica
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
