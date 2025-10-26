import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Contact } from '@/components/EditContactDialog';
import { PageSettings } from '@/components/PageSettingsDialog';
import { useContactsApi } from '@/hooks/useContactsApi';
import PageHeader from '@/components/PageHeader';
import ContactsList from '@/components/ContactsList';
import EditContactDialog from '@/components/EditContactDialog';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import PageSettingsDialog from '@/components/PageSettingsDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

export default function Index() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pageSettings, setPageSettings] = useState<PageSettings>({ 
    id: 1, 
    main_title: 'Мои контакты', 
    main_description: 'Свяжитесь со мной в Telegram', 
    background_image_url: null 
  });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('user_role'));
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();
  const api = useContactsApi();

  useEffect(() => {
    loadContacts();
    loadPageSettings();
    if (authToken) {
      setIsAdminMode(true);
      const savedRole = localStorage.getItem('user_role');
      if (savedRole) {
        setUserRole(savedRole);
      }
    }
  }, []);

  const loadContacts = async () => {
    const data = await api.fetchContacts();
    setContacts(data);
  };

  const loadPageSettings = async () => {
    const data = await api.fetchPageSettings();
    if (data) {
      setPageSettings(data);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUserRole(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    setIsAdminMode(false);
    toast({ title: 'Выход', description: 'Вы вышли из системы' });
  };

  const handleSaveContact = async () => {
    if (!editingContact || !authToken) return;
    const success = await api.updateContact(editingContact, authToken);
    if (success) {
      await loadContacts();
      setIsEditDialogOpen(false);
      setEditingContact(null);
      toast({
        title: 'Успех',
        description: 'Контакт обновлён'
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить контакт',
        variant: 'destructive'
      });
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
    const success = await api.addContact(newContact, authToken);
    if (success) {
      await loadContacts();
      toast({
        title: 'Успех',
        description: 'Контакт добавлен'
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить контакт',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!authToken) return;
    const success = await api.deleteContact(id, authToken);
    if (success) {
      await loadContacts();
      toast({
        title: 'Успех',
        description: 'Контакт удалён'
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить контакт',
        variant: 'destructive'
      });
    }
  };

  const handleChangePassword = async () => {
    if (!authToken) return;
    
    if (!oldPassword.trim() || !newPassword.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive'
      });
      return;
    }

    const success = await api.changePassword(oldPassword, newPassword, authToken);
    if (success) {
      setIsPasswordDialogOpen(false);
      setOldPassword('');
      setNewPassword('');
      toast({
        title: 'Успех',
        description: 'Пароль изменён'
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Неверный старый пароль',
        variant: 'destructive'
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!authToken) return;
    const success = await api.updateSettings(pageSettings, authToken);
    if (success) {
      setIsSettingsDialogOpen(false);
      toast({
        title: 'Успех',
        description: 'Настройки сохранены'
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
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
      await api.updateContactsOrder(newContacts, authToken);
    } catch (error) {
      await loadContacts();
    }
  };

  const backgroundStyle = pageSettings.background_image_url 
    ? { 
        backgroundImage: `linear-gradient(to bottom right, rgba(139, 92, 246, 0.6), rgba(236, 72, 153, 0.6), rgba(251, 146, 60, 0.6)), url(${pageSettings.background_image_url})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }
    : {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-orange-200" style={backgroundStyle}>
      <div className="container mx-auto px-4 py-12">
        <PageHeader
          mainTitle={pageSettings.main_title}
          mainDescription={pageSettings.main_description}
          isAdminMode={isAdminMode}
          onLoginClick={() => navigate("/auth/secure-login-portal")}
          onSettingsClick={() => setIsSettingsDialogOpen(true)}
          onPasswordClick={() => setIsPasswordDialogOpen(true)}
          onLogoutClick={handleLogout}
          onUsersClick={() => navigate('/users')}
          isSuperAdmin={userRole === 'superadmin'}
        />

        <ContactsList
          contacts={contacts}
          isAdminMode={isAdminMode}
          onAddContact={handleAddContact}
          onEditContact={(contact) => {
            setEditingContact(contact);
            setIsEditDialogOpen(true);
          }}
          onDeleteContact={handleDeleteContact}
          onDragEnd={handleDragEnd}
        />

        <div className="mt-16 pb-8 text-center">
          <button
            onClick={() => setIsDisclaimerOpen(true)}
            className="text-xs text-gray-600 hover:text-gray-800 underline opacity-60 hover:opacity-100 transition-opacity"
          >
            Отказ от ответственности
          </button>
        </div>

        <EditContactDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          contact={editingContact}
          onContactChange={setEditingContact}
          onSave={handleSaveContact}
        />

        <ChangePasswordDialog
          isOpen={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
          oldPassword={oldPassword}
          setOldPassword={setOldPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          onChangePassword={handleChangePassword}
        />

        <PageSettingsDialog
          isOpen={isSettingsDialogOpen}
          onOpenChange={setIsSettingsDialogOpen}
          settings={pageSettings}
          onSettingsChange={setPageSettings}
          onSave={handleSaveSettings}
        />

        <Dialog open={isDisclaimerOpen} onOpenChange={setIsDisclaimerOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Отказ от ответственности</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <h3 className="font-bold text-lg mb-2">1. Цель ресурса</h3>
                <p className="text-gray-700">
                  Данный сайт создан исключительно в целях общественного информирования и повышения осведомлённости о рисках, связанных с незаконным оборотом наркотических веществ. Сайт не предназначен и не используется для содействия, организации или совершения противоправной деятельности.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">2. Отсутствие связи с противоправной деятельностью</h3>
                <p className="text-gray-700">
                  Владелец сайта категорически не связан с какой-либо деятельностью по распространению, продаже или употреблению наркотических средств. Любые упоминания терминов или понятий, связанных с данной сферой, имеют исключительно информационный характер.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">3. Законопослушность</h3>
                <p className="text-gray-700">
                  Владелец сайта подчёркивает своё полное соблюдение действующего законодательства Российской Федерации и международных норм. Сайт не преследует цель способствовать нарушению закона.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">4. Отказ от ответственности за действия третьих лиц</h3>
                <p className="text-gray-700">
                  Владелец сайта не несёт ответственности за действия третьих лиц, которые могут использовать информацию, размещённую на сайте, в противоправных целях. Любое использование ресурса в нарушение законодательства является исключительной ответственностью таких лиц.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">5. Призыв к законопослушанию</h3>
                <p className="text-gray-700">
                  Владелец сайта настоятельно призывает всех посетителей соблюдать законодательство и избегать любых форм участия в незаконной деятельности.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">6. Контакты для связи</h3>
                <p className="text-gray-700">
                  Если у вас есть вопросы или жалобы относительно контента, размещённого на сайте, вы можете связаться с владельцем через указанные на сайте контактные данные.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
