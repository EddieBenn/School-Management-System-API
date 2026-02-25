module.exports = {
  createUser: [
    {
      path: "username",
      type: "string",
      length: { min: 3, max: 50 },
      required: true,
    },
    {
      path: "email",
      type: "string",
      regex: /^[A-Za-z0-9_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      required: true,
    },
    {
      path: "password",
      type: "string",
      length: { min: 8, max: 100 },
      required: true,
    },
    {
      path: "role",
      type: "string",
      oneOf: ["superadmin", "school_admin", "student"],
      required: true,
    },
    { path: "schoolId", type: "string", required: false },
  ],
  login: [
    { path: "email", type: "string", required: true },
    { path: "password", type: "string", required: true },
  ],
};
