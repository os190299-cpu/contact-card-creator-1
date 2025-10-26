import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Contact } from '@/components/EditContactDialog';
import { PageSettings } from '@/components/PageSettingsDialog';

const API_URL = 'https://functions.poehali.dev/aae2a894-b17c-467a-a389-439f259b682a';

export function useContactsApi() {
  const { toast } = useToast();

  const fetchContacts = async (): Promise<Contact[]> => {
    try {
      const res = await fetch(`${API_URL}?action=get-contacts`);
      const data = await res.json();
      return data.contacts || [];
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить контакты', variant: 'destructive' });
      return [];
    }
  };

  const fetchPageSettings = async (): Promise<PageSettings | null> => {
    try {
      const res = await fetch(`${API_URL}?action=get-settings`);
      const data = await res.json();
      return data.settings || null;
    } catch (error) {
      return null;
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; token?: string; role?: string }> => {
    try {
      const res = await fetch(`${API_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.role) {
          localStorage.setItem('user_role', data.role);
        }
        toast({ title: 'Успешно', description: 'Вы вошли в систему' });
        return { success: true, token: data.token, role: data.role };
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Неверные данные', variant: 'destructive' });
        return { success: false };
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
      return { success: false };
    }
  };

  const updateContact = async (contact: Contact, authToken: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}?action=update-contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify(contact)
      });

      if (res.ok) {
        toast({ title: 'Успешно', description: 'Контакт обновлён' });
        return true;
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось обновить', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
      return false;
    }
  };

  const addContact = async (newContact: Partial<Contact>, authToken: string): Promise<boolean> => {
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
        toast({ title: 'Успешно', description: 'Контакт добавлен' });
        return true;
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось добавить', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
      return false;
    }
  };

  const deleteContact = async (id: number, authToken: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}?action=delete-contact&id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': authToken }
      });

      if (res.ok) {
        toast({ title: 'Успешно', description: 'Контакт удалён' });
        return true;
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
      return false;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string, authToken: string): Promise<boolean> => {
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
        toast({ title: 'Успешно', description: 'Пароль изменён' });
        return true;
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось изменить пароль', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
      return false;
    }
  };

  const updateSettings = async (settings: PageSettings, authToken: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}?action=update-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        toast({ title: 'Успешно', description: 'Настройки сохранены' });
        return true;
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось сохранить', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Проблема с подключением', variant: 'destructive' });
      return false;
    }
  };

  const updateContactsOrder = async (contacts: Contact[], authToken: string): Promise<void> => {
    try {
      for (let i = 0; i < contacts.length; i++) {
        await fetch(`${API_URL}?action=update-contact`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': authToken
          },
          body: JSON.stringify({ id: contacts[i].id, display_order: i + 1 })
        });
      }
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