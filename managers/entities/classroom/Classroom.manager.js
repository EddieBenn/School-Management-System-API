module.exports = class Classroom {
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

    // Exposed endpoints logic
    this.adminExposed = [
      "post=createClassroom",
      "put=updateClassroom",
      "get=getClassrooms",
      "delete=deleteClassroom",
    ];
  }

  async createClassroom({
    name,
    capacity,
    schoolId,
    __longToken,
    __schooladmin,
  }) {
    let user = __schooladmin;
    // Enforce school logic
    let actualSchoolId = user.role === "superadmin" ? schoolId : user.schoolId;

    const classroom = {
      name,
      capacity: capacity.toString(),
      schoolId: actualSchoolId,
    };
    let result = await this.validators.classroom.createClassroom(classroom);
    if (result) return result;

    if (!actualSchoolId)
      return { error: "School ID required to create a classroom" };

    // Verify school exists
    let school = await this.oyster.call("get_block", actualSchoolId);
    if (school.error) return { error: "School not found" };

    classroom._label = "classroom";
    let createdClassroom = await this.oyster.call("add_block", classroom);

    return createdClassroom;
  }

  async updateClassroom({
    classroomId,
    name,
    capacity,
    __longToken,
    __schooladmin,
  }) {
    let user = __schooladmin;

    let existing = await this.oyster.call("get_block", classroomId);
    if (existing.error || existing._label !== "classroom") {
      return { error: "Classroom not found" };
    }

    if (user.role !== "superadmin" && existing.schoolId !== user.schoolId) {
      return { error: "Access denied to this classroom" };
    }

    const classroomUpdate = { classroomId };
    if (name) classroomUpdate.name = name;
    if (capacity) classroomUpdate.capacity = capacity.toString();

    let result =
      await this.validators.classroom.updateClassroom(classroomUpdate);
    if (result) return result;

    let updatedClassroom = await this.oyster.call("update_block", {
      _id: classroomId,
      ...classroomUpdate,
    });
    return updatedClassroom;
  }

  async getClassrooms({ schoolId, __longToken, __schooladmin }) {
    let user = __schooladmin;
    let querySchoolId =
      user.role === "superadmin" && schoolId ? schoolId : user.schoolId;

    if (!querySchoolId) {
      const result = await this.oyster.call("search_find", {
        query: { text: "*" },
        label: "classroom",
      });
      return { classrooms: result.docs || [] };
    }

    const result = await this.oyster.call("search_find", {
      query: { fields: ["@schoolId:" + querySchoolId] },
      label: "classroom",
    });

    return { classrooms: result.docs || [] };
  }

  async deleteClassroom({ classroomId, __longToken, __schooladmin }) {
    if (!classroomId) return { error: "classroomId is required" };

    let user = __schooladmin;
    let existing = await this.oyster.call("get_block", classroomId);
    if (existing.error || existing._label !== "classroom") {
      return { error: "Classroom not found" };
    }

    if (user.role !== "superadmin" && existing.schoolId !== user.schoolId) {
      return { error: "Access denied to this classroom" };
    }

    let res = await this.oyster.call("delete_block", classroomId);
    return { success: res.ok };
  }
};
