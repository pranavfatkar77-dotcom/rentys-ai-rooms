import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AuthForm from "@/components/auth/AuthForm";

export default function Auth() {
  const [selectedRole, setSelectedRole] = useState<"tenant" | "owner" | null>(null);

  if (selectedRole) {
    return <AuthForm role={selectedRole} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary mb-2">Rentys</CardTitle>
          <CardDescription className="text-lg">
            Smart room rental platform for students & families
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setSelectedRole("tenant")}
            className="w-full h-12 text-lg"
            variant="default"
          >
            Tenant Login
          </Button>
          <Button
            onClick={() => setSelectedRole("owner")}
            className="w-full h-12 text-lg"
            variant="outline"
          >
            Owner Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}