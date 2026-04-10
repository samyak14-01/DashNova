import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Users, BarChart3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export default function DashboardCard({ dashboard, isOwner, onDelete, index }) {
  const collabCount = (dashboard.collaborators || []).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/dashboard/${dashboard.id}`}>
        <Card className="group relative overflow-hidden border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer">
          {/* Gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {dashboard.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dashboard.updated_date
                      ? format(new Date(dashboard.updated_date), 'MMM d, yyyy')
                      : 'Just created'}
                  </p>
                </div>
              </div>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.preventDefault()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive gap-2 cursor-pointer"
                      onClick={e => { e.preventDefault(); onDelete(dashboard.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {dashboard.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{dashboard.description}</p>
            )}

            <div className="flex items-center gap-2">
              {collabCount > 0 && (
                <Badge variant="secondary" className="text-[10px] gap-1 px-2">
                  <Users className="w-3 h-3" />
                  {collabCount}
                </Badge>
              )}
              {!isOwner && (
                <Badge variant="secondary" className="text-[10px] px-2">Shared</Badge>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}