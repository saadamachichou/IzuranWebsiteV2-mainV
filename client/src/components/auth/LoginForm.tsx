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
import GoogleLoginButton from "./GoogleLoginButton";
import { Separator } from "@/components/ui/separator";

const loginFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    clearError();
    
    try {
      await login(values.email, values.password);
      toast({
        title: t("login.success"),
        description: t("login.successDescription"),
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("login.error"),
        description: err.message || t("login.errorDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-md mx-auto bg-black/40 backdrop-blur-md rounded-xl border border-amber-500/20">
      <div>
        <h2 className="text-2xl font-bold text-center text-amber-300">{t("login.title")}</h2>
        <p className="text-amber-200/70 text-center mt-2">
          {t("login.subtitle")}
        </p>
      </div>

      <GoogleLoginButton 
        onSuccess={onSuccess} 
        className="mb-4" 
      />

      <div className="relative mb-4">
        <Separator className="absolute top-1/2 w-full bg-amber-500/30" />
        <span className="relative z-10 block w-12 mx-auto text-center text-sm text-amber-200/60 bg-black px-2">
          {t("login.or")}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">{t("login.email")}</FormLabel>
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">{t("login.password")}</FormLabel>
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
            {isLoading ? t("login.loading") : t("login.submit")}
          </Button>
        </form>
      </Form>
    </div>
  );
}