import * as pino from "pino";

export const logger = pino({
    name: "pino-pretty-bug",
    level: "trace",
    prettyPrint: {
        colorize: true,
    }
});
