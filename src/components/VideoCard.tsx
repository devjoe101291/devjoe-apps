interface VideoCardProps {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
}

export const VideoCard = ({ title, description, videoUrl, thumbnailUrl }: VideoCardProps) => {
  // Detect video type
  const ytMatch = videoUrl.match(/(?:youtube.com\/(?:embed\/|watch\?v=)|youtu.be\/)([\/w-]+)/);
  const vimeoMatch = videoUrl.match(/(?:vimeo.com\/(\d+))/);
  
  return (
    <div className="group relative bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(193_95%_55%_/_0.2)] rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative aspect-video overflow-hidden bg-black">
        {ytMatch ? (
          // YouTube Embed
          <iframe
            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
            title={title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : vimeoMatch ? (
          // Vimeo Embed
          <iframe
            src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
            title={title}
            className="w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          // Uploaded Video File
          <video 
            controls 
            poster={thumbnailUrl || undefined} 
            className="w-full h-full object-contain"
            playsInline
            preload="metadata"
            controlsList="nodownload"
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      <div className="relative p-4 sm:p-6 space-y-2">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};
