"use client";

import { useState } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import { Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";

export default function TrackingPage() {
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
                <Package className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{getTranslation("menu.tracking", languageCode)}</h1>
                <p className="text-muted-foreground mt-1">Track your orders and shipments</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Order #12345</h3>
                    <p className="text-sm text-muted-foreground mt-1">Placed on January 15, 2024</p>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    In Transit
                  </span>
                </div>
                
                <div className="space-y-4 mt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="w-0.5 h-8 bg-border mt-2"></div>
                    </div>
                    <div>
                      <p className="font-medium">Order Confirmed</p>
                      <p className="text-sm text-muted-foreground">January 15, 2024</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Truck className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="w-0.5 h-8 bg-border mt-2"></div>
                    </div>
                    <div>
                      <p className="font-medium">Shipped</p>
                      <p className="text-sm text-muted-foreground">January 16, 2024</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Out for Delivery</p>
                      <p className="text-sm text-muted-foreground">Expected: January 18, 2024</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <p className="text-muted-foreground text-center py-8">
                  No other orders to track
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

