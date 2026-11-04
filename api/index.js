import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let authRoutes,
  menuRoutes,
  categoryRoutes,
  foodRoutes,
  barcodeRoutes,
  transactionRoutes,
  paymentRoutes,
  dashboardRoutes,
  recommendationRoutes;
let routesLoaded = false;
let loadError = null;

try {
  authRoutes = (await import("../apps/backend/src/routes/auth.routes.js"))
    .default;
  menuRoutes = (await import("../apps/backend/src/routes/menu.routes.js"))
    .default;
  categoryRoutes = (
    await import("../apps/backend/src/routes/category.routes.js")
  ).default;
  foodRoutes = (await import("../apps/backend/src/routes/food.routes.js"))
    .default;
  barcodeRoutes = (await import("../apps/backend/src/routes/barcode.routes.js"))
    .default;
  transactionRoutes = (
    await import("../apps/backend/src/routes/transaction.routes.js")
  ).default;
  paymentRoutes = (await import("../apps/backend/src/routes/payment.routes.js"))
    .default;
  dashboardRoutes = (
    await import("../apps/backend/src/routes/dashboard.routes.js")
  ).default;
  recommendationRoutes = (
    await import("../apps/backend/src/routes/recommendation.routes.js")
  ).default;
  routesLoaded = true;
} catch (error) {
  loadError = error;
  console.error("Failed to load routes:", error);
}

app.all("*", async (req, res, next) => {
  const queryPath = req.query.path || "";

  if (queryPath === "health" || req.path === "/health") {
    return res.json({
      success: true,
      message: "API is running on Vercel",
      routesLoaded,
      error: loadError ? loadError.message : null,
      timestamp: new Date().toISOString(),
    });
  }

  if (queryPath === "debug" || req.path === "/debug") {
    let dbStatus = {};
    try {
      const { pool } = await import("../apps/backend/src/db/index.js");
      const tables = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
      );
      const txCount = await pool.query("SELECT count(*) FROM transactions");
      const txPaid = await pool.query(
        "SELECT count(*) FROM transactions WHERE payment_status IN ('paid', 'completed')"
      );
      const txItems = await pool.query("SELECT count(*) FROM transaction_items");
      const hasApriori = tables.rows.some((r) => r.table_name === "apriori_rules");
      let rulesCount = 0;
      if (hasApriori) {
        const rCount = await pool.query("SELECT count(*) FROM apriori_rules");
        rulesCount = parseInt(rCount.rows[0].count, 10);
      }
      dbStatus = {
        connected: true,
        tables: tables.rows.map((r) => r.table_name),
        transactionsTotal: parseInt(txCount.rows[0].count, 10),
        transactionsPaid: parseInt(txPaid.rows[0].count, 10),
        transactionItemsTotal: parseInt(txItems.rows[0].count, 10),
        hasAprioriTable: hasApriori,
        rulesCount,
      };
    } catch (e) {
      dbStatus = { connected: false, error: e.message };
    }
    return res.json({
      queryPath,
      url: req.url,
      path: req.path,
      routesLoaded,
      dbStatus,
    });
  }

  if (!queryPath) {
    return res.json({
      success: true,
      message: "Menu Digital API",
      endpoints: [
        "/auth",
        "/menus",
        "/categories",
        "/foods",
        "/barcodes",
        "/transactions",
        "/payment",
        "/dashboard",
        "/recommendations",
      ],
    });
  }

  const pathParts = queryPath.split("/");
  const basePath = pathParts[0];
  const subPath = "/" + pathParts.slice(1).join("/");

  req.url = subPath || "/";
  req.baseUrl = "/" + basePath;

  if (!routesLoaded) {
    return res.status(500).json({
      success: false,
      message: "Routes not loaded",
      error: loadError ? loadError.message : "Unknown error",
    });
  }

  switch (basePath) {
    case "auth":
      return authRoutes(req, res, next);
    case "menus":
      return menuRoutes(req, res, next);
    case "categories":
      return categoryRoutes(req, res, next);
    case "foods":
      return foodRoutes(req, res, next);
    case "barcodes":
    case "barcode":
      return barcodeRoutes(req, res, next);
    case "transactions":
      return transactionRoutes(req, res, next);
    case "payment":
      return paymentRoutes(req, res, next);
    case "dashboard":
      return dashboardRoutes(req, res, next);
    case "recommendations":
      return recommendationRoutes(req, res, next);
    default:
      return res.status(404).json({
        success: false,
        message: "API endpoint not found",
        queryPath,
        basePath,
        subPath,
      });
  }
});

export default app;
