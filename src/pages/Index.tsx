import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Contact } from '@/components/EditContactDialog';
import { PageSettings } from '@/components/PageSettingsDialog';
import { useContactsApi } from '@/hooks/useContactsApi';
import PageHeader from '@/components/PageHeader';
import ContactsList from '@/components/ContactsList';
import LoginDialog from '@/components/LoginDialog';
import EditContactDialog from '@/components/EditContactDialog';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import PageSettingsDialog from '@/components/PageSettingsDialog';

export default function Index() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pageSettings, setPageSettings] = useState<PageSettings>({ 
    id: 1, 
    main_title: 'Мои контакты', 
    main_description: 'Свяжитесь со мной в Telegram', 
    background_image_url: null 
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();
  const api = useContactsApi();

  useEffect(() => {
    loadContacts();
    loadPageSettings();
    if (authToken) {
      setIsAdminMode(true);
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

  const handleLogin = async () => {
    const result = await api.login(username, password);
    if (result.success && result.token) {
      setAuthToken(result.token);
      localStorage.setItem('auth_token', result.token);
      setIsAdminMode(true);
      setIsLoginOpen(false);
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
          onLoginClick={() => setIsLoginOpen(true)}
          onSettingsClick={() => setIsSettingsDialogOpen(true)}
          onPasswordClick={() => setIsPasswordDialogOpen(true)}
          onLogoutClick={handleLogout}
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

        <LoginDialog
          isOpen={isLoginOpen}
          onOpenChange={setIsLoginOpen}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          onLogin={handleLogin}
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
      </div>
    </div>
  );
}
