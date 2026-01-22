"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Home, Edit, Save, X, Upload } from 'lucide-react';

const Profile = () => {
  const { user, loading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Update editedUser when user data changes
  React.useEffect(() => {
    if (user) {
      setEditedUser({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      setEditedUser({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_informations')
        .update({
          first_name: editedUser.first_name,
          last_name: editedUser.last_name
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });

      await refreshUserProfile();
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour du profil.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload the file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `profile_photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Update the user's profile with the photo URL
      const { error: updateError } = await supabase
        .from('user_informations')
        .update({
          avatar_url: publicUrl
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: "Photo de profil mise à jour",
        description: "Votre photo de profil a été mise à jour avec succès.",
      });

      await refreshUserProfile();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du téléchargement de la photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Utilisateur non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-6">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Mon Profil</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/')}
          className="rounded-full"
          title="Retour à l'accueil"
        >
          <Home className="h-5 w-5 text-primary hover:text-primary/80" />
        </Button>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20 md:w-24 md:h-24">
              <AvatarImage
                src={(user as any).avatar_url || "/placeholder.svg"}
                alt="Photo de profil"
              />
              <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground md:text-2xl">
                {user.first_name ? user.first_name.charAt(0) : 'U'}
                {user.last_name ? user.last_name.charAt(0) : ''}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="icon"
              className="absolute -bottom-2 -right-2 rounded-full bg-background border-border"
              onClick={() => document.getElementById('photo-upload')?.click()}
              disabled={isUploading}
              title="Changer la photo de profil"
            >
              <Upload className="h-4 w-4" />
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </Button>
          </div>
          <div className="text-center">
            <CardTitle className="text-xl font-bold md:text-2xl">
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
              <p className="font-medium text-sm md:text-base">{user.username}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Copropriété</p>
              <p className="font-medium text-sm md:text-base">{user.copro || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="font-medium text-sm md:text-base">{user.actif ? 'Actif' : 'Inactif'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-base font-semibold mb-4 md:text-lg">Informations personnelles</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="first_name" className="text-sm font-medium text-muted-foreground">Prénom</Label>
                <Input
                  id="first_name"
                  value={editedUser.first_name}
                  onChange={(e) => setEditedUser({...editedUser, first_name: e.target.value})}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-sm font-medium text-muted-foreground">Nom</Label>
                <Input
                  id="last_name"
                  value={editedUser.last_name}
                  onChange={(e) => setEditedUser({...editedUser, last_name: e.target.value})}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              {!isEditing ? (
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="rounded-full px-3 py-1 text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="rounded-full px-3 py-1 text-sm"
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="rounded-full px-3 py-1 text-sm"
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;