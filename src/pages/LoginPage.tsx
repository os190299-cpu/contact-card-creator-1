import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContactsApi } from '@/hooks/useContactsApi';
import Icon from '@/components/ui/icon';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const api = useContactsApi();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(username, password);
      if (result.success && result.token) {
        localStorage.setItem('auth_token', result.token);
        if (result.role) {
          localStorage.setItem('user_role', result.role);
        }
        navigate('/');
      } else {
        setError('Неверный логин или пароль');
      }
    } catch (err) {
      setError('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Icon name="Lock" size={48} className="text-purple-500" />
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Защищенный вход
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-gray-300">Логин</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите логин"
                required
                className="bg-gray-700 border-gray-600 text-white"
                autoComplete="username"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-300">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                className="bg-gray-700 border-gray-600 text-white"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
          <div className="mt-6 pt-4 border-t border-gray-700">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="w-full text-gray-400 hover:text-white"
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Вернуться на сайт
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
