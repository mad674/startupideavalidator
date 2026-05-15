const pino = require("pino");

const isDev = process.env.NODE_ENV !== "production";

const logger = isDev
  ? pino({
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    })
  : pino();

module.exports = logger;
