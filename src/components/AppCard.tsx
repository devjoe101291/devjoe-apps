import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Globe, Download } from "lucide-react";

interface AppCardProps {
  name: string;
  description: string;
  platform: "android" | "windows" | "web";
  iconUrl?: string;
  onDownload?: () => void;
  download_count?: number;
}

const platformConfig = {
  android: { icon: Smartphone, label: "Android", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  windows: { icon: Monitor, label: "Windows", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  web: { icon: Globe, label: "Web", color: "bg-primary/10 text-primary border-primary/20" },
};

export const AppCard = ({ name, description, platform, iconUrl, onDownload, download_count }: AppCardProps) => {
  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(193_95%_55%_/_0.2)] hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          </div>
          
          {iconUrl && (
            <div className="w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
              <img src={iconUrl} alt={name} className="w-12 h-12 object-contain" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Badge variant="outline" className={`${config.color} gap-1.5`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </Badge>
          
          {onDownload && (
            <Button 
              size="sm" 
              onClick={onDownload}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Download className="w-4 h-4" />
              Download
              {download_count !== undefined && download_count > 0 && (
                <span className="text-xs opacity-75">({download_count})</span>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  );
};
