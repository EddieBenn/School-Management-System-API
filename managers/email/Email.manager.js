const nodemailer = require("nodemailer");
const EventEmitter = require("events");
const emailTemplates = require("./emailTemplates");

class EmailEventManager extends EventEmitter {}
const emailEmitter = new EmailEventManager();

module.exports = class EmailManager {
  constructor({ config }) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.dotEnv.GMAIL_USER,
        pass: config.dotEnv.GMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.emitter = emailEmitter;
    this._sub();
  }

  _sub() {
    this.emitter.on("user:created", async (user) => {
      if (
        !this.config.dotEnv.GMAIL_USER ||
        !this.config.dotEnv.GMAIL_PASSWORD
      ) {
        console.log(
          "Skpping email send. GMAIL_USER and GMAIL_PASSWORD not set. Welcome mail to:",
          user.email,
        );
        return;
      }
      try {
        await this.transporter.sendMail({
          from: this.config.dotEnv.GMAIL_USER,
          to: user.email,
          subject: "Welcome to School Management System",
          html: emailTemplates.welcome(user.username),
        });
        console.log(`Welcome email sent to ${user.email}`);
      } catch (err) {
        console.error("Failed to send welcome email:", err);
      }
    });
  }

  notifyUserCreated(user) {
    this.emitter.emit("user:created", user);
  }
};
