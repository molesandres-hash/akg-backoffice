import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Star, Loader2, UserCircle } from 'lucide-react';
import { 
  getAllDocenti, 
  addDocente, 
  updateDocente, 
  deleteDocente, 
  setDefaultDocente,
  type DefaultDocente 
} from '@/db/templateDb';
import { toast } from 'sonner';

const emptyDocente: Omit<DefaultDocente, 'id'> = {
  nome: '',
  cognome: '',
  codiceFiscale: '',
  email: '',
  telefono: '',
  isDefault: false,
};

export function DocentiManager() {
  const [docenti, setDocenti] = useState<DefaultDocente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<DefaultDocente | null>(null);
  const [formData, setFormData] = useState<Omit<DefaultDocente, 'id'>>(emptyDocente);

  useEffect(() => {
    loadDocenti();
  }, []);

  const loadDocenti = async () => {
    try {
      const data = await getAllDocenti();
      setDocenti(data);
    } catch (error) {
      console.error('Error loading docenti:', error);
      toast.error('Errore nel caricamento docenti');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (docente?: DefaultDocente) => {
    if (docente) {
      setEditingDocente(docente);
      setFormData({
        nome: docente.nome,
        cognome: docente.cognome,
        codiceFiscale: docente.codiceFiscale,
        email: docente.email,
        telefono: docente.telefono,
        isDefault: docente.isDefault,
      });
    } else {
      setEditingDocente(null);
      setFormData(emptyDocente);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.cognome) {
      toast.error('Nome e cognome sono obbligatori');
      return;
    }

    try {
      if (editingDocente?.id) {
        await updateDocente(editingDocente.id, formData);
        toast.success('Docente aggiornato');
      } else {
        await addDocente(formData);
        toast.success('Docente aggiunto');
      }
      setDialogOpen(false);
      loadDocenti();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo docente?')) return;
    try {
      await deleteDocente(id);
      toast.success('Docente eliminato');
      loadDocenti();
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultDocente(id);
      toast.success('Docente predefinito impostato');
      loadDocenti();
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
              <UserCircle className="w-5 h-5 text-accent" />
              Docenti
            </CardTitle>
            <CardDescription>
              Gestisci la lista dei docenti predefiniti
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
                  {editingDocente ? 'Modifica Docente' : 'Nuovo Docente'}
                </DialogTitle>
                <DialogDescription>
                  Inserisci i dati del docente
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
                      placeholder="Mario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cognome">Cognome *</Label>
                    <Input
                      id="cognome"
                      value={formData.cognome}
                      onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                      placeholder="Rossi"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cf">Codice Fiscale</Label>
                  <Input
                    id="cf"
                    value={formData.codiceFiscale}
                    onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value.toUpperCase() })}
                    placeholder="RSSMRA80A01H501Z"
                    className="font-mono"
                    maxLength={16}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="mario.rossi@email.it"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Telefono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+39 333 1234567"
                    />
                  </div>
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
        {docenti.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nessun docente salvato. Clicca "Aggiungi" per crearne uno.
          </p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Codice Fiscale</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docenti.map((docente) => (
                  <TableRow key={docente.id}>
                    <TableCell>
                      {docente.isDefault && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell>{docente.nome}</TableCell>
                    <TableCell className="font-medium">{docente.cognome}</TableCell>
                    <TableCell className="font-mono text-xs">{docente.codiceFiscale}</TableCell>
                    <TableCell className="text-sm">{docente.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!docente.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSetDefault(docente.id!)}
                            title="Imposta come predefinito"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(docente)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(docente.id!)}
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
