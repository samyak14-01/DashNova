import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Check, Crown, Eye, Lock, Clock, Trash2 } from 'lucide-react';
import PresenceAvatars from './PresenceAvatars';
import WidgetToolbar from './WidgetToolbar';
import CollaboratorManager from './CollaboratorManager';
import ThemePicker from './ThemePicker';
import { useDeviceType } from '@/hooks/useDeviceType';

export default function DashboardHeader({
  dashboard,
  role,
  presences,
  myColor,
  userName,
  onUpdateDashboard,
  onAddWidget,
  onOpenVersionHistory,
  onOpenTrash,
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(dashboard?.title || '');
  const { isMobile } = useDeviceType();

  const canEdit = role === 'admin' || role === 'editor';
  const isAdmin = role === 'admin';
  const isViewer = role === 'viewer';

  const handleTitleSave = () => {
    setEditingTitle(false);
    if (title.trim() && title !== dashboard?.title) {
      onUpdateDashboard({ title: title.trim() });
    }
  };

  const roleBadge = {
    admin: { label: 'Admin', icon: Crown, className: 'bg-primary/10 text-primary' },
    editor: { label: 'Editor', icon: Pencil, className: 'bg-accent/10 text-accent' },
    viewer: { label: 'Viewer', icon: Eye, className: 'bg-muted text-muted-foreground' },
  };
  const rb = roleBadge[role] || roleBadge.viewer;
  const RoleIcon = rb.icon;

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b" style={{ paddingTop: 'var(--safe-area-top)' }}>
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 gap-2">

        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link to="/" className="flex-shrink-0">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          {editingTitle && isAdmin ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                className="h-8 font-semibold text-sm flex-1 min-w-0"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleTitleSave}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h1
                className={`text-base sm:text-lg font-bold tracking-tight truncate ${isAdmin ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                onClick={() => isAdmin && setEditingTitle(true)}
              >
                {dashboard?.title || 'Untitled Dashboard'}
              </h1>
              <Badge className={`${rb.className} gap-1 text-xs hidden sm:inline-flex flex-shrink-0`}>
                <RoleIcon className="w-3 h-3" />
                {rb.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {!isMobile && (
            <PresenceAvatars presences={presences} myColor={myColor} userName={userName} myRole={role} />
          )}

          {isViewer && !isMobile && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground font-medium">
              <Lock className="w-3 h-3" />
              View only
            </div>
          )}

          <ThemePicker />
          {isAdmin && (
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={onOpenVersionHistory} title="Version History">
              <Clock className="w-4 h-4" />
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={onOpenTrash} title="Trash">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {isAdmin && <CollaboratorManager dashboard={dashboard} onUpdate={onUpdateDashboard} />}
          {canEdit && <WidgetToolbar onAddWidget={onAddWidget} disabled={!canEdit} />}
        </div>
      </div>
    </div>
  );
}