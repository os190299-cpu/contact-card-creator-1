import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Contact {
  id: number;
  title: string;
  description: string;
  telegram_link: string;
  display_order: number;
  avatar_url?: string | null;
  telegram_username?: string | null;
}

interface SortableContactCardProps {
  contact: Contact;
  index: number;
  isAdminMode: boolean;
  onEdit: (contact: Contact) => void;
  onDelete: (id: number) => void;
}

export default function SortableContactCard({ 
  contact, 
  index, 
  isAdminMode, 
  onEdit, 
  onDelete 
}: SortableContactCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getAvatarUrl = () => {
    return contact.avatar_url || null;
  };

  const getInitials = () => {
    return contact.title.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className="bg-white/95 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 animate-slide-up border-none"
    >
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-purple-200">
            <AvatarImage src={getAvatarUrl() || undefined} alt={contact.title} />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-lg font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {contact.title}
            </CardTitle>
            <CardDescription className="text-gray-600">{contact.description}</CardDescription>
          </div>
          {isAdminMode && (
            <div {...attributes} {...listeners}>
              <Icon name="GripVertical" className="text-gray-400 cursor-grab active:cursor-grabbing" size={24} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => window.open(contact.telegram_link, '_blank')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg h-11"
          >
            <Icon name="Send" className="mr-2" size={18} />
            Открыть Telegram
          </Button>
          
          {isAdminMode && (
            <div className="flex gap-2">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(contact);
                }}
                variant="outline"
                className="flex-1 h-11"
              >
                <Icon name="Edit" size={18} />
              </Button>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(contact.id);
                }}
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 h-11"
              >
                <Icon name="Trash2" size={18} />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}