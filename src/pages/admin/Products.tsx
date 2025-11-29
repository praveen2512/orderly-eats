import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import AddProductModal from "./AddProduct";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_available: boolean;
  category_id: string | null;
  tax_percentage: number | null;
  categories: { name: string } | null;
}

const Products = () => {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("store") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (storeId) {
      loadProducts();
    }
  }, [storeId]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("store_id", storeId)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    }
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_available: !currentStatus })
        .eq("id", productId);

      if (error) throw error;
      toast.success("Product availability updated");
      loadProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 shadow-card">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <AddProductModal
            storeId={storeId}
            onProductAdded={loadProducts}
          />
        </div>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No products found</p>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="p-6 shadow-card hover:shadow-glow transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{product.name}</h3>
                  {product.categories && (
                    <Badge variant="outline" className="mb-2">
                      {product.categories.name}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground mb-2">
                    {product.description || "No description"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    ₹{Number(product.price).toFixed(2)}
                  </p>
                  {product.tax_percentage && product.tax_percentage > 0 && (
                    <p className="text-xs text-muted-foreground">
                      +{product.tax_percentage}% tax
                    </p>
                  )}
                </div>
                <Badge className={product.is_available ? "bg-success" : "bg-destructive"}>
                  {product.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => toggleAvailability(product.id, product.is_available)}
                >
                  {product.is_available ? "Mark Unavailable" : "Mark Available"}
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>      
    </div>
  );
};

export default Products;
