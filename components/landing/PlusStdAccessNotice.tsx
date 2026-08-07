import { PLUS_STD_ACCESS_REQUIREMENTS } from "@/lib/chatgpt-data";
import { cn } from "@/lib/utils";

type PlusStdAccessNoticeProps = {
  className?: string;
  compact?: boolean;
};

/** Requirements for «Популярный» — login to the customer's ChatGPT account. */
export function PlusStdAccessNotice({ className, compact = false }: PlusStdAccessNoticeProps) {
  const copy = PLUS_STD_ACCESS_REQUIREMENTS;

  return (
    <div
      className={cn(
        "rounded-xl border border-sky-200/90 bg-sky-50/90 text-sky-950",
        compact ? "px-3 py-2.5 text-xs leading-relaxed" : "px-3.5 py-3 text-xs leading-relaxed sm:text-[13px]",
        className,
      )}
      role="note"
    >
      <p className="font-semibold">
        <span aria-hidden>🔑 </span>
        {copy.title}
      </p>
      <p className="mt-1.5">{copy.lead}</p>
      <p className="mt-2 font-medium text-sky-900/90">{copy.intro}</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sky-900/85">
        {copy.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-2 text-sky-900/80">{copy.note}</p>
    </div>
  );
}
