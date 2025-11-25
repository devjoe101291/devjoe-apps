import { useState, useEffect } from "react";
import { AppCard } from "@/components/AppCard";
import { Button } from "@/components/ui/button";
import { Code2, Sparkles, Lock, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    fetchApps();
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

  const handleDownload = async (app: App) => {
    if (!app.file_url) {
      toast({
        title: "Download unavailable",
        description: "This app doesn't have a download file.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Increment download count
      await supabase
        .from('apps')
        .update({ download_count: (app.download_count || 0) + 1 })
        .eq('id', app.id);

      // Get file extension from URL
      const urlParts = app.file_url.split('.');
      const extension = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
      
      // Create proper filename based on app name
      const sanitizedName = app.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedName}.${extension}`;

      // Fetch the file and trigger download with proper name
      const response = await fetch(app.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `${app.name} is being downloaded as ${filename}.`,
      });

      // Refresh apps to show updated download count
      fetchApps();
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
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
        <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center space-y-4 sm:space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-2 sm:mb-4">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">App Development Portfolio</span>
            <span className="xs:hidden">Portfolio</span>
          </div>
          
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight px-2">
            <span className="bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent break-words">
              Dev Joe Solutions
            </span>
          </h1>
          
          <p className="text-sm xs:text-base sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
            Crafting innovative applications across Android, Windows, and Web platforms. 
            Explore my collection of projects and solutions.
          </p>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* Apps Showcase Section */}
      <section className="py-12 sm:py-24 px-4 sm:px-6">
        <div className="container mx-auto">
          {/* Inspirational Quotes */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-20 space-y-6 sm:space-y-8">
            <blockquote className="relative border-l-4 border-primary pl-4 sm:pl-6 py-3 sm:py-4 bg-card/30 rounded-r-lg backdrop-blur">
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground italic leading-relaxed mb-2">
                "God is most glorified in us when we are most satisfied in Him"
              </p>
              <footer className="text-xs sm:text-sm text-primary font-medium">
                ― John Piper
              </footer>
            </blockquote>

            <blockquote className="relative border-l-4 border-primary pl-4 sm:pl-6 py-3 sm:py-4 bg-card/30 rounded-r-lg backdrop-blur">
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground italic leading-relaxed mb-2">
                "If God is the Creator of the entire universe, then it must follow that He is the Lord of the whole universe. No part of the world is outside of His lordship. That means that no part of my life must be outside of His lordship."
              </p>
              <footer className="text-xs sm:text-sm text-primary font-medium">
                ― R.C. Sproul
              </footer>
            </blockquote>

            <blockquote className="relative border-l-4 border-primary pl-4 sm:pl-6 py-3 sm:py-4 bg-card/30 rounded-r-lg backdrop-blur">
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground italic leading-relaxed mb-2">
                "We should ask God to increase our hope when it is small, awaken it when it is dormant, confirm it when it is wavering, strengthen it when it is weak, and raise it up when it is overthrown."
              </p>
              <footer className="text-xs sm:text-sm text-primary font-medium">
                ― John Calvin
              </footer>
            </blockquote>
          </div>

          <div className="text-center space-y-2 sm:space-y-4 mb-8 sm:mb-16 animate-fade-in">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold px-2">
              <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Featured Apps
              </span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {apps.map((app, index) => (
                <div key={app.id} style={{ animationDelay: `${0.3 + index * 0.1}s` }} className="animate-fade-in">
                  <AppCard {...app} iconUrl={app.icon_url} onDownload={() => handleDownload(app)} download_count={app.download_count} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 sm:py-8 px-4 sm:px-6 mt-12 sm:mt-24">
        <div className="container mx-auto text-center text-muted-foreground">
          <p className="text-xs sm:text-sm">© 2024 Dev Joe Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
