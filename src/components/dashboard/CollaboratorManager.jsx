import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, X, Crown, Pencil, Eye } from 'lucide-react';

const ROLE_ICONS = {
  admin: Crown,
  editor: Pencil,
  viewer: Eye,
};

const ROLE_COLORS = {
  admin: 'bg-primary/10 text-primary',
  editor: 'bg-accent/10 text-accent',
  viewer: 'bg-muted text-muted-foreground',
};

export default function CollaboratorManager({ dashboard, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');

  const collaborators = dashboard?.collaborators || [];

  const handleAdd = () => {
    if (!email.trim()) return;
    const updated = [...collaborators.filter(c => c.email !== email), { email: email.trim(), role }];
    onUpdate({ collaborators: updated });
    setEmail('');
  };

  const handleRemove = (emailToRemove) => {
    const updated = collaborators.filter(c => c.email !== emailToRemove);
    onUpdate({ collaborators: updated });
  };

  const handleRoleChange = (emailToUpdate, newRole) => {
    const updated = collaborators.map(c => c.email === emailToUpdate ? { ...c, role: newRole } : c);
    onUpdate({ collaborators: updated });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Collaborators</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add collaborator */}
          <div className="flex gap-2">
            <Input
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} size="icon">
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {(dashboard?.owner_email || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium">{dashboard?.owner_email}</span>
              </div>
              <Badge className="bg-primary/10 text-primary text-xs">Owner</Badge>
            </div>

            {/* Collaborators list */}
            {collaborators.map(c => {
              const RoleIcon = ROLE_ICONS[c.role] || Eye;
              return (
                <div key={c.email} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                      {c.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={c.role} onValueChange={v => handleRoleChange(c.email, v)}>
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(c.email)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}