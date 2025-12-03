import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';

export function PartecipantiTable() {
  const { courseData, addPartecipante, updatePartecipante, removePartecipante } = useWizardStore();
  const { partecipanti } = courseData;

  const handleAddPartecipante = () => {
    addPartecipante({
      nome: '',
      cognome: '',
      codiceFiscale: '',
      email: '',
      telefono: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Partecipanti ({partecipanti.length})
        </h4>
        <Button onClick={handleAddPartecipante} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Aggiungi
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cognome</TableHead>
              <TableHead>Codice Fiscale</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partecipanti.map((p, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Input
                    value={p.nome}
                    onChange={(e) => updatePartecipante(index, { ...p, nome: e.target.value })}
                    className="h-8"
                    placeholder="Nome"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={p.cognome}
                    onChange={(e) => updatePartecipante(index, { ...p, cognome: e.target.value })}
                    className="h-8"
                    placeholder="Cognome"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={p.codiceFiscale}
                    onChange={(e) => updatePartecipante(index, { 
                      ...p, 
                      codiceFiscale: e.target.value.toUpperCase() 
                    })}
                    className="h-8 font-mono text-xs w-40"
                    placeholder="CODICE FISCALE"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={p.email || ''}
                    onChange={(e) => updatePartecipante(index, { ...p, email: e.target.value })}
                    className="h-8"
                    placeholder="email@esempio.it"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={p.telefono || ''}
                    onChange={(e) => updatePartecipante(index, { ...p, telefono: e.target.value })}
                    className="h-8 w-28"
                    placeholder="+39..."
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removePartecipante(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {partecipanti.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nessun partecipante. Clicca "Aggiungi" per inserirne uno.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
