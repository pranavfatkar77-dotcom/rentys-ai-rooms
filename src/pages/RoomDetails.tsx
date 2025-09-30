import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Home, Wifi, Zap, Car, Shield, User, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  address_line: string;
  city: string;
  district: string;
  taluka: string;
  state: string;
  pincode: string;
  landmark: string;
  rent: number;
  room_type: string;
  features: any;
  owner_id: string;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function RoomDetails() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          owner:profiles!rooms_owner_id_fkey (name, email, phone)
        `)
        .eq("id", roomId)
        .single();

      if (error) throw error;
      setRoom(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch room details",
        variant: "destructive",
      });
      navigate("/tenant");
    }
  };

  const handleSendRequest = async () => {
    if (!room) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Note: room_id should be stored as UUID, not int based on the current schema
      const { error } = await supabase
        .from("requests")
        .insert([
          {
            room_id: room.id,
            tenant_id: profile.id,
            owner_id: room.owner_id,
            message: message || "I'm interested in this room",
            status: "pending",
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request sent successfully!",
      });

      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    const icons = {
      wifi: Wifi,
      electricity: Zap,
      water: "💧",
      parking: Car,
      furnished: Home,
      security: Shield,
    };
    return icons[feature as keyof typeof icons] || "✓";
  };

  if (!room) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/tenant")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Room Details</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Room Images */}
        <Card>
          <CardContent className="p-0">
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <Home className="h-16 w-16 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">₹{room.rent.toLocaleString()}/month</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-2">
                      <MapPin className="h-4 w-4" />
                      {room.city}, {room.district}, {room.state}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {room.room_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Full Address</h3>
                    <p className="text-muted-foreground">
                      {room.address_line}, {room.city}, {room.district}, {room.taluka}, {room.state} - {room.pincode}
                    </p>
                    {room.landmark && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Near {room.landmark}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Features</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {room.features && Object.entries(room.features).map(([feature, available]) => {
                        if (!available) return null;
                        const IconComponent = getFeatureIcon(feature);
                        return (
                          <div key={feature} className="flex items-center gap-2">
                            {typeof IconComponent === "string" ? (
                              <span>{IconComponent}</span>
                            ) : (
                              <IconComponent className="h-4 w-4 text-primary" />
                            )}
                            <span className="capitalize">{feature}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Map integration coming soon</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Owner Info & Contact */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{room.owner?.name}</p>
                  <p className="text-sm text-muted-foreground">{room.owner?.email}</p>
                  <p className="text-sm text-muted-foreground">{room.owner?.phone}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send Request</CardTitle>
                <CardDescription>
                  Send a message to the owner expressing your interest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Hi, I'm interested in this room..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSendRequest} disabled={loading} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Sending..." : "Send Request"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}