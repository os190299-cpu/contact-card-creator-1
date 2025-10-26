import { useToast } from '@/hooks/use-toast';
import { Contact } from '@/components/EditContactDialog';
import { PageSettings } from '@/components/PageSettingsDialog';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useContactsApi() {
  const { toast } = useToast();

  const fetchContacts = async (): Promise<Contact[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return await response.json();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить контакты', variant: 'destructive' });
      return [];
    }
  };

  const fetchPageSettings = async (): Promise<PageSettings | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return await response.json();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить настройки', variant: 'destructive' });
      return null;
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; token?: string; role?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        toast({ title: 'Ошибка', description: 'Неверные данные', variant: 'destructive' });
        return { success: false };
      }
      
      const data = await response.json();
      localStorage.setItem('user_role', data.role);
      toast({ title: 'Успешно', description: 'Вы вошли в систему' });
      return { success: true, token: data.token, role: data.role };
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка подключения', variant: 'destructive' });
      return { success: false };
    }
  };

  const updateContact = async (contact: Contact, authToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify(contact)
      });
      
      if (!response.ok) throw new Error('Failed to update contact');
      
      toast({ title: 'Успешно', description: 'Контакт обновлён' });
      return true;
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить контакт', variant: 'destructive' });
      return false;
    }
  };

  const addContact = async (newContact: Partial<Contact>, authToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify(newContact)
      });
      
      if (!response.ok) throw new Error('Failed to add contact');
      
      toast({ title: 'Успешно', description: 'Контакт добавлен' });
      return true;
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось добавить контакт', variant: 'destructive' });
      return false;
    }
  };

  const deleteContact = async (id: number, authToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Token': authToken
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete contact');
      
      toast({ title: 'Успешно', description: 'Контакт удалён' });
      return true;
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить контакт', variant: 'destructive' });
      return false;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string, authToken: string): Promise<boolean> => {
    toast({ title: 'Информация', description: 'Смена пароля временно недоступна' });
    return false;
  };

  const updateSettings = async (settings: PageSettings, authToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) throw new Error('Failed to update settings');
      
      toast({ title: 'Успешно', description: 'Настройки сохранены' });
      return true;
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки', variant: 'destructive' });
      return false;
    }
  };

  const updateContactsOrder = async (contacts: Contact[], authToken: string): Promise<void> => {
    try {
      const promises = contacts.map((contact, index) => 
        fetch(`${API_BASE_URL}/contacts`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': authToken
          },
          body: JSON.stringify({ ...contact, display_order: index + 1 })
        })
      );
      
      await Promise.all(promises);
      toast({ title: 'Успешно', description: 'Порядок обновлён' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить порядок', variant: 'destructive' });
      throw error;
    }
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
