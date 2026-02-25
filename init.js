const config = require("./config/index.config.js");
const Oyster = require("oyster-db");

async function init() {
  const cache = require("./cache/cache.dbh")({
    prefix: config.dotEnv.CACHE_PREFIX,
    url: config.dotEnv.CACHE_REDIS,
  });
  const oyster = new Oyster({
    url: config.dotEnv.OYSTER_REDIS,
    prefix: config.dotEnv.OYSTER_PREFIX,
  });

  const blockManager = oyster.oyster.blockManager;

  const schemas = [
    {
      label: "user",
      schema: [{ path: "email", store: "text", sortable: false }],
    },
    {
      label: "school",
      schema: [{ path: "name", store: "text", sortable: false }],
    },
    {
      label: "classroom",
      schema: [{ path: "schoolId", store: "tag", sortable: false }],
    },
    {
      label: "student",
      schema: [
        { path: "schoolId", store: "tag", sortable: false },
        { path: "classroomId", store: "tag", sortable: false },
      ],
    },
  ];

  for (let index of schemas) {
    try {
      console.log("Creating index for " + index.label + "...");
      await blockManager.search_index(index);
      console.log("Index " + index.label + " created.");
    } catch (err) {
      console.error("Error creating index " + index.label + ":", err.message);
    }
  }

  console.log("Done!");
  process.exit(0);
}

init();
