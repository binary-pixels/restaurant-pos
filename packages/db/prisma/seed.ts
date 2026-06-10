import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.credit.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.table.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.specOption.deleteMany();
  await prisma.spec.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  // Create demo store
  const store = await prisma.store.create({
    data: {
      name: "好味道餐厅",
      slug: "haoweidao",
      address: "北京市朝阳区美食街88号",
      phone: "010-88886666",
    },
  });

  console.log(`Created store: ${store.name}`);

  // Create admin user (password: admin123)
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      storeId: store.id,
      name: "管理员",
      email: "admin@example.com",
      phone: "13800000001",
      passwordHash,
      role: "STORE_ADMIN",
    },
  });

  console.log(`Created user: ${admin.name} (admin@example.com / admin123)`);

  // Create cashier
  const cashier = await prisma.user.create({
    data: {
      storeId: store.id,
      name: "收银员小李",
      email: "cashier@example.com",
      phone: "13800000002",
      passwordHash: await bcrypt.hash("cashier123", 12),
      role: "CASHIER",
    },
  });

  // Create kitchen worker
  await prisma.user.create({
    data: {
      storeId: store.id,
      name: "厨师老王",
      email: "kitchen@example.com",
      passwordHash: await bcrypt.hash("kitchen123", 12),
      role: "KITCHEN",
    },
  });

  // Create tags
  await prisma.tag.createMany({
    data: [
      { storeId: store.id, name: "黄金会员", color: "#f59e0b" },
      { storeId: store.id, name: "爱吃肉", color: "#ef4444" },
      { storeId: store.id, name: "VIP", color: "#8b5cf6" },
    ],
  });

  // Create categories
  const hotDishes = await prisma.category.create({
    data: { storeId: store.id, name: "热菜", sortOrder: 1 },
  });
  const coldDishes = await prisma.category.create({
    data: { storeId: store.id, name: "凉菜", sortOrder: 2 },
  });
  const grill = await prisma.category.create({
    data: { storeId: store.id, name: "烧烤", sortOrder: 3 },
  });
  const drinks = await prisma.category.create({
    data: { storeId: store.id, name: "酒水", sortOrder: 4 },
  });
  const staple = await prisma.category.create({
    data: { storeId: store.id, name: "主食", sortOrder: 5 },
  });

  console.log("Created 5 categories");

  // Create products - Hot Dishes
  const products: any[] = [
    { catId: hotDishes.id, name: "宫保鸡丁", price: 38, costPrice: 15, unit: "份", stock: 100, sortOrder: 1 },
    { catId: hotDishes.id, name: "鱼香肉丝", price: 32, costPrice: 12, unit: "份", stock: 100, sortOrder: 2 },
    { catId: hotDishes.id, name: "回锅肉", price: 35, costPrice: 14, unit: "份", stock: 80, sortOrder: 3 },
    { catId: hotDishes.id, name: "麻婆豆腐", price: 22, costPrice: 6, unit: "份", stock: 150, sortOrder: 4 },
    { catId: hotDishes.id, name: "水煮鱼", price: 68, costPrice: 30, unit: "份", stock: 50, sortOrder: 5 },
    { catId: hotDishes.id, name: "糖醋里脊", price: 36, costPrice: 16, unit: "份", stock: 80, sortOrder: 6 },
    { catId: hotDishes.id, name: "番茄炒蛋", price: 18, costPrice: 5, unit: "份", stock: 200, sortOrder: 7 },
    { catId: hotDishes.id, name: "红烧排骨", price: 48, costPrice: 22, unit: "份", stock: 60, sortOrder: 8 },

    // Cold Dishes
    { catId: coldDishes.id, name: "拍黄瓜", price: 12, costPrice: 3, unit: "份", stock: 200, sortOrder: 1 },
    { catId: coldDishes.id, name: "口水鸡", price: 28, costPrice: 12, unit: "份", stock: 80, sortOrder: 2 },
    { catId: coldDishes.id, name: "凉拌木耳", price: 16, costPrice: 5, unit: "份", stock: 150, sortOrder: 3 },
    { catId: coldDishes.id, name: "皮蛋豆腐", price: 15, costPrice: 4, unit: "份", stock: 120, sortOrder: 4 },

    // Grill
    { catId: grill.id, name: "羊肉串", price: 5, costPrice: 2, unit: "串", stock: 500, sortOrder: 1 },
    { catId: grill.id, name: "牛肉串", price: 6, costPrice: 2.5, unit: "串", stock: 400, sortOrder: 2 },
    { catId: grill.id, name: "烤鸡翅", price: 8, costPrice: 3, unit: "个", stock: 300, sortOrder: 3 },
    { catId: grill.id, name: "烤鱼", price: 58, costPrice: 25, unit: "条", stock: 30, sortOrder: 4 },
    { catId: grill.id, name: "烤茄子", price: 12, costPrice: 4, unit: "个", stock: 100, sortOrder: 5 },
    { catId: grill.id, name: "烤韭菜", price: 8, costPrice: 2, unit: "份", stock: 100, sortOrder: 6 },

    // Drinks
    { catId: drinks.id, name: "青岛啤酒", price: 8, costPrice: 4, unit: "瓶", stock: 500, sortOrder: 1 },
    { catId: drinks.id, name: "可乐", price: 5, costPrice: 3, unit: "听", stock: 300, sortOrder: 2 },
    { catId: drinks.id, name: "雪碧", price: 5, costPrice: 3, unit: "听", stock: 300, sortOrder: 3 },
    { catId: drinks.id, name: "椰汁", price: 10, costPrice: 6, unit: "瓶", stock: 200, sortOrder: 4 },
    { catId: drinks.id, name: "酸梅汤", price: 12, costPrice: 4, unit: "扎", stock: 50, sortOrder: 5 },
    { catId: drinks.id, name: "矿泉水", price: 3, costPrice: 1, unit: "瓶", stock: 500, sortOrder: 6 },

    // Staple
    { catId: staple.id, name: "白米饭", price: 2, costPrice: 0.5, unit: "碗", stock: 500, sortOrder: 1 },
    { catId: staple.id, name: "蛋炒饭", price: 15, costPrice: 4, unit: "份", stock: 100, sortOrder: 2 },
    { catId: staple.id, name: "馒头", price: 2, costPrice: 0.5, unit: "个", stock: 300, sortOrder: 3 },
    { catId: staple.id, name: "手工水饺", price: 22, costPrice: 8, unit: "份", stock: 80, sortOrder: 4 },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: p.catId,
        name: p.name,
        price: p.price,
        costPrice: p.costPrice,
        unit: p.unit,
        stock: p.stock,
        sortOrder: p.sortOrder,
      },
    });
  }

  console.log(`Created ${products.length} products`);

  // Create specs for some products
  const gbjd = await prisma.product.findFirst({ where: { name: "宫保鸡丁" } });
  if (gbjd) {
    const spec = await prisma.spec.create({
      data: {
        productId: gbjd.id,
        name: "辣度",
        type: "SELECT",
        isRequired: true,
      },
    });
    await prisma.specOption.createMany({
      data: [
        { specId: spec.id, label: "不辣", sortOrder: 1 },
        { specId: spec.id, label: "微辣", sortOrder: 2 },
        { specId: spec.id, label: "中辣", priceAdj: 0, sortOrder: 3 },
        { specId: spec.id, label: "特辣", priceAdj: 0, sortOrder: 4 },
      ],
    });

    const spec2 = await prisma.spec.create({
      data: {
        productId: gbjd.id,
        name: "份量",
        type: "SELECT",
        isRequired: true,
      },
    });
    await prisma.specOption.createMany({
      data: [
        { specId: spec2.id, label: "小份", sortOrder: 1 },
        { specId: spec2.id, label: "大份", priceAdj: 10, sortOrder: 2 },
      ],
    });
  }

  // Create zones
  const zone1 = await prisma.zone.create({
    data: { storeId: store.id, name: "一楼大厅", sortOrder: 1 },
  });
  const zone2 = await prisma.zone.create({
    data: { storeId: store.id, name: "二楼包间", sortOrder: 2 },
  });

  console.log("Created 2 zones");

  // Create tables for zone 1
  const tables1 = [
    { label: "A01", capacity: 4, posX: 0, posY: 0 },
    { label: "A02", capacity: 4, posX: 1, posY: 0 },
    { label: "A03", capacity: 6, posX: 2, posY: 0 },
    { label: "A04", capacity: 4, posX: 3, posY: 0 },
    { label: "A05", capacity: 2, posX: 0, posY: 1 },
    { label: "A06", capacity: 4, posX: 1, posY: 1 },
    { label: "A07", capacity: 6, posX: 2, posY: 1 },
    { label: "A08", capacity: 4, posX: 3, posY: 1 },
    { label: "A09", capacity: 8, posX: 0, posY: 2 },
    { label: "A10", capacity: 4, posX: 1, posY: 2 },
    { label: "A11", capacity: 4, posX: 2, posY: 2 },
    { label: "A12", capacity: 2, posX: 3, posY: 2 },
  ];

  for (const t of tables1) {
    await prisma.table.create({
      data: {
        zoneId: zone1.id,
        label: t.label,
        capacity: t.capacity,
        posX: t.posX,
        posY: t.posY,
        sortOrder: tables1.indexOf(t),
      },
    });
  }

  // Create tables for zone 2
  const tables2 = [
    { label: "V01", capacity: 10, posX: 0, posY: 0 },
    { label: "V02", capacity: 8, posX: 1, posY: 0 },
    { label: "V03", capacity: 12, posX: 0, posY: 1 },
    { label: "V05", capacity: 8, posX: 1, posY: 1 },
    { label: "V06", capacity: 6, posX: 0, posY: 2 },
    { label: "V08", capacity: 16, posX: 1, posY: 2 },
  ];

  for (const t of tables2) {
    await prisma.table.create({
      data: {
        zoneId: zone2.id,
        label: t.label,
        capacity: t.capacity,
        posX: t.posX,
        posY: t.posY,
        sortOrder: tables2.indexOf(t),
      },
    });
  }

  console.log(`Created ${tables1.length + tables2.length} tables`);
  console.log("\nSeed complete!");
  console.log("---");
  console.log("Admin login: admin@example.com / admin123");
  console.log("Cashier login: cashier@example.com / cashier123");
  console.log("Kitchen login: kitchen@example.com / kitchen123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
