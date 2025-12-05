"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Search, Settings, User, Package, Gift, HelpCircle, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";

interface SidebarMenuProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function SidebarMenu({ isExpanded, onToggle }: SidebarMenuProps) {
  const { languageCode } = useLanguage();
  const pathname = usePathname();
  
  const menuItems = [
    {
      id: "chats",
      labelKey: "menu.chats",
      icon: MessageCircle,
      href: "/chats",
    },
    {
      id: "search",
      labelKey: "menu.search",
      icon: Search,
      href: "/search",
    },
    {
      id: "account",
      labelKey: "menu.account",
      icon: User,
      href: "/account",
    },
    {
      id: "wishlist",
      labelKey: "menu.wishlist",
      icon: Heart,
      href: "/wishlist",
    },
    {
      id: "tracking",
      labelKey: "menu.tracking",
      icon: Package,
      href: "/tracking",
    },
    {
      id: "rewards",
      labelKey: "menu.rewards",
      icon: Gift,
      href: "/rewards",
    },
    {
      id: "support",
      labelKey: "menu.support",
      icon: HelpCircle,
      href: "/support",
    },
    {
      id: "settings",
      labelKey: "menu.settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  return (
    <div
      className={`h-screen bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-center px-4 border-b border-border ${
        isExpanded ? "py-[26.25px]" : "py-[22.5px]"
      }`}>
        {isExpanded ? (
          <Image
            src="/logo-h.png"
            alt="Logo"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
        ) : (
          <Image
            src="/bird.png"
            alt="Bird"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left group ${
                  isExpanded ? "justify-start" : "justify-center"
                } ${isActive ? "bg-muted" : ""}`}
                title={!isExpanded ? getTranslation(item.labelKey, languageCode) : undefined}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0 ${
                  isActive ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10"
                }`}>
                  <Icon className={`${isActive ? "text-primary" : "text-foreground"} ${item.id === "chats" ? "w-[18px] h-[18px]" : "w-5 h-5"}`} />
                </div>
                {isExpanded && (
                  <span className={`font-medium whitespace-nowrap ${isActive ? "text-primary" : "text-foreground"}`}>
                    {getTranslation(item.labelKey, languageCode)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer with Toggle Button */}
      <div className="border-t border-border p-4">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center px-4 py-3 rounded-lg hover:bg-muted transition-colors"
          aria-label={isExpanded ? "Collapse menu" : "Expand menu"}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted flex-shrink-0">
            {isExpanded ? (
              <ChevronLeft className="w-5 h-5 text-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-foreground" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

