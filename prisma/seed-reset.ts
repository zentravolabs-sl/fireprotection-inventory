// ============================================================
// prisma/seed-reset.ts
//
// ✅  KEEPS  : user, account, session, verification,
//              permission, role_permission
// ❌  CLEARS : all other business tables
// 🌱  SEEDS  : categories, sub-categories, suppliers,
//              customers, inventory, stock, tools,
//              labour types + labours, and 1 sample project
//
// Run: npx tsx prisma/seed-reset.ts
// ============================================================

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";
import { seedPermissions } from "./seed-permissions";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient(
  { adapter } as ConstructorParameters<typeof PrismaClient>[0]
);

// ── helpers ──────────────────────────────────────────────────
function pad(n: number, width = 3) {
  return String(n).padStart(width, "0");
}

// ── 0. Clear all business tables (users preserved) ───────────
async function clearBusinessData() {
  console.log("🗑️   Clearing all business data (users kept)...");

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      customer_refill_replacement,
      customer_refill,
      delivery_note_item,
      delivery_note,
      fire_extinguisher_assignment,
      fire_extinguisher_unit,
      project_estimate_material,
      project_transfer_item,
      project_transfer,
      project_staff,
      labour_ot,
      project_labour,
      tool_history,
      tool_assignment_item,
      tool_assignment,
      tool,
      material_return_item,
      material_return,
      project_material,
      material_issue_item,
      material_issue,
      material_request_item,
      material_request,
      project_engineer,
      project_assignment,
      project_expense,
      project_transport,
      project,
      customer,
      pipe_cut_piece,
      stock_movement,
      stock_batch,
      stock_receive_item,
      stock_receive,
      inventory,
      sub_category,
      category,
      supplier,
      audit_log,
      labour,
      labour_type
    RESTART IDENTITY CASCADE
  `);

  console.log("  ✅ Business data cleared.\n");
}

// ── 1. CATEGORIES & SUB-CATEGORIES ───────────────────────────
async function seedCategories() {
  console.log("  📂 Categories & Sub-Categories...");

  const categoryData: { name: string; subs: string[] }[] = [
    {
      name: "Pipes & Fittings",
      subs: [
        "Black Steel Pipe",
        "GI Pipe",
        "CPVC Pipe",
        "Pipe Fittings – Elbow",
        "Pipe Fittings – Tee",
        "Pipe Fittings – Reducer",
        "Flanges",
        "Couplings",
      ],
    },
    {
      name: "Sprinklers",
      subs: [
        "Upright Sprinkler",
        "Pendant Sprinkler",
        "Sidewall Sprinkler",
        "ESFR Sprinkler",
        "Concealed Sprinkler",
      ],
    },
    {
      name: "Valves",
      subs: [
        "Gate Valve",
        "Butterfly Valve",
        "Check Valve",
        "Globe Valve",
        "Ball Valve",
        "Pressure Reducing Valve",
        "Flow Control Valve",
      ],
    },
    {
      name: "Fire Extinguishers",
      subs: [
        "CO2 Extinguisher",
        "Dry Chemical Powder",
        "Foam Extinguisher",
        "Water Mist",
        "Clean Agent",
      ],
    },
    {
      name: "Hoses & Reels",
      subs: ["Fire Hose", "Hose Reel", "Hose Reel Cabinet", "Hose Coupling"],
    },
    {
      name: "Detection & Alarm",
      subs: [
        "Smoke Detector",
        "Heat Detector",
        "Manual Call Point",
        "Fire Alarm Panel",
        "Hooter / Sounder",
        "Beam Detector",
      ],
    },
    {
      name: "Pumps & Equipment",
      subs: [
        "Jockey Pump",
        "Main Fire Pump",
        "Diesel Pump",
        "Pump Controller",
        "Pressure Gauge",
        "Flow Meter",
      ],
    },
    {
      name: "Hangers & Supports",
      subs: [
        "Pipe Hanger",
        "Clevis Hanger",
        "Threaded Rod",
        "U-Bolt",
        "Beam Clamp",
      ],
    },
    {
      name: "Consumables & Hardware",
      subs: [
        "Teflon Tape",
        "Thread Compound",
        "Welding Rods",
        "Bolts & Nuts",
        "Gaskets",
        "Cable Ties",
        "Safety Signs",
      ],
    },
  ];

  const categoryMap: Record<string, number> = {};
  const subCategoryMap: Record<string, number> = {};

  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { categoryName: cat.name },
      update: {},
      create: { categoryName: cat.name },
      select: { id: true },
    });
    categoryMap[cat.name] = c.id;

    for (const subName of cat.subs) {
      const sc = await prisma.subCategory.upsert({
        where: { categoryId_name: { categoryId: c.id, name: subName } },
        update: {},
        create: { categoryId: c.id, name: subName },
        select: { id: true },
      });
      subCategoryMap[`${cat.name}|${subName}`] = sc.id;
    }
  }

  console.log(
    `     ✅ ${categoryData.length} categories, ${Object.keys(subCategoryMap).length} sub-categories`
  );
  return { categoryMap, subCategoryMap };
}

// ── 2. SUPPLIERS ──────────────────────────────────────────────
async function seedSuppliers() {
  console.log("  🏭 Suppliers...");

  const suppliers = [
    {
      company: "Gulf Fire & Safety Trading LLC",
      contactPerson: "Rashid Al Mansoori",
      phone: "+971-4-321-7890",
      email: "orders@gulffiresafety.ae",
      address: "Al Quoz Industrial Area, Dubai, UAE",
    },
    {
      company: "Emirates Steel & Pipe Co.",
      contactPerson: "Vijay Kumar",
      phone: "+971-2-555-4321",
      email: "sales@emiratessteel.ae",
      address: "Mussafah Industrial Zone, Abu Dhabi, UAE",
    },
    {
      company: "Tyco Fire Protection Products",
      contactPerson: "James Bennett",
      phone: "+971-4-807-7000",
      email: "uae.sales@tyco.com",
      address: "JAFZA, Dubai, UAE",
    },
    {
      company: "Viking Group MENA",
      contactPerson: "Sara Al Ahmadi",
      phone: "+971-4-299-0100",
      email: "mena@vikingcorp.com",
      address: "Dubai Internet City, Dubai, UAE",
    },
    {
      company: "Al Barrak General Trading",
      contactPerson: "Mohammed Al Barrak",
      phone: "+971-6-765-4321",
      email: "procurement@albarrak.ae",
      address: "Ajman Industrial Area, Ajman, UAE",
    },
    {
      company: "Honeywell Life Safety ME",
      contactPerson: "Karen Peters",
      phone: "+971-4-450-5555",
      email: "me.lifesafety@honeywell.com",
      address: "Business Bay, Dubai, UAE",
    },
    {
      company: "Naffco FZCO",
      contactPerson: "Ali Hassan",
      phone: "+971-4-880-5757",
      email: "trading@naffco.com",
      address: "JAFZA, Dubai, UAE",
    },
  ];

  const result: { company: string; id: number }[] = [];
  for (const s of suppliers) {
    const rec = await prisma.supplier.upsert({
      where: { company: s.company },
      update: {},
      create: s,
      select: { id: true, company: true },
    });
    result.push(rec);
  }

  console.log(`     ✅ ${result.length} suppliers`);
  return result;
}

// ── 3. CUSTOMERS ──────────────────────────────────────────────
async function seedCustomers() {
  console.log("  🤝 Customers...");

  const customers = [
    {
      companyName: "Emaar Properties PJSC",
      contactPerson: "Khaled Al Rashed",
      phone: "+971-4-367-3333",
      email: "fm@emaar.ae",
      address: "Downtown Dubai, Dubai, UAE",
    },
    {
      companyName: "DAMAC Properties",
      contactPerson: "Nadia Khoury",
      phone: "+971-4-301-9999",
      email: "contracts@damacproperties.com",
      address: "Business Bay, Dubai, UAE",
    },
    {
      companyName: "Dubai Airports",
      contactPerson: "Saeed Al Falasi",
      phone: "+971-4-224-5555",
      email: "contracts@dubaiairports.ae",
      address: "Dubai International Airport, Dubai, UAE",
    },
    {
      companyName: "Aldar Properties",
      contactPerson: "Maryam Al Junaibi",
      phone: "+971-2-810-5555",
      email: "projects@aldar.com",
      address: "Yas Island, Abu Dhabi, UAE",
    },
    {
      companyName: "Majid Al Futtaim Properties",
      contactPerson: "David Collins",
      phone: "+971-4-294-9999",
      email: "engineering@majidalfuttaim.com",
      address: "Mall of the Emirates, Dubai, UAE",
    },
    {
      companyName: "ADNOC Group",
      contactPerson: "Hamad Al Zaabi",
      phone: "+971-2-602-0000",
      email: "fire.safety@adnoc.ae",
      address: "Corniche Road, Abu Dhabi, UAE",
    },
    {
      companyName: "Union Properties PJSC",
      contactPerson: "Marwan Haddad",
      phone: "+971-4-323-3000",
      email: "fm@unionproperties.ae",
      address: "Motor City, Dubai, UAE",
    },
    // Extra customer for sample project
    {
      companyName: "Al Futtaim Engineering LLC",
      contactPerson: "Mohammed Al Rashid",
      phone: "+971-50-123-4567",
      email: "projects@alfuttaim-eng.ae",
      address: "Business Bay, Dubai, UAE",
    },
  ];

  const result: { companyName: string; id: number }[] = [];
  for (const c of customers) {
    const rec = await prisma.customer.upsert({
      where: { companyName: c.companyName },
      update: {},
      create: c,
      select: { id: true, companyName: true },
    });
    result.push(rec);
  }

  console.log(`     ✅ ${result.length} customers`);
  return result;
}

// ── 4. INVENTORY ──────────────────────────────────────────────
async function seedInventory(
  subCategoryMap: Record<string, number>,
  categoryMap: Record<string, number>
) {
  console.log("  📦 Inventory items...");

  type InventoryItem = {
    itemCode: string;
    name: string;
    brand: string;
    minStock: number;
    rackLocation: string;
    warehouse: string;
    defaultSellPrice: number;
    categoryName: string;
    subCategoryName: string;
  };

  const items: InventoryItem[] = [
    // Pipes & Fittings
    { itemCode: "PIP-001", name: 'Black Steel Pipe 1"',           brand: "Emirates Steel", minStock: 50,  rackLocation: "R-A1", warehouse: "Main", defaultSellPrice: 28,    categoryName: "Pipes & Fittings", subCategoryName: "Black Steel Pipe" },
    { itemCode: "PIP-002", name: 'Black Steel Pipe 1.5"',         brand: "Emirates Steel", minStock: 40,  rackLocation: "R-A2", warehouse: "Main", defaultSellPrice: 42,    categoryName: "Pipes & Fittings", subCategoryName: "Black Steel Pipe" },
    { itemCode: "PIP-003", name: 'Black Steel Pipe 2"',           brand: "Emirates Steel", minStock: 30,  rackLocation: "R-A3", warehouse: "Main", defaultSellPrice: 58,    categoryName: "Pipes & Fittings", subCategoryName: "Black Steel Pipe" },
    { itemCode: "PIP-004", name: 'Black Steel Pipe 3"',           brand: "Emirates Steel", minStock: 20,  rackLocation: "R-A4", warehouse: "Main", defaultSellPrice: 95,    categoryName: "Pipes & Fittings", subCategoryName: "Black Steel Pipe" },
    { itemCode: "PIP-005", name: 'GI Pipe 1"',                    brand: "Al Barrak",      minStock: 25,  rackLocation: "R-B1", warehouse: "Main", defaultSellPrice: 35,    categoryName: "Pipes & Fittings", subCategoryName: "GI Pipe" },
    { itemCode: "FIT-001", name: 'Elbow 1" 90deg Black Steel',    brand: "Tyco",           minStock: 100, rackLocation: "R-C1", warehouse: "Main", defaultSellPrice: 4.5,   categoryName: "Pipes & Fittings", subCategoryName: "Pipe Fittings – Elbow" },
    { itemCode: "FIT-002", name: 'Elbow 1.5" 90deg Black Steel',  brand: "Tyco",           minStock: 80,  rackLocation: "R-C2", warehouse: "Main", defaultSellPrice: 7.2,   categoryName: "Pipes & Fittings", subCategoryName: "Pipe Fittings – Elbow" },
    { itemCode: "FIT-003", name: 'Tee 1" Black Steel',            brand: "Tyco",           minStock: 80,  rackLocation: "R-D1", warehouse: "Main", defaultSellPrice: 6.8,   categoryName: "Pipes & Fittings", subCategoryName: "Pipe Fittings – Tee" },
    { itemCode: "FIT-004", name: 'Reducer 2"x1" Black Steel',     brand: "Tyco",           minStock: 50,  rackLocation: "R-E1", warehouse: "Main", defaultSellPrice: 8.5,   categoryName: "Pipes & Fittings", subCategoryName: "Pipe Fittings – Reducer" },
    { itemCode: "FLG-001", name: 'Flange 2" PN16',                brand: "Emirates Steel", minStock: 20,  rackLocation: "R-F1", warehouse: "Main", defaultSellPrice: 22,    categoryName: "Pipes & Fittings", subCategoryName: "Flanges" },
    // Sprinklers
    { itemCode: "SPR-001", name: 'Upright Sprinkler 1/2" 68C K5.6',   brand: "Viking", minStock: 200, rackLocation: "R-G1", warehouse: "Main", defaultSellPrice: 12.5, categoryName: "Sprinklers", subCategoryName: "Upright Sprinkler" },
    { itemCode: "SPR-002", name: 'Pendant Sprinkler 1/2" 68C K5.6',   brand: "Viking", minStock: 200, rackLocation: "R-G2", warehouse: "Main", defaultSellPrice: 13.0, categoryName: "Sprinklers", subCategoryName: "Pendant Sprinkler" },
    { itemCode: "SPR-003", name: 'Sidewall Sprinkler 1/2" 68C K5.6',  brand: "Viking", minStock: 100, rackLocation: "R-G3", warehouse: "Main", defaultSellPrice: 18.5, categoryName: "Sprinklers", subCategoryName: "Sidewall Sprinkler" },
    { itemCode: "SPR-004", name: 'Concealed Pendant Sprinkler 1/2" 68C', brand: "Tyco", minStock: 100, rackLocation: "R-G4", warehouse: "Main", defaultSellPrice: 28.0, categoryName: "Sprinklers", subCategoryName: "Concealed Sprinkler" },
    { itemCode: "SPR-005", name: 'ESFR Sprinkler K14 3/4" 74C',       brand: "Viking", minStock: 50,  rackLocation: "R-G5", warehouse: "Main", defaultSellPrice: 48.0, categoryName: "Sprinklers", subCategoryName: "ESFR Sprinkler" },
    // Valves
    { itemCode: "VAL-001", name: 'Gate Valve 2" Flanged',           brand: "Naffco",   minStock: 10, rackLocation: "R-H1", warehouse: "Main", defaultSellPrice: 85,  categoryName: "Valves", subCategoryName: "Gate Valve" },
    { itemCode: "VAL-002", name: 'Gate Valve 4" Flanged',           brand: "Naffco",   minStock: 8,  rackLocation: "R-H2", warehouse: "Main", defaultSellPrice: 185, categoryName: "Valves", subCategoryName: "Gate Valve" },
    { itemCode: "VAL-003", name: 'Butterfly Valve 4" Wafer Type',   brand: "Honeywell",minStock: 10, rackLocation: "R-H3", warehouse: "Main", defaultSellPrice: 145, categoryName: "Valves", subCategoryName: "Butterfly Valve" },
    { itemCode: "VAL-004", name: 'Check Valve 2" Swing Type',       brand: "Viking",   minStock: 8,  rackLocation: "R-H4", warehouse: "Main", defaultSellPrice: 95,  categoryName: "Valves", subCategoryName: "Check Valve" },
    { itemCode: "VAL-005", name: 'Pressure Reducing Valve 2"',      brand: "Honeywell",minStock: 5,  rackLocation: "R-H5", warehouse: "Main", defaultSellPrice: 320, categoryName: "Valves", subCategoryName: "Pressure Reducing Valve" },
    { itemCode: "VAL-006", name: 'Ball Valve 1" Threaded',          brand: "Al Barrak",minStock: 30, rackLocation: "R-H6", warehouse: "Main", defaultSellPrice: 28,  categoryName: "Valves", subCategoryName: "Ball Valve" },
    // Fire Extinguishers
    { itemCode: "EXT-001", name: "CO2 Extinguisher 5kg",      brand: "Naffco", minStock: 20, rackLocation: "R-I1", warehouse: "Main", defaultSellPrice: 185, categoryName: "Fire Extinguishers", subCategoryName: "CO2 Extinguisher" },
    { itemCode: "EXT-002", name: "CO2 Extinguisher 9kg",      brand: "Naffco", minStock: 15, rackLocation: "R-I2", warehouse: "Main", defaultSellPrice: 290, categoryName: "Fire Extinguishers", subCategoryName: "CO2 Extinguisher" },
    { itemCode: "EXT-003", name: "DCP Extinguisher 6kg",      brand: "Naffco", minStock: 30, rackLocation: "R-I3", warehouse: "Main", defaultSellPrice: 95,  categoryName: "Fire Extinguishers", subCategoryName: "Dry Chemical Powder" },
    { itemCode: "EXT-004", name: "DCP Extinguisher 9kg",      brand: "Naffco", minStock: 20, rackLocation: "R-I4", warehouse: "Main", defaultSellPrice: 135, categoryName: "Fire Extinguishers", subCategoryName: "Dry Chemical Powder" },
    { itemCode: "EXT-005", name: "Foam AFFF Extinguisher 9L", brand: "Naffco", minStock: 10, rackLocation: "R-I5", warehouse: "Main", defaultSellPrice: 165, categoryName: "Fire Extinguishers", subCategoryName: "Foam Extinguisher" },
    { itemCode: "EXT-006", name: "Clean Agent FM200 7kg",     brand: "Tyco",   minStock: 5,  rackLocation: "R-I6", warehouse: "Main", defaultSellPrice: 520, categoryName: "Fire Extinguishers", subCategoryName: "Clean Agent" },
    // Hoses & Reels
    { itemCode: "HOS-001", name: "Fire Hose 64mm x 30m",         brand: "Gulf Fire", minStock: 10, rackLocation: "R-J1", warehouse: "Main", defaultSellPrice: 165, categoryName: "Hoses & Reels", subCategoryName: "Fire Hose" },
    { itemCode: "HOS-002", name: "Hose Reel 30m Swinging Type",   brand: "Naffco",    minStock: 5,  rackLocation: "R-J2", warehouse: "Main", defaultSellPrice: 380, categoryName: "Hoses & Reels", subCategoryName: "Hose Reel" },
    { itemCode: "HOS-003", name: "Hose Reel Cabinet SS",          brand: "Naffco",    minStock: 5,  rackLocation: "R-J3", warehouse: "Main", defaultSellPrice: 280, categoryName: "Hoses & Reels", subCategoryName: "Hose Reel Cabinet" },
    // Detection & Alarm
    { itemCode: "DET-001", name: "Addressable Smoke Detector",   brand: "Honeywell", minStock: 50, rackLocation: "R-K1", warehouse: "Main", defaultSellPrice: 85, categoryName: "Detection & Alarm", subCategoryName: "Smoke Detector" },
    { itemCode: "DET-002", name: "Conventional Smoke Detector",  brand: "Honeywell", minStock: 30, rackLocation: "R-K2", warehouse: "Main", defaultSellPrice: 45, categoryName: "Detection & Alarm", subCategoryName: "Smoke Detector" },
    { itemCode: "DET-003", name: "Fixed Heat Detector 57C",      brand: "Honeywell", minStock: 30, rackLocation: "R-K3", warehouse: "Main", defaultSellPrice: 55, categoryName: "Detection & Alarm", subCategoryName: "Heat Detector" },
    { itemCode: "DET-004", name: "Break Glass Manual Call Point", brand: "Honeywell", minStock: 20, rackLocation: "R-K4", warehouse: "Main", defaultSellPrice: 38, categoryName: "Detection & Alarm", subCategoryName: "Manual Call Point" },
    { itemCode: "DET-005", name: "Electronic Hooter Sounder 24V",brand: "Honeywell", minStock: 20, rackLocation: "R-K5", warehouse: "Main", defaultSellPrice: 42, categoryName: "Detection & Alarm", subCategoryName: "Hooter / Sounder" },
    // Pumps & Equipment
    { itemCode: "PMP-001", name: "Jockey Pump 2.2kW",         brand: "Grundfos", minStock: 2,  rackLocation: "R-L1", warehouse: "Main", defaultSellPrice: 3800, categoryName: "Pumps & Equipment", subCategoryName: "Jockey Pump" },
    { itemCode: "PMP-002", name: "Pressure Gauge 0-16 Bar 63mm", brand: "Wika",  minStock: 20, rackLocation: "R-L2", warehouse: "Main", defaultSellPrice: 32,   categoryName: "Pumps & Equipment", subCategoryName: "Pressure Gauge" },
    // Hangers & Supports
    { itemCode: "HNG-001", name: 'Pipe Hanger 1" Clevis', brand: "Tolco",   minStock: 200, rackLocation: "R-M1", warehouse: "Main", defaultSellPrice: 3.5, categoryName: "Hangers & Supports", subCategoryName: "Clevis Hanger" },
    { itemCode: "HNG-002", name: "Threaded Rod M10 x 3m", brand: "Generic", minStock: 100, rackLocation: "R-M2", warehouse: "Main", defaultSellPrice: 8.5, categoryName: "Hangers & Supports", subCategoryName: "Threaded Rod" },
    { itemCode: "HNG-003", name: 'U-Bolt 1"',             brand: "Generic", minStock: 150, rackLocation: "R-M3", warehouse: "Main", defaultSellPrice: 2.2, categoryName: "Hangers & Supports", subCategoryName: "U-Bolt" },
    // Consumables & Hardware
    { itemCode: "CON-001", name: "PTFE Teflon Tape 12mm",                  brand: "Generic", minStock: 100, rackLocation: "R-N1", warehouse: "Main", defaultSellPrice: 1.2,  categoryName: "Consumables & Hardware", subCategoryName: "Teflon Tape" },
    { itemCode: "CON-002", name: "Thread Sealant Compound 300ml",          brand: "Henkel",  minStock: 30,  rackLocation: "R-N2", warehouse: "Main", defaultSellPrice: 18.5, categoryName: "Consumables & Hardware", subCategoryName: "Thread Compound" },
    { itemCode: "CON-003", name: "M10 Bolt and Nut Galvanised (pack 50)", brand: "Generic", minStock: 50,  rackLocation: "R-N3", warehouse: "Main", defaultSellPrice: 12.0, categoryName: "Consumables & Hardware", subCategoryName: "Bolts & Nuts" },
    { itemCode: "CON-004", name: "Rubber Gasket 2in Ring",                 brand: "Generic", minStock: 50,  rackLocation: "R-N4", warehouse: "Main", defaultSellPrice: 3.8,  categoryName: "Consumables & Hardware", subCategoryName: "Gaskets" },
    { itemCode: "CON-005", name: "Cable Ties 200mm (pack 100)",            brand: "Generic", minStock: 30,  rackLocation: "R-N5", warehouse: "Main", defaultSellPrice: 6.5,  categoryName: "Consumables & Hardware", subCategoryName: "Cable Ties" },
  ];

  const idMap: Record<string, number> = {};
  let created = 0;

  for (const item of items) {
    const catId = categoryMap[item.categoryName];
    const subId = subCategoryMap[`${item.categoryName}|${item.subCategoryName}`];

    if (!catId || !subId) {
      console.warn(`     ⚠️  Missing cat/sub for ${item.itemCode}`);
      continue;
    }

    let fetched = await prisma.inventory.findUnique({
      where: { itemCode: item.itemCode },
      select: { id: true },
    });

    if (!fetched) {
      const catIdNum = Number(catId);
      const subIdNum = Number(subId);
      const now = new Date().toISOString();
      await prisma.$executeRawUnsafe(
        `INSERT INTO inventory
           ("itemCode", name, brand, unit, "minStock", "rackLocation", warehouse,
            "defaultSellPrice", "expiryControlled", "categoryId", "subCategoryId",
            "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT ("itemCode") DO NOTHING`,
        item.itemCode,
        item.name,
        item.brand,
        "pcs",
        item.minStock,
        item.rackLocation,
        item.warehouse,
        item.defaultSellPrice,
        false,
        catIdNum,
        subIdNum,
        now,
        now
      );

      fetched = await prisma.inventory.findUnique({
        where: { itemCode: item.itemCode },
        select: { id: true },
      });
      created++;
    }

    if (fetched) {
      idMap[item.itemCode] = fetched.id;
    }
  }

  console.log(
    `     ✅ ${created} inventory items created (${Object.keys(idMap).length} resolved)`
  );
  return items
    .filter((item) => idMap[item.itemCode] !== undefined)
    .map((item) => ({ ...item, id: idMap[item.itemCode] }));
}

// ── 5. STOCK RECEIVES + BATCHES + MOVEMENTS ───────────────────
async function seedStock(
  inventoryItems: { itemCode: string; name: string; id: number }[],
  suppliers: { company: string; id: number }[],
  adminUserId: string
) {
  console.log("  📬 Stock Receives / Batches / Movements...");

  const sup1 = suppliers.find((s) => s.company === "Gulf Fire & Safety Trading LLC")!;
  const sup2 = suppliers.find((s) => s.company === "Emirates Steel & Pipe Co.")!;
  const sup3 = suppliers.find((s) => s.company === "Tyco Fire Protection Products")!;
  const sup4 = suppliers.find((s) => s.company === "Naffco FZCO")!;
  const sup5 = suppliers.find((s) => s.company === "Honeywell Life Safety ME")!;

  type ReceiveLine = {
    inventoryId: number;
    qty: number;
    unitCost: number;
    batchNo: string;
  };

  const receives: {
    receiveNo: string;
    receiveDate: Date;
    supplierId: number;
    referenceNo: string;
    lines: ReceiveLine[];
  }[] = [
    {
      receiveNo: "GRN-2026-001",
      receiveDate: new Date("2026-07-10"),
      supplierId: sup2.id,
      referenceNo: "PO-2026-0071",
      lines: [
        { inventoryId: inventoryItems.find((i) => i.itemCode === "PIP-001")!.id, qty: 200, unitCost: 22, batchNo: "BSP-2026-A" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "PIP-002")!.id, qty: 150, unitCost: 34, batchNo: "BSP-2026-B" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "PIP-003")!.id, qty: 100, unitCost: 48, batchNo: "BSP-2026-C" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "PIP-004")!.id, qty: 60,  unitCost: 78, batchNo: "BSP-2026-D" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "PIP-005")!.id, qty: 80,  unitCost: 28, batchNo: "GIP-2026-A" },
      ],
    },
    {
      receiveNo: "GRN-2026-002",
      receiveDate: new Date("2026-07-22"),
      supplierId: sup3.id,
      referenceNo: "PO-2026-0082",
      lines: [
        { inventoryId: inventoryItems.find((i) => i.itemCode === "FIT-001")!.id, qty: 400, unitCost: 3.2,  batchNo: "FIT-EL1-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "FIT-002")!.id, qty: 300, unitCost: 5.5,  batchNo: "FIT-EL2-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "FIT-003")!.id, qty: 300, unitCost: 5.0,  batchNo: "FIT-TE1-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "FIT-004")!.id, qty: 200, unitCost: 6.8,  batchNo: "FIT-RD1-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "FLG-001")!.id, qty: 50,  unitCost: 17,   batchNo: "FLG-2026-A" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "SPR-001")!.id, qty: 500, unitCost: 9.0,  batchNo: "VKG-UP-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "SPR-002")!.id, qty: 500, unitCost: 9.5,  batchNo: "VKG-PD-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "SPR-003")!.id, qty: 200, unitCost: 14,   batchNo: "VKG-SW-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "SPR-004")!.id, qty: 200, unitCost: 21,   batchNo: "TYC-CC-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "SPR-005")!.id, qty: 80,  unitCost: 36,   batchNo: "VKG-ES-2026" },
      ],
    },
    {
      receiveNo: "GRN-2026-003",
      receiveDate: new Date("2026-08-05"),
      supplierId: sup4.id,
      referenceNo: "PO-2026-0093",
      lines: [
        { inventoryId: inventoryItems.find((i) => i.itemCode === "VAL-001")!.id, qty: 30,  unitCost: 65,  batchNo: "NFC-GV2-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "VAL-002")!.id, qty: 20,  unitCost: 148, batchNo: "NFC-GV4-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "VAL-003")!.id, qty: 25,  unitCost: 112, batchNo: "HNW-BF4-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "VAL-004")!.id, qty: 20,  unitCost: 75,  batchNo: "VKG-CV2-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "VAL-005")!.id, qty: 10,  unitCost: 255, batchNo: "HNW-PRV-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "VAL-006")!.id, qty: 80,  unitCost: 22,  batchNo: "ALB-BL1-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "EXT-001")!.id, qty: 50,  unitCost: 145, batchNo: "NFC-CO5-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "EXT-002")!.id, qty: 30,  unitCost: 228, batchNo: "NFC-CO9-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "EXT-003")!.id, qty: 80,  unitCost: 72,  batchNo: "NFC-DP6-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "EXT-004")!.id, qty: 50,  unitCost: 105, batchNo: "NFC-DP9-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "EXT-005")!.id, qty: 25,  unitCost: 128, batchNo: "NFC-FM9-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "EXT-006")!.id, qty: 12,  unitCost: 420, batchNo: "TYC-CA7-2026" },
      ],
    },
    {
      receiveNo: "GRN-2026-004",
      receiveDate: new Date("2026-08-18"),
      supplierId: sup1.id,
      referenceNo: "PO-2026-0104",
      lines: [
        { inventoryId: inventoryItems.find((i) => i.itemCode === "HOS-001")!.id, qty: 25,  unitCost: 132, batchNo: "GFS-HF64-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "HOS-002")!.id, qty: 12,  unitCost: 305, batchNo: "NFC-HR30-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "HOS-003")!.id, qty: 10,  unitCost: 225, batchNo: "NFC-HRC-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "HNG-001")!.id, qty: 500, unitCost: 2.8, batchNo: "TLC-CH1-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "HNG-002")!.id, qty: 200, unitCost: 6.5, batchNo: "GEN-TR10-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "HNG-003")!.id, qty: 300, unitCost: 1.8, batchNo: "GEN-UB1-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "CON-001")!.id, qty: 200, unitCost: 0.9, batchNo: "GEN-TT-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "CON-002")!.id, qty: 60,  unitCost: 14,  batchNo: "HNK-SC-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "CON-003")!.id, qty: 100, unitCost: 9.5, batchNo: "GEN-BN10-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "CON-004")!.id, qty: 100, unitCost: 3.0, batchNo: "GEN-GK2-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "CON-005")!.id, qty: 60,  unitCost: 5.0, batchNo: "GEN-CT-2026" },
      ],
    },
    {
      receiveNo: "GRN-2026-005",
      receiveDate: new Date("2026-08-25"),
      supplierId: sup5.id,
      referenceNo: "PO-2026-0112",
      lines: [
        { inventoryId: inventoryItems.find((i) => i.itemCode === "DET-001")!.id, qty: 120, unitCost: 68,   batchNo: "HNW-ASD-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "DET-002")!.id, qty: 80,  unitCost: 35,   batchNo: "HNW-CSD-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "DET-003")!.id, qty: 80,  unitCost: 42,   batchNo: "HNW-HD57-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "DET-004")!.id, qty: 60,  unitCost: 29,   batchNo: "HNW-MCP-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "DET-005")!.id, qty: 60,  unitCost: 32,   batchNo: "HNW-SND-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "PMP-001")!.id, qty: 4,   unitCost: 3200, batchNo: "GRF-JP-2026" },
        { inventoryId: inventoryItems.find((i) => i.itemCode === "PMP-002")!.id, qty: 40,  unitCost: 25,   batchNo: "WKA-PG16-2026" },
      ],
    },
  ];

  let totalBatches = 0;

  for (const recv of receives) {
    const existing = await prisma.stockReceive.findUnique({
      where: { receiveNo: recv.receiveNo },
    });
    if (existing) continue;

    const header = await prisma.stockReceive.create({
      data: {
        receiveNo: recv.receiveNo,
        receiveDate: recv.receiveDate,
        supplierId: recv.supplierId,
        receivedBy: adminUserId,
        referenceNo: recv.referenceNo,
        status: "CONFIRMED",
      },
      select: { id: true },
    });

    for (const line of recv.lines) {
      if (!line.inventoryId) continue;

      const item = await prisma.stockReceiveItem.create({
        data: {
          stockReceiveId: header.id,
          inventoryId: line.inventoryId,
          qty: line.qty,
          unitCost: line.unitCost,
          batchNo: line.batchNo,
        },
        select: { id: true },
      });

      const batch = await prisma.stockBatch.create({
        data: {
          inventoryId: line.inventoryId,
          stockReceiveItemId: item.id,
          batchNo: line.batchNo,
          receivedQty: line.qty,
          availableQty: line.qty,
          unitCost: line.unitCost,
          receiveDate: recv.receiveDate,
          warehouse: "Main",
        },
        select: { id: true },
      });

      await prisma.stockMovement.create({
        data: {
          inventoryId: line.inventoryId,
          stockBatchId: batch.id,
          qty: line.qty,
          movementType: "IN",
          referenceType: "STOCK_RECEIVE",
          referenceId: header.id,
          createdBy: adminUserId,
          remarks: `GRN ${recv.receiveNo}`,
        },
      });

      totalBatches++;
    }
  }

  console.log(
    `     ✅ ${receives.length} stock receives, ${totalBatches} batches & movements`
  );
}

// ── 6. TOOLS ──────────────────────────────────────────────────
async function seedTools() {
  console.log("  🔧 Tools...");

  const tools = [
    { toolCode: "TL-001", name: "Pipe Threading Machine",        serialNo: "TM-RIDGID-001",        condition: "Good",  status: "Available" },
    { toolCode: "TL-002", name: "Pipe Threading Machine",        serialNo: "TM-RIDGID-002",        condition: "Good",  status: "Available" },
    { toolCode: "TL-003", name: "Pipe Cutter 3inch",             serialNo: "PC-RIDGID-003",        condition: "Good",  status: "Available" },
    { toolCode: "TL-004", name: "Pipe Cutter 4inch",             serialNo: "PC-RIDGID-004",        condition: "Fair",  status: "Available" },
    { toolCode: "TL-005", name: "Pipe Wrench 18inch",            serialNo: "PW-STANLRY-005",       condition: "Good",  status: "Available" },
    { toolCode: "TL-006", name: "Pipe Wrench 24inch",            serialNo: "PW-STANLRY-006",       condition: "Good",  status: "Available" },
    { toolCode: "TL-007", name: "Angle Grinder 5inch",           serialNo: "AG-BOSCH-007",         condition: "Good",  status: "Available" },
    { toolCode: "TL-008", name: "Angle Grinder 5inch",           serialNo: "AG-BOSCH-008",         condition: "Good",  status: "InUse" },
    { toolCode: "TL-009", name: "Electric Drill 13mm",           serialNo: "DR-BOSCH-009",         condition: "Good",  status: "Available" },
    { toolCode: "TL-010", name: "Electric Drill 13mm",           serialNo: "DR-BOSCH-010",         condition: "Good",  status: "Available" },
    { toolCode: "TL-011", name: "Welding Machine 250A",          serialNo: "WM-LINCOLN-011",       condition: "Good",  status: "Available" },
    { toolCode: "TL-012", name: "Welding Machine 250A",          serialNo: "WM-LINCOLN-012",       condition: "Fair",  status: "InUse" },
    { toolCode: "TL-013", name: "Scaffolding Set (6M)",          serialNo: "SC-LAYHER-013",        condition: "Good",  status: "Available" },
    { toolCode: "TL-014", name: "Scaffolding Set (6M)",          serialNo: "SC-LAYHER-014",        condition: "Good",  status: "Available" },
    { toolCode: "TL-015", name: "Hydraulic Pressure Test Pump",  serialNo: "PT-ROTHENBERGER-015",  condition: "Good",  status: "Available" },
    { toolCode: "TL-016", name: "Pipe Bending Machine",          serialNo: "PB-RIDGID-016",        condition: "Good",  status: "Available" },
    { toolCode: "TL-017", name: "Level Laser 360°",              serialNo: "LL-BOSCH-017",         condition: "New",   status: "Available" },
    { toolCode: "TL-018", name: "Multimeter Digital",            serialNo: "MM-FLUKE-018",         condition: "Good",  status: "Available" },
    { toolCode: "TL-019", name: "Chain Block 3T",                serialNo: "CB-CM-019",            condition: "Good",  status: "Available" },
    { toolCode: "TL-020", name: "Safety Harness Set",            serialNo: "SH-3M-020",            condition: "Good",  status: "Available" },
  ] as const;

  let count = 0;
  for (const t of tools) {
    const existing = await prisma.tool.findUnique({ where: { toolCode: t.toolCode } });
    if (existing) continue;

    await prisma.tool.create({
      data: {
        toolCode: t.toolCode,
        name: t.name,
        serialNo: t.serialNo,
        condition: t.condition as any,
        status: t.status as any,
      },
    });
    count++;
  }

  console.log(`     ✅ ${count} tools`);
}

// ── 7. LABOUR TYPES & LABOURS ─────────────────────────────────
async function seedLabours() {
  console.log("  👷 Labour Types & Labours...");

  const labourTypes = [
    { name: "Plumber",               description: "Pipe fitting, threading, and installation works" },
    { name: "Fitter",                description: "Mechanical fitting and assembly works" },
    { name: "Welder",                description: "Welding and metal fabrication" },
    { name: "Electrician",           description: "Electrical wiring and panel installation" },
    { name: "Helper",                description: "General site helper / labourer" },
    { name: "Scaffolder",            description: "Scaffolding erection and dismantling" },
    { name: "Painter",               description: "Surface preparation and painting" },
    { name: "Civil Worker",          description: "Concrete, masonry, and civil works" },
    { name: "Fire Alarm Technician", description: "Fire detection and alarm system installation" },
    { name: "Supervisor",            description: "Site supervision and coordination" },
  ];

  const typeMap: Record<string, number> = {};
  for (const lt of labourTypes) {
    const rec = await prisma.labourType.upsert({
      where: { name: lt.name },
      update: {},
      create: { name: lt.name, description: lt.description },
      select: { id: true },
    });
    typeMap[lt.name] = rec.id;
  }

  const labours = [
    { labourCode: "LB-001", name: "Muhammed Arshad",  typeName: "Plumber",               nic: "LK-ARSHAD-001",  phone: "+971-55-111-0001", monthlySalary: 2800 },
    { labourCode: "LB-002", name: "Rajesh Kumar",      typeName: "Plumber",               nic: "IN-RAJESH-002",   phone: "+971-55-111-0002", monthlySalary: 2800 },
    { labourCode: "LB-003", name: "Sanjay Patel",      typeName: "Fitter",                nic: "IN-SANJAY-003",   phone: "+971-55-111-0003", monthlySalary: 2600 },
    { labourCode: "LB-004", name: "Bilal Hussain",     typeName: "Fitter",                nic: "PK-BILAL-004",    phone: "+971-55-111-0004", monthlySalary: 2600 },
    { labourCode: "LB-005", name: "Ravi Shankar",      typeName: "Welder",                nic: "IN-RAVI-005",     phone: "+971-55-111-0005", monthlySalary: 3200 },
    { labourCode: "LB-006", name: "Mohammed Farooq",   typeName: "Welder",                nic: "PK-FAROOQ-006",   phone: "+971-55-111-0006", monthlySalary: 3200 },
    { labourCode: "LB-007", name: "Suresh Babu",       typeName: "Electrician",           nic: "IN-SURESH-007",   phone: "+971-55-111-0007", monthlySalary: 3000 },
    { labourCode: "LB-008", name: "Asif Iqbal",        typeName: "Helper",                nic: "PK-ASIF-008",     phone: "+971-55-111-0008", monthlySalary: 1800 },
    { labourCode: "LB-009", name: "Rajan Thomas",      typeName: "Helper",                nic: "IN-RAJAN-009",    phone: "+971-55-111-0009", monthlySalary: 1800 },
    { labourCode: "LB-010", name: "Abdul Aziz",        typeName: "Helper",                nic: "BD-AZIZ-010",     phone: "+971-55-111-0010", monthlySalary: 1800 },
    { labourCode: "LB-011", name: "Vikram Singh",      typeName: "Scaffolder",            nic: "IN-VIKRAM-011",   phone: "+971-55-111-0011", monthlySalary: 2400 },
    { labourCode: "LB-012", name: "Tahir Mehmood",     typeName: "Scaffolder",            nic: "PK-TAHIR-012",    phone: "+971-55-111-0012", monthlySalary: 2400 },
    { labourCode: "LB-013", name: "Deepak Nair",       typeName: "Plumber",               nic: "IN-DEEPAK-013",   phone: "+971-55-111-0013", monthlySalary: 2800 },
    { labourCode: "LB-014", name: "Praveen Menon",     typeName: "Fitter",                nic: "IN-PRAVEEN-014",  phone: "+971-55-111-0014", monthlySalary: 2600 },
    { labourCode: "LB-015", name: "Syed Farrukh",      typeName: "Fire Alarm Technician", nic: "PK-FARRUKH-015",  phone: "+971-55-111-0015", monthlySalary: 3400 },
    { labourCode: "LB-016", name: "George Mathew",     typeName: "Fire Alarm Technician", nic: "IN-GEORGE-016",   phone: "+971-55-111-0016", monthlySalary: 3400 },
    { labourCode: "LB-017", name: "Kiran Raj",         typeName: "Painter",               nic: "IN-KIRAN-017",    phone: "+971-55-111-0017", monthlySalary: 2200 },
    { labourCode: "LB-018", name: "Hassan Ali",        typeName: "Civil Worker",          nic: "EG-HASSAN-018",   phone: "+971-55-111-0018", monthlySalary: 2000 },
    { labourCode: "LB-019", name: "Anwar Ibrahim",     typeName: "Supervisor",            nic: "LK-ANWAR-019",    phone: "+971-55-111-0019", monthlySalary: 4500 },
    { labourCode: "LB-020", name: "Prakash Reddy",     typeName: "Supervisor",            nic: "IN-PRAKASH-020",  phone: "+971-55-111-0020", monthlySalary: 4500 },
  ];

  let count = 0;
  for (const l of labours) {
    const existing = await prisma.labour.findUnique({ where: { labourCode: l.labourCode } });
    if (existing) continue;

    await prisma.labour.create({
      data: {
        labourCode: l.labourCode,
        name: l.name,
        labourTypeId: typeMap[l.typeName],
        nic: l.nic,
        phone: l.phone,
        monthlySalary: l.monthlySalary,
        isActive: true,
      },
    });
    count++;
  }

  console.log(
    `     ✅ ${Object.keys(typeMap).length} labour types, ${count} labours`
  );
}

// ── 8. SAMPLE PROJECT ─────────────────────────────────────────
async function seedSampleProject(adminUserId: string) {
  console.log("  🏗️  Sample project...");

  // PM user (create if doesn't exist)
  const pmEmail = "pm.demo@cdnfire.ae";
  const pmPassword = "CdnFire@PM#2026!";
  const hashedPassword = await hashPassword(pmPassword);

  const pmUser = await prisma.user.upsert({
    where: { email: pmEmail },
    update: {},
    create: {
      name: "Ahmed Khalid",
      email: pmEmail,
      password: hashedPassword,
      role: "PROJECT_MANAGER",
      emailVerified: true,
      isActive: true,
      employeeCode: "EMP-PM-001",
      phone: "+971-55-987-6543",
      designation: "Senior Project Manager",
      department: "Projects",
    },
  });

  const existingAccount = await prisma.account.findFirst({
    where: { userId: pmUser.id, providerId: "credential" },
  });
  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: pmUser.id,
        accountId: pmUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });
  }

  // Customer (already seeded above, just fetch it)
  const customer = await prisma.customer.findUnique({
    where: { companyName: "Al Futtaim Engineering LLC" },
    select: { id: true },
  });
  if (!customer) throw new Error("Al Futtaim Engineering LLC customer not found.");

  // Project
  const project = await prisma.project.upsert({
    where: { projectCode: "PRJ-2026-001" },
    update: {},
    create: {
      projectCode: "PRJ-2026-001",
      projectName: "Al Futtaim HQ Fire Suppression System",
      customerId: customer.id,
      projectManagerId: pmUser.id,
      location: "Business Bay Tower, Dubai, UAE",
      startDate: new Date("2026-09-15"),
      endDate: new Date("2027-03-31"),
      status: "IN_PROGRESS",
      projectType: "PRIVATE",
      description:
        "Design, supply, and installation of a complete fire suppression and detection system for the Al Futtaim HQ tower, covering 28 floors including server rooms and parking levels.",
      projectValue: 2_850_000,
      estimatedMaterialCost: 1_200_000,
      estimatedLabourCost: 480_000,
      estimatedTransportCost: 95_000,
      estimatedEquipmentCost: 220_000,
      estimatedOtherCost: 55_000,
      estimatedTotalCost: 2_050_000,
    },
  });

  // Project assignment
  const existingAssignment = await prisma.projectAssignment.findFirst({
    where: { projectId: project.id, projectManagerId: pmUser.id },
  });
  if (!existingAssignment) {
    await prisma.projectAssignment.create({
      data: {
        projectId: project.id,
        projectManagerId: pmUser.id,
        assignedBy: adminUserId,
      },
    });
  }

  console.log(`     ✅ Project: ${project.projectCode} — ${project.projectName}`);
  console.log(`     ✅ PM: ${pmUser.name} <${pmEmail}> (pwd: ${pmPassword})`);
}

// ── MAIN ──────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱  Starting data reset + re-seed (users preserved)...\n");

  // 0. Wipe all business data
  await clearBusinessData();

  // 1. Re-seed permissions (idempotent)
  await seedPermissions(prisma);
  console.log("");

  // Resolve Super Admin user id (needed for stock movements + project assignment)
  const adminUser = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true },
  });
  if (!adminUser) {
    throw new Error(
      "No SUPER_ADMIN user found. Cannot seed stock movements.\n" +
        "Run `npx tsx prisma/seed.ts` first to create the Super Admin."
    );
  }

  console.log("  🔑 Super Admin found, continuing with seed...\n");

  // 2. Seed business data
  const { categoryMap, subCategoryMap } = await seedCategories();
  const suppliers = await seedSuppliers();
  await seedCustomers();
  const inventoryItems = await seedInventory(subCategoryMap, categoryMap);
  await seedStock(inventoryItems, suppliers, adminUser.id);
  await seedTools();
  await seedLabours();

  // 3. Sample project (with PM user)
  await seedSampleProject(adminUser.id);

  console.log("\n✨  Reset & re-seed complete. Users were preserved.\n");
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
