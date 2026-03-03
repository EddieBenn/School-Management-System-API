module.exports = class School {
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
    this.schoolModel = mongomodels.school;
    this.managers = managers;
    this.cache = cache;

    // Using __superadmin middleware ensures only superadmin can hit these
    this.adminExposed = [
      "post=createSchool",
      "put=updateSchool",
      "get=getSchools",
      "delete=deleteSchool",
    ];
  }

  async createSchool({ name, address, __longToken, __superadmin }) {
    const school = { name, address };
    let result = await this.validators.school.createSchool(school);
    if (result) return result;

    let createdSchool = await this.schoolModel.create(school);

    // Invalidate schools cache
    await this.cache.set("schools:all", null);

    return createdSchool;
  }

  async updateSchool({ schoolId, name, address, __longToken, __superadmin }) {
    const school = { schoolId, name, address };
    let result = await this.validators.school.updateSchool(school);
    if (result) return result;

    let updatedSchool = await this.schoolModel.findByIdAndUpdate(
      schoolId,
      { name, address },
      { new: true },
    );

    if (!updatedSchool) {
      return { error: "School not found" };
    }

    // Invalidate schools cache
    await this.cache.set("schools:all", null);

    return updatedSchool;
  }

  async getSchools({ __longToken, __superadmin }) {
    // Try to get from cache
    const cachedSchools = await this.cache.get("schools:all");
    if (cachedSchools) {
      return { schools: JSON.parse(cachedSchools), cached: true };
    }

    const schools = await this.schoolModel.find({});

    // Store in cache for 5 minutes
    await this.cache.set("schools:all", JSON.stringify(schools), { ttl: 300 });

    return { schools };
  }

  async deleteSchool({ schoolId, __longToken, __superadmin }) {
    if (!schoolId) return { error: "schoolId is required" };

    let res = await this.schoolModel.findByIdAndDelete(schoolId);

    // Invalidate schools cache
    await this.cache.set("schools:all", null);

    return { success: !!res };
  }
};
