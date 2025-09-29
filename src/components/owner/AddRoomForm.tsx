import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddRoomFormProps {
  onSuccess: () => void;
}

export default function AddRoomForm({ onSuccess }: AddRoomFormProps) {
  const [formData, setFormData] = useState({
    address_line: "",
    city: "",
    district: "",
    taluka: "",
    state: "",
    pincode: "",
    landmark: "",
    rent: "",
    room_type: "",
  });
  
  const [features, setFeatures] = useState({
    wifi: false,
    electricity: false,
    water: false,
    parking: false,
    furnished: false,
    security: false,
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFeatures(prev => ({ ...prev, [feature]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { error } = await supabase
        .from("rooms")
        .insert([
          {
            owner_id: profile.id,
            address_line: formData.address_line,
            city: formData.city,
            district: formData.district,
            taluka: formData.taluka,
            state: formData.state,
            pincode: formData.pincode,
            landmark: formData.landmark,
            rent: parseFloat(formData.rent),
            room_type: formData.room_type,
            features,
            is_active: true,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room added successfully!",
      });

      onSuccess();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address_line">Address Line</Label>
          <Textarea
            id="address_line"
            value={formData.address_line}
            onChange={(e) => handleInputChange("address_line", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="landmark">Nearby Landmark</Label>
          <Input
            id="landmark"
            value={formData.landmark}
            onChange={(e) => handleInputChange("landmark", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="district">District</Label>
          <Input
            id="district"
            value={formData.district}
            onChange={(e) => handleInputChange("district", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="taluka">Taluka</Label>
          <Input
            id="taluka"
            value={formData.taluka}
            onChange={(e) => handleInputChange("taluka", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange("state", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => handleInputChange("pincode", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rent">Monthly Rent (₹)</Label>
          <Input
            id="rent"
            type="number"
            value={formData.rent}
            onChange={(e) => handleInputChange("rent", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="room_type">Room Type</Label>
          <Select value={formData.room_type} onValueChange={(value) => handleInputChange("room_type", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">Features</Label>
        <div className="grid grid-cols-3 gap-4 mt-2">
          {Object.entries(features).map(([feature, checked]) => (
            <div key={feature} className="flex items-center space-x-2">
              <Checkbox
                id={feature}
                checked={checked}
                onCheckedChange={(checked) => handleFeatureChange(feature, !!checked)}
              />
              <Label htmlFor={feature} className="text-sm capitalize">
                {feature}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Adding Room..." : "Add Room"}
      </Button>
    </form>
  );
}