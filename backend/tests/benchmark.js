process.env.NODE_ENV = "test";
const autocannon = require("autocannon");
const { server } = require("../server");
const dbConnect = require("../config/db");

async function runBenchmark() {
  await dbConnect();
  const testServer = server.listen(0);
  const port = testServer.address().port;
  const url = `http://localhost:${port}/`;

  console.log(`Starting load benchmark against ${url} with 50 concurrent connections for 5 seconds...\n`);

  const result = await autocannon({
    url,
    connections: 50,
    duration: 5,
    pipelining: 1,
  });

  console.log(autocannon.printResult(result));

  testServer.close();
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
