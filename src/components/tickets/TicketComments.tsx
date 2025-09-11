import { useState, useEffect, FormEvent } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api/axios';

interface CommentUser {
  id?: number;
  name?: string;
  email?: string;
  avatar?: string | null;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user?: CommentUser;
  userId?: number;
  userName?: string;
  userEmail?: string;
  userAvatar?: string | null;
}

export function TicketComments({ ticketId }: { ticketId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      // This is a placeholder - replace with your actual API endpoint
      const response = await api.get(`/tickets/${ticketId}/comments`);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [ticketId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      // This is a placeholder - replace with your actual API endpoint
      const response = await api.post(`/tickets/${ticketId}/comments`, {
        content: newComment,
      });
      
      setComments(prevComments => [response.data, ...(prevComments || [])]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          disabled={submitting}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!newComment.trim() || submitting}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        {!comments || comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-4">
              <Avatar>
                <AvatarImage 
                  src={comment.user?.avatar || comment.userAvatar || ''} 
                  alt={comment.user?.name || comment.userName || 'User'} 
                />
                <AvatarFallback className="bg-muted">
                  {(comment.user?.name || comment.userName || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    {comment.user?.name || comment.userName || 'Unknown User'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
