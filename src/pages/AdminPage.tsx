import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Contact {
  id: number;
  title: string;
  username: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

const SortableContact = ({ contact, onEdit, onDelete }: { contact: Contact; onEdit: () => void; onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: contact.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 hover:shadow-lg transition-all">
      <div className="flex items-center gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <Icon name="GripVertical" size={20} className="text-gray-400" />
        </div>
        
        <div 
          className="p-3 rounded-lg" 
          style={{ backgroundColor: contact.color }}
        >
          <Icon name={contact.icon as any} size={24} className="text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg">{contact.title}</h3>
          <p className="text-sm text-gray-600">@{contact.username}</p>
          <p className="text-sm text-gray-500 mt-1">{contact.description}</p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Icon name="Edit" size={16} />
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const AdminPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editDialog, setEditDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/auth/secure-login-portal');
      return;
    }
    fetchContacts();
  }, [navigate]);

  const fetchContacts = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/aae2a894-b17c-467a-a389-439f259b682a?action=get-contacts');
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = contacts.findIndex((c) => c.id === active.id);
      const newIndex = contacts.findIndex((c) => c.id === over.id);
      const newContacts = arrayMove(contacts, oldIndex, newIndex);
      setContacts(newContacts);

      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        await fetch('https://functions.poehali.dev/aae2a894-b17c-467a-a389-439f259b682a?action=reorder-contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token
          },
          body: JSON.stringify({ contacts: newContacts.map((c, i) => ({ id: c.id, sort_order: i })) })
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить порядок",
          variant: "destructive"
        });
        fetchContacts();
      }
    }
  };

  const handleAddContact = () => {
    setCurrentContact({
      id: 0,
      title: "Новый контакт",
      username: "",
      description: "",
      icon: "MessageCircle",
      color: "#3b82f6",
      sort_order: contacts.length
    });
    setEditDialog(true);
  };

  const handleEditContact = (contact: Contact) => {
    setCurrentContact({ ...contact });
    setEditDialog(true);
  };

  const handleSaveContact = async () => {
    if (!currentContact) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const url = currentContact.id === 0
        ? 'https://functions.poehali.dev/aae2a894-b17c-467a-a389-439f259b682a?action=add-contact'
        : `https://functions.poehali.dev/aae2a894-b17c-467a-a389-439f259b682a?action=update-contact&id=${currentContact.id}`;

      const response = await fetch(url, {
        method: currentContact.id === 0 ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify(currentContact)
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Контакт сохранен"
        });
        setEditDialog(false);
        fetchContacts();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить контакт",
        variant: "destructive"
      });
    }
  };

  const handleDeleteContact = async (id: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    if (!confirm('Удалить этот контакт?')) return;

    try {
      const response = await fetch(`https://functions.poehali.dev/aae2a894-b17c-467a-a389-439f259b682a?action=delete-contact&id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': token }
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Контакт удален"
        });
        fetchContacts();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить контакт",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch('https://functions.poehali.dev/aae2a894-b17c-467a-a389-439f259b682a?action=change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Пароль изменен"
        });
        setPasswordDialog(false);
        setOldPassword("");
        setNewPassword("");
      } else {
        toast({
          title: "Ошибка",
          description: "Неверный старый пароль",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить пароль",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Админ-панель
            </h1>
            <p className="text-gray-600 mt-2">Управление контактами</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Icon name="Home" size={18} className="mr-2" />
              На сайт
            </Button>
            {localStorage.getItem('user_role') === 'superadmin' && (
              <Button variant="outline" onClick={() => navigate('/audit-log')}>
                <Icon name="Activity" size={18} className="mr-2" />
                Журнал действий
              </Button>
            )}
            <Button variant="outline" onClick={() => setPasswordDialog(true)}>
              <Icon name="Key" size={18} className="mr-2" />
              Сменить пароль
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <Icon name="LogOut" size={18} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-6 animate-scale-in">
          <Button onClick={handleAddContact} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Icon name="Plus" size={20} className="mr-2" />
            Добавить контакт
          </Button>
        </Card>

        <div className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={contacts.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {contacts.map((contact, index) => (
                <div key={contact.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                  <SortableContact
                    contact={contact}
                    onEdit={() => handleEditContact(contact)}
                    onDelete={() => handleDeleteContact(contact.id)}
                  />
                </div>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать контакт</DialogTitle>
            </DialogHeader>
            {currentContact && (
              <div className="space-y-4">
                <div>
                  <Label>Название</Label>
                  <Input
                    value={currentContact.title}
                    onChange={(e) => setCurrentContact({ ...currentContact, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Username (без @)</Label>
                  <Input
                    value={currentContact.username}
                    onChange={(e) => setCurrentContact({ ...currentContact, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Описание</Label>
                  <Input
                    value={currentContact.description}
                    onChange={(e) => setCurrentContact({ ...currentContact, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Иконка</Label>
                  <select
                    value={currentContact.icon}
                    onChange={(e) => setCurrentContact({ ...currentContact, icon: e.target.value })}
                    className="w-full border rounded p-2"
                  >
                    <option value="MessageCircle">MessageCircle</option>
                    <option value="Users">Users</option>
                    <option value="Briefcase">Briefcase</option>
                    <option value="Phone">Phone</option>
                    <option value="Mail">Mail</option>
                    <option value="Heart">Heart</option>
                    <option value="Star">Star</option>
                  </select>
                </div>
                <div>
                  <Label>Цвет</Label>
                  <Input
                    type="color"
                    value={currentContact.color}
                    onChange={(e) => setCurrentContact({ ...currentContact, color: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>Отмена</Button>
              <Button onClick={handleSaveContact}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Сменить пароль</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Старый пароль</Label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div>
                <Label>Новый пароль</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasswordDialog(false)}>Отмена</Button>
              <Button onClick={handleChangePassword}>Изменить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPage;