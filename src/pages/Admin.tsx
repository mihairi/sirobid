import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminAuctionsList } from "@/components/admin/AdminAuctionsList";
import { AdminBidsList } from "@/components/admin/AdminBidsList";
import { AdminCreateAuction } from "@/components/admin/AdminCreateAuction";
import { Package, Gavel, Plus } from "lucide-react";

export default function Admin() {
  const { isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("auctions");

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground lg:text-4xl">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage auctions, view bids, and monitor activity
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted">
          <TabsTrigger value="auctions" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Auctions</span>
          </TabsTrigger>
          <TabsTrigger value="bids" className="gap-2">
            <Gavel className="h-4 w-4" />
            <span className="hidden sm:inline">Bids</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auctions" className="animate-fade-in">
          <AdminAuctionsList />
        </TabsContent>

        <TabsContent value="bids" className="animate-fade-in">
          <AdminBidsList />
        </TabsContent>

        <TabsContent value="create" className="animate-fade-in">
          <AdminCreateAuction onSuccess={() => setActiveTab("auctions")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
