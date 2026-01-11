import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useLanguage } from "@/context/LanguageContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthDialogProps = {
  className?: string;
  children?: React.ReactNode;
  defaultTab?: "login" | "register";
  buttonText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

export default function AuthDialog({
  className,
  children,
  defaultTab = "login",
  buttonText,
  variant = "default",
}: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button variant={variant} className={className}>
            {buttonText || t("auth.signIn")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md md:max-w-xl bg-background/95 backdrop-blur-xl shadow-xl dark:border-primary/20 dark:shadow-primary/10"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">{t("auth.authentication")}</DialogTitle>
          <DialogDescription className="sr-only">{t("auth.authenticationDescription")}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
            <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}