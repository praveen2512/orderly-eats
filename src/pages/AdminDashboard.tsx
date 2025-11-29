import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  TrendingUp, 
  Users,
  DollarSign,
  Package
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import Overview from "./admin/Overview";
import Orders from "./admin/Orders";
import Products from "./admin/Products";
import Analytics from "./admin/Analytics";

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const storeId = searchParams.get("store") || "";
  const tab = searchParams.get("tab") || "overview";
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeProducts: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    if (storeId) {
      loadStats();
    }
  }, [storeId]);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today's orders
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .gte("created_at", today.toISOString());

      // Today's revenue
      const { data: revenueData } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("store_id", storeId)
        .gte("created_at", today.toISOString());

      const revenue = revenueData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Active products
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("is_available", true);

      // Pending orders
      const { count: pendingCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("status", "pending");

      setStats({
        todayOrders: ordersCount || 0,
        todayRevenue: revenue,
        activeProducts: productsCount || 0,
        pendingOrders: pendingCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleTabChange = (newTab: string) => {
    navigate(`/admin?store=${storeId}&tab=${newTab}`);
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Navigation />
      
      {/* Header */}
      <header className="bg-card shadow-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-primary p-4 rounded-2xl shadow-glow">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your restaurant operations
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 shadow-card hover:shadow-glow transition-all animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-primary/10 p-3 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.todayOrders}</h3>
            <p className="text-sm text-muted-foreground">Today's Orders</p>
          </Card>

          <Card className="p-6 shadow-card hover:shadow-glow transition-all animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="bg-success/10 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <h3 className="text-3xl font-bold mb-1">₹{stats.todayRevenue.toFixed(2)}</h3>
            <p className="text-sm text-muted-foreground">Today's Revenue</p>
          </Card>

          <Card className="p-6 shadow-card hover:shadow-glow transition-all animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="bg-secondary/10 p-3 rounded-xl">
                <Package className="w-6 h-6 text-secondary" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.activeProducts}</h3>
            <p className="text-sm text-muted-foreground">Active Products</p>
          </Card>

          <Card className="p-6 shadow-card hover:shadow-glow transition-all animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="bg-accent/10 p-3 rounded-xl">
                <Users className="w-6 h-6 text-accent" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.pendingOrders}</h3>
            <p className="text-sm text-muted-foreground">Pending Orders</p>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-card animate-fade-in">
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Overview
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Orders
              </TabsTrigger>
              <TabsTrigger value="products" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Products
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-6">
              <Overview />
            </TabsContent>

            <TabsContent value="orders" className="p-6">
              <Orders />
            </TabsContent>

            <TabsContent value="products" className="p-6">
              <Products />
            </TabsContent>

            <TabsContent value="analytics" className="p-6">
              <Analytics />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
