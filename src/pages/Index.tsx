import { useState, useEffect } from "react";
import { AppCard } from "@/components/AppCard";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Code2, Sparkles, Lock, Download, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

interface App {
  id: string;
  name: string;
  description: string;
  platform: "android" | "windows" | "web";
  icon_url?: string;
  file_url?: string;
  download_count?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Track visitor
  useVisitorTracking();

  // --- Add: video gallery state & fetch ---
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    fetchApps();
    fetchVideos();
    checkIfAdmin();
  }, []);

  const fetchApps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("apps")
      .select("*")
      .order("created_at", { ascending: false });

    setApps((data as App[]) || []);
    setLoading(false);
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    const { data, error } = await supabase
      .from("videos" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setVideos((data as any[]) || []);
    setLoadingVideos(false);
  };

  const checkIfAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!!data);
  };

  const handleDownload = async (app: App) => {
    // Validate file URL exists
    if (!app.file_url) {
      toast({
        title: "❌ Download Unavailable",
        description: "This app doesn't have a download file yet.",
        variant: "destructive",
      });
      return;
    }

    // Show loading toast
    toast({
      title: "⏳ Preparing Download...",
      description: `Getting ${app.name} ready for you...`,
    });

    try {
      // Get file extension from URL
      const urlParts = app.file_url.split('.');
      const extension = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
      
      // Create proper filename based on app name
      const sanitizedName = app.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedName}.${extension}`;

      // For external URLs (Supabase/R2), use direct download link
      if (app.file_url.startsWith('http')) {
        // Create invisible link and trigger download
        const link = document.createElement('a');
        link.href = app.file_url;
        link.download = filename;
        link.target = '_blank'; // Open in new tab for better compatibility
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Increment download count after successful trigger
        await supabase
          .from('apps')
          .update({ download_count: (app.download_count || 0) + 1 })
          .eq('id', app.id);

        toast({
          title: "✅ Download Started!",
          description: `${app.name} is downloading as ${filename}. Check your downloads folder.`,
        });

        // Refresh apps to show updated download count
        fetchApps();
      } else {
        throw new Error('Invalid file URL');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      
      // User-friendly error messages
      const errorMessage = error?.message?.includes('Failed to fetch') 
        ? 'Network error. Please check your connection and try again.'
        : error?.message?.includes('CORS')
        ? 'File access blocked. Please contact the administrator.'
        : 'Unable to download the file. Please try again or contact support.';

      toast({
        title: "❌ Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] xs:min-h-[60vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background z-0" />
        
        {/* Animated Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse z-0" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center space-y-3 sm:space-y-8 py-8 sm:py-0">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] xs:text-xs sm:text-sm font-medium mb-1 sm:mb-4 animate-fade-in-down">
            <Sparkles className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">App Development Portfolio</span>
            <span className="xs:hidden">Portfolio</span>
          </div>
          
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight px-2 sm:px-4 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <span className="bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent break-words">
              Dev Joe Solutions
            </span>
          </h1>
          
          <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-3 sm:px-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Crafting innovative applications across Android, Windows, and Web platforms. 
            Explore my collection of projects and solutions.
          </p>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* Apps Showcase Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-24 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto">
          {/* Inspirational Quotes */}
          <div className="max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16 lg:mb-20 space-y-4 sm:space-y-6 md:space-y-8">
            <blockquote className="relative border-l-2 sm:border-l-4 border-primary pl-3 sm:pl-4 md:pl-6 py-2 sm:py-3 md:py-4 bg-card/30 rounded-r-lg backdrop-blur animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground italic leading-relaxed mb-1 sm:mb-2">
                "God is most glorified in us when we are most satisfied in Him"
              </p>
              <footer className="text-sm sm:text-base text-primary font-medium">
                ― John Piper
              </footer>
            </blockquote>

            <blockquote className="relative border-l-2 sm:border-l-4 border-primary pl-3 sm:pl-4 md:pl-6 py-2 sm:py-3 md:py-4 bg-card/30 rounded-r-lg backdrop-blur animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground italic leading-relaxed mb-1 sm:mb-2">
                "If God is the Creator of the entire universe, then it must follow that He is the Lord of the whole universe. No part of the world is outside of His lordship. That means that no part of my life must be outside of His lordship."
              </p>
              <footer className="text-sm sm:text-base text-primary font-medium">
                ― R.C. Sproul
              </footer>
            </blockquote>

            <blockquote className="relative border-l-2 sm:border-l-4 border-primary pl-3 sm:pl-4 md:pl-6 py-2 sm:py-3 md:py-4 bg-card/30 rounded-r-lg backdrop-blur animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground italic leading-relaxed mb-1 sm:mb-2">
                "We should ask God to increase our hope when it is small, awaken it when it is dormant, confirm it when it is wavering, strengthen it when it is weak, and raise it up when it is overthrown."
              </p>
              <footer className="text-sm sm:text-base text-primary font-medium">
                ― John Calvin
              </footer>
            </blockquote>
          </div>

          <div className="text-center space-y-1.5 sm:space-y-2 md:space-y-4 mb-6 sm:mb-8 md:mb-12 lg:mb-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2 sm:px-4">
              <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Featured Apps
              </span>
            </h2>
            <p className="text-muted-foreground text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-3 sm:px-4">
              A showcase of applications built with modern technologies and best practices
            </p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground">Loading apps...</div>
          ) : apps.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No apps yet. Login to add your first app!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6" style={{ animationDelay: '0.2s' }}>
              {apps.map((app, index) => (
                <div key={app.id} className="animate-scale-in" style={{ animationDelay: `${0.1 + index * 0.1}s` }}>
                  <AppCard 
                    id={app.id}
                    name={app.name}
                    description={app.description}
                    platform={app.platform}
                    iconUrl={app.icon_url}
                    onDownload={() => handleDownload(app)}
                    download_count={app.download_count}
                    isAdmin={isAdmin}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* YouTube Video Gallery Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-24 px-3 sm:px-4 md:px-6 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center space-y-1.5 sm:space-y-2 md:space-y-4 mb-6 sm:mb-8 md:mb-12 lg:mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] xs:text-xs sm:text-sm font-medium mb-1 sm:mb-2 md:mb-4 mx-auto">
              <Video className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
              <span>Inspirational Content</span>
            </div>
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2 sm:px-4">
              <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Video Gallery
              </span>
            </h2>
            <p className="text-muted-foreground text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-3 sm:px-4">
              Uplifting messages and teachings to strengthen your faith
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {loadingVideos ? (
              <div className="text-center text-muted-foreground col-span-full">Loading videos...</div>
            ) : videos.length === 0 ? (
              <div className="text-center text-muted-foreground col-span-full">No videos yet.</div>
            ) : videos.map((video, idx) => (
              <div className="animate-scale-in" style={{ animationDelay: `${0.1 + idx * 0.1}s` }} key={video.id}>
                <VideoCard
                  title={video.title}
                  description={video.description}
                  videoUrl={video.video_url}
                  thumbnailUrl={video.thumbnail_url}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 mt-8 sm:mt-12 md:mt-16 lg:mt-24">
        <div className="container mx-auto text-center text-muted-foreground">
          <p className="text-[10px] xs:text-xs sm:text-sm">© 2025 Dev Joe Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
