import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Pencil, Trash2, Star, Loader2, Building2, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { 
  getAllEnti, 
  addEnte, 
  updateEnte, 
  deleteEnte,
  setDefaultEnte,
  getAllSedi,
  addSede,
  updateSede,
  deleteSede,
  setDefaultSede,
  type DefaultEnte,
  type DefaultSede 
} from '@/db/templateDb';
import { toast } from 'sonner';

const emptyEnte: Omit<DefaultEnte, 'id'> = {
  nome: '',
  indirizzo: '',
  isDefault: false,
};

const emptySede: Omit<DefaultSede, 'id'> = {
  nome: '',
  indirizzo: '',
  citta: '',
  cap: '',
  provincia: '',
  enteId: undefined,
  isDefault: false,
};

export function EntiSediManager() {
  const [enti, setEnti] = useState<DefaultEnte[]>([]);
  const [sedi, setSedi] = useState<DefaultSede[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEnti, setExpandedEnti] = useState<Set<number>>(new Set());
  
  // Ente dialog
  const [enteDialogOpen, setEnteDialogOpen] = useState(false);
  const [editingEnte, setEditingEnte] = useState<DefaultEnte | null>(null);
  const [enteFormData, setEnteFormData] = useState<Omit<DefaultEnte, 'id'>>(emptyEnte);
  
  // Sede dialog
  const [sedeDialogOpen, setSedeDialogOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<DefaultSede | null>(null);
  const [sedeFormData, setSedeFormData] = useState<Omit<DefaultSede, 'id'>>(emptySede);
  const [selectedEnteId, setSelectedEnteId] = useState<number | undefined>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entiData, sediData] = await Promise.all([getAllEnti(), getAllSedi()]);
      setEnti(entiData);
      setSedi(sediData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Errore nel caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  const toggleEnte = (id: number) => {
    setExpandedEnti(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getSediForEnte = (enteId: number) => {
    return sedi.filter(s => s.enteId === enteId);
  };

  // Ente handlers
  const handleOpenEnteDialog = (ente?: DefaultEnte) => {
    if (ente) {
      setEditingEnte(ente);
      setEnteFormData({ nome: ente.nome, indirizzo: ente.indirizzo, isDefault: ente.isDefault });
    } else {
      setEditingEnte(null);
      setEnteFormData(emptyEnte);
    }
    setEnteDialogOpen(true);
  };

  const handleSaveEnte = async () => {
    if (!enteFormData.nome) {
      toast.error('Il nome ente è obbligatorio');
      return;
    }
    try {
      if (editingEnte?.id) {
        await updateEnte(editingEnte.id, enteFormData);
        toast.success('Ente aggiornato');
      } else {
        await addEnte(enteFormData);
        toast.success('Ente aggiunto');
      }
      setEnteDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDeleteEnte = async (id: number) => {
    if (!confirm('Eliminare questo ente e tutte le sedi associate?')) return;
    try {
      await deleteEnte(id);
      toast.success('Ente eliminato');
      loadData();
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  // Sede handlers
  const handleOpenSedeDialog = (enteId: number, sede?: DefaultSede) => {
    setSelectedEnteId(enteId);
    if (sede) {
      setEditingSede(sede);
      setSedeFormData({
        nome: sede.nome,
        indirizzo: sede.indirizzo,
        citta: sede.citta,
        cap: sede.cap,
        provincia: sede.provincia,
        enteId: sede.enteId,
        isDefault: sede.isDefault,
      });
    } else {
      setEditingSede(null);
      setSedeFormData({ ...emptySede, enteId });
    }
    setSedeDialogOpen(true);
  };

  const handleSaveSede = async () => {
    if (!sedeFormData.nome) {
      toast.error('Il nome sede è obbligatorio');
      return;
    }
    try {
      if (editingSede?.id) {
        await updateSede(editingSede.id, sedeFormData);
        toast.success('Sede aggiornata');
      } else {
        await addSede(sedeFormData);
        toast.success('Sede aggiunta');
      }
      setSedeDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDeleteSede = async (id: number) => {
    if (!confirm('Eliminare questa sede?')) return;
    try {
      await deleteSede(id);
      toast.success('Sede eliminata');
      loadData();
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
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                Enti di Formazione
              </CardTitle>
              <CardDescription>
                Gestisci enti e relative sedi operative
              </CardDescription>
            </div>
            <Dialog open={enteDialogOpen} onOpenChange={setEnteDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenEnteDialog()} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Aggiungi Ente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingEnte ? 'Modifica Ente' : 'Nuovo Ente'}</DialogTitle>
                  <DialogDescription>Inserisci i dati dell'ente di formazione</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Ente *</Label>
                    <Input
                      id="nome"
                      value={enteFormData.nome}
                      onChange={(e) => setEnteFormData({ ...enteFormData, nome: e.target.value })}
                      placeholder="AK Group S.r.l"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="indirizzo">Indirizzo Sede Legale</Label>
                    <Input
                      id="indirizzo"
                      value={enteFormData.indirizzo}
                      onChange={(e) => setEnteFormData({ ...enteFormData, indirizzo: e.target.value })}
                      placeholder="Via Roma 123, 20100 Milano MI"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isDefault"
                      checked={enteFormData.isDefault}
                      onCheckedChange={(checked) => setEnteFormData({ ...enteFormData, isDefault: !!checked })}
                    />
                    <Label htmlFor="isDefault" className="text-sm">Imposta come predefinito</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEnteDialogOpen(false)}>Annulla</Button>
                  <Button onClick={handleSaveEnte}>Salva</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {enti.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nessun ente salvato. Clicca "Aggiungi Ente" per crearne uno.
            </p>
          ) : (
            <div className="space-y-2">
              {enti.map((ente) => (
                <Collapsible
                  key={ente.id}
                  open={expandedEnti.has(ente.id!)}
                  onOpenChange={() => toggleEnte(ente.id!)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {expandedEnti.has(ente.id!) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          {ente.isDefault && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                          <div>
                            <p className="font-medium">{ente.nome}</p>
                            {ente.indirizzo && (
                              <p className="text-sm text-muted-foreground">{ente.indirizzo}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {!ente.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDefaultEnte(ente.id!).then(loadData)}
                              title="Imposta come predefinito"
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEnteDialog(ente)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteEnte(ente.id!)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t p-3 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Sedi Operative ({getSediForEnte(ente.id!).length})
                          </p>
                          <Button size="sm" variant="outline" className="gap-1 h-7" onClick={() => handleOpenSedeDialog(ente.id!)}>
                            <Plus className="w-3 h-3" />
                            Aggiungi Sede
                          </Button>
                        </div>
                        {getSediForEnte(ente.id!).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nessuna sede associata</p>
                        ) : (
                          <div className="space-y-2">
                            {getSediForEnte(ente.id!).map((sede) => (
                              <div key={sede.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                <div className="flex items-center gap-2">
                                  {sede.isDefault && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                  <div>
                                    <p className="text-sm font-medium">{sede.nome}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {sede.indirizzo}{sede.citta && `, ${sede.cap} ${sede.citta} (${sede.provincia})`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {!sede.isDefault && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDefaultSede(sede.id!).then(loadData)}>
                                      <Star className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenSedeDialog(ente.id!, sede)}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteSede(sede.id!)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sede Dialog */}
      <Dialog open={sedeDialogOpen} onOpenChange={setSedeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSede ? 'Modifica Sede' : 'Nuova Sede'}</DialogTitle>
            <DialogDescription>Inserisci i dati della sede operativa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sedeNome">Nome Sede *</Label>
              <Input
                id="sedeNome"
                value={sedeFormData.nome}
                onChange={(e) => setSedeFormData({ ...sedeFormData, nome: e.target.value })}
                placeholder="Milano Porta Romana"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sedeIndirizzo">Indirizzo</Label>
              <Input
                id="sedeIndirizzo"
                value={sedeFormData.indirizzo}
                onChange={(e) => setSedeFormData({ ...sedeFormData, indirizzo: e.target.value })}
                placeholder="Via Roma 123"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="sedeCitta">Città</Label>
                <Input
                  id="sedeCitta"
                  value={sedeFormData.citta}
                  onChange={(e) => setSedeFormData({ ...sedeFormData, citta: e.target.value })}
                  placeholder="Milano"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sedeProv">Prov.</Label>
                <Input
                  id="sedeProv"
                  value={sedeFormData.provincia}
                  onChange={(e) => setSedeFormData({ ...sedeFormData, provincia: e.target.value.toUpperCase() })}
                  placeholder="MI"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sedeCap">CAP</Label>
              <Input
                id="sedeCap"
                value={sedeFormData.cap}
                onChange={(e) => setSedeFormData({ ...sedeFormData, cap: e.target.value })}
                placeholder="20100"
                maxLength={5}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sedeDefault"
                checked={sedeFormData.isDefault}
                onCheckedChange={(checked) => setSedeFormData({ ...sedeFormData, isDefault: !!checked })}
              />
              <Label htmlFor="sedeDefault" className="text-sm">Imposta come predefinita</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSedeDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSaveSede}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
