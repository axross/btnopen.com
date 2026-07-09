import { enUS, ja, type Locale } from "date-fns/locale";
import type { PayloadLocale } from "@/repositories/payload-types";

/** date-fns locale used to format dates for each supported app locale. */
export const dateFnsLocaleByLocale: Record<PayloadLocale, Locale> = {
	"ja-JP": ja,
	"en-US": enUS,
};
