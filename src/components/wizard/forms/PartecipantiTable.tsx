import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Partecipante } from '@/types/extraction';

interface SortableRowProps {
  participant: Partecipante;
  index: number;
  onUpdate: (index: number, data: Partecipante) => void;
  onRemove: (index: number) => void;
}

function SortableRow({ participant, index, onUpdate, onRemove }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `participant-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted/50' : ''}>
      <TableCell className="w-10">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="font-medium text-muted-foreground w-10">
        {index + 1}
      </TableCell>
      <TableCell>
        <Input
          value={participant.nome}
          onChange={(e) => onUpdate(index, { ...participant, nome: e.target.value })}
          className="h-8"
          placeholder="Nome"
        />
      </TableCell>
      <TableCell>
        <Input
          value={participant.cognome}
          onChange={(e) => onUpdate(index, { ...participant, cognome: e.target.value })}
          className="h-8"
          placeholder="Cognome"
        />
      </TableCell>
      <TableCell>
        <Input
          value={participant.codiceFiscale}
          onChange={(e) => onUpdate(index, { 
            ...participant, 
            codiceFiscale: e.target.value.toUpperCase() 
          })}
          className="h-8 font-mono text-xs w-36"
          placeholder="CODICE FISCALE"
        />
      </TableCell>
      <TableCell>
        <Input
          value={participant.email || ''}
          onChange={(e) => onUpdate(index, { ...participant, email: e.target.value })}
          className="h-8 w-36"
          placeholder="email@esempio.it"
        />
      </TableCell>
      <TableCell className="text-center">
        <Checkbox
          checked={participant.benefits || false}
          onCheckedChange={(checked) => onUpdate(index, { ...participant, benefits: !!checked })}
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function PartecipantiTable() {
  const { courseData, addPartecipante, updatePartecipante, removePartecipante, setCourseData } = useWizardStore();
  const { partecipanti } = courseData;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddPartecipante = () => {
    addPartecipante({
      nome: '',
      cognome: '',
      codiceFiscale: '',
      email: '',
      telefono: '',
      benefits: false,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace('participant-', ''));
      const newIndex = parseInt(String(over.id).replace('participant-', ''));
      
      const newPartecipanti = arrayMove(partecipanti, oldIndex, newIndex);
      setCourseData({ ...courseData, partecipanti: newPartecipanti });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">
            Partecipanti ({partecipanti.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Trascina le righe per riordinare • Spunta "GOL" per i beneficiari
          </p>
        </div>
        <Button onClick={handleAddPartecipante} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Aggiungi
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Cognome</TableHead>
                <TableHead>Codice Fiscale</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-16 text-center" title="Beneficiario GOL/PNRR">GOL</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={partecipanti.map((_, i) => `participant-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                {partecipanti.map((p, index) => (
                  <SortableRow
                    key={`participant-${index}`}
                    participant={p}
                    index={index}
                    onUpdate={updatePartecipante}
                    onRemove={removePartecipante}
                  />
                ))}
              </SortableContext>
              {partecipanti.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nessun partecipante. Clicca "Aggiungi" per inserirne uno.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}
