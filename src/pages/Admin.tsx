import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Plus, Trash2, Upload, Home, Edit } from "lucide-react";
import { AppCard } from "@/components/AppCard";
import type { User } from "@supabase/supabase-js";

interface App {
  id: string;
  name: string;
  description: string;
  platform: "android" | "windows" | "web";
  icon_url?: string;
  file_url?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<"android" | "windows" | "web">("android");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [appFile, setAppFile] = useState<File | null>(null);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPlatform, setEditPlatform] = useState<"android" | "windows" | "web">("android");
  const [editIconFile, setEditIconFile] = useState<File | null>(null);
  const [editAppFile, setEditAppFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const checkAdminRole = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (error || !data) {
      toast({
        title: "Access Denied",
        description: "You don't have admin access. Please contact the administrator.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      navigate("/");
      return;
    }

    // User is admin, fetch apps
    fetchApps();
  };

  const fetchApps = async () => {
    const { data, error } = await supabase
      .from("apps")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching apps",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setApps((data as App[]) || []);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const uploadFile = async (file: File, bucket: string, folder: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Math.random()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let iconUrl = null;
      let fileUrl = null;

      if (iconFile) {
        iconUrl = await uploadFile(iconFile, "app-icons", "icons");
      }

      if (appFile) {
        fileUrl = await uploadFile(appFile, "app-files", "files");
      }

      const { error } = await supabase.from("apps").insert({
        name,
        description,
        platform,
        icon_url: iconUrl,
        file_url: fileUrl,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "App added successfully.",
      });

      setName("");
      setDescription("");
      setPlatform("android");
      setIconFile(null);
      setAppFile(null);
      fetchApps();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("apps").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting app",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "App deleted successfully.",
      });
      fetchApps();
    }
  };

  const handleEditClick = (app: App) => {
    setEditingApp(app);
    setEditName(app.name);
    setEditDescription(app.description);
    setEditPlatform(app.platform);
    setEditIconFile(null);
    setEditAppFile(null);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    setLoading(true);

    try {
      let iconUrl = editingApp.icon_url;
      let fileUrl = editingApp.file_url;

      if (editIconFile) {
        iconUrl = await uploadFile(editIconFile, "app-icons", "icons");
      }

      if (editAppFile) {
        fileUrl = await uploadFile(editAppFile, "app-files", "files");
      }

      const { error } = await supabase
        .from("apps")
        .update({
          name: editName,
          description: editDescription,
          platform: editPlatform,
          icon_url: iconUrl,
          file_url: fileUrl,
        })
        .eq("id", editingApp.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "App updated successfully.",
      });

      setEditDialogOpen(false);
      setEditingApp(null);
      fetchApps();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-12">
        <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-border/50">
          <h2 className="text-2xl font-bold mb-6">Add New App</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">App Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="My Awesome App"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={(value: any) => setPlatform(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Describe your app..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="icon">App Icon (optional)</Label>
                <Input
                  id="icon"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">App File (APK/EXE/ZIP)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".apk,.exe,.zip,.msi"
                  onChange={(e) => setAppFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Adding App..." : "Add App"}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Manage Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div key={app.id} className="relative group">
                <AppCard {...app} iconUrl={app.icon_url} />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleEditClick(app)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(app.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit App</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name">App Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  placeholder="My Awesome App"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-platform">Platform</Label>
                <Select value={editPlatform} onValueChange={(value: any) => setEditPlatform(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
                placeholder="Describe your app..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit-icon">New App Icon (optional)</Label>
                <Input
                  id="edit-icon"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditIconFile(e.target.files?.[0] || null)}
                />
                {editingApp?.icon_url && !editIconFile && (
                  <p className="text-sm text-muted-foreground">Current icon will be kept if not replaced</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-file">New App File (optional)</Label>
                <Input
                  id="edit-file"
                  type="file"
                  accept=".apk,.exe,.zip,.msi"
                  onChange={(e) => setEditAppFile(e.target.files?.[0] || null)}
                />
                {editingApp?.file_url && !editAppFile && (
                  <p className="text-sm text-muted-foreground">Current file will be kept if not replaced</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                <Edit className="w-4 h-4 mr-2" />
                {loading ? "Updating..." : "Update App"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
