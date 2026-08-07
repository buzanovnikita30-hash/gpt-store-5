import { PLUS_STD_ACCESS_REQUIREMENTS } from "@/lib/chatgpt-data";
import { cn } from "@/lib/utils";

type PlusStdAccessNoticeProps = {
  className?: string;
  /** Dense card layout — keeps tariff cards compact */
  compact?: boolean;
};

/** Requirements for «Популярный» — login to the customer's ChatGPT account. */
export function PlusStdAccessNotice({ className, compact = false }: PlusStdAccessNoticeProps) {
  const copy = PLUS_STD_ACCESS_REQUIREMENTS;

  if (compact) {
    return (
      <details
        className={cn(
          "group rounded-lg border border-sky-200/90 bg-sky-50/90 px-2.5 py-2 text-[11px] leading-snug text-sky-950",
          className,
        )}
      >
        <summary className="cursor-pointer list-none font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>🔑</span>
            <span>{copy.title}</span>
            <span className="font-normal text-sky-800/80">— вход в ваш аккаунт ChatGPT</span>
            <span className="ml-auto text-sky-700/70 transition group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </span>
        </summary>
        <div className="mt-1.5 border-t border-sky-200/70 pt-1.5 text-sky-900/90">
          <p>{copy.lead}</p>
          <p className="mt-1 font-medium">{copy.intro}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-3.5">
            {copy.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-1 text-sky-900/80">{copy.note}</p>
        </div>
      </details>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-sky-200/90 bg-sky-50/90 px-3.5 py-3 text-xs leading-relaxed text-sky-950 sm:text-[13px]",
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
