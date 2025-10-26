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
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!authToken) return;
    const success = await api.deleteContact(id, authToken);
    if (success) {
      await loadContacts();
    }
  };

  const handleChangePassword = async () => {
    if (!authToken) return;
    const success = await api.changePassword(oldPassword, newPassword, authToken);
    if (success) {
      setIsPasswordDialogOpen(false);
      setOldPassword('');
      setNewPassword('');
    }
  };

  const handleSaveSettings = async () => {
    if (!authToken) return;
    const success = await api.updateSettings(pageSettings, authToken);
    if (success) {
      setIsSettingsDialogOpen(false);
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
          onLoginClick={() => {}}
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
                <h3 className="font-bold text-lg mb-2">2. Источники и точность</h3>
                <p className="text-gray-700">
                  Информация (включая юзернеймы, описания и публичные ссылки) собирается из общедоступных источников. Мы не гарантируем полноту, точность, достоверность или актуальность этих данных. Любые утверждения о противоправной деятельности основаны на найденных в публичном пространстве материалах и помечены как «не подтверждённые», если фактическая проверка отсутствует.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">3. Ограничение ответственности</h3>
                <p className="text-gray-700">
                  Владельцы и администраторы сайта не несут ответственности за любые убытки, юридические последствия или иные действия, возникшие в результате использования информации, размещённой на сайте. Использование материалов сайта для совершения противоправных действий запрещено.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">4. Личные данные и репутация</h3>
                <p className="text-gray-700">
                  Если вы считаете, что опубликованная информация содержит ваши персональные данные, ложна, порочит честь и достоинство или нарушает иные права — отправьте запрос на удаление/исправление. Мы рассматриваем обращения и можем удалить или пометить сомнительную информацию после проверки.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="fixed bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDisclaimerOpen(true)}
            className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg"
          >
            <Icon name="Info" size={16} className="mr-2" />
            Отказ от ответственности
          </Button>
        </div>
      </div>
    </div>
  );
}