"use client";

import { useState } from 'react';
import ProfileCard from '@/components/ProfileCard';
import EditProfileForm from '@/components/EditProfileForm';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('view');
  const [updatedUser, setUpdatedUser] = useState(user);

  if (!user) {
    return <div className="text-center py-8">Chargement du profil...</div>;
  }

  const handleUpdate = (newUser: any) => {
    setUpdatedUser(newUser);
    setActiveTab('view');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Mon Profil</h1>
        {activeTab === 'view' && (
          <Button onClick={() => setActiveTab('edit')} className="rounded-full">
            Modifier le profil
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="view">Voir le profil</TabsTrigger>
          <TabsTrigger value="edit">Modifier le profil</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <ProfileCard user={updatedUser} />
        </TabsContent>

        <TabsContent value="edit">
          <EditProfileForm user={updatedUser} onUpdate={handleUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;