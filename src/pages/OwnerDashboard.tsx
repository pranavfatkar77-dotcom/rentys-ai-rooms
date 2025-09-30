import { useState, useEffect } from "react";
import { Plus, Home, Edit, Trash2, User, Phone, Mail, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AddRoomForm from "@/components/owner/AddRoomForm";

interface Room {
  id: string;
  address_line: string;
  city: string;
  landmark: string;
  rent: number;
  room_type: string;
  features: any;
  is_active: boolean;
}

interface Request {
  id: string;
  room_id: string;
  status: string;
  created_at: string;
  tenant_id: string;
  tenant: {
    name: string;
    email: string;
    phone: string;
  };
  room: {
    address_line: string;
    city: string;
    rent: number;
  };
}

export default function OwnerDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch owner's rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("owner_id", profile.id);

      if (roomsError) throw roomsError;
      setRooms(roomsData || []);

      // Fetch requests for owner's rooms
      const { data: requestsData, error: requestsError } = await supabase
        .from("requests")
        .select(`
          *,
          tenant:profiles!requests_tenant_id_fkey (name, email, phone),
          room:rooms!requests_room_id_fkey (address_line, city, rent)
        `)
        .eq("owner_id", profile.id);

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
      
      fetchOwnerData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const handleRequestAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from("requests")
        .update({ status })
        .eq("id", requestId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });
      
      fetchOwnerData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "default";
      case "accepted": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Rentys - Owner</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Add Room Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Rooms ({rooms.length})</CardTitle>
              <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                  </DialogHeader>
                  <AddRoomForm 
                    onSuccess={() => {
                      setShowAddRoom(false);
                      fetchOwnerData();
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room.id}>
                  <CardHeader className="p-0">
                    <div className="h-32 bg-muted rounded-t-lg flex items-center justify-center">
                      <Home className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">₹{room.rent.toLocaleString()}/month</CardTitle>
                      <Badge variant={room.is_active ? "default" : "secondary"}>
                        {room.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription className="mb-3">
                      {room.city} {room.landmark && `• ${room.landmark}`}
                    </CardDescription>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tenant Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Requests ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{request.tenant?.name}</span>
                          <Badge variant={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {request.room?.address_line}, {request.room?.city}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          ₹{request.room?.rent.toLocaleString()}/month
                        </p>
                        {request.status === "accepted" && (
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span>{request.tenant?.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{request.tenant?.phone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleRequestAction(request.id, "accepted")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleRequestAction(request.id, "rejected")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {requests.length === 0 && (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                  <p className="text-muted-foreground">Requests from tenants will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}