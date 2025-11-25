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
import { LogOut, Plus, Trash2, Upload, Home, Edit, Video, Play } from "lucide-react";
import { AppCard } from "@/components/AppCard";
import { uploadFileChunked, uploadImage, formatFileSize, validateFile } from "@/lib/uploadUtils";
import { Progress } from "@/components/ui/progress";
import type { User } from "@supabase/supabase-js";

interface App {
  id: string;
  name: string;
  description: string;
  platform: "android" | "windows" | "web";
  icon_url?: string;
  file_url?: string;
  download_count?: number;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  view_count?: number;
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Video management states
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"apps" | "videos">("apps");

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

    // User is admin, fetch apps and videos
    fetchApps();
    fetchVideos();
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

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching videos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setVideos((data as any) || []);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let iconUrl = null;
      let fileUrl = null;

      // Validate files
      if (iconFile) {
        const validation = validateFile(iconFile, 10 * 1024 * 1024, [
          "image/jpeg",
          "image/png",
          "image/webp",
        ]);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      if (appFile) {
        // Check file size - Supabase free tier limit is 50MB
        const MAX_SIZE = 50 * 1024 * 1024;
        if (appFile.size > MAX_SIZE) {
          throw new Error(
            `File size is ${formatFileSize(appFile.size)}. Supabase free tier has a 50MB upload limit.

To upload larger files:
1. Upgrade to Supabase Pro ($25/month) for up to 5GB
2. Or compress your APK to under 50MB`
          );
        }

        // Check file extension (more reliable than MIME type for APK files)
        const fileName = appFile.name.toLowerCase();
        const validExtensions = ['.apk', '.exe', '.zip', '.msi', '.rar'];
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
          throw new Error(`Invalid file type. Please upload: ${validExtensions.join(', ')}`);
        }
      }

      // Upload icon
      if (iconFile) {
        toast({
          title: "Uploading icon...",
          description: `Size: ${formatFileSize(iconFile.size)}`,
        });
        iconUrl = await uploadImage(iconFile, "app-icons", "icons", (progress) => {
          setUploadProgress(Math.round(progress.percentage / 2)); // 0-50%
        });
      }

      // Upload app file with chunked upload
      if (appFile) {
        toast({
          title: "Uploading app file...",
          description: `Size: ${formatFileSize(appFile.size)}. Using optimized chunked upload for faster transfer.`,
        });
        fileUrl = await uploadFileChunked(
          appFile,
          "app-files",
          "files",
          (progress) => {
            const baseProgress = iconFile ? 50 : 0;
            const fileProgress = iconFile ? progress.percentage / 2 : progress.percentage;
            setUploadProgress(Math.round(baseProgress + fileProgress));
          }
        );
      }

      setUploadProgress(100);

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
      setUploadProgress(0);
      fetchApps();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add app. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }

    setLoading(false);
    setIsUploading(false);
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
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let iconUrl = editingApp.icon_url;
      let fileUrl = editingApp.file_url;

      if (editIconFile) {
        toast({
          title: "Uploading new icon...",
          description: `Size: ${formatFileSize(editIconFile.size)}`,
        });
        iconUrl = await uploadImage(editIconFile, "app-icons", "icons", (progress) => {
          setUploadProgress(Math.round(progress.percentage / 2));
        });
      }

      if (editAppFile) {
        toast({
          title: "Uploading new app file...",
          description: `Size: ${formatFileSize(editAppFile.size)}. Using optimized chunked upload.`,
        });
        fileUrl = await uploadFileChunked(
          editAppFile,
          "app-files",
          "files",
          (progress) => {
            const baseProgress = editIconFile ? 50 : 0;
            const fileProgress = editIconFile ? progress.percentage / 2 : progress.percentage;
            setUploadProgress(Math.round(baseProgress + fileProgress));
          }
        );
      }

      setUploadProgress(100);

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
      setUploadProgress(0);
      fetchApps();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update app. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }

    setLoading(false);
    setIsUploading(false);
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let thumbnailUrl = null;
      let videoUrl = null;

      // Validate files
      if (thumbnailFile) {
        const validation = validateFile(thumbnailFile, 10 * 1024 * 1024, [
          "image/jpeg",
          "image/png",
          "image/webp",
        ]);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      if (!videoFile) {
        throw new Error("Please select a video file to upload.");
      }

      const validation = validateFile(videoFile, 500 * 1024 * 1024, [
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ]);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Upload thumbnail
      if (thumbnailFile) {
        toast({
          title: "Uploading thumbnail...",
          description: `Size: ${formatFileSize(thumbnailFile.size)}`,
        });
        thumbnailUrl = await uploadImage(
          thumbnailFile,
          "video-thumbnails",
          "thumbnails",
          (progress) => {
            setUploadProgress(Math.round(progress.percentage / 4)); // 0-25%
          }
        );
      }

      // Upload video with chunked upload
      toast({
        title: "Uploading video...",
        description: `Size: ${formatFileSize(videoFile.size)}. Using optimized chunked upload for faster transfer.`,
      });
      videoUrl = await uploadFileChunked(
        videoFile,
        "videos",
        "uploads",
        (progress) => {
          const baseProgress = thumbnailFile ? 25 : 0;
          const videoProgress = thumbnailFile
            ? (progress.percentage * 75) / 100
            : progress.percentage;
          setUploadProgress(Math.round(baseProgress + videoProgress));
        }
      );

      setUploadProgress(100);

      const { error } = await supabase.from("videos" as any).insert({
        title: videoTitle,
        description: videoDescription,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Video added successfully.",
      });

      setVideoTitle("");
      setVideoDescription("");
      setVideoFile(null);
      setThumbnailFile(null);
      setUploadProgress(0);
      fetchVideos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add video. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }

    setLoading(false);
    setIsUploading(false);
  };

  const handleVideoDelete = async (id: string) => {
    const { error } = await supabase.from("videos" as any).delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting video",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Video deleted successfully.",
      });
      fetchVideos();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            <span className="hidden sm:inline">Admin Dashboard</span>
            <span className="sm:hidden">Admin</span>
          </h1>
          <div className="flex gap-1 sm:gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="gap-1 sm:gap-2 h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4">
              <Home className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Home</span>
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-1 sm:gap-2 h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4">
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border/50">
          <Button
            variant={activeTab === "apps" ? "default" : "ghost"}
            onClick={() => setActiveTab("apps")}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Apps
          </Button>
          <Button
            variant={activeTab === "videos" ? "default" : "ghost"}
            onClick={() => setActiveTab("videos")}
            className="gap-2"
          >
            <Video className="w-4 h-4" />
            Videos
          </Button>
        </div>

        {/* Apps Section */}
        {activeTab === "apps" && (
          <>
            <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card to-card/50 border-border/50">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Add New App</h2>
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
                  accept=".apk,.exe,.zip,.msi,.rar"
                  onChange={(e) => setAppFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-semibold text-primary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading || isUploading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isUploading ? `Uploading ${uploadProgress}%...` : loading ? "Adding App..." : "Add App"}
            </Button>
          </form>
        </Card>

        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold">Manage Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {apps.map((app) => (
              <div key={app.id} className="relative group">
                <AppCard {...app} iconUrl={app.icon_url} />
                {/* Download Count Badge - Admin Only */}
                <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-md text-xs sm:text-sm font-semibold shadow-lg z-10">
                  <span className="hidden xs:inline">{app.download_count || 0} Downloads</span>
                  <span className="xs:hidden">{app.download_count || 0} DL</span>
                </div>
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
          </>
        )}

        {/* Videos Section */}
        {activeTab === "videos" && (
          <>
            <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card to-card/50 border-border/50">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Add New Video</h2>
              <form onSubmit={handleVideoSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="video-title">Video Title</Label>
                    <Input
                      id="video-title"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      required
                      placeholder="Inspirational Message"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-file">Video File (MP4/WebM)</Label>
                    <Input
                      id="video-file"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-description">Description</Label>
                  <Textarea
                    id="video-description"
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    required
                    placeholder="Describe the video content..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail Image (optional)</Label>
                  <Input
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-muted-foreground">Recommended: 1280x720px (16:9 aspect ratio)</p>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uploading...</span>
                      <span className="font-semibold text-primary">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading || isUploading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isUploading ? `Uploading ${uploadProgress}%...` : loading ? "Adding Video..." : "Add Video"}
                </Button>
              </form>
            </Card>

            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold">Manage Videos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {videos.map((video) => (
                  <Card key={video.id} className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50">
                    <div className="relative aspect-video overflow-hidden bg-secondary/50">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{video.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {video.view_count || 0} views
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleVideoDelete(video.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
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
                  accept=".apk,.exe,.zip,.msi,.rar"
                  onChange={(e) => setEditAppFile(e.target.files?.[0] || null)}
                />
                {editingApp?.file_url && !editAppFile && (
                  <p className="text-sm text-muted-foreground">Current file will be kept if not replaced</p>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-semibold text-primary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={loading || isUploading}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isUploading ? `Uploading ${uploadProgress}%...` : loading ? "Updating..." : "Update App"}
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
