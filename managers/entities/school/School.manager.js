module.exports = class School {
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

    school._label = "school";

    let createdSchool = await this.oyster.call("add_block", school);
    return createdSchool;
  }

  async updateSchool({ schoolId, name, address, __longToken, __superadmin }) {
    const school = { schoolId, name, address };
    let result = await this.validators.school.updateSchool(school);
    if (result) return result;

    let existing = await this.oyster.call("get_block", schoolId);
    if (existing.error || existing._label !== "school") {
      return { error: "School not found" };
    }

    let updatedSchool = await this.oyster.call("update_block", {
      _id: schoolId,
      name,
      address,
    });
    return updatedSchool;
  }

  async getSchools({ __longToken, __superadmin }) {
    // Find all blocks with label 'school'
    const result = await this.oyster.call("search_find", {
      query: { text: "*" },
      label: "school",
    });
    return { schools: result.docs || [] };
  }

  async deleteSchool({ schoolId, __longToken, __superadmin }) {
    if (!schoolId) return { error: "schoolId is required" };

    // Optionally check if exists first
    let res = await this.oyster.call("delete_block", schoolId);
    return { success: res.ok };
  }
};
