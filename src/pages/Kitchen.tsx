import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";

interface Order {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    products: {
      name: string;
    };
  }[];
}

const Kitchen = () => {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("store") || "";
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            quantity,
            products (name)
          )
        `)
        .eq("store_id", storeId)
        .in("status", ["pending", "preparing"])
        .order("created_at", { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "preparing" | "ready" | "served" | "delivered" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-accent text-accent-foreground";
      case "preparing":
        return "bg-primary text-primary-foreground";
      case "ready":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTimeSince = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    return minutes < 1 ? "Just now" : `${minutes} min ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Navigation />
      
      <div className="p-8">
        <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-glow">
            <ChefHat className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Kitchen Display
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time order management
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-lg">
          <Badge className="bg-accent text-accent-foreground px-4 py-2">
            Pending: {orders.filter(o => o.status === 'pending').length}
          </Badge>
          <Badge className="bg-primary text-primary-foreground px-4 py-2">
            Preparing: {orders.filter(o => o.status === 'preparing').length}
          </Badge>
        </div>
      </header>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <ChefHat className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No Active Orders</h2>
          <p className="text-muted-foreground">
            All caught up! New orders will appear here automatically.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order, index) => (
            <Card
              key={order.id}
              className="p-6 shadow-glow animate-slide-up hover:scale-105 transition-all"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">#{order.order_number}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {getTimeSince(order.created_at)}
                  </div>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>

              <div className="mb-4 space-y-2">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-border"
                  >
                    <span className="font-medium">{item.products.name}</span>
                    <Badge variant="outline">x{item.quantity}</Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {order.status === "pending" && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, "preparing")}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Start Preparing
                  </Button>
                )}
                {order.status === "preparing" && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, "ready")}
                    className="w-full bg-success hover:bg-success/90"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Ready
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Kitchen;
