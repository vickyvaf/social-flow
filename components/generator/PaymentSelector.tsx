interface PaymentSelectorProps {
  selected: string;
  onSelect: (token: string) => void;
}

export function PaymentSelector({ selected, onSelect }: PaymentSelectorProps) {
  const tokens = [
    { id: "IDRX", label: "IDRX", icon: "Rp" },
    { id: "eth", label: "ETH", icon: "Ξ" },
    { id: "sol", label: "SOL", icon: "◎" },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Payment Selection
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Cost: 1.50 IDRX
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {tokens.map((token) => (
          <button
            key={token.id}
            onClick={() => onSelect(token.id)}
            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${
              selected === token.id
                ? "border-blue-500 bg-white text-blue-600 shadow-sm dark:bg-black"
                : "border-zinc-200 bg-transparent text-zinc-600 hover:bg-white hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <span
              className={
                selected === token.id ? "text-blue-600" : "text-zinc-400"
              }
            >
              {token.icon}
            </span>
            {token.label}
          </button>
        ))}
      </div>
    </div>
  );
}
