"use client";

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { User } from '@/types';

interface ProfileCardProps {
  user: User;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-col items-center gap-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src="/placeholder.svg" alt="Photo de profil" />
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
            {user.first_name ? user.first_name.charAt(0) : 'U'}
            {user.last_name ? user.last_name.charAt(0) : ''}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <CardTitle className="text-2xl font-bold">
            {user.first_name} {user.last_name}
          </CardTitle>
          <Badge
            variant={
              user.role === 'Superadmin' ? 'default' :
              user.role === 'ASL' ? 'secondary' :
              user.role === 'En attente' ? 'outline' : 'default'
            }
            className="mt-2"
          >
            {user.role.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.username}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Copropriété</p>
            <p className="font-medium">{user.copro || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Statut</p>
            <p className="font-medium">{user.actif ? 'Actif' : 'Inactif'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;