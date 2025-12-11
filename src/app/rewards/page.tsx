"use client";

import { useState } from "react";
import Link from "next/link";
import SidebarMenu from "@/components/SidebarMenu";
import { Gift, Star, Trophy, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";

export default function RewardsPage() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const { languageCode } = useLanguage();

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <SidebarMenu 
        isExpanded={isMenuExpanded} 
        onToggle={() => setIsMenuExpanded(!isMenuExpanded)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Back to Chat Button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{getTranslation("nav.backToChat", languageCode)}</span>
            </Link>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{getTranslation("menu.rewards", languageCode)}</h1>
                <p className="text-muted-foreground mt-1">Earn points and unlock exclusive rewards</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="border border-border rounded-lg p-6 bg-card text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">1,250</h3>
                <p className="text-sm text-muted-foreground">Points Available</p>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Silver</h3>
                <p className="text-sm text-muted-foreground">Member Tier</p>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">3</h3>
                <p className="text-sm text-muted-foreground">Available Rewards</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Available Rewards</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-6 bg-card">
                  <h3 className="font-semibold mb-2">$10 Off Next Purchase</h3>
                  <p className="text-sm text-muted-foreground mb-4">Use 500 points to get $10 off your next order</p>
                  <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Redeem (500 pts)
                  </button>
                </div>

                <div className="border border-border rounded-lg p-6 bg-card">
                  <h3 className="font-semibold mb-2">Free Shipping</h3>
                  <p className="text-sm text-muted-foreground mb-4">Use 200 points for free shipping on your next order</p>
                  <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Redeem (200 pts)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

