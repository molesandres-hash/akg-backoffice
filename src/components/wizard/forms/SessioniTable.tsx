import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';

interface SessioniTableProps {
  moduloIndex: number;
}

export function SessioniTable({ moduloIndex }: SessioniTableProps) {
  const { 
    courseData, 
    addSessioneToModulo, 
    updateSessioneInModulo, 
    removeSessioneFromModulo 
  } = useWizardStore();
  
  const modulo = courseData.moduli[moduloIndex];
  const sessioni = modulo?.sessioni || [];

  const handleAddSessione = () => {
    addSessioneToModulo(moduloIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Sessioni ({sessioni.length})</h4>
        <Button onClick={handleAddSessione} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Aggiungi
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-28">Data</TableHead>
              <TableHead className="w-20">Inizio</TableHead>
              <TableHead className="w-20">Fine</TableHead>
              <TableHead className="w-24">Tipo</TableHead>
              <TableHead>Argomento</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessioni.map((sessione, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-muted-foreground">
                  {sessione.numero || index + 1}
                </TableCell>
                <TableCell>
                  <Input
                    value={sessione.data_completa}
                    onChange={(e) => updateSessioneInModulo(moduloIndex, index, { 
                      data_completa: e.target.value 
                    })}
                    placeholder="DD/MM/YYYY"
                    className="h-8 w-28"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={sessione.ora_inizio}
                    onChange={(e) => updateSessioneInModulo(moduloIndex, index, { 
                      ora_inizio: e.target.value 
                    })}
                    placeholder="HH:MM"
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={sessione.ora_fine}
                    onChange={(e) => updateSessioneInModulo(moduloIndex, index, { 
                      ora_fine: e.target.value 
                    })}
                    placeholder="HH:MM"
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={sessione.is_fad ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {sessione.is_fad ? 'FAD' : sessione.tipo_sede || 'N/D'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Input
                    value={sessione.argomento || ''}
                    onChange={(e) => updateSessioneInModulo(moduloIndex, index, { 
                      argomento: e.target.value 
                    })}
                    placeholder="Argomento"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeSessioneFromModulo(moduloIndex, index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sessioni.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  Nessuna sessione. Clicca "Aggiungi" per inserirne una.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
