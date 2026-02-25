const http = require("http");
const express = require("express");
const cors = require("cors");
const app = express();

module.exports = class AdminServer {
  constructor({ config, managers }) {
    this.config = config;
    this.adminApi = managers.adminApi;
  }

  use(args) {
    app.use(args);
  }

  run() {
    app.use(cors({ origin: "*" }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/static", express.static("public"));

    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).send("Something broke!");
    });

    app.all("/api/:moduleName/:fnName", this.adminApi.mw);

    let server = http.createServer(app);
    server.listen(this.config.dotEnv.ADMIN_PORT, () => {
      console.log(
        `${this.config.dotEnv.SERVICE_NAME.toUpperCase()} ADMIN is running on port: ${this.config.dotEnv.ADMIN_PORT}`,
      );
    });
  }
};
