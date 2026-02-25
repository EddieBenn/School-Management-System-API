const http = require("http");
const express = require("express");
const cors = require("cors");
const errorHandler = require("../../mws/error.middleware");
const app = express();

module.exports = class UserServer {
  constructor({ config, managers }) {
    this.config = config;
    this.userApi = managers.userApi;
    this.allowedOrigins = config.dotEnv.ALLOWED_ORIGINS;
  }

  /** for injecting middlewares */
  use(args) {
    app.use(args);
  }

  /** server configs */
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

    /** a single middleware to handle all */
    app.all("/api/:moduleName/:fnName", this.userApi.mw);

    /** global error handler — must be registered after all routes */
    app.use(errorHandler);

    let server = http.createServer(app);
    server.listen(this.config.dotEnv.USER_PORT, () => {
      console.log(
        `${this.config.dotEnv.SERVICE_NAME.toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`,
      );
    });
  }
};
