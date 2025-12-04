import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Pencil, Trash2, Loader2, BookOpen, ChevronDown, ChevronRight, X } from 'lucide-react';
import { 
  getAllListeArgomenti, 
  addListaArgomenti, 
  updateListaArgomenti, 
  deleteListaArgomenti,
  type ListaArgomenti 
} from '@/db/templateDb';
import { toast } from 'sonner';

const emptyLista: Omit<ListaArgomenti, 'id'> = {
  nome: '',
  argomenti: [],
};

export function ListeArgomentiManager() {
  const [liste, setListe] = useState<ListaArgomenti[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedListe, setExpandedListe] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLista, setEditingLista] = useState<ListaArgomenti | null>(null);
  const [formData, setFormData] = useState<Omit<ListaArgomenti, 'id'>>(emptyLista);
  const [newArgomento, setNewArgomento] = useState('');

  useEffect(() => {
    loadListe();
  }, []);

  const loadListe = async () => {
    try {
      const data = await getAllListeArgomenti();
      setListe(data);
    } catch (error) {
      console.error('Error loading liste:', error);
      toast.error('Errore nel caricamento liste');
    } finally {
      setLoading(false);
    }
  };

  const toggleLista = (id: number) => {
    setExpandedListe(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleOpenDialog = (lista?: ListaArgomenti) => {
    if (lista) {
      setEditingLista(lista);
      setFormData({ nome: lista.nome, argomenti: [...lista.argomenti] });
    } else {
      setEditingLista(null);
      setFormData(emptyLista);
    }
    setNewArgomento('');
    setDialogOpen(true);
  };

  const handleAddArgomento = () => {
    if (!newArgomento.trim()) return;
    setFormData({ ...formData, argomenti: [...formData.argomenti, newArgomento.trim()] });
    setNewArgomento('');
  };

  const handleRemoveArgomento = (index: number) => {
    setFormData({
      ...formData,
      argomenti: formData.argomenti.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast.error('Il nome lista è obbligatorio');
      return;
    }
    if (formData.argomenti.length === 0) {
      toast.error('Aggiungi almeno un argomento');
      return;
    }

    try {
      if (editingLista?.id) {
        await updateListaArgomenti(editingLista.id, formData);
        toast.success('Lista aggiornata');
      } else {
        await addListaArgomenti(formData);
        toast.success('Lista aggiunta');
      }
      setDialogOpen(false);
      loadListe();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questa lista?')) return;
    try {
      await deleteListaArgomenti(id);
      toast.success('Lista eliminata');
      loadListe();
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Liste Argomenti
            </CardTitle>
            <CardDescription>
              Set predefiniti di argomenti didattici per i moduli
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Nuova Lista
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingLista ? 'Modifica Lista' : 'Nuova Lista Argomenti'}
                </DialogTitle>
                <DialogDescription>
                  Crea un set di argomenti da assegnare ai moduli
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeLista">Nome Lista *</Label>
                  <Input
                    id="nomeLista"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Es: Logistica Base, Sicurezza Lavoro"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Argomenti ({formData.argomenti.length})</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newArgomento}
                      onChange={(e) => setNewArgomento(e.target.value)}
                      placeholder="Aggiungi argomento..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArgomento())}
                    />
                    <Button type="button" onClick={handleAddArgomento} size="icon" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {formData.argomenti.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/50 rounded-lg max-h-40 overflow-y-auto">
                      {formData.argomenti.map((arg, index) => (
                        <Badge key={index} variant="secondary" className="gap-1 pr-1">
                          {arg}
                          <button
                            type="button"
                            onClick={() => handleRemoveArgomento(index)}
                            className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleSave}>Salva</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {liste.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nessuna lista salvata. Clicca "Nuova Lista" per crearne una.
          </p>
        ) : (
          <div className="space-y-2">
            {liste.map((lista) => (
              <Collapsible
                key={lista.id}
                open={expandedListe.has(lista.id!)}
                onOpenChange={() => toggleLista(lista.id!)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {expandedListe.has(lista.id!) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{lista.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {lista.argomenti.length} argomenti
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(lista)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(lista.id!)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t p-3 bg-muted/30">
                      <div className="flex flex-wrap gap-2">
                        {lista.argomenti.map((arg, index) => (
                          <Badge key={index} variant="outline">
                            {index + 1}. {arg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
