import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface ChatUser {
  id: number;
  username: string;
  is_banned: boolean;
  created_at: string;
  telegram_username?: string;
}

const ChatUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    
    if (!token || role !== 'superadmin') {
      toast({
        title: 'Доступ запрещён',
        description: 'Только суперадминистратор может управлять чатом',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://functions.poehali.dev/94e458f4-39f1-49d8-a16c-303d025747b9', {
        headers: {
          'X-Auth-Token': token || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить пользователей',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBan = async (userId: number, currentBanStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://functions.poehali.dev/1c283fc4-7265-4add-8063-9f9ff962c018', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || '',
        },
        body: JSON.stringify({
          user_id: userId,
          action: currentBanStatus ? 'unban' : 'ban',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: currentBanStatus ? 'Пользователь разблокирован' : 'Пользователь заблокирован',
        });
        loadUsers();
      } else {
        const data = await response.json();
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось выполнить операцию',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Icon name="ArrowLeft" size={20} />
              Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Управление пользователями чата</h1>
              <p className="text-gray-600 mt-1">Просмотр и модерация пользователей</p>
            </div>
          </div>
          <Button
            onClick={loadUsers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Icon name="RefreshCw" size={20} />
            Обновить
          </Button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Icon name="Loader2" size={48} className="mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Загрузка пользователей...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Icon name="Users" size={48} className="mx-auto mb-4 opacity-30 text-gray-400" />
            <p className="text-gray-600">Пока нет зарегистрированных пользователей</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Логин</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Telegram</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Дата регистрации</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Статус</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.telegram_username ? (
                        <span className="flex items-center gap-1">
                          <Icon name="Send" size={14} />
                          @{user.telegram_username}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          <Icon name="Ban" size={14} />
                          Заблокирован
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <Icon name="CheckCircle" size={14} />
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => handleToggleBan(user.id, user.is_banned)}
                        variant={user.is_banned ? 'outline' : 'destructive'}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Icon name={user.is_banned ? 'CheckCircle' : 'Ban'} size={16} />
                        {user.is_banned ? 'Разблокировать' : 'Заблокировать'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatUsersPage;