module.exports = class Student {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    mongomodels,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.studentModel = mongomodels.student;
    this.schoolModel = mongomodels.school;
    this.managers = managers;
    this.cache = cache;

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

    let school = await this.schoolModel.findById(actualSchoolId);
    if (!school) return { error: "School not found" };

    let createdStudent = await this.studentModel.create(student);

    // Invalidate student cache
    await this.cache.set(`students:${actualSchoolId}`, null);

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

    let existing = await this.studentModel.findById(studentId);
    if (!existing) {
      return { error: "Student not found" };
    }

    if (
      user.role !== "superadmin" &&
      existing.schoolId.toString() !== user.schoolId.toString()
    ) {
      return { error: "Access denied to this student" };
    }

    const studentUpdate = {};
    if (firstName) studentUpdate.firstName = firstName;
    if (lastName) studentUpdate.lastName = lastName;
    if (classroomId) studentUpdate.classroomId = classroomId;

    let result = await this.validators.student.updateStudent({
      studentId,
      ...studentUpdate,
    });
    if (result) return result;

    let updatedStudent = await this.studentModel.findByIdAndUpdate(
      studentId,
      studentUpdate,
      { new: true },
    );

    // Invalidate student cache
    await this.cache.set(`students:${existing.schoolId}`, null);

    return updatedStudent;
  }

  async getStudents({ schoolId, classroomId, __longToken, __schooladmin }) {
    let user = __schooladmin;
    let querySchoolId =
      user.role === "superadmin" && schoolId ? schoolId : user.schoolId;

    let filter = {};
    if (querySchoolId) filter.schoolId = querySchoolId;
    if (classroomId) filter.classroomId = classroomId;

    // Try to get from cache
    const cacheKey = `students:${querySchoolId || "all"}:${classroomId || "all"}`;
    const cachedStudents = await this.cache.get(cacheKey);
    if (cachedStudents) {
      return { students: JSON.parse(cachedStudents), cached: true };
    }

    const students = await this.studentModel.find(filter);

    // Store in cache for 5 minutes
    await this.cache.set(cacheKey, JSON.stringify(students), { ttl: 300 });

    return { students };
  }

  async deleteStudent({ studentId, __longToken, __schooladmin }) {
    if (!studentId) return { error: "studentId is required" };

    let user = __schooladmin;
    let existing = await this.studentModel.findById(studentId);
    if (!existing) {
      return { error: "Student not found" };
    }

    if (
      user.role !== "superadmin" &&
      existing.schoolId.toString() !== user.schoolId.toString()
    ) {
      return { error: "Access denied to this student" };
    }

    let res = await this.studentModel.findByIdAndDelete(studentId);

    // Invalidate student cache
    await this.cache.set(`students:${existing.schoolId}`, null);

    return { success: !!res };
  }
};
