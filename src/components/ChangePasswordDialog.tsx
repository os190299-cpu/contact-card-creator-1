import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  oldPassword: string;
  setOldPassword: (password: string) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  onChangePassword: () => void;
}

export default function ChangePasswordDialog({
  isOpen,
  onOpenChange,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  onChangePassword
}: ChangePasswordDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Изменить пароль
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="old-password">Старый пароль</Label>
            <Input 
              id="old-password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-password">Новый пароль</Label>
            <Input 
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button 
            onClick={onChangePassword}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Изменить пароль
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
