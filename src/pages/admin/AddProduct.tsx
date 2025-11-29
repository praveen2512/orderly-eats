import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const AddProductModal = ({ storeId, onProductAdded }) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (storeId) loadCategories();
  }, [storeId]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("store_id", storeId)
      .order("display_order", { ascending: true });

    if (error) toast.error("Failed to load categories");
    else setCategories(data || []);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      store_id: storeId,
      category_id: formData.get("category_id")?.toString() || null,
      name: formData.get("name")?.toString() || "",
      description: formData.get("description")?.toString() || null,
      price: Number(formData.get("price")),
      image_url: formData.get("image_url")?.toString() || null,
      is_available: formData.get("is_available") === "true",
      is_trending: formData.get("is_trending") === "true",
      is_recommended: formData.get("is_recommended") === "true",
      prep_time_minutes: formData.get("prep_time_minutes") ? Number(formData.get("prep_time_minutes")) : null,
      tax_percentage: formData.get("tax_percentage") ? Number(formData.get("tax_percentage")) : null,
      tax_type: formData.get("tax_type")?.toString() || null,
    };

    console.log("Adding product with payload:", payload);

    const { error } = await supabase.from("products").insert(payload);
    if (error) {
      toast.error("Failed to add product");
      return;
    }

    toast.success("Product added successfully");
    setOpen(false);
    form.reset();
    if (onProductAdded) {
      onProductAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-glow w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>Provide the necessary product details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Product Name</label>
            <Input name="name" required placeholder="e.g. Veg Burger" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <Select name="category_id">
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Price (₹)</label>
            <Input name="price" type="number" min="0" step="0.01" required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Input name="description" placeholder="Optional description" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Image URL</label>
            <Input name="image_url" placeholder="https://..." />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Availability</label>
            <Select name="is_available" defaultValue="true">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Available</SelectItem>
                <SelectItem value="false">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Trending</label>
              <Select name="is_trending" defaultValue="false">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Recommended</label>
              <Select name="is_recommended" defaultValue="false">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Prep Time (minutes)</label>
              <Input name="prep_time_minutes" type="number" min="0" placeholder="e.g. 10" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Tax Percentage</label>
              <Input name="tax_percentage" type="number" min="0" step="0.1" placeholder="e.g. 5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Tax Type</label>
            <Select name="tax_type">
              <SelectTrigger><SelectValue placeholder="Select tax type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GST">GST</SelectItem>
                <SelectItem value="VAT">VAT</SelectItem>
                <SelectItem value="Service Tax">Service Tax</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" className="bg-gradient-primary shadow-glow w-full">
              Add Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
