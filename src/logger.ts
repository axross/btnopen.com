import { pino } from "pino";
import { isDevelopment } from "./runtime";

export const rootLogger = pino(
	isDevelopment
		? {
				level: "trace",
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
					},
				},
			}
		: {
				level: "info",
			},
);
