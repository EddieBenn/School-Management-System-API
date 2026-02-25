module.exports = {
  welcome: (username) => `
    <div style="width: 60%; margin: 0 auto; text-align: center; padding: 20px; border-radius: 10px; border: 2px solid gold; background-color: #fffaf0; font-family: Arial, sans-serif;">
      <h3 style="font-size: 24px; color: #d2691e; margin-bottom: 10px;">Welcome to the School Management System</h3>
      <p style="font-size: 18px; color: #8b4513; margin: 10px 0;">
        Hello, ${username}! We are excited to have you on board.
      </p>
      <p style="font-size: 16px; color: #2e8b57; margin: 10px 0;">
        You can now log in using your email to access your dashboard.
      </p>
    </div>
  `,
};
