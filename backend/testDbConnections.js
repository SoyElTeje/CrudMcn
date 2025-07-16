const { getPool } = require("./db");

(async () => {
  try {
    // 1. List all databases
    const pool = await getPool();
    const dbsResult = await pool
      .request()
      .query("SELECT name FROM sys.databases");
    const dbs = dbsResult.recordset.map((row) => row.name);
    console.log("📚 Databases on server:");
    dbs.forEach((db) => console.log("  -", db));

    // 2. Test APPDATA database
    console.log("\n🔍 Testing APPDATA database:");
    try {
      const appdataPool = await getPool("APPDATA");
      const currentDbResult = await appdataPool
        .request()
        .query("SELECT DB_NAME() as CurrentDatabase");
      console.log(
        `  Current database: ${currentDbResult.recordset[0].CurrentDatabase}`
      );

      const appdataTablesResult = await appdataPool
        .request()
        .query(
          `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`
        );
      console.log("  Tables:");
      appdataTablesResult.recordset.forEach((row) => {
        console.log(`    - ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
      });
    } catch (err) {
      console.log(`  ❌ Error accessing APPDATA: ${err.message}`);
    }

    // 3. Test BD_ABM1 database
    console.log("\n🔍 Testing BD_ABM1 database:");
    try {
      const abm1Pool = await getPool("BD_ABM1");
      const currentDbResult = await abm1Pool
        .request()
        .query("SELECT DB_NAME() as CurrentDatabase");
      console.log(
        `  Current database: ${currentDbResult.recordset[0].CurrentDatabase}`
      );

      const abm1TablesResult = await abm1Pool
        .request()
        .query(
          `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`
        );
      console.log("  Tables:");
      abm1TablesResult.recordset.forEach((row) => {
        console.log(`    - ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
      });
    } catch (err) {
      console.log(`  ❌ Error accessing BD_ABM1: ${err.message}`);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
  process.exit(0);
})();
