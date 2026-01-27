import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * 龜三的ERP Demo - 種子資料腳本
 * 建立測試用的初始資料
 */
async function main() {
  console.log('開始建立種子資料...')

  // ===================================
  // 1. 建立角色
  // ===================================
  console.log('建立角色...')

  const roles = await Promise.all([
    prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        code: 'ADMIN',
        name: '系統管理員',
        description: '擁有系統完整權限',
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { code: 'MANAGER' },
      update: {},
      create: {
        code: 'MANAGER',
        name: '門市店長',
        description: '管理門市營運',
        isSystem: true,
        permissions: {
          create: [
            { module: 'dashboard', action: 'read' },
            { module: 'products', action: 'read' },
            { module: 'products', action: 'update' },
            { module: 'categories', action: 'read' },
            { module: 'customers', action: 'read' },
            { module: 'customers', action: 'create' },
            { module: 'customers', action: 'update' },
            { module: 'inventory', action: 'read' },
            { module: 'orders', action: 'read' },
            { module: 'orders', action: 'create' },
            { module: 'orders', action: 'update' },
            { module: 'reports', action: 'read' },
            { module: 'promotions', action: 'read' },
            { module: 'settings', action: 'read' },
          ],
        },
      },
    }),
    prisma.role.upsert({
      where: { code: 'CASHIER' },
      update: {},
      create: {
        code: 'CASHIER',
        name: '收銀員',
        description: '處理收銀與訂單',
        isSystem: true,
        permissions: {
          create: [
            { module: 'dashboard', action: 'read' },
            { module: 'products', action: 'read' },
            { module: 'customers', action: 'read' },
            { module: 'customers', action: 'create' },
            { module: 'orders', action: 'read' },
            { module: 'orders', action: 'create' },
          ],
        },
      },
    }),
    prisma.role.upsert({
      where: { code: 'WAREHOUSE' },
      update: {},
      create: {
        code: 'WAREHOUSE',
        name: '倉管人員',
        description: '管理倉庫與庫存',
        isSystem: true,
        permissions: {
          create: [
            { module: 'dashboard', action: 'read' },
            { module: 'products', action: 'read' },
            { module: 'categories', action: 'read' },
            { module: 'inventory', action: 'read' },
            { module: 'inventory', action: 'create' },
            { module: 'inventory', action: 'update' },
          ],
        },
      },
    }),
    prisma.role.upsert({
      where: { code: 'PURCHASER' },
      update: {},
      create: {
        code: 'PURCHASER',
        name: '採購人員',
        description: '處理採購作業',
        isSystem: true,
        permissions: {
          create: [
            { module: 'dashboard', action: 'read' },
            { module: 'products', action: 'read' },
            { module: 'suppliers', action: 'read' },
            { module: 'suppliers', action: 'create' },
            { module: 'suppliers', action: 'update' },
            { module: 'purchase-orders', action: 'read' },
            { module: 'purchase-orders', action: 'create' },
            { module: 'purchase-orders', action: 'update' },
            { module: 'inventory', action: 'read' },
          ],
        },
      },
    }),
    prisma.role.upsert({
      where: { code: 'VIEWER' },
      update: {},
      create: {
        code: 'VIEWER',
        name: '檢視者',
        description: '僅能檢視資料',
        isSystem: true,
        permissions: {
          create: [
            { module: 'dashboard', action: 'read' },
            { module: 'products', action: 'read' },
            { module: 'categories', action: 'read' },
            { module: 'customers', action: 'read' },
            { module: 'suppliers', action: 'read' },
            { module: 'inventory', action: 'read' },
            { module: 'orders', action: 'read' },
            { module: 'purchase-orders', action: 'read' },
            { module: 'reports', action: 'read' },
          ],
        },
      },
    }),
  ])

  const roleMap = Object.fromEntries(roles.map((r) => [r.code, r]))

  // ===================================
  // 2. 建立門市
  // ===================================
  console.log('建立門市...')

  const stores = await Promise.all([
    prisma.store.upsert({
      where: { code: 'HQ' },
      update: {},
      create: {
        code: 'HQ',
        name: '總部',
        address: '台北市信義區信義路五段7號',
        phone: '02-2345-6789',
        email: 'hq@erp-demo.com',
        manager: '王經理',
        openTime: '09:00',
        closeTime: '18:00',
        isActive: true,
      },
    }),
    prisma.store.upsert({
      where: { code: 'STORE001' },
      update: {},
      create: {
        code: 'STORE001',
        name: '台北旗艦店',
        address: '台北市中正區忠孝東路一段1號',
        phone: '02-2222-1111',
        email: 'store001@erp-demo.com',
        manager: '李店長',
        openTime: '10:00',
        closeTime: '22:00',
        isActive: true,
      },
    }),
    prisma.store.upsert({
      where: { code: 'STORE002' },
      update: {},
      create: {
        code: 'STORE002',
        name: '新竹門市',
        address: '新竹市東區光復路一段101號',
        phone: '03-5555-1234',
        email: 'store002@erp-demo.com',
        manager: '陳店長',
        openTime: '10:00',
        closeTime: '21:00',
        isActive: true,
      },
    }),
  ])

  // ===================================
  // 3. 建立倉庫
  // ===================================
  console.log('建立倉庫...')

  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { code: 'WH-MAIN' },
      update: {},
      create: {
        code: 'WH-MAIN',
        name: '主倉庫',
        address: '台北市內湖區瑞光路100號',
        phone: '02-8888-9999',
        manager: '張倉管',
        isActive: true,
        isDefault: true,
      },
    }),
    prisma.warehouse.upsert({
      where: { code: 'WH-NORTH' },
      update: {},
      create: {
        code: 'WH-NORTH',
        name: '北區倉庫',
        address: '桃園市中壢區中華路二段50號',
        phone: '03-4444-5555',
        manager: '林倉管',
        isActive: true,
        isDefault: false,
      },
    }),
  ])

  // ===================================
  // 4. 建立使用者
  // ===================================
  console.log('建立使用者...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@erp-demo.com',
        password: hashedPassword,
        name: '系統管理員',
        phone: '0912-345-678',
        roleId: roleMap.ADMIN.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'manager01' },
      update: {},
      create: {
        username: 'manager01',
        email: 'manager01@erp-demo.com',
        password: hashedPassword,
        name: '李經理',
        phone: '0923-456-789',
        roleId: roleMap.MANAGER.id,
        storeId: stores[1].id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'cashier01' },
      update: {},
      create: {
        username: 'cashier01',
        email: 'cashier01@erp-demo.com',
        password: hashedPassword,
        name: '王小明',
        phone: '0934-567-890',
        roleId: roleMap.CASHIER.id,
        storeId: stores[1].id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'warehouse01' },
      update: {},
      create: {
        username: 'warehouse01',
        email: 'warehouse01@erp-demo.com',
        password: hashedPassword,
        name: '張倉管',
        phone: '0945-678-901',
        roleId: roleMap.WAREHOUSE.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'purchaser01' },
      update: {},
      create: {
        username: 'purchaser01',
        email: 'purchaser01@erp-demo.com',
        password: hashedPassword,
        name: '陳採購',
        phone: '0956-789-012',
        roleId: roleMap.PURCHASER.id,
        isActive: true,
      },
    }),
  ])

  // ===================================
  // 5. 建立基礎資料
  // ===================================
  console.log('建立基礎資料...')

  // 計量單位
  const units = await Promise.all([
    prisma.unit.upsert({
      where: { code: 'PCS' },
      update: {},
      create: { code: 'PCS', name: '件', description: '單件' },
    }),
    prisma.unit.upsert({
      where: { code: 'BOX' },
      update: {},
      create: { code: 'BOX', name: '盒', description: '盒裝' },
    }),
    prisma.unit.upsert({
      where: { code: 'SET' },
      update: {},
      create: { code: 'SET', name: '組', description: '組合' },
    }),
    prisma.unit.upsert({
      where: { code: 'KG' },
      update: {},
      create: { code: 'KG', name: '公斤', description: '重量單位' },
    }),
  ])

  // 稅別
  const taxTypes = await Promise.all([
    prisma.taxType.upsert({
      where: { code: 'TAX5' },
      update: {},
      create: { code: 'TAX5', name: '應稅 5%', rate: 0.05 },
    }),
    prisma.taxType.upsert({
      where: { code: 'TAX0' },
      update: {},
      create: { code: 'TAX0', name: '零稅率', rate: 0 },
    }),
    prisma.taxType.upsert({
      where: { code: 'EXEMPT' },
      update: {},
      create: { code: 'EXEMPT', name: '免稅', rate: 0 },
    }),
  ])

  // 付款方式
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.upsert({
      where: { code: 'CASH' },
      update: {},
      create: { code: 'CASH', name: '現金', sortOrder: 1 },
    }),
    prisma.paymentMethod.upsert({
      where: { code: 'CREDIT' },
      update: {},
      create: { code: 'CREDIT', name: '信用卡', sortOrder: 2 },
    }),
    prisma.paymentMethod.upsert({
      where: { code: 'LINEPAY' },
      update: {},
      create: { code: 'LINEPAY', name: 'LINE Pay', sortOrder: 3 },
    }),
    prisma.paymentMethod.upsert({
      where: { code: 'TRANSFER' },
      update: {},
      create: { code: 'TRANSFER', name: '轉帳', sortOrder: 4 },
    }),
  ])

  // ===================================
  // 6. 建立商品分類
  // ===================================
  console.log('建立商品分類...')

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { code: 'ELECTRONICS' },
      update: {},
      create: {
        code: 'ELECTRONICS',
        name: '3C電子',
        description: '電子產品與配件',
        level: 1,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { code: 'CLOTHING' },
      update: {},
      create: {
        code: 'CLOTHING',
        name: '服飾',
        description: '服裝與配件',
        level: 1,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { code: 'FOOD' },
      update: {},
      create: {
        code: 'FOOD',
        name: '食品',
        description: '食品與飲料',
        level: 1,
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { code: 'HOME' },
      update: {},
      create: {
        code: 'HOME',
        name: '居家用品',
        description: '居家生活用品',
        level: 1,
        sortOrder: 4,
      },
    }),
  ])

  const categoryMap = Object.fromEntries(categories.map((c) => [c.code, c]))

  // ===================================
  // 7. 建立供應商
  // ===================================
  console.log('建立供應商...')

  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { code: 'SUP001' },
      update: {},
      create: {
        code: 'SUP001',
        name: '大同電子股份有限公司',
        shortName: '大同電子',
        contactPerson: '林先生',
        phone: '02-1234-5678',
        email: 'sales@tatung.com',
        address: '台北市中山區中山北路三段22號',
        taxId: '12345678',
        paymentTerms: 30,
      },
    }),
    prisma.supplier.upsert({
      where: { code: 'SUP002' },
      update: {},
      create: {
        code: 'SUP002',
        name: '服飾批發商行',
        shortName: '服飾批發',
        contactPerson: '陳小姐',
        phone: '04-2222-3333',
        email: 'order@fashion.com',
        address: '台中市西屯區台灣大道四段123號',
        taxId: '23456789',
        paymentTerms: 45,
      },
    }),
    prisma.supplier.upsert({
      where: { code: 'SUP003' },
      update: {},
      create: {
        code: 'SUP003',
        name: '食品貿易有限公司',
        shortName: '食品貿易',
        contactPerson: '黃經理',
        phone: '07-7777-8888',
        email: 'info@foodtrade.com',
        address: '高雄市三民區建國二路100號',
        taxId: '34567890',
        paymentTerms: 15,
      },
    }),
    prisma.supplier.upsert({
      where: { code: 'SUP004' },
      update: {},
      create: {
        code: 'SUP004',
        name: '居家生活館',
        shortName: '居家生活',
        contactPerson: '劉主任',
        phone: '02-5555-6666',
        email: 'contact@homelife.com',
        address: '新北市三重區重新路四段88號',
        taxId: '45678901',
        paymentTerms: 30,
      },
    }),
  ])

  // ===================================
  // 8. 建立會員等級
  // ===================================
  console.log('建立會員等級...')

  const customerLevels = await Promise.all([
    prisma.customerLevel.upsert({
      where: { code: 'REGULAR' },
      update: {},
      create: {
        code: 'REGULAR',
        name: '一般會員',
        discountRate: 0,
        pointsMultiplier: 1,
        minPoints: 0,
        benefits: '基本會員權益',
        sortOrder: 1,
      },
    }),
    prisma.customerLevel.upsert({
      where: { code: 'SILVER' },
      update: {},
      create: {
        code: 'SILVER',
        name: '銀卡會員',
        discountRate: 0.05,
        pointsMultiplier: 1.2,
        minPoints: 5000,
        benefits: '95折優惠、1.2倍點數',
        sortOrder: 2,
      },
    }),
    prisma.customerLevel.upsert({
      where: { code: 'GOLD' },
      update: {},
      create: {
        code: 'GOLD',
        name: '金卡會員',
        discountRate: 0.1,
        pointsMultiplier: 1.5,
        minPoints: 20000,
        benefits: '9折優惠、1.5倍點數、生日禮',
        sortOrder: 3,
      },
    }),
    prisma.customerLevel.upsert({
      where: { code: 'VIP' },
      update: {},
      create: {
        code: 'VIP',
        name: 'VIP會員',
        discountRate: 0.15,
        pointsMultiplier: 2,
        minPoints: 50000,
        benefits: '85折優惠、2倍點數、專屬禮遇',
        sortOrder: 4,
      },
    }),
  ])

  // ===================================
  // 9. 建立商品
  // ===================================
  console.log('建立商品...')

  const products = await Promise.all([
    // 3C 電子類
    prisma.product.upsert({
      where: { sku: 'PHONE001' },
      update: {},
      create: {
        sku: 'PHONE001',
        barcode: '4710001234567',
        name: '智慧型手機 Pro Max',
        shortName: '手機 Pro Max',
        description: '最新款智慧型手機，搭載頂級處理器',
        specification: '6.7吋螢幕、256GB儲存空間',
        costPrice: 25000,
        listPrice: 39900,
        sellingPrice: 35900,
        minPrice: 33000,
        safetyStock: 10,
        reorderPoint: 5,
        reorderQty: 20,
        categoryId: categoryMap.ELECTRONICS.id,
        unitId: units[0].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'LAPTOP001' },
      update: {},
      create: {
        sku: 'LAPTOP001',
        barcode: '4710001234568',
        name: '輕薄筆記型電腦 14吋',
        shortName: '筆電 14吋',
        description: '超輕薄設計，適合商務使用',
        specification: '14吋螢幕、512GB SSD、16GB RAM',
        costPrice: 28000,
        listPrice: 45900,
        sellingPrice: 42900,
        safetyStock: 5,
        reorderPoint: 3,
        reorderQty: 10,
        categoryId: categoryMap.ELECTRONICS.id,
        unitId: units[0].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'HEADPHONE001' },
      update: {},
      create: {
        sku: 'HEADPHONE001',
        barcode: '4710001234569',
        name: '藍牙無線耳機',
        shortName: '藍牙耳機',
        description: '主動降噪藍牙耳機',
        specification: '藍牙5.0、30小時續航',
        costPrice: 2000,
        listPrice: 4990,
        sellingPrice: 3990,
        safetyStock: 30,
        reorderPoint: 15,
        reorderQty: 50,
        categoryId: categoryMap.ELECTRONICS.id,
        unitId: units[0].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'TABLET001' },
      update: {},
      create: {
        sku: 'TABLET001',
        barcode: '4710001234570',
        name: '平板電腦 10吋',
        shortName: '平板 10吋',
        description: '輕巧平板，娛樂學習兩相宜',
        specification: '10吋螢幕、128GB、WiFi版',
        costPrice: 8000,
        listPrice: 15900,
        sellingPrice: 12900,
        safetyStock: 15,
        reorderPoint: 8,
        reorderQty: 25,
        categoryId: categoryMap.ELECTRONICS.id,
        unitId: units[0].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'WATCH001' },
      update: {},
      create: {
        sku: 'WATCH001',
        barcode: '4710001234571',
        name: '智慧手錶運動版',
        shortName: '智慧手錶',
        description: '運動追蹤、心率監測',
        specification: '防水50米、GPS內建',
        costPrice: 5000,
        listPrice: 9990,
        sellingPrice: 8990,
        safetyStock: 20,
        reorderPoint: 10,
        reorderQty: 30,
        categoryId: categoryMap.ELECTRONICS.id,
        unitId: units[0].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    // 服飾類
    prisma.product.upsert({
      where: { sku: 'TSHIRT001' },
      update: {},
      create: {
        sku: 'TSHIRT001',
        barcode: '4710002234567',
        name: '純棉T恤 經典款',
        shortName: '純棉T恤',
        description: '100%純棉舒適T恤',
        specification: '尺寸: S/M/L/XL',
        costPrice: 150,
        listPrice: 590,
        sellingPrice: 490,
        safetyStock: 50,
        reorderPoint: 25,
        reorderQty: 100,
        categoryId: categoryMap.CLOTHING.id,
        unitId: units[0].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'JEANS001' },
      update: {},
      create: {
        sku: 'JEANS001',
        barcode: '4710002234568',
        name: '牛仔褲 修身款',
        shortName: '牛仔褲',
        description: '彈性牛仔布料，舒適修身',
        specification: '尺寸: 28/30/32/34/36',
        costPrice: 400,
        listPrice: 1290,
        sellingPrice: 990,
        safetyStock: 30,
        reorderPoint: 15,
        reorderQty: 50,
        categoryId: categoryMap.CLOTHING.id,
        unitId: units[0].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'JACKET001' },
      update: {},
      create: {
        sku: 'JACKET001',
        barcode: '4710002234569',
        name: '輕量防風外套',
        shortName: '防風外套',
        description: '輕量防風防潑水',
        specification: '尺寸: S/M/L/XL/XXL',
        costPrice: 600,
        listPrice: 1990,
        sellingPrice: 1590,
        safetyStock: 25,
        reorderPoint: 12,
        reorderQty: 40,
        categoryId: categoryMap.CLOTHING.id,
        unitId: units[0].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    // 食品類
    prisma.product.upsert({
      where: { sku: 'SNACK001' },
      update: {},
      create: {
        sku: 'SNACK001',
        barcode: '4710003234567',
        name: '綜合堅果禮盒',
        shortName: '堅果禮盒',
        description: '嚴選綜合堅果，送禮自用兩相宜',
        specification: '內含6種堅果，淨重500g',
        costPrice: 200,
        listPrice: 499,
        sellingPrice: 399,
        safetyStock: 100,
        reorderPoint: 50,
        reorderQty: 200,
        categoryId: categoryMap.FOOD.id,
        unitId: units[1].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'COFFEE001' },
      update: {},
      create: {
        sku: 'COFFEE001',
        barcode: '4710003234568',
        name: '精選咖啡豆',
        shortName: '咖啡豆',
        description: '中深焙精選咖啡豆',
        specification: '淨重454g',
        costPrice: 180,
        listPrice: 450,
        sellingPrice: 380,
        safetyStock: 80,
        reorderPoint: 40,
        reorderQty: 150,
        categoryId: categoryMap.FOOD.id,
        unitId: units[1].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'TEA001' },
      update: {},
      create: {
        sku: 'TEA001',
        barcode: '4710003234569',
        name: '高山烏龍茶禮盒',
        shortName: '烏龍茶禮盒',
        description: '台灣高山烏龍茶',
        specification: '淨重300g、附精美禮盒',
        costPrice: 350,
        listPrice: 899,
        sellingPrice: 799,
        safetyStock: 60,
        reorderPoint: 30,
        reorderQty: 100,
        categoryId: categoryMap.FOOD.id,
        unitId: units[1].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    // 居家用品類
    prisma.product.upsert({
      where: { sku: 'HOME001' },
      update: {},
      create: {
        sku: 'HOME001',
        barcode: '4710004234567',
        name: '多功能收納盒組',
        shortName: '收納盒組',
        description: '可堆疊設計，有效利用空間',
        specification: '一組三入，大中小各一',
        costPrice: 150,
        listPrice: 399,
        sellingPrice: 299,
        safetyStock: 80,
        reorderPoint: 40,
        reorderQty: 100,
        categoryId: categoryMap.HOME.id,
        unitId: units[2].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'HOME002' },
      update: {},
      create: {
        sku: 'HOME002',
        barcode: '4710004234568',
        name: '不鏽鋼保溫瓶',
        shortName: '保溫瓶',
        description: '真空雙層保溫',
        specification: '容量500ml',
        costPrice: 200,
        listPrice: 599,
        sellingPrice: 499,
        safetyStock: 60,
        reorderPoint: 30,
        reorderQty: 80,
        categoryId: categoryMap.HOME.id,
        unitId: units[0].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'HOME003' },
      update: {},
      create: {
        sku: 'HOME003',
        barcode: '4710004234569',
        name: 'LED護眼檯燈',
        shortName: 'LED檯燈',
        description: '無藍光護眼設計',
        specification: '三段亮度調節',
        costPrice: 400,
        listPrice: 990,
        sellingPrice: 890,
        safetyStock: 40,
        reorderPoint: 20,
        reorderQty: 60,
        categoryId: categoryMap.HOME.id,
        unitId: units[0].id,
        taxTypeId: taxTypes[0].id,
      },
    }),
  ])

  const productMap = Object.fromEntries(products.map((p) => [p.sku, p]))

  // ===================================
  // 10. 建立庫存
  // ===================================
  console.log('建立庫存...')

  await prisma.inventory.deleteMany({})

  const inventoryData = []
  for (const product of products) {
    // 主倉庫庫存
    const mainQty = Math.floor(Math.random() * 80) + 20
    inventoryData.push({
      productId: product.id,
      warehouseId: warehouses[0].id,
      quantity: mainQty,
      reservedQty: Math.floor(Math.random() * 5),
      availableQty: mainQty,
    })
    // 北區倉庫庫存
    const northQty = Math.floor(Math.random() * 50) + 10
    inventoryData.push({
      productId: product.id,
      warehouseId: warehouses[1].id,
      quantity: northQty,
      reservedQty: Math.floor(Math.random() * 3),
      availableQty: northQty,
    })
  }
  await prisma.inventory.createMany({ data: inventoryData })

  // 建立一些低庫存商品（用於報表警示）
  await prisma.inventory.updateMany({
    where: {
      productId: { in: [productMap.PHONE001.id, productMap.LAPTOP001.id] },
      warehouseId: warehouses[0].id,
    },
    data: { quantity: 3, availableQty: 3 },
  })

  // ===================================
  // 11. 建立會員
  // ===================================
  console.log('建立會員...')

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { code: 'C0001' },
      update: {},
      create: {
        code: 'C0001',
        name: '張三',
        phone: '0912-111-111',
        email: 'zhangsan@email.com',
        gender: 'M',
        birthday: new Date('1990-05-15'),
        address: '台北市大安區忠孝東路四段100號',
        totalPoints: 15000,
        availablePoints: 12000,
        totalSpent: 85000,
        orderCount: 25,
        levelId: customerLevels[1].id,
      },
    }),
    prisma.customer.upsert({
      where: { code: 'C0002' },
      update: {},
      create: {
        code: 'C0002',
        name: '李四',
        phone: '0923-222-222',
        email: 'lisi@email.com',
        gender: 'F',
        birthday: new Date('1985-08-20'),
        address: '新北市板橋區中山路一段50號',
        totalPoints: 35000,
        availablePoints: 28000,
        totalSpent: 168000,
        orderCount: 45,
        levelId: customerLevels[2].id,
      },
    }),
    prisma.customer.upsert({
      where: { code: 'C0003' },
      update: {},
      create: {
        code: 'C0003',
        name: '王五',
        phone: '0934-333-333',
        email: 'wangwu@email.com',
        gender: 'M',
        birthday: new Date('1995-12-01'),
        address: '台中市西區台灣大道二段200號',
        totalPoints: 3000,
        availablePoints: 2500,
        totalSpent: 25000,
        orderCount: 8,
        levelId: customerLevels[0].id,
      },
    }),
    prisma.customer.upsert({
      where: { code: 'C0004' },
      update: {},
      create: {
        code: 'C0004',
        name: '趙六',
        phone: '0945-444-444',
        email: 'zhaoliu@email.com',
        gender: 'F',
        birthday: new Date('1988-03-10'),
        address: '高雄市前鎮區中華五路789號',
        totalPoints: 55000,
        availablePoints: 48000,
        totalSpent: 280000,
        orderCount: 68,
        levelId: customerLevels[3].id,
      },
    }),
    prisma.customer.upsert({
      where: { code: 'C0005' },
      update: {},
      create: {
        code: 'C0005',
        name: '孫七',
        phone: '0956-555-555',
        email: 'sunqi@email.com',
        gender: 'M',
        birthday: new Date('1992-07-25'),
        address: '桃園市中壢區中央西路二段88號',
        totalPoints: 8000,
        availablePoints: 6500,
        totalSpent: 42000,
        orderCount: 15,
        levelId: customerLevels[1].id,
      },
    }),
  ])

  // ===================================
  // 12. 建立訂單
  // ===================================
  console.log('建立訂單...')

  await prisma.payment.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})

  const orderStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'SHIPPED', 'PROCESSING', 'PENDING']
  const now = new Date()

  // 取得可以建立訂單的使用者 (cashier 和 manager)
  const orderUsers = users.filter((u) => u.username === 'cashier01' || u.username === 'manager01')

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 60)
    const orderDate = new Date(now)
    orderDate.setDate(orderDate.getDate() - daysAgo)

    const customer = customers[Math.floor(Math.random() * customers.length)]
    const store = stores[Math.floor(Math.random() * stores.length)]
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)]
    const orderUser = orderUsers[Math.floor(Math.random() * orderUsers.length)]

    const orderNo = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`

    // 隨機選擇 1-4 個商品
    const numItems = Math.floor(Math.random() * 4) + 1
    const selectedProducts = products.sort(() => 0.5 - Math.random()).slice(0, numItems)

    let subtotal = 0
    const orderItems = selectedProducts.map((product) => {
      const quantity = Math.floor(Math.random() * 3) + 1
      const unitPrice = product.sellingPrice.toNumber()
      const itemSubtotal = unitPrice * quantity
      subtotal += itemSubtotal
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity,
        unitPrice,
        subtotal: itemSubtotal,
      }
    })

    const discountAmount = Math.floor(subtotal * (Math.random() * 0.1))
    const taxAmount = Math.floor((subtotal - discountAmount) * 0.05)
    const totalAmount = subtotal - discountAmount + taxAmount

    const order = await prisma.order.create({
      data: {
        orderNo,
        customerId: customer.id,
        storeId: store.id,
        userId: orderUser.id,
        status,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        paidAmount: status === 'COMPLETED' || status === 'SHIPPED' ? totalAmount : 0,
        paymentStatus: status === 'COMPLETED' || status === 'SHIPPED' ? 'PAID' : 'UNPAID',
        notes: '',
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: orderItems,
        },
      },
    })

    // 建立付款記錄
    if (status === 'COMPLETED' || status === 'SHIPPED') {
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      await prisma.payment.create({
        data: {
          orderId: order.id,
          paymentMethodId: paymentMethod.id,
          amount: totalAmount,
          status: 'COMPLETED',
          paidAt: orderDate,
          createdAt: orderDate,
        },
      })
    }
  }

  // ===================================
  // 13. 建立採購單
  // ===================================
  console.log('建立採購單...')

  await prisma.purchaseOrderItem.deleteMany({})
  await prisma.purchaseOrder.deleteMany({})

  const poStatuses = ['COMPLETED', 'COMPLETED', 'RECEIVED', 'ORDERED', 'APPROVED', 'PENDING']

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 90)
    const orderDate = new Date(now)
    orderDate.setDate(orderDate.getDate() - daysAgo)

    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]
    const status = poStatuses[Math.floor(Math.random() * poStatuses.length)]

    const orderNo = `PO-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`

    const numItems = Math.floor(Math.random() * 5) + 1
    const selectedProducts = products.sort(() => 0.5 - Math.random()).slice(0, numItems)

    let totalAmount = 0
    const poItems = selectedProducts.map((product) => {
      const quantity = Math.floor(Math.random() * 20) + 5
      const unitPrice = product.costPrice.toNumber()
      const itemSubtotal = unitPrice * quantity
      totalAmount += itemSubtotal
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity,
        unitPrice,
        subtotal: itemSubtotal,
        receivedQty: status === 'COMPLETED' || status === 'RECEIVED' ? quantity : 0,
      }
    })

    await prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId: supplier.id,
        status,
        totalAmount,
        orderDate,
        expectedDate: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        notes: '',
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: poItems,
        },
      },
    })
  }

  // ===================================
  // 14. 建立庫存異動記錄
  // ===================================
  console.log('建立庫存異動記錄...')

  await prisma.inventoryMovement.deleteMany({})

  const movementTypes = ['IN', 'OUT', 'ADJUST']

  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const movementDate = new Date(now)
    movementDate.setDate(movementDate.getDate() - daysAgo)

    const product = products[Math.floor(Math.random() * products.length)]
    const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)]
    const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)]
    const quantity = (Math.floor(Math.random() * 20) + 1) * (movementType === 'OUT' ? -1 : 1)

    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType,
        quantity: Math.abs(quantity),
        beforeQty: 50,
        afterQty: 50 + quantity,
        referenceType:
          movementType === 'IN' ? 'PURCHASE' : movementType === 'OUT' ? 'ORDER' : 'ADJUST',
        reason: movementType === 'ADJUST' ? '庫存盤點調整' : undefined,
        createdAt: movementDate,
      },
    })
  }

  // ===================================
  // 15. 建立促銷活動
  // ===================================
  console.log('建立促銷活動...')

  await prisma.promotion.deleteMany({})

  await Promise.all([
    prisma.promotion.create({
      data: {
        code: 'SUMMER2024',
        name: '夏季特賣',
        description: '全館商品85折優惠',
        type: 'DISCOUNT',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minPurchase: 1000,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        isActive: true,
        usageLimit: 1000,
        usedCount: 356,
      },
    }),
    prisma.promotion.create({
      data: {
        code: 'NEWMEMBER',
        name: '新會員首購優惠',
        description: '新會員首筆訂單折抵$200',
        type: 'DISCOUNT',
        discountType: 'AMOUNT',
        discountValue: 200,
        minPurchase: 500,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        usageLimit: 5000,
        usedCount: 1234,
      },
    }),
    prisma.promotion.create({
      data: {
        code: 'BIRTHDAY',
        name: '生日禮金',
        description: '生日當月購物折抵$500',
        type: 'DISCOUNT',
        discountType: 'AMOUNT',
        discountValue: 500,
        minPurchase: 2000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        usageLimit: 10000,
        usedCount: 567,
      },
    }),
    prisma.promotion.create({
      data: {
        code: 'ELECTRONICS10',
        name: '3C電子9折',
        description: '3C電子商品享9折優惠',
        type: 'DISCOUNT',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minPurchase: 0,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        isActive: false,
        usageLimit: 500,
        usedCount: 500,
      },
    }),
  ])

  // ===================================
  // 16. 建立優惠券
  // ===================================
  console.log('建立優惠券...')

  await prisma.coupon.deleteMany({})

  await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'SAVE100',
        name: '滿千折百券',
        description: '消費滿$1000折$100',
        discountType: 'AMOUNT',
        discountValue: 100,
        minPurchase: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        usageLimit: 2000,
        usedCount: 856,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'VIP20OFF',
        name: 'VIP專屬8折券',
        description: 'VIP會員專屬8折優惠',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minPurchase: 3000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        usageLimit: 500,
        usedCount: 123,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'FREE200',
        name: '免費$200折價券',
        description: '無消費門檻',
        discountType: 'AMOUNT',
        discountValue: 200,
        minPurchase: 0,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
        isActive: false,
        usageLimit: 1000,
        usedCount: 1000,
      },
    }),
  ])

  console.log('')
  console.log('========================================')
  console.log('種子資料建立完成!')
  console.log('========================================')
  console.log('')
  console.log('測試帳號:')
  console.log('  admin / password123 (系統管理員)')
  console.log('  manager01 / password123 (門市店長)')
  console.log('  cashier01 / password123 (收銀員)')
  console.log('  warehouse01 / password123 (倉管人員)')
  console.log('  purchaser01 / password123 (採購人員)')
  console.log('')
  console.log('資料統計:')
  console.log('  - 商品: 14 筆')
  console.log('  - 分類: 4 筆')
  console.log('  - 會員: 5 筆')
  console.log('  - 供應商: 4 筆')
  console.log('  - 訂單: 50 筆')
  console.log('  - 採購單: 30 筆')
  console.log('  - 庫存異動: 100 筆')
  console.log('  - 促銷活動: 4 筆')
  console.log('  - 優惠券: 3 筆')
}

main()
  .catch((e) => {
    console.error('種子資料建立失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
