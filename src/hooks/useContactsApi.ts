import { useToast } from '@/hooks/use-toast';
import { Contact } from '@/components/EditContactDialog';
import { PageSettings } from '@/components/PageSettingsDialog';

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: 1,
    title: 'Telegram',
    description: 'Свяжитесь со мной',
    telegram_link: 'https://t.me/username',
    display_order: 1
  }
];

const DEFAULT_SETTINGS: PageSettings = {
  id: 1,
  main_title: 'Мои контакты',
  main_description: 'Свяжитесь со мной в Telegram',
  background_image_url: null
};

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', role: 'superadmin' }
];

export function useContactsApi() {
  const { toast } = useToast();

  const initializeStorage = () => {
    if (!localStorage.getItem('contacts')) {
      localStorage.setItem('contacts', JSON.stringify(DEFAULT_CONTACTS));
    }
    if (!localStorage.getItem('page_settings')) {
      localStorage.setItem('page_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
    }
  };

  const fetchContacts = async (): Promise<Contact[]> => {
    initializeStorage();
    const stored = localStorage.getItem('contacts');
    return stored ? JSON.parse(stored) : DEFAULT_CONTACTS;
  };

  const fetchPageSettings = async (): Promise<PageSettings | null> => {
    initializeStorage();
    const stored = localStorage.getItem('page_settings');
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; token?: string; role?: string }> => {
    initializeStorage();
    const stored = localStorage.getItem('users');
    const users = stored ? JSON.parse(stored) : DEFAULT_USERS;
    
    const user = users.find((u: any) => u.username === username && u.password === password);
    
    if (user) {
      const token = `token_${Date.now()}`;
      localStorage.setItem('user_role', user.role);
      toast({ title: 'Успешно', description: 'Вы вошли в систему' });
      return { success: true, token, role: user.role };
    } else {
      toast({ title: 'Ошибка', description: 'Неверные данные', variant: 'destructive' });
      return { success: false };
    }
  };

  const updateContact = async (contact: Contact, authToken: string): Promise<boolean> => {
    const stored = localStorage.getItem('contacts');
    const contacts = stored ? JSON.parse(stored) : [];
    const index = contacts.findIndex((c: Contact) => c.id === contact.id);
    
    if (index !== -1) {
      contacts[index] = contact;
      localStorage.setItem('contacts', JSON.stringify(contacts));
      toast({ title: 'Успешно', description: 'Контакт обновлён' });
      return true;
    }
    
    toast({ title: 'Ошибка', description: 'Контакт не найден', variant: 'destructive' });
    return false;
  };

  const addContact = async (newContact: Partial<Contact>, authToken: string): Promise<boolean> => {
    const stored = localStorage.getItem('contacts');
    const contacts = stored ? JSON.parse(stored) : [];
    const newId = contacts.length > 0 ? Math.max(...contacts.map((c: Contact) => c.id)) + 1 : 1;
    
    const contact: Contact = {
      id: newId,
      title: newContact.title || 'Новый контакт',
      description: newContact.description || 'Описание',
      telegram_link: newContact.telegram_link || 'https://t.me/username',
      display_order: newContact.display_order || contacts.length + 1
    };
    
    contacts.push(contact);
    localStorage.setItem('contacts', JSON.stringify(contacts));
    toast({ title: 'Успешно', description: 'Контакт добавлен' });
    return true;
  };

  const deleteContact = async (id: number, authToken: string): Promise<boolean> => {
    const stored = localStorage.getItem('contacts');
    const contacts = stored ? JSON.parse(stored) : [];
    const filtered = contacts.filter((c: Contact) => c.id !== id);
    
    localStorage.setItem('contacts', JSON.stringify(filtered));
    toast({ title: 'Успешно', description: 'Контакт удалён' });
    return true;
  };

  const changePassword = async (oldPassword: string, newPassword: string, authToken: string): Promise<boolean> => {
    const role = localStorage.getItem('user_role');
    const stored = localStorage.getItem('users');
    const users = stored ? JSON.parse(stored) : DEFAULT_USERS;
    
    const userIndex = users.findIndex((u: any) => u.role === role && u.password === oldPassword);
    
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
      toast({ title: 'Успешно', description: 'Пароль изменён' });
      return true;
    }
    
    toast({ title: 'Ошибка', description: 'Неверный старый пароль', variant: 'destructive' });
    return false;
  };

  const updateSettings = async (settings: PageSettings, authToken: string): Promise<boolean> => {
    localStorage.setItem('page_settings', JSON.stringify(settings));
    toast({ title: 'Успешно', description: 'Настройки сохранены' });
    return true;
  };

  const updateContactsOrder = async (contacts: Contact[], authToken: string): Promise<void> => {
    const updated = contacts.map((c, index) => ({ ...c, display_order: index + 1 }));
    localStorage.setItem('contacts', JSON.stringify(updated));
    toast({ title: 'Успешно', description: 'Порядок обновлён' });
  };

  return {
    fetchContacts,
    fetchPageSettings,
    login,
    updateContact,
    addContact,
    deleteContact,
    changePassword,
    updateSettings,
    updateContactsOrder
  };
}