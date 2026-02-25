module.exports = {
  createSchool: [
    {
      path: "name",
      label: "Name",
      type: "string",
      length: { min: 3, max: 100 },
      required: true,
    },
    {
      path: "address",
      label: "Address",
      type: "string",
      length: { min: 5, max: 200 },
      required: true,
    },
  ],
  updateSchool: [
    {
      path: "name",
      label: "Name",
      type: "string",
      length: { min: 3, max: 100 },
    },
    {
      path: "address",
      label: "Address",
      type: "string",
      length: { min: 5, max: 200 },
    },
    { path: "schoolId", type: "string", required: true },
  ],
};
