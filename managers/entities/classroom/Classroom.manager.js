module.exports = class Classroom {
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
    this.classroomModel = mongomodels.classroom;
    this.schoolModel = mongomodels.school;
    this.managers = managers;
    this.cache = cache;

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
      capacity: Number(capacity),
      schoolId: actualSchoolId,
    };
    let result = await this.validators.classroom.createClassroom({
      ...classroom,
      capacity: capacity.toString(), // Validator expects string based on schema
    });
    if (result) return result;

    if (!actualSchoolId)
      return { error: "School ID required to create a classroom" };

    // Verify school exists
    let school = await this.schoolModel.findById(actualSchoolId);
    if (!school) return { error: "School not found" };

    let createdClassroom = await this.classroomModel.create(classroom);

    // Invalidate classroom cache for this school
    await this.cache.set(`classrooms:${actualSchoolId}`, null);

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

    let existing = await this.classroomModel.findById(classroomId);
    if (!existing) {
      return { error: "Classroom not found" };
    }

    if (
      user.role !== "superadmin" &&
      existing.schoolId.toString() !== user.schoolId.toString()
    ) {
      return { error: "Access denied to this classroom" };
    }

    const classroomUpdate = {};
    if (name) classroomUpdate.name = name;
    if (capacity) classroomUpdate.capacity = Number(capacity);

    let result = await this.validators.classroom.updateClassroom({
      classroomId,
      ...classroomUpdate,
      ...(capacity && { capacity: capacity.toString() }),
    });
    if (result) return result;

    let updatedClassroom = await this.classroomModel.findByIdAndUpdate(
      classroomId,
      classroomUpdate,
      { new: true },
    );

    // Invalidate classroom cache for this school
    await this.cache.set(`classrooms:${existing.schoolId}`, null);

    return updatedClassroom;
  }

  async getClassrooms({ schoolId, __longToken, __schooladmin }) {
    let user = __schooladmin;
    let querySchoolId =
      user.role === "superadmin" && schoolId ? schoolId : user.schoolId;

    if (!querySchoolId) {
      const classrooms = await this.classroomModel.find({});
      return { classrooms };
    }

    // Try to get from cache
    const cachedClassrooms = await this.cache.get(
      `classrooms:${querySchoolId}`,
    );
    if (cachedClassrooms) {
      return { classrooms: JSON.parse(cachedClassrooms), cached: true };
    }

    const classrooms = await this.classroomModel.find({
      schoolId: querySchoolId,
    });

    // Store in cache for 5 minutes
    await this.cache.set(
      `classrooms:${querySchoolId}`,
      JSON.stringify(classrooms),
      { ttl: 300 },
    );

    return { classrooms };
  }

  async deleteClassroom({ classroomId, __longToken, __schooladmin }) {
    if (!classroomId) return { error: "classroomId is required" };

    let user = __schooladmin;
    let existing = await this.classroomModel.findById(classroomId);
    if (!existing) {
      return { error: "Classroom not found" };
    }

    if (
      user.role !== "superadmin" &&
      existing.schoolId.toString() !== user.schoolId.toString()
    ) {
      return { error: "Access denied to this classroom" };
    }

    let res = await this.classroomModel.findByIdAndDelete(classroomId);

    // Invalidate classroom cache for this school
    await this.cache.set(`classrooms:${existing.schoolId}`, null);

    return { success: !!res };
  }
};
