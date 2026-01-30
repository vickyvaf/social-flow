"use client";

import { useAccount } from "wagmi";
import { SettingsModal } from "./SettingsModal";

interface PlatformSelectorProps {
  selected: string;
  onSelect: (platform: string) => void;
  systemInstructions: Record<string, string>;
  setSystemInstructions: (instructions: Record<string, string>) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  selectedPlatform: string;
  onSaveInstruction?: (platform: string, instruction: string) => void;
  connectedPlatforms?: string[];
  connectedUsernames?: Record<string, string>;
  onDisconnect?: (platform: string) => void;
  onConnect?: (platform: string) => void;
  isConnected?: boolean;
}

const platforms = [
  {
    id: "twitter",
    label: "Twitter",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "threads",
    label: "Threads",
    icon: (
      <svg
        aria-label="Threads"
        viewBox="0 0 192 192"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path
          className="x19hqcy"
          d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"
        />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.6.6 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
      </svg>
    ),
  },
];

export function PlatformSelector({
  selected,
  onSelect,
  systemInstructions,
  setSystemInstructions,
  isSettingsOpen,
  setIsSettingsOpen,
  selectedPlatform,
  onSaveInstruction,
  connectedPlatforms = [],
  connectedUsernames = {},
  onDisconnect,
  onConnect,
}: PlatformSelectorProps) {
  const { isConnected: isWalletConnected } = useAccount();
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Target Platform
        </label>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        value={systemInstructions[selectedPlatform]}
        onChange={(newValue) =>
          // @ts-ignore
          setSystemInstructions((prev) => ({
            ...prev,
            [selectedPlatform]: newValue,
          }))
        }
        onSave={() => {
          if (onSaveInstruction) {
            onSaveInstruction(
              selectedPlatform,
              systemInstructions[selectedPlatform],
            );
          }
        }}
        platform={selectedPlatform}
      />
      <div className="grid grid-cols-3 mt-1 gap-3">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            onClick={() => onSelect(platform.id)}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 relative group ${
              selected === platform.id
                ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black"
            }`}
          >
            {connectedPlatforms.includes(platform.id) && (
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                {onDisconnect && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onDisconnect(platform.id);
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3 w-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            )}
            <div
              className={`${
                selected === platform.id ? "text-blue-500" : "text-zinc-500"
              }`}
            >
              {platform.icon}
            </div>
            <span
              className={`text-xs font-semibold ${
                selected === platform.id ? "text-blue-600" : "text-zinc-500"
              }`}
            >
              {platform.label}
            </span>
            {connectedUsernames[platform.id] ? (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                @{connectedUsernames[platform.id]}
              </span>
            ) : (
              isWalletConnected &&
              !connectedPlatforms.includes(platform.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConnect?.(platform.id);
                  }}
                  className="mt-1 rounded-md bg-blue-600 px-3 py-1 text-[10px] font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Connect
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
