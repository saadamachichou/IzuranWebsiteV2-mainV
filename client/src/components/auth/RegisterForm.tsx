import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLanguage } from "@/context/LanguageContext";

const registerFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    clearError();
    
    try {
      await register(
        values.username,
        values.email,
        values.password,
        values.confirmPassword,
        values.firstName,
        values.lastName
      );
      toast({
        title: t("register.success"),
        description: t("register.successDescription"),
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("register.error"),
        description: err.message || t("register.errorDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-md mx-auto bg-black/40 backdrop-blur-md rounded-xl border border-amber-500/20">
      <div>
        <h2 className="text-2xl font-bold text-center text-amber-300">{t("register.title")}</h2>
        <p className="text-amber-200/70 text-center mt-2">
          {t("register.subtitle")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">{t("register.username")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="yourusername"
                    {...field}
                    className="bg-black/60 border-amber-500/20 text-amber-200 placeholder:text-amber-200/50 focus:border-amber-500/50"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">{t("register.email")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="example@izuran.com"
                    {...field}
                    className="bg-black/60 border-amber-500/20 text-amber-200 placeholder:text-amber-200/50 focus:border-amber-500/50"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-300">{t("register.firstName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("register.firstNamePlaceholder")}
                      {...field}
                      className="bg-black/60 border-amber-500/20 text-amber-200 placeholder:text-amber-200/50 focus:border-amber-500/50"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-300">{t("register.lastName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("register.lastNamePlaceholder")}
                      {...field}
                      className="bg-black/60 border-amber-500/20 text-amber-200 placeholder:text-amber-200/50 focus:border-amber-500/50"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">{t("register.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-black/60 border-amber-500/20 text-amber-200 placeholder:text-amber-200/50 focus:border-amber-500/50"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">{t("register.confirmPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-black/60 border-amber-500/20 text-amber-200 placeholder:text-amber-200/50 focus:border-amber-500/50"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-black font-medium" disabled={isLoading}>
            {isLoading ? t("register.loading") : t("register.submit")}
          </Button>
        </form>
      </Form>
    </div>
  );
}