import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Star, Loader2, Video } from 'lucide-react';
import { 
  getAllPiattaforme, 
  addPiattaforma, 
  updatePiattaforma, 
  deletePiattaforma, 
  setDefaultPiattaforma,
  type DefaultPiattaformaFad 
} from '@/db/templateDb';
import { toast } from 'sonner';

const emptyPiattaforma: Omit<DefaultPiattaformaFad, 'id'> = {
  nome: '',
  linkBase: '',
  isDefault: false,
};

export function PiattaformeFadManager() {
  const [piattaforme, setPiattaforme] = useState<DefaultPiattaformaFad[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPiattaforma, setEditingPiattaforma] = useState<DefaultPiattaformaFad | null>(null);
  const [formData, setFormData] = useState<Omit<DefaultPiattaformaFad, 'id'>>(emptyPiattaforma);

  useEffect(() => {
    loadPiattaforme();
  }, []);

  const loadPiattaforme = async () => {
    try {
      const data = await getAllPiattaforme();
      setPiattaforme(data);
    } catch (error) {
      console.error('Error loading piattaforme:', error);
      toast.error('Errore nel caricamento piattaforme');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (piattaforma?: DefaultPiattaformaFad) => {
    if (piattaforma) {
      setEditingPiattaforma(piattaforma);
      setFormData({
        nome: piattaforma.nome,
        linkBase: piattaforma.linkBase,
        isDefault: piattaforma.isDefault,
      });
    } else {
      setEditingPiattaforma(null);
      setFormData(emptyPiattaforma);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast.error('Il nome è obbligatorio');
      return;
    }

    try {
      if (editingPiattaforma?.id) {
        await updatePiattaforma(editingPiattaforma.id, formData);
        toast.success('Piattaforma aggiornata');
      } else {
        await addPiattaforma(formData);
        toast.success('Piattaforma aggiunta');
      }
      setDialogOpen(false);
      loadPiattaforme();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questa piattaforma?')) return;
    try {
      await deletePiattaforma(id);
      toast.success('Piattaforma eliminata');
      loadPiattaforme();
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultPiattaforma(id);
      toast.success('Piattaforma predefinita impostata');
      loadPiattaforme();
    } catch (error) {
      toast.error('Errore nell\'impostazione');
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
              <Video className="w-5 h-5 text-accent" />
              Piattaforme FAD
            </CardTitle>
            <CardDescription>
              Gestisci le piattaforme per la formazione a distanza
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPiattaforma ? 'Modifica Piattaforma' : 'Nuova Piattaforma'}
                </DialogTitle>
                <DialogDescription>
                  Inserisci i dati della piattaforma FAD
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Piattaforma *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Es: Zoom, Google Meet, Teams"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkBase">Link Base (opzionale)</Label>
                  <Input
                    id="linkBase"
                    value={formData.linkBase}
                    onChange={(e) => setFormData({ ...formData, linkBase: e.target.value })}
                    placeholder="https://zoom.us/j/"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL base per generare i link. I dettagli specifici (ID, passcode) vengono inseriti nel wizard.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: !!checked })}
                  />
                  <Label htmlFor="isDefault" className="text-sm">
                    Imposta come predefinita
                  </Label>
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
        {piattaforme.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nessuna piattaforma salvata. Clicca "Aggiungi" per crearne una.
          </p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Link Base</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {piattaforme.map((piattaforma) => (
                  <TableRow key={piattaforma.id}>
                    <TableCell>
                      {piattaforma.isDefault && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{piattaforma.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {piattaforma.linkBase || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!piattaforma.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSetDefault(piattaforma.id!)}
                            title="Imposta come predefinita"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(piattaforma)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(piattaforma.id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
