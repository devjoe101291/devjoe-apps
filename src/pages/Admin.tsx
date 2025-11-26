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
import { VisitorStats } from "@/components/VisitorStats";
import { uploadFileChunked, uploadImage, formatFileSize, validateFile, isR2Configured } from "@/lib/uploadUtils";
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

  // R2 Storage monitoring
  const [r2StorageUsed, setR2StorageUsed] = useState(0);
  const R2_FREE_TIER_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB in bytes
  const storagePercentage = (r2StorageUsed / R2_FREE_TIER_LIMIT) * 100;
  const showStorageWarning = storagePercentage >= 80; // Show warning at 80%
  const storageCritical = storagePercentage >= 95; // Critical at 95%

  // --- state for new video form ---
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoInputType, setVideoInputType] = useState<'file' | 'link'>('file');
  const [videoLink, setVideoLink] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"apps" | "videos" | "visitors">("apps");

  useEffect(() => {
    checkAuth();
    calculateR2StorageUsage();
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
      // Recalculate storage after fetching videos
      calculateR2StorageUsage();
    }
  };

  // Calculate R2 storage usage from video URLs
  const calculateR2StorageUsage = async () => {
    try {
      const { data } = await supabase
        .from("videos" as any)
        .select("video_url");
      
      if (!data) return;

      // Estimate storage based on R2 URLs
      // This is an approximation - for exact usage, you'd need to query R2 API
      let totalSize = 0;
      
      for (const video of data) {
        if (video.video_url && video.video_url.includes('r2.dev')) {
          // Estimate: We'll fetch file sizes when available
          // For now, we'll use a conservative estimate
          // In production, you'd want to store file_size in the database
          totalSize += 100 * 1024 * 1024; // Assume 100MB per video as placeholder
        }
      }
      
      setR2StorageUsed(totalSize);
    } catch (error) {
      console.error('Error calculating R2 storage:', error);
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
        // Check file extension (more reliable than MIME type for APK files)
        const fileName = appFile.name.toLowerCase();
        const validExtensions = ['.apk', '.exe', '.zip', '.msi', '.rar'];
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
          throw new Error(`Invalid file type. Please upload: ${validExtensions.join(', ')}`);
        }

        // Check if R2 is configured for large files
        const isLargeFile = appFile.size > 50 * 1024 * 1024; // 50MB+
        if (isLargeFile && !isR2Configured()) {
          throw new Error(
            `File size is ${formatFileSize(appFile.size)}. Large file uploads require Cloudflare R2 configuration. Please configure R2 credentials in your environment variables.`
          );
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

  // In handleVideoSubmit, support both file and link submissions
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let thumbnailUrl = null;
      let videoUrl = null;
      // --- handle file ---
      if (videoInputType === 'file') {
        if (!videoFile) {
          throw new Error("Please select a video file to upload.");
        }
        
        // Validate video file type
        const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
        if (!validVideoTypes.includes(videoFile.type)) {
          throw new Error(`Invalid video format. Supported: MP4, WebM, MOV`);
        }

        // Check if R2 is configured for large files
        const isLargeFile = videoFile.size > 50 * 1024 * 1024; // 50MB+
        const r2Available = isR2Configured();
        console.log('R2 Configuration Check:', { isLargeFile, r2Available });
        if (isLargeFile && !r2Available) {
          throw new Error(
            `Video size is ${formatFileSize(videoFile.size)}. Large file uploads require Cloudflare R2 configuration. Please check environment variables.`
          );
        }
        // Upload thumbnail (if any)
        if (thumbnailFile) {
          toast({ title: "Uploading thumbnail...", description: `Size: ${formatFileSize(thumbnailFile.size)}` });
          thumbnailUrl = await uploadImage(
            thumbnailFile,
            "video-thumbnails",
            "thumbnails",
            (progress) => setUploadProgress(Math.round(progress.percentage / 4))
          );
        }
        toast({ title: "Uploading video...", description: `Size: ${formatFileSize(videoFile.size)}. Using optimized chunked upload for faster transfer.` });
        videoUrl = await uploadFileChunked(
          videoFile,
          "videos",
          "uploads",
          (progress) => {
            const baseProgress = thumbnailFile ? 25 : 0;
            const videoProgress = thumbnailFile ? (progress.percentage * 75) / 100 : progress.percentage;
            setUploadProgress(Math.round(baseProgress + videoProgress));
          }
        );
        setUploadProgress(100);
      } else {
        // --- handle link ---
        if (!videoLink.trim()) {
          throw new Error("Please provide a YouTube or Vimeo link.");
        }
        videoUrl = videoLink.trim();
        // handle optional thumbnail upload
        if (thumbnailFile) {
          toast({ title: "Uploading thumbnail...", description: `Size: ${formatFileSize(thumbnailFile.size)}` });
          thumbnailUrl = await uploadImage(
            thumbnailFile,
            "video-thumbnails",
            "thumbnails",
            (progress) => setUploadProgress(Math.round(progress.percentage))
          );
        }
        setUploadProgress(100);
      }
      const { error } = await supabase.from("videos" as any).insert({
        title: videoTitle,
        description: videoDescription,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      } as any);
      if (error) throw error;
      toast({ title: "Success!", description: "Video added successfully." });
      setVideoTitle(""); setVideoDescription(""); setVideoFile(null); setVideoLink(""); setThumbnailFile(null);
      setUploadProgress(0);
      fetchVideos();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add video. Please try again.", variant: "destructive" });
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
      calculateR2StorageUsage(); // Recalculate after deletion
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

      {/* R2 Storage Status Banner - Always Visible */}
      <div className={`border-b ${
        storageCritical 
          ? 'bg-destructive/90 text-destructive-foreground border-destructive'
          : storagePercentage >= 80
          ? 'bg-yellow-500/90 text-yellow-950 border-yellow-600'
          : 'bg-primary/10 text-foreground border-primary/20'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1">
              {storagePercentage >= 80 && (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-xs sm:text-sm">
                    💾 R2 Storage: {(r2StorageUsed / 1024 / 1024 / 1024).toFixed(2)} GB / 10 GB
                  </p>
                  <div className="flex-1 min-w-[100px] max-w-[200px]">
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          storageCritical 
                            ? 'bg-white'
                            : storagePercentage >= 80 
                            ? 'bg-yellow-900' 
                            : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${
                    storageCritical 
                      ? 'animate-pulse'
                      : ''
                  }`}>
                    {storagePercentage.toFixed(1)}%
                  </span>
                </div>
                {storagePercentage >= 80 && (
                  <p className="text-xs opacity-90 mt-1">
                    {storageCritical 
                      ? '🚨 Critical! Delete videos now or upgrade immediately!'
                      : '⚠️ Warning: Storage getting full. Consider deleting old videos.'}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs flex-shrink-0 ${
                storageCritical 
                  ? 'bg-white text-destructive hover:bg-white/90 border-white'
                  : storagePercentage >= 80
                  ? 'bg-white text-yellow-900 hover:bg-white/90 border-white'
                  : 'bg-primary/20 hover:bg-primary/30'
              }`}
              onClick={() => window.open('https://dash.cloudflare.com/', '_blank')}
            >
              View in Cloudflare
            </Button>
          </div>
        </div>
      </div>

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
          <Button
            variant={activeTab === "visitors" ? "default" : "ghost"}
            onClick={() => setActiveTab("visitors")}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Visitors
          </Button>
        </div>

        {/* Visitor Stats Section */}
        {activeTab === "visitors" && <VisitorStats />}

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
                    {/* Radio toggle for upload/link */}
                    <Label>Source Type</Label>
                    <div className="flex items-center gap-4 mt-1">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={videoInputType === 'file'}
                          onChange={() => setVideoInputType('file')}
                        />
                        File Upload
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={videoInputType === 'link'}
                          onChange={() => setVideoInputType('link')}
                        />
                        YouTube/Vimeo Link
                      </label>
                    </div>
                  </div>
                </div>
                {videoInputType === 'file' ? (
                  <div className="space-y-2">
                    <Label htmlFor="video-file">Video File (MP4/WebM)</Label>
                    <Input
                      id="video-file"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      required={videoInputType === 'file'}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="video-link">YouTube or Vimeo Link</Label>
                    <Input
                      id="video-link"
                      type="url"
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      required={videoInputType === 'link'}
                      placeholder="https://www.youtube.com/watch?v=xxxxxx or https://vimeo.com/xxxxxx"
                    />
                  </div>
                )}
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
