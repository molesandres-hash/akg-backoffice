import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Star, Loader2, Shield } from 'lucide-react';
import { 
  getAllSupervisori, 
  addSupervisore, 
  updateSupervisore, 
  deleteSupervisore, 
  setDefaultSupervisore,
  type DefaultSupervisore 
} from '@/db/templateDb';
import { toast } from 'sonner';

const emptySupervisore: Omit<DefaultSupervisore, 'id'> = {
  nome: '',
  cognome: '',
  qualifica: '',
  isDefault: false,
};

export function SupervisoriManager() {
  const [supervisori, setSupervisori] = useState<DefaultSupervisore[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupervisore, setEditingSupervisore] = useState<DefaultSupervisore | null>(null);
  const [formData, setFormData] = useState<Omit<DefaultSupervisore, 'id'>>(emptySupervisore);

  useEffect(() => {
    loadSupervisori();
  }, []);

  const loadSupervisori = async () => {
    try {
      const data = await getAllSupervisori();
      setSupervisori(data);
    } catch (error) {
      console.error('Error loading supervisori:', error);
      toast.error('Errore nel caricamento supervisori');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (supervisore?: DefaultSupervisore) => {
    if (supervisore) {
      setEditingSupervisore(supervisore);
      setFormData({
        nome: supervisore.nome,
        cognome: supervisore.cognome,
        qualifica: supervisore.qualifica,
        isDefault: supervisore.isDefault,
      });
    } else {
      setEditingSupervisore(null);
      setFormData(emptySupervisore);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.cognome) {
      toast.error('Nome e cognome sono obbligatori');
      return;
    }

    try {
      if (editingSupervisore?.id) {
        await updateSupervisore(editingSupervisore.id, formData);
        toast.success('Supervisore aggiornato');
      } else {
        await addSupervisore(formData);
        toast.success('Supervisore aggiunto');
      }
      setDialogOpen(false);
      loadSupervisori();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo supervisore?')) return;
    try {
      await deleteSupervisore(id);
      toast.success('Supervisore eliminato');
      loadSupervisori();
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultSupervisore(id);
      toast.success('Supervisore predefinito impostato');
      loadSupervisori();
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
              <Shield className="w-5 h-5 text-accent" />
              Supervisori
            </CardTitle>
            <CardDescription>
              Gestisci la lista dei supervisori/team leader
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
                  {editingSupervisore ? 'Modifica Supervisore' : 'Nuovo Supervisore'}
                </DialogTitle>
                <DialogDescription>
                  Inserisci i dati del supervisore
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Andrea"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cognome">Cognome *</Label>
                    <Input
                      id="cognome"
                      value={formData.cognome}
                      onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                      placeholder="Hubbard"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualifica">Qualifica</Label>
                  <Input
                    id="qualifica"
                    value={formData.qualifica}
                    onChange={(e) => setFormData({ ...formData, qualifica: e.target.value })}
                    placeholder="Es: Team Leader, Supervisore"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: !!checked })}
                  />
                  <Label htmlFor="isDefault" className="text-sm">
                    Imposta come predefinito
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
        {supervisori.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nessun supervisore salvato. Clicca "Aggiungi" per crearne uno.
          </p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Qualifica</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisori.map((supervisore) => (
                  <TableRow key={supervisore.id}>
                    <TableCell>
                      {supervisore.isDefault && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell>{supervisore.nome}</TableCell>
                    <TableCell className="font-medium">{supervisore.cognome}</TableCell>
                    <TableCell className="text-muted-foreground">{supervisore.qualifica}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!supervisore.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSetDefault(supervisore.id!)}
                            title="Imposta come predefinito"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(supervisore)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(supervisore.id!)}
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
