import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import SortableContactCard from '@/components/SortableContactCard';
import { Contact } from '@/components/EditContactDialog';

interface ContactsListProps {
  contacts: Contact[];
  isAdminMode: boolean;
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (id: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export default function ContactsList({
  contacts,
  isAdminMode,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onDragEnd
}: ContactsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <>
      {isAdminMode && (
        <div className="mb-6 flex justify-end animate-fade-in">
          <Button 
            onClick={onAddContact}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
          >
            <Icon name="Plus" className="mr-2" size={18} />
            Добавить контакт
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={contacts.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact, index) => (
              <SortableContactCard
                key={contact.id}
                contact={contact}
                index={index}
                isAdminMode={isAdminMode}
                onEdit={onEditContact}
                onDelete={onDeleteContact}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
