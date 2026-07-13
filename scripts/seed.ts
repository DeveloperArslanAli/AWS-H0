import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSeed() {
  console.log("Starting seed process...");
  console.warn("WARNING: This will delete existing connections for the test user!");

  // 1. Get or Create a User
  let { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Failed to list users:", usersError);
    process.exit(1);
  }

  let user = users.users.find(u => u.email === "test@auroraguard.dev");

  if (!user) {
    console.log("No test users found. Creating a test user...");
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: "test@auroraguard.dev",
      password: "password123",
      email_confirm: true,
      user_metadata: { full_name: "Test User", company: "AuroraGuard Inc" },
    });
    if (createError) {
      console.error("Failed to create test user:", createError);
      process.exit(1);
    }
    if (!newUser.user) throw new Error("No user returned");
    user = newUser.user;
    console.log("Created test user:", user.email);
  } else {
    console.log("Found existing user:", user.email);
  }

  const userId = user.id;

  // 2. Ensure Profile exists
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: user.user_metadata?.full_name || "Test User",
    company: user.user_metadata?.company || "AuroraGuard",
    plan: "pro",
  });
  if (profileError) {
    console.error("Failed to upsert profile:", profileError);
  }

  // 3. Delete existing connections to start fresh (cascade deletes queries, metrics, alerts)
  console.log("Cleaning up existing data for user...");
  await supabase.from("db_connections").delete().eq("user_id", userId);

  // 4. Create dummy connections
  const { data: connections, error: connError } = await supabase
    .from("db_connections")
    .insert([
      {
        user_id: userId,
        name: "production-primary-pg",
        engine: "postgres",
        host: "prod-db-1.auroraguard.local",
        port: 5432,
        database_name: "main",
        environment: "production",
        region: "us-east-1",
        status: "healthy",
        ssl_enabled: true,
      },
      {
        user_id: userId,
        name: "staging-analytics",
        engine: "mysql",
        host: "stage-db-anlyt.auroraguard.local",
        port: 3306,
        database_name: "analytics",
        environment: "staging",
        region: "us-west-2",
        status: "degraded",
        ssl_enabled: true,
      }
    ])
    .select("id, name");

  if (connError || !connections) {
    console.error("Failed to create connections:", connError);
    process.exit(1);
  }
  console.log(`Created ${connections.length} connections.`);

  const prodConnId = connections[0].id;
  
  // 5. Create metrics (time series for the last 2 hours, 10 min intervals)
  console.log("Generating metrics data...");
  const metrics = [];
  const now = Date.now();
  for (let i = 12; i >= 0; i--) {
    const ts = new Date(now - i * 10 * 60 * 1000).toISOString();
    // Some random fluctuation
    const cpu = 40 + Math.random() * 20 + (i === 2 ? 30 : 0); // Spiked 20 mins ago
    const qps = 500 + Math.random() * 200;
    const latency = cpu > 80 ? 450 : 45 + Math.random() * 15;
    
    metrics.push({
      user_id: userId,
      connection_id: prodConnId,
      ts,
      cpu_pct: cpu.toFixed(2),
      active_connections: Math.floor(10 + Math.random() * 10),
      qps: qps.toFixed(2),
      latency_p95_ms: latency.toFixed(2),
      cache_hit_ratio: (98 - Math.random() * 2).toFixed(2),
      storage_gb: 120.5,
    });
  }
  
  const { error: metricError } = await supabase.from("metrics").insert(metrics);
  if (metricError) {
    console.error("Failed to insert metrics:", metricError);
  } else {
    console.log(`Inserted ${metrics.length} metric points.`);
  }

  // 6. Create top queries
  console.log("Generating queries data...");
  const { data: queries, error: queryError } = await supabase.from("queries").insert([
    {
      user_id: userId,
      connection_id: prodConnId,
      query_text: "SELECT * FROM users WHERE email = $1",
      query_hash: "q1",
      calls: 154320,
      mean_exec_ms: 1.2,
      total_exec_ms: 154320 * 1.2,
      rows_read: 154320,
      status: "healthy"
    },
    {
      user_id: userId,
      connection_id: prodConnId,
      query_text: "SELECT * FROM orders LEFT JOIN users ON users.id = orders.user_id ORDER BY created_at DESC",
      query_hash: "q2",
      calls: 1250,
      mean_exec_ms: 850.5, // Slow
      total_exec_ms: 1250 * 850.5,
      rows_read: 12500000,
      status: "critical"
    },
    {
      user_id: userId,
      connection_id: prodConnId,
      query_text: "SELECT count(*) FROM audit_logs WHERE action LIKE '%login%'",
      query_hash: "q3",
      calls: 450,
      mean_exec_ms: 320.1, // Slow
      total_exec_ms: 450 * 320.1,
      rows_read: 800000,
      status: "slow"
    }
  ]).select("id, query_text");

  if (queryError) {
    console.error("Failed to insert queries:", queryError);
  } else {
    console.log(`Inserted ${queries ? queries.length : 0} queries.`);
  }

  // 7. Create alerts
  console.log("Generating alerts data...");
  const { error: alertError } = await supabase.from("alerts").insert([
    {
      user_id: userId,
      connection_id: prodConnId,
      severity: "critical",
      status: "open",
      title: "Elevated query latency",
      description: "Measured p95 latency 450ms exceeds 500ms.",
      metric: "latency_p95_ms",
      threshold: 500,
      observed_value: 450,
    },
    {
      user_id: userId,
      connection_id: prodConnId,
      severity: "warning",
      status: "acknowledged",
      title: "High CPU utilisation",
      description: "Process CPU 82.5% exceeds 80%.",
      metric: "cpu_pct",
      threshold: 80,
      observed_value: 82.5,
    }
  ]);
  
  if (alertError) {
    console.error("Failed to insert alerts:", alertError);
  } else {
    console.log("Inserted alerts.");
  }

  console.log("Seed complete! You can now log into the dashboard with:");
  console.log("Email: test@auroraguard.dev");
  console.log("Password: password123");
}

runSeed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
