import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Plus, Minus, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type OrderType = "dine_in" | "take_away";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string | null;
  is_trending: boolean;
  is_recommended: boolean;
}

interface Category {
  id: string;
  name: string;
  image_url: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const Kiosk = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("store") || "";
  
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      loadMenu();
    }
  }, [storeId]);

  const loadMenu = async () => {
    try {
      const { data: categoriesData, error: catError } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("display_order");

      if (catError) throw catError;
      setCategories(categoriesData || []);

      const { data: productsData, error: prodError } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_available", true);

      if (prodError) throw prodError;
      setProducts(productsData || []);
      
      if (categoriesData && categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (error) {
      console.error("Error loading menu:", error);
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  if (!orderType) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-8">
        <Card className="max-w-2xl w-full p-12 shadow-glow animate-scale-in">
          <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Welcome to Orderly
          </h1>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Choose your order type to get started
          </p>
          <div className="grid grid-cols-2 gap-6">
            <Button
              size="lg"
              onClick={() => setOrderType("dine_in")}
              className="h-40 text-2xl font-bold bg-primary hover:bg-primary/90 shadow-glow transition-all hover:scale-105"
            >
              🍽️<br />Dine In
            </Button>
            <Button
              size="lg"
              onClick={() => setOrderType("take_away")}
              className="h-40 text-2xl font-bold bg-secondary hover:bg-secondary/90 shadow-glow transition-all hover:scale-105"
            >
              📦<br />Take Away
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-2xl font-semibold text-primary animate-pulse">
          Loading menu...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="bg-card shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Orderly
            </h1>
            <p className="text-sm text-muted-foreground">
              {orderType === "dine_in" ? "Dine In" : "Take Away"}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate(`/checkout?store=${storeId}`)}
            disabled={cart.length === 0}
            className="relative bg-primary hover:bg-primary/90 shadow-glow"
          >
            <ShoppingCart className="mr-2" />
            Cart ({cart.length})
            {cart.length > 0 && (
              <Badge className="ml-2 bg-accent text-accent-foreground">
                ₹{cartTotal.toFixed(2)}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Categories */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-4 pb-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="lg"
                onClick={() => setSelectedCategory(category.id)}
                className={`min-w-[150px] h-20 transition-all ${
                  selectedCategory === category.id
                    ? "bg-gradient-primary shadow-glow scale-105"
                    : "hover:scale-105"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <Card
              key={product.id}
              className="overflow-hidden hover:shadow-glow transition-all hover:scale-105 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => addToCart(product)}
            >
              <div className="relative h-48 bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🍔
                  </div>
                )}
                {product.is_trending && (
                  <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
                {product.is_recommended && (
                  <Badge className="absolute top-2 left-2 bg-secondary text-secondary-foreground">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Chef's Pick
                  </Badge>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    ₹{product.price}
                  </span>
                  {cart.find((item) => item.product.id === product.id) ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(product.id, -1);
                        }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-bold text-lg">
                        {cart.find((item) => item.product.id === product.id)?.quantity}
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Kiosk;
