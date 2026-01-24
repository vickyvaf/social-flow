"use strict";
"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlertModal } from "@/components/ui/AlertModal";
import { EditPostModal } from "@/components/posts/EditPostModal";
import { supabase } from "@/supabase/client";
import { useEffect, useState, Suspense } from "react";
import { format } from "date-fns";

interface Post {
  _id?: string;
  id?: string;
  content: string;
  platform: string;
  status: string; // published, scheduled, failed
  scheduled_for?: string;
  scheduledFor?: string;
  created_at: string;
  updated_at?: string;
  // Add other fields as discovered
}

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  twitter: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-3.5 w-3.5"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  threads: (
    <svg
      aria-label="Threads"
      viewBox="0 0 192 192"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className="h-3.5 w-3.5"
    >
      <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
    </svg>
  ),
  linkedin: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-3.5 w-3.5"
    >
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.6.6 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
    </svg>
  ),
  instagram: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-3.5 w-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
      />
    </svg>
  ),
};

export default function PostsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
          <Header />
          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-7xl">
              <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  Posts
                </h1>
                <div className="animate-pulse h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex animate-pulse items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                          <div className="h-5 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800"></div>
                          <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <PostsContent />
    </Suspense>
  );
}

function PostsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initialize filter from URL or default to 'all'
  const initialFilter = searchParams.get("filter") as
    | "all"
    | "published"
    | "scheduled"
    | null;
  const [filter, setFilter] = useState<"all" | "published" | "scheduled">(
    initialFilter || "all",
  );

  const initialPlatformFilter = searchParams.get("platform") as
    | "all"
    | "linkedin"
    | "threads"
    | "twitter"
    | null;
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [platformFilter, setPlatformFilter] = useState<
    "all" | "linkedin" | "threads" | "twitter"
  >(initialPlatformFilter || "all");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check Supabase session
  useEffect(() => {
    async function getSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    }
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch connected platforms from cookies
  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const platforms: string[] = [];

    if (cookies.find((row) => row.startsWith("twitter_is_connected=")))
      platforms.push("twitter");
    if (cookies.find((row) => row.startsWith("threads_is_connected=")))
      platforms.push("threads");
    if (cookies.find((row) => row.startsWith("linkedin_is_connected=")))
      platforms.push("linkedin");
    if (cookies.find((row) => row.startsWith("instagram_is_connected=")))
      platforms.push("instagram");

    setConnectedPlatforms(platforms);
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + pathname,
      },
    });
  };

  const handleConnect = (platform: string) => {
    window.location.href = `/api/auth/${platform}`;
  };

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        `/api/posts/${postToDelete._id || postToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      // Remove from state
      setPosts((prev) =>
        prev.filter(
          (p) => (p._id || p.id) !== (postToDelete._id || postToDelete.id),
        ),
      );
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      // Optional: Add toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (post: Post) => {
    setPostToEdit(post);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (
    postId: string,
    newContent: string,
    newScheduledFor: string,
  ) => {
    setIsEditing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          content: newContent,
          scheduledFor: newScheduledFor,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      await response.json(); // Consuming response

      // Update state
      setPosts((prev) =>
        prev.map((p) =>
          (p._id || p.id) === postId
            ? { ...p, content: newContent, scheduledFor: newScheduledFor }
            : p,
        ),
      );
      setIsEditModalOpen(false);
      setPostToEdit(null);
    } catch (error) {
      console.error("Error updating post:", error);
      // Optional: Add toast notification
    } finally {
      setIsEditing(false);
    }
  };

  const fetchPosts = async (pageNum: number, isReset: boolean = false) => {
    if (isReset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: "100",
      });

      if (filter !== "all") {
        queryParams.append("status", filter);
      }

      if (platformFilter !== "all") {
        queryParams.append("platform", platformFilter);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`/api/posts?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      const newPostsRaw: Post[] = data.posts || [];
      const newPosts = newPostsRaw.filter((p) => p.status !== "failed");

      if (newPostsRaw.length < 10) {
        setHasMore(false);
      }

      setPosts((prev) => {
        if (isReset) return newPosts;
        // Simple de-duplication based on _id or id
        const existingIds = new Set(prev.map((p) => p._id || p.id));
        const filteredNew = newPosts.filter(
          (p) => !existingIds.has(p._id || p.id),
        );
        return [...prev, ...filteredNew];
      });

      if (!isReset) {
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load and filter change
  useEffect(() => {
    if (!user) return; // Don't fetch if not logged in

    // Sync URL with filter state
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (filter === "all") {
      current.delete("filter");
    } else {
      current.set("filter", filter);
    }

    if (platformFilter === "all") {
      current.delete("platform");
    } else {
      current.set("platform", platformFilter);
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);

    setPage(1);
    setHasMore(true);
    setPosts([]);
    fetchPosts(1, true);
  }, [filter, platformFilter, user?.id]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!user) return; // Don't observe if not logged in

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPosts(page + 1);
        }
      },
      { threshold: 1.0 },
    );

    const trigger = document.getElementById("scroll-trigger");
    if (trigger) {
      observer.observe(trigger);
    }

    return () => {
      if (trigger) observer.unobserve(trigger);
    };
  }, [page, hasMore, loading, loadingMore, filter, platformFilter, user?.id]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <Header />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mx-auto max-w-sm space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-8 w-8 text-zinc-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Sign in to view posts
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Please sign in with your Google account to manage and track
                    your social media posts.
                  </p>
                </div>
                <button
                  onClick={handleSignIn}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Posts
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage and track your social media posts across all platforms.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex gap-2">
              {(["all", "published", "scheduled"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {f === "all"
                    ? "All Status"
                    : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "linkedin", "threads", "twitter"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    platformFilter === p
                      ? "bg-blue-600 text-white"
                      : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {p === "all"
                    ? "All Platforms"
                    : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            {posts.map((post) => {
              console.log("post", post);

              return (
                <div
                  key={post._id || post.id || Math.random().toString()}
                  className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500/20 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {/* @ts-ignore */}
                        {(post.post_distributions || post.platforms)?.map(
                          ({ id, _id, platform, username, accountId }: any) => {
                            return (
                              <PlatformBadge
                                key={id || _id}
                                platform={platform}
                                username={
                                  username ||
                                  accountId?.username ||
                                  accountId?.displayName
                                }
                              />
                            );
                          },
                        )}
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            post.status === "published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : post.status === "scheduled"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {post.status}
                        </span>
                        <div className="flex gap-2 text-xs text-zinc-400">
                          {post.scheduled_for && (
                            <span>
                              Scheduled:{" "}
                              {format(
                                new Date(
                                  post.scheduledFor || post.scheduled_for,
                                ),
                                "MMM d, yyyy HH:mm",
                              )}
                            </span>
                          )}
                          {post.status === "published" && (
                            <span>
                              Published:{" "}
                              {format(
                                new Date(
                                  post.updated_at ||
                                    post.created_at ||
                                    new Date(),
                                ),
                                "MMM d, yyyy HH:mm",
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                        {post.content}
                      </p>
                    </div>

                    {(post.status === "scheduled" ||
                      post.status === "published") && (
                      <>
                        <button
                          onClick={() => handleEditClick(post)}
                          className="rounded-lg p-2 text-zinc-400 hover:bg-blue-50 hover:text-blue-500 dark:text-zinc-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                          title="Edit Scheduled Post"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-5 w-5"
                          >
                            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(post)}
                          className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                          title="Delete Scheduled Post"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 mt-20">
                    Created:{" "}
                    {format(
                      new Date(post.created_at || new Date()),
                      "MMM d, yyyy HH:mm",
                    )}
                  </span>
                </div>
              );
            })}

            {loading && posts.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex animate-pulse items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                          <div className="h-5 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800"></div>
                          <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-zinc-500">No posts found.</p>
              </div>
            )}

            {hasMore && posts.length > 0 && (
              <div id="scroll-trigger" className="flex justify-center py-8">
                {loadingMore && (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <AlertModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        post={postToEdit}
        isLoading={isEditing}
      />

      <Footer />
    </div>
  );
}

function PlatformBadge({
  platform,
  username,
}: {
  platform: string;
  username: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        platform === "twitter"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          : platform === "threads"
            ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
            : platform === "linkedin"
              ? "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300"
              : platform === "instagram"
                ? "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
                : "bg-gray-100 text-gray-800"
      }`}
    >
      {PLATFORM_ICONS[platform] && (
        <span className="flex items-center justify-center">
          {PLATFORM_ICONS[platform]} <span className="ml-1">{username}</span>
        </span>
      )}
    </span>
  );
}
