import { useState, useEffect } from "react";
import { format } from "date-fns";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    postId: string,
    newContent: string,
    newScheduledFor: string,
  ) => Promise<void>;
  post: {
    id?: string;
    _id?: string;
    content: string;
    scheduledFor?: string;
  } | null;
  isLoading?: boolean;
}

export function EditPostModal({
  isOpen,
  onClose,
  onSave,
  post,
  isLoading = false,
}: EditPostModalProps) {
  const [content, setContent] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    if (post) {
      setContent(post.content);
      // Check for 'scheduledFor' (camelCase) or 'scheduled_for' (snake_case from DB)
      const scheduledVal = post.scheduledFor || (post as any).scheduled_for;

      if (scheduledVal) {
        const date = new Date(scheduledVal);
        if (!isNaN(date.getTime())) {
          setScheduleDate(format(date, "yyyy-MM-dd"));
          setScheduleTime(format(date, "HH:mm"));
        }
      } else {
        // If "kasih default valuenya" implies providing a default starting point (e.g. now)
        // when there is no schedule, we can uncomment the below.
        // But for "Edit", preserving existing is priority.
        // Assuming the issue was missing data due to case mismatch.
      }
    }
  }, [post]);

  const handleSave = () => {
    if (!post) return;
    const postId = post._id || post.id;
    if (!postId) return;

    let scheduledFor = "";
    if (scheduleDate && scheduleTime) {
      scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }

    onSave(postId, content, scheduledFor);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800 transform transition-all">
        <div className="mb-4">
          <h3 className="text-lg font-medium leading-6 text-zinc-900 dark:text-white">
            Edit Scheduled Post
          </h3>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:text-white"
                placeholder="Post content..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Scheduled For
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:text-white"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={isLoading || !content || !scheduleDate || !scheduleTime}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
