/** Быстрые фразы оператора/админа — вставка в поле + опционально смена статуса focus-заказа. */

export type StaffQuickReply = {
  label: string;
  message: string;
  /** GPT orders.status */
  gptStatus?: string;
  /** Subs orders.status */
  subsStatus?: string;
};

export const STAFF_CHAT_QUICK_REPLIES: StaffQuickReply[] = [
  {
    label: "Приняли заказ",
    message: "Здравствуйте! Заказ принят в работу, скоро вернёмся с обновлением.",
    gptStatus: "activating",
    subsStatus: "processing",
  },
  {
    label: "Нужны данные",
    message:
      "Для активации пришлите, пожалуйста, данные для входа (без пароля, если возможно — по инструкции на сайте).",
    gptStatus: "waiting_client",
    subsStatus: "awaiting_data",
  },
  {
    label: "Готово",
    message:
      "Подписка активирована. Проверьте доступ в личном кабинете. Если что-то не так — напишите сюда.",
    gptStatus: "active",
    subsStatus: "activated",
  },
  {
    label: "Ожидайте",
    message: "Спасибо за сообщение! Оператор подключится в ближайшее время (обычно 5–15 минут).",
  },
  {
    label: "Уточнение",
    message:
      "Уточните, пожалуйста, номер заказа или email оплаты — так быстрее найдём ваш заказ.",
  },
];

export function staffQuickReplyTargetStatus(
  reply: StaffQuickReply,
  siteSlug: "gpt-store" | "subs-store",
): string | null {
  const status = siteSlug === "subs-store" ? reply.subsStatus : reply.gptStatus;
  return status?.trim() || null;
}
