import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface PageHeaderProps {
  mainTitle: string;
  mainDescription: string;
  isAdminMode: boolean;
  onLoginClick: () => void;
  onSettingsClick: () => void;
  onPasswordClick: () => void;
  onLogoutClick: () => void;
}

export default function PageHeader({
  mainTitle,
  mainDescription,
  isAdminMode,
  onLoginClick,
  onSettingsClick,
  onPasswordClick,
  onLogoutClick
}: PageHeaderProps) {
  return (
    <div className="relative mb-12 animate-fade-in">
      <div className="text-center">
        <h1 className="text-6xl font-black text-white drop-shadow-2xl mb-3" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>
          {mainTitle}
        </h1>
        <p className="text-white/90 text-lg font-medium drop-shadow-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {mainDescription}
        </p>
      </div>
      <div className="absolute top-12 right-4">
        {!isAdminMode ? (
          <Button 
            onClick={onLoginClick}
            variant="outline"
            className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
          >
            <Icon name="Lock" className="mr-2" size={18} />
            Войти
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={onSettingsClick}
              variant="outline"
              className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
            >
              <Icon name="Settings" className="mr-2" size={18} />
              Настройки
            </Button>
            <Button 
              onClick={onPasswordClick}
              variant="outline"
              className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
            >
              <Icon name="Key" className="mr-2" size={18} />
              Пароль
            </Button>
            <Button 
              onClick={onLogoutClick}
              variant="outline"
              className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
            >
              <Icon name="LogOut" className="mr-2" size={18} />
              Выход
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
