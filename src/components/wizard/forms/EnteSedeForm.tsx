import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWizardStore } from '@/store/wizardStore';
import { getAllEnti, getSediByEnte, type DefaultEnte, type DefaultSede } from '@/db/templateDb';

export function EnteSedeForm() {
  const { courseData, updateEnte, updateSede } = useWizardStore();
  const { ente, sede } = courseData;

  const [entiList, setEntiList] = useState<DefaultEnte[]>([]);
  const [sediList, setSediList] = useState<DefaultSede[]>([]);
  const [selectedEnteId, setSelectedEnteId] = useState<string>('');
  const [selectedSedeId, setSelectedSedeId] = useState<string>('');

  // Carica enti dal database e gestisci default
  useEffect(() => {
    getAllEnti().then(list => {
      setEntiList(list);

      // 1. If only one ente exists, select it automatically if field is empty
      if (list.length === 1 && (!ente.nome || ente.nome.trim() === '')) {
        handleEnteSelect(String(list[0].id), list);
        return;
      }

      // 2. Auto-select default if ente name is empty
      const defaultEnte = list.find(e => e.isDefault);
      if (defaultEnte && (!ente.nome || ente.nome.trim() === '')) {
        handleEnteSelect(String(defaultEnte.id), list);
      } else if (ente.nome) {
        // Try to match existing name
        const match = list.find(e => e.nome === ente.nome);
        if (match) setSelectedEnteId(String(match.id));
      }
    });
  }, []); // Run once on mount

  // Gestione sedi quando cambia ente o quando viene caricata una selezione
  useEffect(() => {
    if (selectedEnteId) {
      getSediByEnte(Number(selectedEnteId)).then(list => {
        setSediList(list);

        // 1. If only one sede exists for this ente, select it automatically if field is empty
        if (list.length === 1 && (!sede.nome || sede.nome.trim() === '')) {
          handleSedeSelect(String(list[0].id), list);
          return;
        }

        // 2. Auto-select default sede for this ente
        const defaultSede = list.find(s => s.isDefault);
        if (defaultSede && (!sede.nome || sede.nome.trim() === '')) {
          handleSedeSelect(String(defaultSede.id), list);
        } else if (sede.nome) {
          // Try to match existing sede for this ente
          const match = list.find(s => s.nome === sede.nome);
          if (match) setSelectedSedeId(String(match.id));
        }
      });
    } else {
      setSediList([]);
      setSelectedSedeId('');
    }
  }, [selectedEnteId]);

  const handleEnteSelect = (value: string, listStr?: DefaultEnte[]) => {
    if (value === 'manual') {
      setSelectedEnteId('');
      setSelectedSedeId('');
      return;
    }

    // Ensure we handle both string update and direct list passing
    const list = listStr || entiList;
    const enteId = Number(value);
    const selectedEnte = list.find(e => e.id === enteId);

    if (selectedEnte) {
      setSelectedEnteId(value);
      updateEnte({
        nome: selectedEnte.nome,
        indirizzo: selectedEnte.indirizzo
      });
    }
  };

  const handleSedeSelect = (value: string, listStr?: DefaultSede[]) => {
    if (value === 'manual') {
      setSelectedSedeId('');
      return;
    }

    const list = listStr || sediList;
    const sedeId = Number(value);
    const selectedSede = list.find(s => s.id === sedeId);

    if (selectedSede) {
      setSelectedSedeId(value);
      updateSede({
        nome: selectedSede.nome,
        indirizzo: `${selectedSede.indirizzo}, ${selectedSede.cap} ${selectedSede.citta} (${selectedSede.provincia})`
      });
      updateEnte({
        accreditato: {
          ...ente.accreditato,
          nome: selectedSede.nome,
          via: selectedSede.indirizzo,
          comune: selectedSede.citta,
          cap: selectedSede.cap,
          provincia: selectedSede.provincia
        }
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ente Formativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropdown selezione ente */}
          {entiList.length > 0 && (
            <div className="space-y-2">
              <Label>Seleziona Ente Predefinito</Label>
              <Select value={selectedEnteId} onValueChange={(val) => handleEnteSelect(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">-- Inserisci manualmente --</SelectItem>
                  {entiList.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
          {/* Dropdown selezione sede (solo se ente selezionato) */}
          {sediList.length > 0 && (
            <div className="space-y-2">
              <Label>Seleziona Sede Predefinita</Label>
              <Select value={selectedSedeId} onValueChange={(val) => handleSedeSelect(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona sede..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">-- Inserisci manualmente --</SelectItem>
                  {sediList.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nome} - {s.citta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
