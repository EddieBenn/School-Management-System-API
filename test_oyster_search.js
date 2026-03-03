const Cortex = require("ion-cortex");
const Oyster = require("oyster-db");

async function run() {
  const oyster = new Oyster({
    url: "redis://127.0.0.1:6379",
    prefix: "testapp"
  });
  
  await oyster.connect();
  
  const email = "edidiongndaobong5@gmail.com";
  
  // Try to find the user
  const escaped = email.replace(/[@.]/g, "\\$&");
  console.log("Escaped:", escaped);
  
  const emailSearch = await oyster.call("search_find", {
    query: { text: "@email:" + escaped },
    label: "user",
  });
  
  console.log("Search result with escape:", JSON.stringify(emailSearch, null, 2));

  const emailSearch2 = await oyster.call("search_find", {
    query: { text: "@email:\"" + email + "\"" },
    label: "user",
  });
  console.log("Search result with quotes:", JSON.stringify(emailSearch2, null, 2));
  
  process.exit(0);
}
run();
