import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Trash2,
  FileText,
  Download,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import {
  getAllTemplates,
  addTemplate,
  deleteTemplate,
  type UserTemplate
} from '@/db/templateDb';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { validateDocxTemplate } from '@/services/validation/templateValidator';
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

const categories: Array<{ value: UserTemplate['category']; label: string }> = [
  { value: 'registri', label: 'Registri' },
  { value: 'attestati', label: 'Attestati' },
  { value: 'verbali', label: 'Verbali' },
  { value: 'altro', label: 'Altro' },
];

export function TemplateManager() {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadCategory, setUploadCategory] = useState<UserTemplate['category']>('registri');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<UserTemplate | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const allTemplates = await getAllTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Errore nel caricamento dei template');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.docx')) {
        toast.error(`Il file ${file.name} non è un documento Word (.docx)`);
        continue;
      }

      // Validate template structure
      const validation = await validateDocxTemplate(file);
      if (!validation.isValid) {
        toast.error(`Errore nel file ${file.name}: ${validation.errors.join(' ')}`);
        continue;
      }

      try {
        await addTemplate({
          name: file.name.replace('.docx', ''),
          category: uploadCategory,
          fileBlob: file,
          uploadDate: new Date(),
          isDefault: false,
        });
        toast.success(`Template "${file.name}" caricato con successo`);
      } catch (error) {
        toast.error(`Errore nel caricamento di ${file.name}`);
      }
    }

    // Reset input
    event.target.value = '';
    loadTemplates();
  };

  const handleDelete = (template: UserTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete?.id) return;

    try {
      await deleteTemplate(templateToDelete.id);
      toast.success('Template eliminato');
      loadTemplates();
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDownload = (template: UserTemplate) => {
    const url = URL.createObjectURL(template.fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const templatesByCategory = templates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, UserTemplate[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">Gestione Template</h1>
          <p className="text-muted-foreground mt-1">
            Carica e gestisci i template Word per la generazione documenti
          </p>
        </div>
        <Button variant="outline" onClick={loadTemplates} size="sm" className="gap-2">
          <RefreshCcw className="w-4 h-4" />
          Aggiorna
        </Button>
      </div>

      {/* Upload Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent" />
            Carica Nuovo Template
          </CardTitle>
          <CardDescription>
            Seleziona la categoria e carica un file .docx con i placeholder standard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={uploadCategory} onValueChange={(v) => setUploadCategory(v as UserTemplate['category'])}>
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-accent/50 transition-colors">
            <input
              type="file"
              accept=".docx"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="template-upload"
            />
            <label htmlFor="template-upload" className="cursor-pointer">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Clicca per caricare o trascina qui</p>
              <p className="text-sm text-muted-foreground mt-1">
                Solo file .docx • Categoria: {categories.find(c => c.value === uploadCategory)?.label}
              </p>
            </label>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-accent" />
              Placeholder Supportati
            </p>
            <div className="flex flex-wrap gap-2">
              {['{CORSO_TITOLO}', '{DOCENTE_NOME}', '{#STUDENTI}', '{DATA_OGGI}'].map((ph) => (
                <Badge key={ph} variant="secondary" className="font-mono text-xs">
                  {ph}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">+ altri</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Template Disponibili</CardTitle>
          <CardDescription>
            {templates.length} template caricati nel database locale
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Caricamento...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nessun template caricato</p>
              <p className="text-sm mt-1">Carica il tuo primo template per iniziare</p>
            </div>
          ) : (
            <Tabs defaultValue={categories[0].value}>
              <TabsList className="mb-4">
                {categories.map((cat) => (
                  <TabsTrigger key={cat.value} value={cat.value} className="gap-2">
                    {cat.label}
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {templatesByCategory[cat.value]?.length || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((cat) => (
                <TabsContent key={cat.value} value={cat.value}>
                  <div className="space-y-2">
                    {(templatesByCategory[cat.value] || []).map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {template.isDefault ? 'Sistema' : 'Personalizzato'} •
                              Caricato il {template.uploadDate.toLocaleDateString('it-IT')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(template)}
                            title="Scarica"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(template)}
                            className="text-destructive hover:text-destructive"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!templatesByCategory[cat.value] || templatesByCategory[cat.value].length === 0) && (
                      <p className="text-center text-muted-foreground py-4">
                        Nessun template in questa categoria
                      </p>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il template?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare "{templateToDelete?.name}". Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
