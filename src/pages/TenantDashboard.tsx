import { useState, useEffect } from "react";
import { Search, MapPin, Home, Users, Wifi, Zap, Car, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  address_line: string;
  city: string;
  landmark: string;
  rent: number;
  room_type: string;
  features: any;
  images: any;
  owner_id: string;
}

export default function TenantDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [budget, setBudget] = useState([50000]);
  const [roomType, setRoomType] = useState("both");
  const [features, setFeatures] = useState({
    wifi: false,
    electricity: false,
    water: false,
    parking: false,
    furnished: false,
    security: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch rooms",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    try {
      let query = supabase
        .from("rooms")
        .select("*")
        .eq("is_active", true)
        .lte("rent", budget[0]);

      if (searchLocation) {
        query = query.or(`city.ilike.%${searchLocation}%,landmark.ilike.%${searchLocation}%`);
      }

      if (roomType !== "both") {
        query = query.eq("room_type", roomType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Search failed",
        variant: "destructive",
      });
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

  const handleRoomClick = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Rentys - Tenant</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="City, landmark..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Budget: ₹{budget[0].toLocaleString()}/month
                </label>
                <Slider
                  value={budget}
                  onValueChange={setBudget}
                  max={100000}
                  min={5000}
                  step={1000}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Room Type</label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Features</label>
                <div className="space-y-2">
                  {Object.entries(features).map(([feature, checked]) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={checked}
                        onCheckedChange={(checked) =>
                          setFeatures(prev => ({ ...prev, [feature]: checked }))
                        }
                      />
                      <label htmlFor={feature} className="text-sm capitalize">
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Listings */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <div onClick={() => handleRoomClick(room.id)}>
                    <CardHeader className="p-0">
                      <div className="h-48 bg-muted rounded-t-lg flex items-center justify-center">
                        <Home className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">₹{room.rent.toLocaleString()}/month</CardTitle>
                        <Badge variant="secondary" className="capitalize">
                          {room.room_type}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1 mb-3">
                        <MapPin className="h-4 w-4" />
                        {room.city} {room.landmark && `• ${room.landmark}`}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2">
                        {room.features && Object.entries(room.features).map(([feature, available]) => {
                          if (!available) return null;
                          const IconComponent = getFeatureIcon(feature);
                          return (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {typeof IconComponent === "string" ? (
                                <span className="mr-1">{IconComponent}</span>
                              ) : (
                                <IconComponent className="h-3 w-3 mr-1" />
                              )}
                              {feature}
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
            
            {rooms.length === 0 && (
              <Card className="p-8 text-center">
                <CardContent>
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No rooms found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search criteria</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}