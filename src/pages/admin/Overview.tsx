import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Package, AlertTriangle, TrendingUp, Users } from "lucide-react";

const Overview = () => {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("store") || "";
  const [data, setData] = useState({
    totalOrders: 0,
    lowStockItems: 0,
    totalCustomers: 0,
    activeProducts: 0,
    recentOrders: [] as any[],
    lowStockProducts: [] as any[],
  });

  useEffect(() => {
    if (storeId) {
      loadOverviewData();
    }
  }, [storeId]);

  const loadOverviewData = async () => {
    try {
      // Get total orders
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId);

      // Get active products
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("is_available", true);

      // Get customers
      const { count: customersCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId);

      // Get low stock items
      const { data: inventoryData } = await supabase
        .from("inventory")
        .select("*, products(*)")
        .eq("store_id", storeId);

      const lowStock = inventoryData?.filter(
        (item) => item.current_stock < (item.min_stock_threshold || 10)
      ).slice(0, 5) || [];

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("*, order_items(quantity, products(name))")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(5);

      setData({
        totalOrders: ordersCount || 0,
        lowStockItems: lowStock?.length || 0,
        totalCustomers: customersCount || 0,
        activeProducts: productsCount || 0,
        recentOrders: recentOrders || [],
        lowStockProducts: lowStock || [],
      });
    } catch (error) {
      console.error("Error loading overview data:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-primary/10 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">{data.totalOrders}</h3>
          <p className="text-sm text-muted-foreground">Total Orders</p>
        </Card>

        <Card className="p-6 shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-success/10 p-3 rounded-xl">
              <Package className="w-6 h-6 text-success" />
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">{data.activeProducts}</h3>
          <p className="text-sm text-muted-foreground">Active Products</p>
        </Card>

        <Card className="p-6 shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-accent/10 p-3 rounded-xl">
              <Users className="w-6 h-6 text-accent" />
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">{data.totalCustomers}</h3>
          <p className="text-sm text-muted-foreground">Total Customers</p>
        </Card>

        <Card className="p-6 shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-destructive/10 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">{data.lowStockItems}</h3>
          <p className="text-sm text-muted-foreground">Low Stock Items</p>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-bold mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {data.recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            data.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-accent/5 rounded-lg hover:bg-accent/10 transition-colors"
              >
                <div>
                  <p className="font-medium">#{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{Number(order.total_amount).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Low Stock Alert */}
      {data.lowStockProducts.length > 0 && (
        <Card className="p-6 shadow-card border-destructive/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="text-xl font-bold">Low Stock Alert</h3>
          </div>
          <div className="space-y-3">
            {data.lowStockProducts.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg"
              >
                <p className="font-medium">{item.products?.name}</p>
                <p className="text-destructive font-bold">
                  {item.current_stock} units left
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Overview;
