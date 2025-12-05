"use client";

import { useState } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import { HelpCircle, MessageSquare, Book, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";

export default function SupportPage() {
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
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-primary/10 rounded-lg">
                <HelpCircle className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{getTranslation("menu.support", languageCode)}</h1>
                <p className="text-muted-foreground mt-1">Get help and contact our support team</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border border-border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Chat with our support team in real-time</p>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Book className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Help Center</h3>
                <p className="text-sm text-muted-foreground">Browse our knowledge base and FAQs</p>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Email Support</h3>
                <p className="text-sm text-muted-foreground">Send us an email and we&apos;ll get back to you</p>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <HelpCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Common Questions</h3>
                <p className="text-sm text-muted-foreground">Find answers to frequently asked questions</p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-6 bg-card">
              <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">How do I track my order?</h3>
                  <p className="text-sm text-muted-foreground">
                    You can track your order by visiting the Order Tracking page in the menu. Enter your order number to see the current status.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">What is your return policy?</h3>
                  <p className="text-sm text-muted-foreground">
                    We offer a 30-day return policy on all unused items in their original packaging. Visit your account page to initiate a return.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">How do I earn rewards points?</h3>
                  <p className="text-sm text-muted-foreground">
                    You earn points for every purchase. 1 point for every $1 spent. Points can be redeemed for discounts and exclusive rewards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

