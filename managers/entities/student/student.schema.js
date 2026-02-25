module.exports = {
  createStudent: [
    { path: "firstName", type: "string", required: true },
    { path: "lastName", type: "string", required: true },
    { path: "schoolId", type: "string", required: true },
    { path: "classroomId", type: "string" },
  ],
  updateStudent: [
    { path: "studentId", type: "string", required: true },
    { path: "firstName", type: "string" },
    { path: "lastName", type: "string" },
    { path: "classroomId", type: "string" },
  ],
};
