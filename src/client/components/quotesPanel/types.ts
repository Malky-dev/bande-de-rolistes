import type { QuoteAdmin } from "@/api/auth";

export type QuoteFormState = {
  content: string;
  author: string;
};

export type QuoteTableItem = QuoteAdmin;
