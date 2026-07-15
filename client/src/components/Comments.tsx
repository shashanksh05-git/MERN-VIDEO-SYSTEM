import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Languages, MapPin, ThumbsDown, ThumbsUp } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  city?: string;
  likes?: string[];
  dislikes?: string[];
  commentedon: string;
}

const blockedSpecialCharsRegex = /[@#$%^&*<>{}\[\]\\/|~`_=+]/;

const hasBlockedSpecialChars = (text: string) => {
  return blockedSpecialCharsRegex.test(text);
};

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translatedComments, setTranslatedComments] = useState<{
    [key: string]: string;
  }>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const { user } = useUser();

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getUserCity = async (): Promise<string> => {
    if (!navigator.geolocation) {
      return "Unknown City";
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const res = await axiosInstance.get(
              `/comment/city?lat=${lat}&lon=${lon}`
            );

            resolve(res.data.city || "Unknown City");
          } catch (error) {
            resolve("Unknown City");
          }
        },
        () => {
          resolve("Unknown City");
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000,
        }
      );
    });
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    if (hasBlockedSpecialChars(newComment)) {
      alert("Special characters like @ # $ % ^ & * are not allowed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const city = await getUserCity();

      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name || user.email || "Anonymous",
        city,
      });

      if (res.data.comment) {
        setComments([res.data.result, ...comments]);
        setNewComment("");
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error adding comment");
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;

    if (hasBlockedSpecialChars(editText)) {
      alert("Special characters like @ # $ % ^ & * are not allowed.");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );

      if (res.data) {
        setComments((prev) =>
          prev.map((c) => (c._id === editingCommentId ? res.data : c))
        );

        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error updating comment");
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);

      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleReaction = async (
    commentId: string,
    action: "like" | "dislike"
  ) => {
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      const res = await axiosInstance.patch(`/comment/${commentId}/react`, {
        userid: user._id,
        action,
      });

      if (res.data.deleted) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        alert("Comment removed because it received 2 dislikes");
        return;
      }

      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.data.result : c))
      );
    } catch (error: any) {
      alert(error?.response?.data?.message || "Reaction failed");
    }
  };

  const handleTranslate = async (comment: Comment) => {
    try {
      setTranslatingId(comment._id);

      console.log("TRANSLATING:", {
  text: comment.commentbody,
  targetLanguage: "en",
});

const res = await axiosInstance.post("/comment/translate", {
  text: comment.commentbody,
  targetLanguage: "en",
});

console.log("TRANSLATION RESULT:", res.data);

      setTranslatedComments((prev) => ({
        ...prev,
        [comment._id]: res.data.translatedText,
      }));
    } catch (error) {
      alert("Translation failed");
    } finally {
      setTranslatingId(null);
    }
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4" />
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ar">Arabic</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="zh-CN">Chinese</option>
          </select>
        </div>
      </div>

      {user ? (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment in any language..."
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />

            {hasBlockedSpecialChars(newComment) && (
              <p className="text-xs text-red-500">
                Special characters like @ # $ % ^ & * are not allowed.
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmitComment}
                disabled={
                  !newComment.trim() ||
                  isSubmitting ||
                  hasBlockedSpecialChars(newComment)
                }
              >
                {isSubmitting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Login to add a comment.</p>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const likeCount = comment.likes?.length || 0;
            const dislikeCount = comment.dislikes?.length || 0;

            return (
              <div key={comment._id} className="flex gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback>
                    {comment.usercommented?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.usercommented}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.commentedon))} ago
                    </span>

                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {comment.city || "Unknown City"}
                    </span>
                  </div>

                  {editingCommentId === comment._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />

                      {hasBlockedSpecialChars(editText) && (
                        <p className="text-xs text-red-500">
                          Special characters like @ # $ % ^ & * are not
                          allowed.
                        </p>
                      )}

                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={handleUpdateComment}
                          disabled={
                            !editText.trim() || hasBlockedSpecialChars(editText)
                          }
                        >
                          Save
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{comment.commentbody}</p>

                      {translatedComments[comment._id] && (
                        <div className="mt-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                          <p className="mb-1 text-xs font-semibold text-muted-foreground">
                            Translated
                          </p>
                          <p>{translatedComments[comment._id]}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <button
                          onClick={() => handleReaction(comment._id, "like")}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {likeCount}
                        </button>

                        <button
                          onClick={() => handleReaction(comment._id, "dislike")}
                          className="flex items-center gap-1 hover:text-destructive"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          {dislikeCount}
                        </button>

                        <button
                          onClick={() => handleTranslate(comment)}
                          className="flex items-center gap-1 hover:text-primary"
                          disabled={translatingId === comment._id}
                        >
                          <Languages className="w-4 h-4" />
                          {translatingId === comment._id
                            ? "Translating..."
                            : "Translate"}
                        </button>

                        {comment.userid === user?._id && (
                          <>
                            <button onClick={() => handleEdit(comment)}>
                              Edit
                            </button>

                            <button onClick={() => handleDelete(comment._id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Comments;