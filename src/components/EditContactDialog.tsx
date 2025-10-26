import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Редактировать контакт
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
          <div>
            <Label htmlFor="edit-username">Telegram Username (для аватара)</Label>
            <Input 
              id="edit-username"
              value={contact.telegram_username || ''}
              onChange={(e) => onContactChange({ ...contact, telegram_username: e.target.value || null })}
              placeholder="username"
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
