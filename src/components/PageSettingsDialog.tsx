import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface PageSettings {
  id: number;
  main_title: string;
  main_description: string;
  background_image_url?: string | null;
}

interface PageSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PageSettings;
  onSettingsChange: (settings: PageSettings) => void;
  onSave: () => void;
}

export default function PageSettingsDialog({
  isOpen,
  onOpenChange,
  settings,
  onSettingsChange,
  onSave
}: PageSettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Настройки страницы
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="main-title">Заголовок</Label>
            <Input 
              id="main-title"
              value={settings.main_title}
              onChange={(e) => onSettingsChange({ ...settings, main_title: e.target.value })}
              placeholder="Мои контакты"
            />
          </div>
          <div>
            <Label htmlFor="main-description">Описание</Label>
            <Input 
              id="main-description"
              value={settings.main_description}
              onChange={(e) => onSettingsChange({ ...settings, main_description: e.target.value })}
              placeholder="Свяжитесь со мной в Telegram"
            />
          </div>
          <div>
            <Label htmlFor="background-image">URL фонового изображения (необязательно)</Label>
            <Input 
              id="background-image"
              value={settings.background_image_url || ''}
              onChange={(e) => onSettingsChange({ ...settings, background_image_url: e.target.value || null })}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">Оставьте пустым для стандартного градиента</p>
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
