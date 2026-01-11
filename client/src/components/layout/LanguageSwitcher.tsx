import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/LanguageContext";
import React from "react";

type Language = {
  code: string;
  name: string;
  flag: string;
};

const languages: Language[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "tmz", name: "Tamazight", flag: "🇲🇦" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

export default function LanguageSwitcher() {
  const { language: currentLangCode, setLanguage } = useLanguage();
  
  // Find the current language object
  const currentLanguage = languages.find(lang => lang.code === currentLangCode) || languages[0];

  // Change language using context
  const changeLanguage = (language: Language) => {
    setLanguage(language.code as "en" | "tmz" | "fr");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild aria-label="Select language">
        <button
          className="relative h-10 w-10 rounded-full flex items-center justify-center bg-black border border-amber-700 text-amber-400 hover:bg-amber-900/40 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-black transition-all"
          aria-label="Select language"
        >
          <Globe size={22} className="text-amber-400" />
          <span className="absolute -bottom-1 right-0 text-xs text-amber-400 hidden sm:inline-block">
            {currentLanguage.flag}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-black border border-amber-700 text-amber-100 shadow-lg" align="end">
        <DropdownMenuLabel className="font-normal text-amber-200">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-amber-100">Language</p>
            <p className="text-xs leading-none text-amber-400">Select your preferred language</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-amber-700/40" />
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className={`flex items-center space-x-2 text-sm rounded-md transition-colors px-3 py-2 cursor-pointer
              ${currentLanguage.code === language.code ? "text-amber-400 font-semibold bg-black" : "text-amber-100 bg-black"}
              hover:bg-amber-900/40 focus:bg-amber-900/40 focus:text-amber-50 border border-transparent focus:border-amber-700`}
            onClick={() => changeLanguage(language)}
          >
            <span className="text-base">{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}