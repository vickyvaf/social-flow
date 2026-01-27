"use strict";
"use client";

import { Header } from "@/components/layout/Header";
import { AlertModal } from "@/components/ui/AlertModal";
import { EditPostModal } from "@/components/posts/EditPostModal";
import { supabase } from "@/supabase/client";
import { useEffect, useState, Suspense } from "react";
import { format } from "date-fns";
import { useAccount } from "wagmi";
import { ButtonConnectWallet } from "@/components/button-connect-wallet";

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
  const { isConnected, address } = useAccount();

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
        // router.push("/"); // Removed to prevent loop
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
            ? {
                ...p,
                content: newContent,
                scheduledFor: newScheduledFor,
                scheduled_for: newScheduledFor, // Keeping both in sync
              }
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
      if (!address) {
        setPosts([]);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const limit = 100;
      const from = (pageNum - 1) * limit;
      const to = from + limit - 1;

      // 1. Get user_id from profiles table using wallet address
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("wallet_address", address)
        .single();

      if (profileError || !profileData) {
        console.warn("Profile not found for address:", address);
        setPosts([]);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const userId = profileData.id;

      // 2. Fetch posts using the retrieved user_id
      let query = supabase
        .from("getlate_posts")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      if (platformFilter !== "all") {
        query = query.contains(
          "platforms",
          JSON.stringify([{ platform: platformFilter }]),
        );
      }

      const { data: newPostsRaw, error } = await query;

      if (error) {
        throw error;
      }

      const newPosts = (newPostsRaw || []).filter(
        (p: any) => p.status !== "failed",
      );

      if ((newPostsRaw || []).length < limit) {
        setHasMore(false);
      }

      setPosts((prev) => {
        if (isReset) return newPosts;
        // Simple de-duplication based on _id or id
        const existingIds = new Set(prev.map((p) => p._id || p.id));
        const filteredNew = newPosts.filter(
          (p: any) => !existingIds.has(p._id || p.id),
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
    if (!address) return; // Fetch if wallet is connected

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
  }, [filter, platformFilter, address]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!address) return; // Don't observe if not logged in

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
  }, [page, hasMore, loading, loadingMore, filter, platformFilter, address]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-zinc-50 dark:bg-black">
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
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
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
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
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
          <div className="space-y-4 pb-12">
            {posts.map((post) => {
              console.log("post", post);

              return (
                <div
                  key={post._id || post.id || Math.random().toString()}
                  className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500/20 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit mb-1 items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            post.status === "published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : post.status === "scheduled"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {post.status}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* @ts-ignore */}
                          {(post.post_distributions || post.platforms)?.map(
                            ({
                              id,
                              _id,
                              platform,
                              username,
                              accountId,
                            }: any) => {
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
                        </div>
                        <div className="flex mt-1 gap-2 text-xs text-zinc-400">
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
                          className="rounded-lg text-zinc-400 hover:bg-blue-50 hover:text-blue-500 dark:text-zinc-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
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
                          className="rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
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
                  <div className="text-xs text-zinc-400 mt-4">
                    Created:{" "}
                    {format(
                      new Date(post.created_at || new Date()),
                      "MMM d, yyyy HH:mm",
                    )}
                  </div>
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
              <p className="text-zinc-500 text-center mt-20">No posts found.</p>
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
    </div>
  );
}

function PlatformBadge({
  platform,
  username,
}: {
  platform: string;
  username?: string;
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
          {PLATFORM_ICONS[platform]}{" "}
          <span className="ml-1">{username || "Connected"}</span>
        </span>
      )}
    </span>
  );
}
