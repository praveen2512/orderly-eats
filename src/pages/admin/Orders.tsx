import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  status: string;
  order_type: string;
  created_at: string;
  order_items: {
    quantity: number;
    products: { name: string };
  }[];
}

const Orders = () => {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("store") || "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");

  useEffect(() => {
    if (storeId) {
      loadOrders();
    }
  }, [storeId]);

  const loadOrders = async () => {
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            products (name)
          )
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "pending" | "preparing" | "ready" | "served" | "delivered" | "cancelled");
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "preparing" | "ready" | "served" | "delivered" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Order status updated");
      loadOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-accent",
      preparing: "bg-primary",
      ready: "bg-success",
      served: "bg-secondary",
      delivered: "bg-success",
      cancelled: "bg-destructive",
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6 shadow-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by order number or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {["all", "pending", "preparing", "ready", "served", "cancelled"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(status);
                  setTimeout(loadOrders, 0);
                }}
                className={statusFilter === status ? "bg-gradient-primary" : ""}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No orders found</p>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="p-6 shadow-card hover:shadow-glow transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">#{order.order_number}</h3>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge variant="outline">{order.order_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name || "Walk-in Customer"} • {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    ₹{Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Items:</h4>
                <div className="space-y-1">
                  {order.order_items.map((item, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">
                      {item.quantity}x {item.products.name}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {order.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "preparing")}
                  >
                    Start Preparing
                  </Button>
                )}
                {order.status === "preparing" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "ready")}
                    className="bg-success"
                  >
                    Mark as Ready
                  </Button>
                )}
                {order.status === "ready" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "served")}
                  >
                    Mark as Served
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
