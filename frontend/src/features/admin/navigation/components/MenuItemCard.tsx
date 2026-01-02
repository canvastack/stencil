import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu } from '@/types/navigation';
import { Edit, Trash2, Plus, GripVertical, Eye, EyeOff } from 'lucide-react';

interface MenuItemCardProps {
  menu: Menu;
  level?: number;
  onEdit: (menu: Menu) => void;
  onDelete: (uuid: string) => void;
  onAddChild: (parentMenu: Menu) => void;
}

export const MenuItemCard = ({ menu, level = 0, onEdit, onDelete, onAddChild }: MenuItemCardProps) => {
  const hasChildren = menu.children && menu.children.length > 0;

  return (
    <div className={`${level > 0 ? 'ml-8 mt-2' : 'mt-2'}`}>
      <Card className={!menu.is_active ? 'opacity-60' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{menu.label}</h4>
                  {menu.badge_text && (
                    <Badge variant="secondary" style={{ backgroundColor: menu.badge_color || undefined }}>
                      {menu.badge_text}
                    </Badge>
                  )}
                  {!menu.is_visible && (
                    <Badge variant="outline" className="text-xs">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hidden
                    </Badge>
                  )}
                  {menu.requires_auth && (
                    <Badge variant="outline" className="text-xs">
                      Auth Required
                    </Badge>
                  )}
                </div>
                
                {menu.path && (
                  <p className="text-sm text-muted-foreground">
                    Path: <code className="bg-muted px-1 py-0.5 rounded">{menu.path}</code>
                  </p>
                )}
                
                {menu.description && (
                  <p className="text-sm text-muted-foreground">{menu.description}</p>
                )}
                
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Urutan: {menu.sort_order}</span>
                  {menu.show_in_header && <Badge variant="outline" className="text-xs">Header</Badge>}
                  {menu.show_in_footer && <Badge variant="outline" className="text-xs">Footer</Badge>}
                  {menu.show_in_mobile && <Badge variant="outline" className="text-xs">Mobile</Badge>}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => onAddChild(menu)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onEdit(menu)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(menu.uuid)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChildren && (
        <div className="mt-2 space-y-2">
          {menu.children!.map((child) => (
            <MenuItemCard
              key={child.uuid}
              menu={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};
