import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import SortableContactCard from '@/components/SortableContactCard';

const API_URL = 'https://functions.poehali.dev/aae2a894-b17c-467a-a389-439f259b682a';

interface Contact {
  id: number;
  title: string;
  description: string;
  telegram_link: string;
  display_order: number;
  avatar_url?: string | null;
  telegram_username?: string | null;
}

export default function Index() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchContacts();
    if (authToken) {
      setIsAdminMode(true);
    }
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_URL}?action=get-contacts`);
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить контакты', variant: 'destructive' });
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setAuthToken(data.token);
        localStorage.setItem('auth_token', data.token);
        setIsAdminMode(true);
        setIsLoginOpen(false);
        toast({ title: 'Успешно', description: 'Вы вошли в систему' });
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Неверные данные', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('auth_token');
    setIsAdminMode(false);
    toast({ title: 'Выход', description: 'Вы вышли из системы' });
  };

  const handleSaveContact = async () => {
    if (!editingContact || !authToken) return;

    try {
      const res = await fetch(`${API_URL}?action=update-contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify(editingContact)
      });

      if (res.ok) {
        await fetchContacts();
        setIsEditDialogOpen(false);
        setEditingContact(null);
        toast({ title: 'Успешно', description: 'Контакт обновлён' });
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось обновить', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
    }
  };

  const handleAddContact = async () => {
    if (!authToken) return;

    const newContact = {
      title: 'Новый контакт',
      description: 'Описание',
      telegram_link: 'https://t.me/username',
      display_order: contacts.length + 1
    };

    try {
      const res = await fetch(`${API_URL}?action=add-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify(newContact)
      });

      if (res.ok) {
        await fetchContacts();
        toast({ title: 'Успешно', description: 'Контакт добавлен' });
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось добавить', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!authToken) return;

    try {
      const res = await fetch(`${API_URL}?action=delete-contact&id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': authToken }
      });

      if (res.ok) {
        await fetchContacts();
        toast({ title: 'Успешно', description: 'Контакт удалён' });
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (!authToken) return;

    try {
      const res = await fetch(`${API_URL}?action=change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setIsPasswordDialogOpen(false);
        setOldPassword('');
        setNewPassword('');
        toast({ title: 'Успешно', description: 'Пароль изменён' });
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось изменить пароль', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = contacts.findIndex((c) => c.id === active.id);
    const newIndex = contacts.findIndex((c) => c.id === over.id);

    const newContacts = arrayMove(contacts, oldIndex, newIndex);
    setContacts(newContacts);

    if (!authToken) return;

    try {
      for (let i = 0; i < newContacts.length; i++) {
        await fetch(`${API_URL}?action=update-contact`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': authToken
          },
          body: JSON.stringify({ id: newContacts[i].id, display_order: i + 1 })
        });
      }
      toast({ title: 'Успешно', description: 'Порядок обновлён' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить порядок', variant: 'destructive' });
      await fetchContacts();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="container mx-auto px-4 py-12">
        <div className="relative mb-12 animate-fade-in">
          <div className="flex-1 text-center">
            <h1 className="text-5xl font-bold text-white drop-shadow-lg mx-0 px-0 text-left" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>Slivki Ghetto</h1>
            <p className="text-white/90 text-lg font-medium drop-shadow-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>Актуалы черного рынка</p>
          </div>
          <div className="absolute top-12 right-4">
            {!isAdminMode ? (
              <Button 
                onClick={() => setIsLoginOpen(true)}
                variant="outline"
                className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
              >
                <Icon name="Lock" className="mr-2" size={18} />
                Войти
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsPasswordDialogOpen(true)}
                  variant="outline"
                  className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
                >
                  <Icon name="Key" className="mr-2" size={18} />
                  Пароль
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
                >
                  <Icon name="LogOut" className="mr-2" size={18} />
                  Выход
                </Button>
              </div>
            )}
          </div>
        </div>

        {isAdminMode && (
          <div className="mb-4 text-center animate-fade-in">
            <p className="text-white/80 text-sm">
              <Icon name="Info" className="inline mr-1" size={16} />
              Перетаскивайте карточки для изменения порядка
            </p>
          </div>
        )}

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={contacts.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((contact, index) => (
                <SortableContactCard
                  key={contact.id}
                  contact={contact}
                  index={index}
                  isAdminMode={isAdminMode}
                  onEdit={(c) => {
                    setEditingContact(c);
                    setIsEditDialogOpen(true);
                  }}
                  onDelete={handleDeleteContact}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {isAdminMode && (
          <div className="mt-8 flex justify-center animate-fade-in">
            <Button 
              onClick={handleAddContact}
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90 shadow-2xl"
            >
              <Icon name="Plus" className="mr-2" size={20} />
              Добавить контакт
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Вход в систему
            </DialogTitle>
            <DialogDescription>Введите данные для доступа к админ-панели</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Логин</Label>
              <Input 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Войти
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Редактировать контакт
            </DialogTitle>
          </DialogHeader>
          {editingContact && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Название</Label>
                <Input 
                  id="edit-title"
                  value={editingContact.title}
                  onChange={(e) => setEditingContact({ ...editingContact, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Описание</Label>
                <Textarea 
                  id="edit-description"
                  value={editingContact.description}
                  onChange={(e) => setEditingContact({ ...editingContact, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-link">Telegram ссылка</Label>
                <Input 
                  id="edit-link"
                  value={editingContact.telegram_link}
                  onChange={(e) => setEditingContact({ ...editingContact, telegram_link: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-username">Telegram username (для аватарки)</Label>
                <Input 
                  id="edit-username"
                  value={editingContact.telegram_username || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, telegram_username: e.target.value })}
                  placeholder="username"
                />
              </div>
              <div>
                <Label htmlFor="edit-avatar">URL аватарки (необязательно)</Label>
                <Input 
                  id="edit-avatar"
                  value={editingContact.avatar_url || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="edit-order">Порядок отображения</Label>
                <Input 
                  id="edit-order"
                  type="number"
                  value={editingContact.display_order}
                  onChange={(e) => setEditingContact({ ...editingContact, display_order: parseInt(e.target.value) })}
                />
              </div>
              <Button 
                onClick={handleSaveContact}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Сохранить
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Изменить пароль
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="old-password">Старый пароль</Label>
              <Input 
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-password">Новый пароль</Label>
              <Input 
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleChangePassword}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Изменить пароль
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}