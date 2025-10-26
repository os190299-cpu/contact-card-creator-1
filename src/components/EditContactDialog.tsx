import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

export interface Contact {
  id: number;
  title: string;
  description: string;
  telegram_link: string;
  display_order: number;
  avatar_url?: string | null;
  telegram_username?: string | null;
}

interface EditContactDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onContactChange: (contact: Contact) => void;
  onSave: () => void;
}

export default function EditContactDialog({
  isOpen,
  onOpenChange,
  contact,
  onContactChange,
  onSave
}: EditContactDialogProps) {
  if (!contact) return null;

  const getInitials = () => {
    return contact.title.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Редактировать контакт
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-24 w-24 border-2 border-purple-200">
              <AvatarImage src={contact.avatar_url || undefined} alt={contact.title} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div>
            <Label htmlFor="edit-avatar-url">URL фото аватара (необязательно)</Label>
            <Input 
              id="edit-avatar-url"
              value={contact.avatar_url || ''}
              onChange={(e) => onContactChange({ ...contact, avatar_url: e.target.value || null })}
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">Вставьте ссылку на изображение из интернета</p>
          </div>

          <div>
            <Label htmlFor="edit-title">Название</Label>
            <Input 
              id="edit-title"
              value={contact.title}
              onChange={(e) => onContactChange({ ...contact, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-description">Описание</Label>
            <Textarea 
              id="edit-description"
              value={contact.description}
              onChange={(e) => onContactChange({ ...contact, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-telegram">Telegram ссылка</Label>
            <Input 
              id="edit-telegram"
              value={contact.telegram_link}
              onChange={(e) => onContactChange({ ...contact, telegram_link: e.target.value })}
              placeholder="https://t.me/username"
            />
          </div>
          <Button 
            onClick={onSave}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}