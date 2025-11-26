import { YouTubeVideo } from "./YouTubeVideo";

export const TestYouTube = () => {
  return (
    <div className="p-4">
      <h1>YouTube Video Test</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <YouTubeVideo 
          title="Test Video 1"
          description="This is a test video"
          videoId="JHdB1dYAteA"
        />
        <YouTubeVideo 
          title="Test Video 2"
          description="This is another test video"
          videoId="qkmGhZY1FBQ"
        />
        <YouTubeVideo 
          title="Test Video 3"
          description="This is the third test video"
          videoId="9jYtODX22ZY"
        />
      </div>
    </div>
  );
};