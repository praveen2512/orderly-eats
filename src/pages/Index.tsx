import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Store, Laptop, TrendingUp } from "lucide-react";
import { Navigation } from "@/components/Navigation";

const Index = () => {
  const navigate = useNavigate();
  const [defaultStore, setDefaultStore] = useState<string | null>(null);

  useEffect(() => {
    loadDefaultStore();
  }, []);

  const loadDefaultStore = async () => {
    try {
      const { data } = await supabase
        .from("stores")
        .select("id")
        .limit(1)
        .single();
      
      if (data) {
        setDefaultStore(data.id);
      }
    } catch (error) {
      console.error("Error loading store:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="bg-gradient-primary p-6 rounded-3xl shadow-glow inline-block mb-6">
              <Store className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Orderly
            </h1>
            <p className="text-2xl text-muted-foreground mb-2">
              Modern Restaurant Management System
            </p>
            <p className="text-lg text-muted-foreground">
              Streamline orders, manage inventory, and delight customers
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card 
              className="p-8 cursor-pointer hover:shadow-glow transition-all hover:scale-105 animate-slide-up"
              onClick={() => navigate(`/kiosk?store=${defaultStore}`)}
            >
              <div className="bg-primary/10 p-4 rounded-2xl w-fit mb-4">
                <Laptop className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Self-Service Kiosk</h3>
              <p className="text-muted-foreground">
                Customer-facing ordering system with intuitive interface
              </p>
            </Card>

            <Card 
              className="p-8 cursor-pointer hover:shadow-glow transition-all hover:scale-105 animate-slide-up"
              style={{ animationDelay: '0.1s' }}
              onClick={() => navigate(`/admin?store=${defaultStore}`)}
            >
              <div className="bg-secondary/10 p-4 rounded-2xl w-fit mb-4">
                <TrendingUp className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Admin Dashboard</h3>
              <p className="text-muted-foreground">
                Comprehensive management and analytics tools
              </p>
            </Card>

            <Card 
              className="p-8 cursor-pointer hover:shadow-glow transition-all hover:scale-105 animate-slide-up"
              style={{ animationDelay: '0.2s' }}
              onClick={() => navigate(`/kitchen?store=${defaultStore}`)}
            >
              <div className="bg-accent/10 p-4 rounded-2xl w-fit mb-4">
                <ChefHat className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Kitchen Display</h3>
              <p className="text-muted-foreground">
                Real-time order tracking for kitchen staff
              </p>
            </Card>
          </div>

          {/* Features */}
          <Card className="p-12 shadow-card animate-fade-in hidden">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-primary bg-clip-text text-transparent">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "🎯 Multi-vendor & multi-store architecture",
                "💳 Integrated payment processing (Card/UPI)",
                "📊 Real-time order tracking",
                "🍕 Dynamic menu management",
                "📈 Analytics & reporting dashboard",
                "🔔 Live kitchen notifications",
                "🎨 Customizable themes per vendor",
                "💪 Production-ready & scalable"
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span className="text-2xl">{feature.split(' ')[0]}</span>
                  <span className="font-medium">{feature.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
