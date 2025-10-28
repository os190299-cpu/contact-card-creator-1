import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AuditLog {
  id: number;
  admin_username: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    
    if (!token || role !== 'superadmin') {
      navigate('/auth/secure-login-portal');
      return;
    }
    
    fetchLogs();
  }, [navigate]);

  useEffect(() => {
    let filtered = logs;
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.admin_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.action_type === filterType);
    }
    
    setFilteredLogs(filtered);
  }, [searchTerm, filterType, logs]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/audit/logs', {
        headers: { 'X-Auth-Token': token || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setFilteredLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'login': return 'LogIn';
      case 'logout': return 'LogOut';
      case 'create_user': return 'UserPlus';
      case 'delete_user': return 'UserMinus';
      case 'update_user': return 'UserCog';
      case 'create_contact': return 'FilePlus';
      case 'update_contact': return 'FileEdit';
      case 'delete_contact': return 'FileX';
      case 'change_password': return 'Key';
      default: return 'Activity';
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'login': return 'text-green-600';
      case 'logout': return 'text-gray-600';
      case 'create_user':
      case 'create_contact': return 'text-blue-600';
      case 'update_user':
      case 'update_contact': return 'text-yellow-600';
      case 'delete_user':
      case 'delete_contact': return 'text-red-600';
      case 'change_password': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'login': 'Вход в систему',
      'logout': 'Выход из системы',
      'create_user': 'Создание пользователя',
      'delete_user': 'Удаление пользователя',
      'update_user': 'Изменение пользователя',
      'create_contact': 'Добавление контакта',
      'update_contact': 'Изменение контакта',
      'delete_contact': 'Удаление контакта',
      'change_password': 'Смена пароля',
      'reorder_contacts': 'Изменение порядка контактов'
    };
    return labels[actionType] || actionType;
  };

  const actionTypes = [
    { value: 'all', label: 'Все действия' },
    { value: 'login', label: 'Входы' },
    { value: 'create_user', label: 'Создание' },
    { value: 'update_user', label: 'Изменения' },
    { value: 'delete_user', label: 'Удаления' },
    { value: 'create_contact', label: 'Контакты' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Журнал действий</h1>
            <p className="text-slate-300">Мониторинг активности администраторов</p>
          </div>
          
          <Button onClick={() => navigate('/admin')} variant="outline">
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>
        </div>

        <Card className="p-6 mb-6 bg-white/95 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Поиск по админу, действию или деталям..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {actionTypes.map(type => (
                <Button
                  key={type.value}
                  size="sm"
                  variant={filterType === type.value ? "default" : "outline"}
                  onClick={() => setFilterType(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <Card className="p-8 text-center bg-white/95 backdrop-blur">
              <Icon name="FileSearch" size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all' 
                  ? 'Записи не найдены' 
                  : 'Журнал действий пуст'}
              </p>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="p-4 bg-white/95 backdrop-blur hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gray-100 ${getActionColor(log.action_type)}`}>
                    <Icon name={getActionIcon(log.action_type) as any} size={24} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {getActionLabel(log.action_type)}
                      </h3>
                      <span className="text-sm text-gray-500">
                        • {format(new Date(log.created_at), 'dd MMMM yyyy, HH:mm:ss', { locale: ru })}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Icon name="User" size={14} />
                        <span className="font-medium">{log.admin_username}</span>
                      </div>
                      
                      {log.ip_address && (
                        <div className="flex items-center gap-1">
                          <Icon name="Globe" size={14} />
                          <span>{log.ip_address}</span>
                        </div>
                      )}
                      
                      {log.target_type && (
                        <div className="flex items-center gap-1">
                          <Icon name="Target" size={14} />
                          <span>{log.target_type}: {log.target_id}</span>
                        </div>
                      )}
                    </div>

                    {log.details && (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="mt-6 text-center text-sm text-slate-300">
          Всего записей: {filteredLogs.length} {searchTerm || filterType !== 'all' ? `из ${logs.length}` : ''}
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
