import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  LogOut,
  Home
} from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card shadow-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Orderly
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button 
                variant={isActive("/") ? "default" : "ghost"}
                className={isActive("/") ? "bg-gradient-primary" : ""}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            
            <Link to="/kiosk?store=22222222-2222-2222-2222-222222222222">
              <Button 
                variant={isActive("/kiosk") ? "default" : "ghost"}
                className={isActive("/kiosk") ? "bg-gradient-primary" : ""}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Kiosk
              </Button>
            </Link>

            {user && (
              <>
                <Link to="/admin?store=22222222-2222-2222-2222-222222222222">
                  <Button 
                    variant={isActive("/admin") ? "default" : "ghost"}
                    className={isActive("/admin") ? "bg-gradient-primary" : ""}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>

                <Link to="/kitchen?store=22222222-2222-2222-2222-222222222222">
                  <Button 
                    variant={isActive("/kitchen") ? "default" : "ghost"}
                    className={isActive("/kitchen") ? "bg-gradient-primary" : ""}
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Kitchen
                  </Button>
                </Link>

                <Button variant="ghost" onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}

            {!user && (
              <Link to="/login">
                <Button className="bg-gradient-primary">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
