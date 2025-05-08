import { z } from "zod";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Введите корректный email адрес" }),
  password: z.string().min(6, { message: "Пароль должен содержать минимум 6 символов" }),
  rememberMe: z.boolean().optional().default(false),
});

// Registration form schema
const registerSchema = z.object({
  firstName: z.string().min(2, { message: "Имя должно содержать минимум 2 символа" }),
  lastName: z.string().min(2, { message: "Фамилия должна содержать минимум 2 символа" }),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  password: z.string().min(6, { message: "Пароль должен содержать минимум 6 символов" }),
  confirmPassword: z.string().min(6, { message: "Пароль должен содержать минимум 6 символов" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

// Reset password schema
const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Введите корректный email адрес" }),
});

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation, resetPasswordMutation } = useAuth();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate({
      email: values.email,
      password: values.password,
    });
  }

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
  }

  // Reset password form
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  function onResetPasswordSubmit(values: z.infer<typeof resetPasswordSchema>) {
    resetPasswordMutation.mutate(values, {
      onSuccess: () => {
        setIsResetDialogOpen(false);
        resetPasswordForm.reset();
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50">
      {/* Left Column: Auth Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Tabs defaultValue="login" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>
          
          {/* Login Form */}
          <TabsContent value="login">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Вход в кабинет</CardTitle>
                <CardDescription className="text-center">
                  Введите свои данные для входа в личный кабинет
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Пароль</FormLabel>
                            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                              <DialogTrigger asChild>
                                <Button variant="link" className="p-0 h-auto text-sm">
                                  Забыли пароль?
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Восстановление пароля</DialogTitle>
                                  <DialogDescription>
                                    Введите email, указанный при регистрации. Мы отправим на него инструкцию по восстановлению пароля.
                                  </DialogDescription>
                                </DialogHeader>
                                <Form {...resetPasswordForm}>
                                  <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}>
                                    <FormField
                                      control={resetPasswordForm.control}
                                      name="email"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Email</FormLabel>
                                          <FormControl>
                                            <Input placeholder="your@email.com" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <DialogFooter className="mt-4">
                                      <Button 
                                        type="submit" 
                                        disabled={resetPasswordMutation.isPending}
                                      >
                                        {resetPasswordMutation.isPending && (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Отправить
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </Form>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm cursor-pointer">
                            Запомнить меня
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Войти
                    </Button>
                  </form>
                </Form>
              </CardContent>
              
              <CardFooter className="justify-center">
                <p className="text-sm text-neutral-500">
                  Нет аккаунта? <TabsTrigger value="register" className="text-primary underline px-0">Зарегистрируйтесь</TabsTrigger>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Register Form */}
          <TabsContent value="register">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Регистрация</CardTitle>
                <CardDescription className="text-center">
                  Создайте учетную запись для доступа к личному кабинету
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Имя</FormLabel>
                            <FormControl>
                              <Input placeholder="Иван" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Фамилия</FormLabel>
                            <FormControl>
                              <Input placeholder="Петров" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пароль</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Подтверждение пароля</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Зарегистрироваться
                    </Button>
                  </form>
                </Form>
              </CardContent>
              
              <CardFooter className="justify-center">
                <p className="text-sm text-neutral-500">
                  Уже есть аккаунт? <TabsTrigger value="login" className="text-primary underline px-0">Войдите</TabsTrigger>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right Column: Hero Section */}
      <div className="w-full md:w-1/2 bg-primary text-white p-8 flex items-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-heading mb-4">
            Личный кабинет клиента веб-студии
          </h1>
          
          <p className="text-lg mb-6 opacity-90">
            Отслеживайте статус проектов, ставьте задачи и общайтесь с командой разработки в удобном интерфейсе.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <span className="material-icons">visibility</span>
              </div>
              <div>
                <h3 className="font-medium text-lg">Прозрачность процесса</h3>
                <p className="opacity-80">Наблюдайте за каждым этапом работы в режиме реального времени</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <span className="material-icons">sync</span>
              </div>
              <div>
                <h3 className="font-medium text-lg">Эффективная коммуникация</h3>
                <p className="opacity-80">Обсуждайте детали проекта напрямую с вашим менеджером</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <span className="material-icons">task_alt</span>
              </div>
              <div>
                <h3 className="font-medium text-lg">Управление задачами</h3>
                <p className="opacity-80">Создавайте и отслеживайте задачи, получайте уведомления о статусе</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
