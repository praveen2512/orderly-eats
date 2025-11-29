import { useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CreditCard, Smartphone, Banknote, Printer, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";

type PaymentMethod = "card" | "upi" | "cash";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("store") || "";
  
  // Get cart and order type from navigation state
  const { cart, orderType, currency = "₹" } = location.state || { cart: [], orderType: "take_away", currency: "₹" };
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [tipAmount, setTipAmount] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Calculate totals
  const subtotal = cart.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0);
  const taxAmount = cart.reduce((sum: number, item: any) => {
    const itemTotal = item.product.price * item.quantity;
    const tax = (itemTotal * (item.product.tax_percentage || 0)) / 100;
    return sum + tax;
  }, 0);
  const total = subtotal + taxAmount + tipAmount;

  const handleContinueToPayment = () => {
    if (!customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }
    setShowPayment(true);
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          order_number: orderNumber,
          order_type: orderType,
          customer_name: customerName,
          subtotal_amount: subtotal,
          tax_amount: taxAmount,
          tip_amount: tipAmount,
          total_amount: total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item: any) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
        special_instructions: specialInstructions,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          amount: total,
          method: paymentMethod,
          status: "completed",
        });

      if (paymentError) throw paymentError;

      // Update customer loyalty if phone provided
      if (customerPhone) {
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("*")
          .eq("phone", customerPhone)
          .eq("store_id", storeId)
          .single();

        if (existingCustomer) {
          await supabase
            .from("customers")
            .update({
              loyalty_points: existingCustomer.loyalty_points + Math.floor(total / 10),
              total_orders: existingCustomer.total_orders + 1,
            })
            .eq("id", existingCustomer.id);
        } else {
          await supabase
            .from("customers")
            .insert({
              phone: customerPhone,
              name: customerName,
              store_id: storeId,
              loyalty_points: Math.floor(total / 10),
              total_orders: 1,
            });
        }
      }

      setOrderDetails(order);
      setShowReceipt(true);
      toast.success("Order placed successfully!");
      
      // Auto-print receipt
      setTimeout(() => {
        window.print();
        toast.success("Receipt sent to printer");
      }, 1000);

    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    } finally {
      setProcessing(false);
    }
  };

  if (showReceipt && orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <Navigation />
        
        <div className="container mx-auto px-6 py-8">
          <Card className="max-w-2xl mx-auto p-8 shadow-glow">
            <div className="text-center mb-8">
              <div className="bg-success/10 p-4 rounded-full inline-block mb-4">
                <CheckCircle className="w-16 h-16 text-success" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground">Order #{orderDetails.order_number}</p>
            </div>

            <div className="border-t border-b py-6 mb-6">
              <h3 className="font-bold mb-4">Order Details</h3>
              {cart.map((item: any) => (
                <div key={item.product.id} className="flex justify-between mb-2">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>{currency}{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{currency}{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {tipAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tip</span>
                    <span>{currency}{tipAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{currency}{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button onClick={() => window.print()} variant="outline" className="w-full">
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
              <Button onClick={() => navigate(`/kiosk?store=${storeId}`)} className="w-full bg-gradient-primary">
                Return to Kiosk
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <Navigation />
        
        <div className="container mx-auto px-6 py-8">
          <Card className="max-w-2xl mx-auto p-8 shadow-glow">
            <h2 className="text-2xl font-bold mb-6 text-center">Complete Payment</h2>
            
            <div className="mb-6 p-6 bg-accent/10 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg">Total Amount</span>
                <span className="text-3xl font-bold text-primary">{currency}{total.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Payment Method: {paymentMethod.toUpperCase()}</p>
            </div>

            <div className="mb-6 p-6 border-2 border-dashed rounded-lg text-center">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">Mock Payment Gateway</p>
              <p className="text-sm text-muted-foreground">This is a simulation. Click confirm to proceed.</p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleConfirmPayment} 
                disabled={processing}
                className="w-full bg-gradient-primary shadow-glow h-14 text-lg"
              >
                {processing ? "Processing..." : "Confirm Payment"}
              </Button>
              <Button 
                onClick={() => setShowPayment(false)} 
                variant="outline"
                className="w-full"
                disabled={processing}
              >
                Back
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Navigation />
      
      <header className="bg-card shadow-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Checkout
            </h1>
            <p className="text-sm text-muted-foreground">
              Complete your order
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <Card className="p-6 shadow-card animate-slide-up">
              <h2 className="text-xl font-bold mb-4">Customer Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone (Optional - for loyalty points)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="w-5 h-5" />
                      <span>Card Payment</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Smartphone className="w-5 h-5" />
                      <span>UPI Payment</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Banknote className="w-5 h-5" />
                      <span>Cash Payment</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Add Tip */}
            <Card className="p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-xl font-bold mb-4">Add Tip (Optional)</h2>
              <div className="grid grid-cols-4 gap-3">
                {[0, 10, 20, 50].map((amount) => (
                  <Button
                    key={amount}
                    variant={tipAmount === amount ? "default" : "outline"}
                    onClick={() => setTipAmount(amount)}
                    className={tipAmount === amount ? "bg-gradient-primary" : ""}
                  >
                    {amount === 0 ? "No Tip" : `${currency}${amount}`}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Special Instructions */}
            <Card className="p-6 shadow-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-xl font-bold mb-4">Special Instructions</h2>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests or dietary requirements..."
                rows={4}
              />
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 shadow-glow sticky top-24 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                {cart.map((item: any) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.product.name} x{item.quantity}</span>
                    <span className="font-medium">{currency}{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{currency}{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {tipAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tip</span>
                    <span>{currency}{tipAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{currency}{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleContinueToPayment}
                disabled={processing || cart.length === 0}
                className="w-full mt-6 bg-gradient-primary shadow-glow text-lg h-14"
              >
                Continue to Payment
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Receipt will be automatically printed
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
