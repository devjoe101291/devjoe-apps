import { useState, useEffect } from "react";
import { AppCard } from "@/components/AppCard";
import { Button } from "@/components/ui/button";
import { Code2, Sparkles, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";

interface App {
  id: string;
  name: string;
  description: string;
  platform: "android" | "windows" | "web";
  icon_url?: string;
  file_url?: string;
}

const Index = () => {
  const navigate = useNavigate();
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
        <div className="relative z-10 container mx-auto px-6 text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            App Development Portfolio
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Dev Joe Solutions
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Crafting innovative applications across Android, Windows, and Web platforms. 
            Explore my collection of projects and solutions.
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_hsl(193_95%_55%_/_0.3)] hover:shadow-[0_0_30px_hsl(193_95%_55%_/_0.5)] transition-all"
            >
              <Lock className="w-5 h-5 mr-2" />
              Admin Login
            </Button>
          </div>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* Apps Showcase Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Featured Apps
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {apps.map((app, index) => (
                <div key={app.id} style={{ animationDelay: `${0.3 + index * 0.1}s` }} className="animate-fade-in">
                  <AppCard {...app} iconUrl={app.icon_url} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6 mt-24">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 Dev Joe Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
