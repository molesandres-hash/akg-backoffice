import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Layers } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { SessioniTable } from './SessioniTable';

export function ModuliForm() {
  const { 
    courseData, 
    addModulo, 
    updateModulo, 
    removeModulo,
    isSingleModule 
  } = useWizardStore();
  const { moduli } = courseData;

  const handleAddModulo = () => {
    addModulo();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isSingleModule() ? 'Corso a modulo singolo' : `${moduli.length} moduli`}
          </span>
        </div>
        <Button onClick={handleAddModulo} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Aggiungi Modulo
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['modulo-0']} className="space-y-3">
        {moduli.map((modulo, index) => (
          <AccordionItem key={index} value={`modulo-${index}`} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3 flex-1">
                <Badge variant="secondary" className="shrink-0">
                  Modulo {index + 1}
                </Badge>
                <span className="text-sm font-medium truncate">
                  {modulo.titolo || 'Senza titolo'}
                </span>
                <div className="flex gap-2 ml-auto mr-4">
                  <Badge variant="outline" className="text-xs">
                    {modulo.sessioni.length} sessioni
                  </Badge>
                  {modulo.tipo_sede && (
                    <Badge 
                      variant={modulo.tipo_sede.toLowerCase().includes('online') ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {modulo.tipo_sede}
                    </Badge>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {/* Module Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label>Titolo Modulo</Label>
                    <Input
                      value={modulo.titolo}
                      onChange={(e) => updateModulo(index, { titolo: e.target.value })}
                      placeholder="Titolo del modulo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ID Corso</Label>
                    <Input
                      value={modulo.id_corso}
                      onChange={(e) => updateModulo(index, { id_corso: e.target.value })}
                      placeholder="Es: 50039"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ID Sezione</Label>
                    <Input
                      value={modulo.id_sezione}
                      onChange={(e) => updateModulo(index, { id_sezione: e.target.value })}
                      placeholder="Es: 144176"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo Sede</Label>
                    <Input
                      value={modulo.tipo_sede}
                      onChange={(e) => updateModulo(index, { tipo_sede: e.target.value })}
                      placeholder="Es: Online, Presenza"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data Inizio</Label>
                    <Input
                      value={modulo.data_inizio}
                      onChange={(e) => updateModulo(index, { data_inizio: e.target.value })}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data Fine</Label>
                    <Input
                      value={modulo.data_fine}
                      onChange={(e) => updateModulo(index, { data_fine: e.target.value })}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ore Totali</Label>
                    <Input
                      value={modulo.ore_totali}
                      onChange={(e) => updateModulo(index, { ore_totali: e.target.value })}
                      placeholder="Es: 20"
                    />
                  </div>
                </div>

                {/* Argomenti */}
                <Card className="bg-muted/30">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Argomenti ({modulo.argomenti.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {modulo.argomenti.map((arg, argIndex) => (
                        <Badge key={argIndex} variant="secondary" className="text-xs">
                          {arg}
                        </Badge>
                      ))}
                      {modulo.argomenti.length === 0 && (
                        <span className="text-xs text-muted-foreground">Nessun argomento</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Sessions Table */}
                <SessioniTable moduloIndex={index} />

                {/* Delete Module Button */}
                {moduli.length > 1 && (
                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeModulo(index)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Elimina Modulo
                    </Button>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
