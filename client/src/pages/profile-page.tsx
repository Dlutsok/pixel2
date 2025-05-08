import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout/layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { User, Edit, Key, Mail, Phone, Building, ExternalLink } from "lucide-react";

// Profile form schema
const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "Имя должно содержать минимум 2 символа",
  }),
  lastName: z.string().min(2, {
    message: "Фамилия должна содержать минимум 2 символа",
  }),
  email: z.string().email({
    message: "Пожалуйста, введите корректный email",
  }),
  company: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Текущий пароль должен содержать минимум 6 символов",
  }),
  newPassword: z.string().min(6, {
    message: "Новый пароль должен содержать минимум 6 символов",
  }),
  confirmPassword: z.string().min(6, {
    message: "Подтверждение пароля должно содержать минимум 6 символов",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Профиль обновлен",
        description: "Ваш профиль был успешно обновлен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка при обновлении профиля",
        description: error.message || "Что-то пошло не так",
        variant: "destructive",
      });
    },
  });
  
  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("POST", "/api/users/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Пароль обновлен",
        description: "Ваш пароль был успешно изменен",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка при обновлении пароля",
        description: error.message || "Что-то пошло не так",
        variant: "destructive",
      });
    },
  });
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      company: user?.company || "",
      position: user?.position || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  function onProfileSubmit(values: ProfileFormValues) {
    updateProfileMutation.mutate(values);
  }
  
  function onPasswordSubmit(values: PasswordFormValues) {
    updatePasswordMutation.mutate(values);
  }
  
  // Generate initials for avatar
  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase();
  };
  
  return (
    <Layout>
      <div className="p-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold font-heading">Профиль пользователя</h1>
          <p className="text-neutral-500">Управление персональной информацией и настройками</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="order-2 lg:order-1 lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList>
                <TabsTrigger value="profile">Профиль</TabsTrigger>
                <TabsTrigger value="security">Безопасность</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Информация профиля</CardTitle>
                    <CardDescription>
                      Управляйте вашей личной информацией и контактными данными
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Имя</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Фамилия</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="company"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Компания</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Не указано" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="position"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Должность</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Не указано" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Телефон</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Не указано" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>О себе</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Расскажите немного о себе..." 
                                    className="min-h-[100px]" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              type="button"
                              onClick={() => setIsEditing(false)}
                            >
                              Отмена
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={updateProfileMutation.isPending}
                            >
                              {updateProfileMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-neutral-500">Имя</Label>
                            <p className="font-medium">{user?.firstName || 'Не указано'}</p>
                          </div>
                          <div>
                            <Label className="text-neutral-500">Фамилия</Label>
                            <p className="font-medium">{user?.lastName || 'Не указано'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-neutral-500" />
                            <Label className="text-neutral-500">Email</Label>
                          </div>
                          <p className="font-medium">{user?.email}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-neutral-500" />
                              <Label className="text-neutral-500">Компания</Label>
                            </div>
                            <p className="font-medium">{user?.company || 'Не указано'}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-neutral-500" />
                              <Label className="text-neutral-500">Должность</Label>
                            </div>
                            <p className="font-medium">{user?.position || 'Не указано'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-neutral-500" />
                            <Label className="text-neutral-500">Телефон</Label>
                          </div>
                          <p className="font-medium">{user?.phone || 'Не указано'}</p>
                        </div>
                        
                        <div>
                          <Label className="text-neutral-500">О себе</Label>
                          <p className="font-medium">{user?.bio || 'Информация не указана'}</p>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => setIsEditing(true)}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Редактировать профиль</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Изменение пароля</CardTitle>
                    <CardDescription>
                      Обновите ваш пароль для повышения безопасности аккаунта
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Текущий пароль</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Новый пароль</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                Минимум 6 символов, используйте комбинацию букв, цифр и специальных символов
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Подтверждение пароля</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updatePasswordMutation.isPending}
                          >
                            {updatePasswordMutation.isPending ? "Обновление..." : "Обновить пароль"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="order-1 lg:order-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.avatarUrl || ""} alt={`${user?.firstName} ${user?.lastName}`} />
                    <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{user?.firstName} {user?.lastName}</h3>
                    <p className="text-neutral-500">{user?.email}</p>
                    {user?.position && user?.company && (
                      <p className="text-neutral-500">
                        {user.position}, {user.company}
                      </p>
                    )}
                  </div>
                  
                  <div className="w-full pt-4 border-t">
                    <div className="space-y-2">
                      <div className="text-neutral-500 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Роль: {user?.role === 'admin' ? 'Администратор' : 
                                    user?.role === 'manager' ? 'Менеджер' : 'Клиент'}</span>
                      </div>
                      <div className="text-neutral-500 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        <span>Аккаунт создан: {user?.createdAt ? 
                          new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Не известно'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}