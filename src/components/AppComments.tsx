import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, User, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  app_id: string;
  anonymous_name: string;
  comment_text: string;
  created_at: string;
}

interface AppCommentsProps {
  appId: string;
  appName: string;
  isAdmin?: boolean;
}

// Generate anonymous username like "Anonymous1234"
const generateAnonymousName = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `Anonymous${randomNum}`;
};

// Get or create anonymous ID from localStorage
const getAnonymousId = () => {
  let anonymousId = localStorage.getItem('anonymousId');
  if (!anonymousId) {
    anonymousId = generateAnonymousName();
    localStorage.setItem('anonymousId', anonymousId);
  }
  return anonymousId;
};

export const AppComments = ({ appId, appName, isAdmin = false }: AppCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Always fetch count for button display
    fetchComments();
  }, [appId]);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_comments' as any)
        .select('*')
        .eq('app_id', appId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments((data as any) || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please write a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const anonymousName = getAnonymousId();
      
      const { error } = await supabase
        .from('app_comments' as any)
        .insert({
          app_id: appId,
          anonymous_name: anonymousName,
          comment_text: newComment.trim(),
        });

      if (error) throw error;

      toast({
        title: "Comment posted!",
        description: `Your feedback as ${anonymousName} has been saved.`,
      });

      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAdmin) return;

    setDeleting(commentId);
    try {
      const { error } = await supabase
        .from('app_comments' as any)
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Comment deleted",
        description: "The comment has been removed.",
      });

      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Toggle Comments Button */}
      <Button
        variant="outline"
        onClick={() => setShowComments(!showComments)}
        className="w-full gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
      >
        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden xs:inline">
          {showComments ? 'Hide Comments' : `Add Comment or View Comments (${comments.length})`}
        </span>
        <span className="xs:hidden">
          {showComments ? 'Hide' : `Comments (${comments.length})`}
        </span>
      </Button>

      {/* Comments Section */}
      {showComments && (
        <Card className="p-3 sm:p-4 space-y-3 sm:space-y-4 bg-card/50 border-border/50">
          {/* Add Comment Form */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="break-all">Commenting as: <span className="text-primary font-medium">{getAnonymousId()}</span></span>
            </div>
            
            <Textarea
              placeholder={`Share your thoughts about ${appName}... Is it helpful? Any improvements needed?`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
              maxLength={500}
            />
            
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {newComment.length}/500
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                size="sm"
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{submitting ? 'Posting...' : 'Post Comment'}</span>
                <span className="xs:hidden">{submitting ? 'Posting...' : 'Post'}</span>
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="border-t border-border/50 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold">
              {comments.length === 0 ? 'No comments yet' : `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`}
            </h4>

            {loading ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Be the first to share your feedback!
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                {comments.map((comment) => (
                  <Card key={comment.id} className="p-2 sm:p-3 bg-secondary/30 border-border/30">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-medium text-primary break-all">
                            {comment.anonymous_name}
                          </span>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(comment.created_at)}
                            </span>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deleting === comment.id}
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground/90 break-words leading-relaxed">
                          {comment.comment_text}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
