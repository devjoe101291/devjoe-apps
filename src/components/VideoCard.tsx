import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, Eye } from "lucide-react";
import ReactPlayer from "react-player";

interface VideoCardProps {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  viewCount?: number;
  onView?: () => void;
}

export const VideoCard = ({ 
  title, 
  description, 
  videoUrl, 
  thumbnailUrl,
  viewCount = 0,
  onView 
}: VideoCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    if (onView) {
      onView();
    }
  };

  return (
    <>
      <Card 
        className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(193_95%_55%_/_0.2)] cursor-pointer"
        onClick={handlePlay}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-secondary/50">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Play className="w-16 h-16 text-primary/50" />
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>

          {/* View Count */}
          {viewCount > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {viewCount}
            </div>
          )}
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

      {/* Video Player Dialog */}
      <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
        <DialogContent className="max-w-5xl p-0 bg-black border-0">
          <div className="relative aspect-video">
            <ReactPlayer
              url={videoUrl}
              playing={isPlaying}
              controls
              width="100%"
              height="100%"
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                  }
                }
              }}
            />
          </div>
          <div className="p-4 bg-card">
            <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
