import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id?: number;
  username: string;
  role: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function UsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'X-Auth-Token': token || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось загрузить пользователей', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка подключения к серверу', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;

    setCreating(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          role: 'admin'
        })
      });
      
      if (response.ok) {
        setNewUsername('');
        setNewPassword('');
        await fetchUsers();
        toast({ title: 'Успешно', description: 'Пользователь создан' });
      } else {
        const error = await response.json();
        toast({ 
          title: 'Ошибка', 
          description: error.error || 'Не удалось создать пользователя', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка подключения к серверу', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Удалить пользователя ${username}?`)) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Token': token || ''
        }
      });
      
      if (response.ok) {
        await fetchUsers();
        toast({ title: 'Успешно', description: 'Пользователь удалён' });
      } else {
        const error = await response.json();
        toast({ 
          title: 'Ошибка', 
          description: error.error || 'Не удалось удалить пользователя', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка подключения к серверу', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <Icon name="ArrowLeft" size={20} className="mr-2" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold text-white">Управление пользователями</h1>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            <Icon name="LogOut" size={20} className="mr-2" />
            Выйти
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Создать нового пользователя</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="username">Имя пользователя</Label>
                  <Input
                    id="username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="admin2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? 'Создание...' : 'Создать пользователя'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Список пользователей ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{user.username}</div>
                      <div className="text-sm text-gray-600">
                        {user.role === 'superadmin' ? '👑 Супер-админ' : '👤 Админ'}
                      </div>
                    </div>
                    {user.role !== 'superadmin' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.username)}
                      >
                        <Icon name="Trash2" size={16} className="mr-1" />
                        Удалить
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}