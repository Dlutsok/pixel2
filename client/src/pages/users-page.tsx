import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  MoreVertical,
  User,
  Shield,
  Building,
  MoreHorizontal,
  Check,
  X,
} from "lucide-react";

// Импортируем Layout из наших компонентов
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Схема для создания нового пользователя
const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email обязателен")
    .email("Введите правильный email"),
  password: z
    .string()
    .min(6, "Пароль должен содержать минимум 6 символов"),
  firstName: z
    .string()
    .min(1, "Имя обязательно"),
  lastName: z
    .string()
    .min(1, "Фамилия обязательна"),
  role: z
    .string()
    .min(1, "Роль обязательна"),
  company: z
    .string()
    .optional(),
  phone: z
    .string()
    .optional(),
});

// Схема для изменения пользователя (без пароля)
const updateUserSchema = z.object({
  id: z.number(),
  email: z
    .string()
    .min(1, "Email обязателен")
    .email("Введите правильный email"),
  firstName: z
    .string()
    .min(1, "Имя обязательно"),
  lastName: z
    .string()
    .min(1, "Фамилия обязательна"),
  role: z
    .string()
    .min(1, "Роль обязательна"),
  company: z
    .string()
    .optional(),
  phone: z
    .string()
    .optional(),
});

// Схема для изменения пароля
const changePasswordSchema = z.object({
  id: z.number(),
  password: z
    .string()
    .min(6, "Пароль должен содержать минимум 6 символов"),
});

type CreateUserValues = z.infer<typeof createUserSchema>;
type UpdateUserValues = z.infer<typeof updateUserSchema>;
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UpdateUserValues | null>(null);
  const [changingPasswordForUserId, setChangingPasswordForUserId] = useState<number | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<number | null>(null);

  // Проверка, является ли пользователь администратором
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-neutral-50 flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="p-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <h2 className="text-xl font-bold mb-2">Нет доступа</h2>
                <p className="mb-4">Управление пользователями доступно только администраторам.</p>
                <Button onClick={() => window.history.back()}>Вернуться назад</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Получение списка пользователей
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) {
        throw new Error("Не удалось загрузить пользователей");
      }
      return res.json();
    },
  });

  // Мутация для создания пользователя
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserValues) => {
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCreateDialog(false);
      toast({
        title: "Пользователь создан",
        description: "Новый пользователь успешно добавлен в систему.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при создании пользователя",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Мутация для обновления пользователя
  const updateUserMutation = useMutation({
    mutationFn: async (data: UpdateUserValues) => {
      const res = await apiRequest("PATCH", `/api/users/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "Пользователь обновлен",
        description: "Данные пользователя успешно обновлены.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при обновлении пользователя",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Мутация для изменения пароля пользователя
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordValues) => {
      const res = await apiRequest("PATCH", `/api/users/${data.id}/password`, {
        password: data.password,
      });
      return await res.json();
    },
    onSuccess: () => {
      setChangingPasswordForUserId(null);
      toast({
        title: "Пароль изменен",
        description: "Пароль пользователя успешно обновлен.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при изменении пароля",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Мутация для удаления пользователя
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setConfirmDeleteUserId(null);
      toast({
        title: "Пользователь удален",
        description: "Пользователь был успешно удален из системы.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при удалении пользователя",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Инициализация формы для создания пользователя
  const createForm = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "client",
      company: "",
      phone: "",
    },
  });

  // Инициализация формы для редактирования пользователя
  const editForm = useForm<UpdateUserValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: 0,
      email: "",
      firstName: "",
      lastName: "",
      role: "client",
      company: "",
      phone: "",
    },
  });

  // Инициализация формы для изменения пароля
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      id: 0,
      password: "",
    },
  });

  // Обработчик создания пользователя
  const handleCreateUser = (values: CreateUserValues) => {
    createUserMutation.mutate(values);
  };

  // Обработчик обновления пользователя
  const handleUpdateUser = (values: UpdateUserValues) => {
    updateUserMutation.mutate(values);
  };

  // Обработчик изменения пароля
  const handleChangePassword = (values: ChangePasswordValues) => {
    changePasswordMutation.mutate(values);
  };

  // Обработчик редактирования пользователя (открытие диалога)
  const handleEditUser = (userData: any) => {
    const userToEdit: UpdateUserValues = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      company: userData.company || "",
      phone: userData.phone || "",
    };
    
    editForm.reset(userToEdit);
    setEditingUser(userToEdit);
  };

  // Обработчик открытия диалога изменения пароля
  const handleOpenChangePassword = (userId: number) => {
    passwordForm.reset({
      id: userId,
      password: "",
    });
    setChangingPasswordForUserId(userId);
  };

  // Функция для фильтрации пользователей по табу и поиску
  const filteredUsers = users.filter((user: any) => {
    // Фильтрация по табу
    if (currentTab !== "all" && user.role !== currentTab) {
      return false;
    }
    
    // Фильтрация по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.company && user.company.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Обработчик выбора/снятия выбора со всех пользователей
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(filteredUsers.map((user: any) => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  // Обработчик выбора/снятия выбора с одного пользователя
  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  // Функция для отображения бейджа роли
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500">Администратор</Badge>;
      case "manager":
        return <Badge className="bg-amber-500">Менеджер</Badge>;
      case "client":
        return <Badge className="bg-blue-500">Клиент</Badge>;
      default:
        return <Badge className="bg-neutral-500">{role}</Badge>;
    }
  };

  // Определение инициалов пользователя для аватара
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold font-heading">Управление пользователями</h1>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Создать пользователя
              </Button>
            </div>
            <p className="text-neutral-500">
              Управляйте аккаунтами пользователей, меняйте их роли и создавайте новых пользователей.
            </p>
          </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  className="pl-8"
                  placeholder="Поиск пользователей..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                  <TabsTrigger value="all">Все</TabsTrigger>
                  <TabsTrigger value="client">Клиенты</TabsTrigger>
                  <TabsTrigger value="manager">Менеджеры</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">
                Ошибка при загрузке пользователей
              </div>
            ) : filteredUsers.length > 0 ? (
              <div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedUserIds.length > 0 &&
                              selectedUserIds.length === filteredUsers.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Контакты</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userData: any) => (
                        <TableRow key={userData.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUserIds.includes(userData.id)}
                              onCheckedChange={(checked) =>
                                handleSelectUser(userData.id, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {getUserInitials(userData.firstName, userData.lastName)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {userData.firstName} {userData.lastName}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {userData.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {renderRoleBadge(userData.role)}
                            {userData.company && (
                              <div className="text-xs text-neutral-500 mt-1">
                                {userData.company}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {userData.phone ? (
                              <div className="text-sm">{userData.phone}</div>
                            ) : (
                              <div className="text-xs text-neutral-500">Не указан</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditUser(userData)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Редактировать
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenChangePassword(userData.id)}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Изменить пароль
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setConfirmDeleteUserId(userData.id)}
                                  className="text-red-500 focus:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Удалить
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-neutral-500">
                    Показано {filteredUsers.length} из {users.length} пользователей
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive>
                          1
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext href="#" />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                  <User className="h-6 w-6 text-neutral-500" />
                </div>
                <h3 className="text-lg font-medium mb-1">Пользователи не найдены</h3>
                <p className="text-neutral-500 text-sm mb-4">
                  {searchQuery
                    ? `Нет результатов для "${searchQuery}"`
                    : "В системе нет пользователей с выбранной ролью"}
                </p>
                <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Создать пользователя
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Диалог создания пользователя */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Создание нового пользователя</DialogTitle>
              <DialogDescription>
                Заполните информацию для создания нового аккаунта пользователя
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(handleCreateUser)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Иван" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фамилия*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Петров" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="user@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль*</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Минимум 6 символов" autoComplete="current-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Роль*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите роль" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="client">Клиент</SelectItem>
                          <SelectItem value="manager">Менеджер</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Компания</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ООО «Компания»" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+7 (999) 123-45-67" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? "Создание..." : "Создать пользователя"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Диалог редактирования пользователя */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Редактирование пользователя</DialogTitle>
              <DialogDescription>
                Обновите информацию о пользователе
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleUpdateUser)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фамилия*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Роль*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите роль" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="client">Клиент</SelectItem>
                          <SelectItem value="manager">Менеджер</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Компания</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setEditingUser(null)}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Диалог изменения пароля */}
        <Dialog
          open={!!changingPasswordForUserId}
          onOpenChange={(open) => !open && setChangingPasswordForUserId(null)}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Изменение пароля</DialogTitle>
              <DialogDescription>
                Введите новый пароль для пользователя
              </DialogDescription>
            </DialogHeader>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(handleChangePassword)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Новый пароль*</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Минимум 6 символов" autoComplete="current-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setChangingPasswordForUserId(null)}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending
                      ? "Изменение..."
                      : "Изменить пароль"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Диалог подтверждения удаления пользователя */}
        <Dialog
          open={!!confirmDeleteUserId}
          onOpenChange={(open) => !open && setConfirmDeleteUserId(null)}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Удаление пользователя</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteUserId(null)}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmDeleteUserId && deleteUserMutation.mutate(confirmDeleteUserId)}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Удаление..." : "Удалить"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  );
}