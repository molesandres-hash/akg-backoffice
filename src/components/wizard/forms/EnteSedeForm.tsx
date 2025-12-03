import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWizardStore } from '@/store/wizardStore';

export function EnteSedeForm() {
  const { courseData, updateEnte, updateSede } = useWizardStore();
  const { ente, sede } = courseData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ente Formativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome Ente</Label>
            <Input
              value={ente.nome}
              onChange={(e) => updateEnte({ nome: e.target.value })}
              placeholder="Es: AK Group S.r.l"
            />
          </div>
          
          <div className="space-y-2">
            <Label>ID Ente</Label>
            <Input
              value={ente.id}
              onChange={(e) => updateEnte({ id: e.target.value })}
              placeholder="Es: ent_1_sede_ak_3"
            />
          </div>

          <div className="space-y-2">
            <Label>Indirizzo</Label>
            <Input
              value={ente.indirizzo}
              onChange={(e) => updateEnte({ indirizzo: e.target.value })}
              placeholder="Via, Città, Provincia"
            />
          </div>

          {/* Sede Accreditata */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3">Sede Accreditata</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Nome</Label>
                <Input
                  value={ente.accreditato.nome}
                  onChange={(e) => updateEnte({ 
                    accreditato: { ...ente.accreditato, nome: e.target.value } 
                  })}
                  className="h-9"
                  placeholder="Nome sede"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Via</Label>
                <Input
                  value={ente.accreditato.via}
                  onChange={(e) => updateEnte({ 
                    accreditato: { ...ente.accreditato, via: e.target.value } 
                  })}
                  className="h-9"
                  placeholder="Via"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">N. Civico</Label>
                <Input
                  value={ente.accreditato.numero_civico}
                  onChange={(e) => updateEnte({ 
                    accreditato: { ...ente.accreditato, numero_civico: e.target.value } 
                  })}
                  className="h-9"
                  placeholder="N."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Comune</Label>
                <Input
                  value={ente.accreditato.comune}
                  onChange={(e) => updateEnte({ 
                    accreditato: { ...ente.accreditato, comune: e.target.value } 
                  })}
                  className="h-9"
                  placeholder="Comune"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CAP</Label>
                <Input
                  value={ente.accreditato.cap}
                  onChange={(e) => updateEnte({ 
                    accreditato: { ...ente.accreditato, cap: e.target.value } 
                  })}
                  className="h-9"
                  placeholder="CAP"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Provincia</Label>
                <Input
                  value={ente.accreditato.provincia}
                  onChange={(e) => updateEnte({ 
                    accreditato: { ...ente.accreditato, provincia: e.target.value } 
                  })}
                  className="h-9"
                  placeholder="Prov."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sede */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sede del Corso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome Sede</Label>
            <Input
              value={sede.nome}
              onChange={(e) => updateSede({ nome: e.target.value })}
              placeholder="Es: Milano Porta Romana"
            />
          </div>

          <div className="space-y-2">
            <Label>Indirizzo</Label>
            <Input
              value={sede.indirizzo}
              onChange={(e) => updateSede({ indirizzo: e.target.value })}
              placeholder="Es: Corso di Porta Romana 122"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Input
              value={sede.tipo}
              onChange={(e) => updateSede({ tipo: e.target.value })}
              placeholder="Es: Aula, Online"
            />
          </div>

          <div className="space-y-2">
            <Label>Modalità</Label>
            <Input
              value={sede.modalita}
              onChange={(e) => updateSede({ modalita: e.target.value })}
              placeholder="Es: FAD Sincrona"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
