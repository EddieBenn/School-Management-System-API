const http = require("http");
const express = require("express");
const cors = require("cors");
const errorHandler = require("../../mws/error.middleware");
const app = express();

module.exports = class AdminServer {
  constructor({ config, managers }) {
    this.config = config;
    this.adminApi = managers.adminApi;
    this.allowedOrigins = config.dotEnv.ALLOWED_ORIGINS;
  }

  use(args) {
    app.use(args);
  }

  run() {
    const allowedOrigins = this.allowedOrigins;
    app.use(
      cors({
        origin: (origin, callback) => {
          // allow requests with no origin (e.g. mobile apps, curl, Postman)
          if (!origin) return callback(null, true);
          if (allowedOrigins.includes(origin)) return callback(null, true);
          return callback(new Error(`CORS: origin '${origin}' is not allowed`));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
      }),
    );
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/static", express.static("public"));

    app.all("/api/:moduleName/:fnName", this.adminApi.mw);

    /** global error handler — must be registered after all routes */
    app.use(errorHandler);

    let server = http.createServer(app);
    server.listen(this.config.dotEnv.ADMIN_PORT, () => {
      console.log(
        `${this.config.dotEnv.SERVICE_NAME.toUpperCase()} ADMIN is running on port: ${this.config.dotEnv.ADMIN_PORT}`,
      );
    });
  }
};
