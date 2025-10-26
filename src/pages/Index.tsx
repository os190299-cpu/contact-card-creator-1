import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface Contact {
  id: number;
  title: string;
  username: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

const Index = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/aae2a894-b17c-467a-a389-439f259b682a?action=get-contacts');
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openTelegram = (username: string) => {
    window.open(`https://t.me/${username}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-200 rounded-full"></div>
          <div className="h-4 w-32 bg-blue-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block p-4 bg-blue-500 rounded-full mb-6 shadow-lg animate-scale-in">
            <Icon name="MessageCircle" size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Мои Контакты
          </h1>
          <p className="text-gray-600 text-lg">
            Выберите удобный способ связи
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {contacts.map((contact, index) => (
            <Card
              key={contact.id}
              className="p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group animate-slide-up border-2 border-transparent hover:border-blue-200"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
              onClick={() => openTelegram(contact.username)}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-md"
                  style={{ backgroundColor: contact.color }}
                >
                  <Icon 
                    name={contact.icon as any} 
                    size={32} 
                    className="text-white"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2 text-gray-800 group-hover:text-blue-600 transition-colors">
                    {contact.title}
                  </h3>
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                    {contact.description}
                  </p>
                  <div className="flex items-center gap-2 text-blue-500 font-medium group-hover:gap-3 transition-all">
                    <Icon name="Send" size={18} />
                    <span>@{contact.username}</span>
                    <Icon 
                      name="ArrowRight" 
                      size={18} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {contacts.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <Icon name="Inbox" size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Контакты пока не добавлены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;