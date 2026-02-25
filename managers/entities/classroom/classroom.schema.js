module.exports = {
  createClassroom: [
    {
      path: "name",
      label: "Name",
      type: "string",
      length: { min: 2, max: 50 },
      required: true,
    },
    { path: "capacity", label: "Capacity", type: "String", required: true },
    { path: "schoolId", type: "string", required: true },
  ],
  updateClassroom: [
    { path: "classroomId", type: "string", required: true },
    { path: "name", type: "string", length: { min: 2, max: 50 } },
    { path: "capacity", type: "String" },
  ],
};
