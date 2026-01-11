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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function PasswordChangeForm() {
  const { changePassword, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, {
      message: t("settings.currentPasswordRequired"),
    }),
    newPassword: z.string().min(8, {
      message: t("settings.passwordMinLength"),
    }),
    confirmNewPassword: z.string().min(8, {
      message: t("settings.passwordMinLength"),
    }),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: t("settings.passwordMismatch"),
    path: ["confirmNewPassword"],
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: t("settings.passwordSame"),
    path: ["newPassword"],
  });

  type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Google-only users can't change password if they haven't set one
  const isPasswordChangeDisabled = user?.authProvider === 'google' && user?.passwordHash === null;

  async function onSubmit(values: PasswordChangeValues) {
    setIsLoading(true);
    
    try {
      await changePassword(
        values.currentPassword,
        values.newPassword,
        values.confirmNewPassword
      );
      
      toast({
        title: t("settings.passwordChangeSuccess"),
        description: t("settings.passwordChangeSuccessDesc"),
      });
      
      // Reset form
      form.reset();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("settings.passwordChangeError"),
        description: err.message || t("settings.passwordChangeErrorDesc"),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full bg-black/40 backdrop-blur-md border border-amber-500/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-400" />
          <CardTitle className="text-amber-200">{t("settings.changePassword")}</CardTitle>
        </div>
        <CardDescription>
          {isPasswordChangeDisabled 
            ? t("settings.googleUserPasswordInfo") 
            : t("settings.passwordInfo")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPasswordChangeDisabled ? (
          <p className="text-muted-foreground text-sm">
            {t("settings.googleUserPasswordHelp")}
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.currentPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="bg-black/70 border-amber-500 text-amber-100 placeholder:text-amber-400 focus:ring-amber-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.newPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="bg-black/70 border-amber-500 text-amber-100 placeholder:text-amber-400 focus:ring-amber-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.confirmNewPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="bg-black/70 border-amber-500 text-amber-100 placeholder:text-amber-400 focus:ring-amber-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white" disabled={isLoading}>
                {isLoading ? t("settings.updating") : t("settings.updatePassword")}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}