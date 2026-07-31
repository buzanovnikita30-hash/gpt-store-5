"use client";

import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { SubsOrderStatusSelect } from "@/components/admin/SubsOrderStatusSelect";
import type { OrderStatus } from "@/types/database";

type Props = {
  orderId: string;
  initialStatus: string;
  siteSlug: "gpt-store" | "subs-store";
  onStatusChange?: (next: string) => void;
};

/** Смена статуса заказа для admin/operator (GPT + Subs). */
export function StaffOrderStatusSelect({
  orderId,
  initialStatus,
  siteSlug,
  onStatusChange,
}: Props) {
  if (siteSlug === "subs-store") {
    return (
      <SubsOrderStatusSelect
        orderId={orderId}
        initialStatus={initialStatus}
        siteSlug="subs-store"
        onStatusChange={onStatusChange}
      />
    );
  }

  return (
    <OrderStatusSelect
      orderId={orderId}
      initialStatus={initialStatus as OrderStatus}
      onStatusChange={onStatusChange}
    />
  );
}
