"use client";

import { useState, useEffect } from "react";
import { Toast } from "@/components/ui/Toast";

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: string;
  currentPreferences?: any;
  onSave?: (preferences: any) => void;
}

export function UserPreferencesModal({
  isOpen,
  onClose,
  address,
  currentPreferences,
  onSave,
}: UserPreferencesModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const [formData, setFormData] = useState({
    brand_name: "",
    niche: "",
    target_audience: "",
    brand_voice: "Professional",
    tone: "Friendly",
    content_style: "Engaging",
    preferred_hashtags: [] as string[],
    keywords: [] as string[],
    avoid_topics: [] as string[],
    creativity_level: 7,
    post_length: "medium",
    emoji_usage: "moderate",
    call_to_action_preference: "moderate",
  });

  const [hashtagInput, setHashtagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [avoidTopicInput, setAvoidTopicInput] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (currentPreferences) {
      setFormData({
        brand_name: currentPreferences.brand_name || "",
        niche: currentPreferences.niche || "",
        target_audience: currentPreferences.target_audience || "",
        brand_voice: currentPreferences.brand_voice || "Professional",
        tone: currentPreferences.tone || "Friendly",
        content_style: currentPreferences.content_style || "Engaging",
        preferred_hashtags: currentPreferences.preferred_hashtags || [],
        keywords: currentPreferences.keywords || [],
        avoid_topics: currentPreferences.avoid_topics || [],
        creativity_level: currentPreferences.creativity_level || 7,
        post_length: currentPreferences.post_length || "medium",
        emoji_usage: currentPreferences.emoji_usage || "moderate",
        call_to_action_preference:
          currentPreferences.call_to_action_preference || "moderate",
      });
    }
  }, [currentPreferences]);

  if (!isOpen) return null;

  const handleAddItem = (
    type: "preferred_hashtags" | "keywords" | "avoid_topics",
    value: string,
    setter: (value: string) => void,
  ) => {
    if (value.trim()) {
      setFormData({
        ...formData,
        [type]: [...formData[type], value.trim()],
      });
      setter("");
    }
  };

  const handleRemoveItem = (
    type: "preferred_hashtags" | "keywords" | "avoid_topics",
    index: number,
  ) => {
    setFormData({
      ...formData,
      [type]: formData[type].filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      console.log("[UserPreferencesModal] Saving preferences:", {
        address,
        hasAddress: !!address,
        addressLength: address?.length,
      });

      const response = await fetch("/api/user/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: formData,
          address,
        }),
      });

      const data = await response.json();
      console.log("[UserPreferencesModal] Server response:", {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to save preferences");
      }

      setToast({
        show: true,
        message: "Preferences updated successfully! ✨",
        type: "success",
      });

      if (onSave) {
        onSave(data.preferences);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || "Failed to save preferences",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Content Preferences
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="items-center overflow-x-auto flex border-b border-zinc-200 dark:border-zinc-800">
          {[
            { id: "profile", label: "Profile", icon: "👤" },
            { id: "voice", label: "Voice & Tone", icon: "🎤" },
            { id: "keywords", label: "Keywords", icon: "🔑" },
            { id: "settings", label: "Settings", icon: "⚙️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-nowrap flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.brand_name}
                  onChange={(e) =>
                    setFormData({ ...formData, brand_name: e.target.value })
                  }
                  placeholder="e.g., TechStartup Inc."
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Niche / Industry
                </label>
                <select
                  value={formData.niche}
                  onChange={(e) =>
                    setFormData({ ...formData, niche: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Select your niche</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance & Crypto</option>
                  <option value="Fashion">Fashion & Beauty</option>
                  <option value="Travel">Travel & Lifestyle</option>
                  <option value="Food">Food & Beverage</option>
                  <option value="Health">Health & Fitness</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Business">Business & Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formData.target_audience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_audience: e.target.value,
                    })
                  }
                  placeholder="e.g., Young professionals aged 25-35"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* Voice & Tone Tab */}
          {activeTab === "voice" && (
            <div className="space-y-5">
              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Brand Voice
                </label>
                <div className="flex overflow-x-auto items-center gap-3">
                  {[
                    "Professional",
                    "Casual",
                    "Humorous",
                    "Inspirational",
                    "Educational",
                    "Bold",
                  ].map((voice) => (
                    <button
                      key={voice}
                      onClick={() =>
                        setFormData({ ...formData, brand_voice: voice })
                      }
                      className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                        formData.brand_voice === voice
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {voice}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Tone
                </label>
                <div className="flex overflow-x-auto items-center gap-3">
                  {[
                    "Friendly",
                    "Authoritative",
                    "Conversational",
                    "Formal",
                    "Enthusiastic",
                    "Empathetic",
                  ].map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setFormData({ ...formData, tone })}
                      className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                        formData.tone === tone
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Content Style
                </label>
                <select
                  value={formData.content_style}
                  onChange={(e) =>
                    setFormData({ ...formData, content_style: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="Story-driven">Story-driven</option>
                  <option value="Data-driven">Data-driven</option>
                  <option value="Visual-heavy">Visual-heavy</option>
                  <option value="Engaging">Engaging & Interactive</option>
                  <option value="Educational">Educational</option>
                </select>
              </div>
            </div>
          )}

          {/* Keywords Tab */}
          {activeTab === "keywords" && (
            <div className="space-y-5">
              {/* Preferred Hashtags */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Preferred Hashtags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem(
                          "preferred_hashtags",
                          hashtagInput,
                          setHashtagInput,
                        );
                      }
                    }}
                    placeholder="e.g., #TechNews"
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    onClick={() =>
                      handleAddItem(
                        "preferred_hashtags",
                        hashtagInput,
                        setHashtagInput,
                      )
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.preferred_hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {tag}
                      <button
                        onClick={() =>
                          handleRemoveItem("preferred_hashtags", idx)
                        }
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Keywords to Emphasize
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem(
                          "keywords",
                          keywordInput,
                          setKeywordInput,
                        );
                      }
                    }}
                    placeholder="e.g., Innovation, AI"
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    onClick={() =>
                      handleAddItem("keywords", keywordInput, setKeywordInput)
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    >
                      {keyword}
                      <button
                        onClick={() => handleRemoveItem("keywords", idx)}
                        className="hover:text-green-900 dark:hover:text-green-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Avoid Topics */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Topics to Avoid
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={avoidTopicInput}
                    onChange={(e) => setAvoidTopicInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem(
                          "avoid_topics",
                          avoidTopicInput,
                          setAvoidTopicInput,
                        );
                      }
                    }}
                    placeholder="e.g., Politics, Religion"
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    onClick={() =>
                      handleAddItem(
                        "avoid_topics",
                        avoidTopicInput,
                        setAvoidTopicInput,
                      )
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.avoid_topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    >
                      {topic}
                      <button
                        onClick={() => handleRemoveItem("avoid_topics", idx)}
                        className="hover:text-red-900 dark:hover:text-red-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              {/* Creativity Level */}
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <span>Creativity Level</span>
                  <span className="text-blue-600">
                    {formData.creativity_level}/10
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.creativity_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creativity_level: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-zinc-500">
                  <span>Conservative</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Post Length */}
              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Post Length
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["short", "medium", "long"].map((length) => (
                    <button
                      key={length}
                      onClick={() =>
                        setFormData({ ...formData, post_length: length })
                      }
                      className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium capitalize transition-all ${
                        formData.post_length === length
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {length}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji Usage */}
              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Emoji Usage
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["none", "minimal", "moderate", "heavy"].map((usage) => (
                    <button
                      key={usage}
                      onClick={() =>
                        setFormData({ ...formData, emoji_usage: usage })
                      }
                      className={`rounded-lg border-2 px-3 py-2.5 text-xs font-medium capitalize transition-all ${
                        formData.emoji_usage === usage
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {usage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Call-to-Action Strength
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["none", "subtle", "moderate", "strong"].map((cta) => (
                    <button
                      key={cta}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          call_to_action_preference: cta,
                        })
                      }
                      className={`rounded-lg border-2 px-3 py-2.5 text-xs font-medium capitalize transition-all ${
                        formData.call_to_action_preference === cta
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {cta}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
