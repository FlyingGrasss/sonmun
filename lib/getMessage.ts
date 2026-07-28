import { FORM } from "@/lib/conference";

type MessageTemplates = typeof FORM.messages.responses;

export default function getMessage(
  lang: 'en' | 'tr',
  key: keyof MessageTemplates['en']
): string {
  return FORM.messages.responses[lang][key];
}
