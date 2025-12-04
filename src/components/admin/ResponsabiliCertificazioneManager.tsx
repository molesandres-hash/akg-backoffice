import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Star, Loader2, Award } from 'lucide-react';
import { 
  getAllResponsabiliCertificazione, 
  addResponsabileCertificazione, 
  updateResponsabileCertificazione, 
  deleteResponsabileCertificazione, 
  setDefaultResponsabileCertificazione,
  type DefaultResponsabileCertificazione 
} from '@/db/templateDb';
import { toast } from 'sonner';

const emptyResponsabile: Omit<DefaultResponsabileCertificazione, 'id'> = {
  nome: '',
  cognome: '',
  dataNascita: '',
  luogoNascita: '',
  residenza: '',
  documento: '',
  isDefault: false,
};

export function ResponsabiliCertificazioneManager() {
  const [responsabili, setResponsabili] = useState<DefaultResponsabileCertificazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResponsabile, setEditingResponsabile] = useState<DefaultResponsabileCertificazione | null>(null);
  const [formData, setFormData] = useState<Omit<DefaultResponsabileCertificazione, 'id'>>(emptyResponsabile);

  useEffect(() => {
    loadResponsabili();
  }, []);

  const loadResponsabili = async () => {
    try {
      const data = await getAllResponsabiliCertificazione();
      console.log('📋 Responsabili Certificazione loaded:', data);
      setResponsabili(data);
    } catch (error) {
      console.error('Error loading responsabili certificazione:', error);
      toast.error('Errore nel caricamento responsabili');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (responsabile?: DefaultResponsabileCertificazione) => {
    if (responsabile) {
      setEditingResponsabile(responsabile);
      setFormData({
        nome: responsabile.nome,
        cognome: responsabile.cognome,
        dataNascita: responsabile.dataNascita,
        luogoNascita: responsabile.luogoNascita,
        residenza: responsabile.residenza,
        documento: responsabile.documento,
        isDefault: responsabile.isDefault,
      });
    } else {
      setEditingResponsabile(null);
      setFormData(emptyResponsabile);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.cognome) {
      toast.error('Nome e cognome sono obbligatori');
      return;
    }

    try {
      if (editingResponsabile?.id) {
        await updateResponsabileCertificazione(editingResponsabile.id, formData);
        toast.success('Responsabile aggiornato');
      } else {
        await addResponsabileCertificazione(formData);
        toast.success('Responsabile aggiunto');
      }
      setDialogOpen(false);
      loadResponsabili();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo responsabile?')) return;
    try {
      await deleteResponsabileCertificazione(id);
      toast.success('Responsabile eliminato');
      loadResponsabili();
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultResponsabileCertificazione(id);
      toast.success('Responsabile predefinito impostato');
      loadResponsabili();
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
              <Award className="w-5 h-5 text-accent" />
              Responsabili Certificazione
            </CardTitle>
            <CardDescription>
              Persone autorizzate a firmare documenti di certificazione
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingResponsabile ? 'Modifica Responsabile' : 'Nuovo Responsabile Certificazione'}
                </DialogTitle>
                <DialogDescription>
                  Inserisci i dati del responsabile certificazione
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
                      placeholder="Gianfranco"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cognome">Cognome *</Label>
                    <Input
                      id="cognome"
                      value={formData.cognome}
                      onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                      placeholder="Torre"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataNascita">Data Nascita</Label>
                    <Input
                      id="dataNascita"
                      value={formData.dataNascita}
                      onChange={(e) => setFormData({ ...formData, dataNascita: e.target.value })}
                      placeholder="12/03/1976"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="luogoNascita">Luogo Nascita</Label>
                    <Input
                      id="luogoNascita"
                      value={formData.luogoNascita}
                      onChange={(e) => setFormData({ ...formData, luogoNascita: e.target.value })}
                      placeholder="Milano (MI)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residenza">Residenza</Label>
                  <Input
                    id="residenza"
                    value={formData.residenza}
                    onChange={(e) => setFormData({ ...formData, residenza: e.target.value })}
                    placeholder="Via Example 1, Milano"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento">Documento (ID)</Label>
                  <Input
                    id="documento"
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                    placeholder="CA12345AA"
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
        {responsabili.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nessun responsabile salvato. Clicca "Aggiungi" per crearne uno.
          </p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Data Nascita</TableHead>
                  <TableHead>Luogo Nascita</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responsabili.map((responsabile) => (
                  <TableRow key={responsabile.id}>
                    <TableCell>
                      {responsabile.isDefault && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell>{responsabile.nome}</TableCell>
                    <TableCell className="font-medium">{responsabile.cognome}</TableCell>
                    <TableCell className="text-muted-foreground">{responsabile.dataNascita}</TableCell>
                    <TableCell className="text-muted-foreground">{responsabile.luogoNascita}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!responsabile.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSetDefault(responsabile.id!)}
                            title="Imposta come predefinito"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(responsabile)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(responsabile.id!)}
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