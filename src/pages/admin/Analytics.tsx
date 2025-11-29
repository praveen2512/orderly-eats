import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, ShoppingBag, Users } from "lucide-react";

const Analytics = () => {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("store") || "";
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [] as any[],
    revenueByDay: [] as any[],
  });

  useEffect(() => {
    if (storeId) {
      loadAnalytics();
    }
  }, [storeId]);

  const loadAnalytics = async () => {
    try {
      // Get total revenue and orders
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .eq("store_id", storeId);

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get top products
      const { data: topProducts } = await supabase
        .from("order_items")
        .select(`
          product_id,
          quantity,
          products (name, price)
        `)
        .limit(5);

      // Group and sum quantities
      const productMap = new Map();
      topProducts?.forEach((item: any) => {
        const productId = item.product_id;
        if (productMap.has(productId)) {
          productMap.get(productId).quantity += item.quantity;
        } else {
          productMap.set(productId, {
            name: item.products.name,
            quantity: item.quantity,
            price: item.products.price,
          });
        }
      });

      const topProductsArray = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Revenue by day (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split("T")[0];
      }).reverse();

      const revenueByDay = last7Days.map((day) => {
        const dayRevenue = orders
          ?.filter((order) => order.created_at.startsWith(day))
          .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
        return { day, revenue: dayRevenue };
      });

      setAnalytics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topProducts: topProductsArray,
        revenueByDay,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-success/10 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-primary/10 p-3 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold">{analytics.totalOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-accent/10 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-3xl font-bold">₹{analytics.averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-bold mb-4">Revenue Trend (Last 7 Days)</h3>
        <div className="space-y-3">
          {analytics.revenueByDay.map((day) => (
            <div key={day.day} className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
              <p className="font-medium">{new Date(day.day).toLocaleDateString()}</p>
              <p className="text-lg font-bold text-primary">₹{day.revenue.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Products */}
      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-bold mb-4">Top Selling Products</h3>
        <div className="space-y-3">
          {analytics.topProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No data available</p>
          ) : (
            analytics.topProducts.map((product, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-accent/5 rounded-lg hover:bg-accent/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">₹{Number(product.price).toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{product.quantity} sold</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{(Number(product.price) * product.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
