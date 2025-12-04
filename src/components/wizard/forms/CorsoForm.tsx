import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWizardStore } from '@/store/wizardStore';
import { getAllOfferteFormative, type OffertaFormativaDB } from '@/db/templateDb';

export function CorsoForm() {
  const { courseData, updateCorso } = useWizardStore();
  const { corso } = courseData;

  const [offerteList, setOfferteList] = useState<OffertaFormativaDB[]>([]);

  // Carica offerte formative dal database
  useEffect(() => {
    getAllOfferteFormative().then(setOfferteList);
  }, []);

  const handleOffertaSelect = (value: string) => {
    if (value === 'manual') return;
    
    const offerta = offerteList.find(o => o.id === Number(value));
    if (offerta) {
      updateCorso({
        offerta_formativa: { 
          codice: offerta.codice, 
          nome: offerta.nome 
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="titolo">Titolo Corso</Label>
          <Input
            id="titolo"
            value={corso.titolo}
            onChange={(e) => updateCorso({ titolo: e.target.value })}
            placeholder="Es: AI: Intelligenza Artificiale 100% FAD"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="id">ID Corso</Label>
          <Input
            id="id"
            value={corso.id}
            onChange={(e) => updateCorso({ id: e.target.value })}
            placeholder="Es: 50039"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select 
            value={corso.tipo} 
            onValueChange={(value) => updateCorso({ tipo: value as 'FAD' | 'presenza' | 'misto' | '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FAD">FAD (Online)</SelectItem>
              <SelectItem value="presenza">In Presenza</SelectItem>
              <SelectItem value="misto">Misto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_inizio">Data Inizio</Label>
          <Input
            id="data_inizio"
            value={corso.data_inizio}
            onChange={(e) => updateCorso({ data_inizio: e.target.value })}
            placeholder="DD/MM/YYYY"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_fine">Data Fine</Label>
          <Input
            id="data_fine"
            value={corso.data_fine}
            onChange={(e) => updateCorso({ data_fine: e.target.value })}
            placeholder="DD/MM/YYYY"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ore_totali">Ore Totali</Label>
          <Input
            id="ore_totali"
            value={corso.ore_totali}
            onChange={(e) => updateCorso({ ore_totali: e.target.value })}
            placeholder="Es: 20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ore_rendicontabili">Ore Rendicontabili</Label>
          <Input
            id="ore_rendicontabili"
            value={corso.ore_rendicontabili}
            onChange={(e) => updateCorso({ ore_rendicontabili: e.target.value })}
            placeholder="Es: 20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capienza">Capienza</Label>
          <Input
            id="capienza"
            value={corso.capienza}
            onChange={(e) => updateCorso({ capienza: e.target.value })}
            placeholder="Es: 4/5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stato">Stato</Label>
          <Input
            id="stato"
            value={corso.stato}
            onChange={(e) => updateCorso({ stato: e.target.value })}
            placeholder="Es: Aperto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="anno">Anno</Label>
          <Input
            id="anno"
            value={corso.anno}
            onChange={(e) => updateCorso({ anno: e.target.value })}
            placeholder="Es: 2025"
          />
        </div>
      </div>

      {/* Offerta Formativa */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-3">Offerta Formativa</h4>
        
        {/* Dropdown selezione offerta GOL */}
        {offerteList.length > 0 && (
          <div className="space-y-2 mb-4">
            <Label>Seleziona Offerta Predefinita (GOL)</Label>
            <Select onValueChange={handleOffertaSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona offerta formativa..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">-- Inserisci manualmente --</SelectItem>
                {offerteList.map(o => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.codice} - {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="of_codice">Codice</Label>
            <Input
              id="of_codice"
              value={corso.offerta_formativa.codice}
              onChange={(e) => updateCorso({ 
                offerta_formativa: { ...corso.offerta_formativa, codice: e.target.value } 
              })}
              placeholder="Es: 1540"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="of_nome">Nome</Label>
            <Input
              id="of_nome"
              value={corso.offerta_formativa.nome}
              onChange={(e) => updateCorso({ 
                offerta_formativa: { ...corso.offerta_formativa, nome: e.target.value } 
              })}
              placeholder="Es: GOL - FAD 100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
