import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";

interface YouTubeVideoProps {
  title: string;
  description: string;
  videoId: string;
}

export const YouTubeVideo = ({ 
  title, 
  description,
  videoId
}: YouTubeVideoProps) => {
  const videoUrl = `https://www.youtube.com/embed/${videoId}`;
  
  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(193_95%_55%_/_0.2)]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* YouTube Video Embed */}
      <div className="relative aspect-video overflow-hidden bg-secondary/50">
        <iframe
          src={videoUrl}
          title={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
        
        {/* Play Button Overlay (for styling) */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="relative p-4 sm:p-6 space-y-2">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  );
};