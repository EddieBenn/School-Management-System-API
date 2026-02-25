module.exports = class Student {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    oyster,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.oyster = oyster;
    this.managers = managers;

    this.adminExposed = [
      "post=createStudent",
      "put=updateStudent",
      "get=getStudents",
      "delete=deleteStudent",
    ];
  }

  async createStudent({
    firstName,
    lastName,
    classroomId,
    schoolId,
    __longToken,
    __schooladmin,
  }) {
    let user = __schooladmin;
    let actualSchoolId = user.role === "superadmin" ? schoolId : user.schoolId;

    const student = { firstName, lastName, schoolId: actualSchoolId };
    if (classroomId) student.classroomId = classroomId;

    let result = await this.validators.student.createStudent(student);
    if (result) return result;

    if (!actualSchoolId)
      return { error: "School ID required to create a student" };

    let school = await this.oyster.call("get_block", actualSchoolId);
    if (school.error) return { error: "School not found" };

    student._label = "student";
    let createdStudent = await this.oyster.call("add_block", student);

    return createdStudent;
  }

  async updateStudent({
    studentId,
    firstName,
    lastName,
    classroomId,
    __longToken,
    __schooladmin,
  }) {
    let user = __schooladmin;

    let existing = await this.oyster.call("get_block", studentId);
    if (existing.error || existing._label !== "student") {
      return { error: "Student not found" };
    }

    if (user.role !== "superadmin" && existing.schoolId !== user.schoolId) {
      return { error: "Access denied to this student" };
    }

    const studentUpdate = { studentId };
    if (firstName) studentUpdate.firstName = firstName;
    if (lastName) studentUpdate.lastName = lastName;
    if (classroomId) studentUpdate.classroomId = classroomId;

    let result = await this.validators.student.updateStudent(studentUpdate);
    if (result) return result;

    let updatedStudent = await this.oyster.call("update_block", {
      _id: studentId,
      ...studentUpdate,
    });
    return updatedStudent;
  }

  async getStudents({ schoolId, classroomId, __longToken, __schooladmin }) {
    let user = __schooladmin;
    let querySchoolId =
      user.role === "superadmin" && schoolId ? schoolId : user.schoolId;

    let fieldsSearch = [];
    if (querySchoolId) fieldsSearch.push("@schoolId:" + querySchoolId);
    if (classroomId) fieldsSearch.push("@classroomId:" + classroomId);

    let searchBody = { label: "student" };
    if (fieldsSearch.length > 0) {
      searchBody.query = { fields: fieldsSearch };
    } else {
      searchBody.query = { text: "*" };
    }

    const result = await this.oyster.call("search_find", searchBody);
    return { students: result.docs || [] };
  }

  async deleteStudent({ studentId, __longToken, __schooladmin }) {
    if (!studentId) return { error: "studentId is required" };

    let user = __schooladmin;
    let existing = await this.oyster.call("get_block", studentId);
    if (existing.error || existing._label !== "student") {
      return { error: "Student not found" };
    }

    if (user.role !== "superadmin" && existing.schoolId !== user.schoolId) {
      return { error: "Access denied to this student" };
    }

    let res = await this.oyster.call("delete_block", studentId);
    return { success: res.ok };
  }
};
