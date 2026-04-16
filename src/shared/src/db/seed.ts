import { db, initDb } from "./client.js";
import { products } from "./schema.js";

initDb();

const sample = [
  // Bebidas - piezas
  { barcode: "7501234560014", sku: "BEB001", name: "Agua Bonafont 600ml",   price: 15, cost: 8,  category: "BEB", stock: 100, minStock: 20, unitType: "pza", unitQty: 0.6 },
  { barcode: "7501234560021", sku: "BEB002", name: "Coca-Cola 600ml",       price: 22, cost: 12, category: "BEB", stock: 80,  minStock: 15, unitType: "pza", unitQty: 0.6 },
  { barcode: "7501234560038", sku: "BEB003", name: "Cafe Americano",         price: 35, cost: 18, category: "BEB", stock: 50,  minStock: 10, unitType: "pza", unitQty: 1 },
  { barcode: "7501234560045", sku: "BEB004", name: "Jugo Natural Naranja",   price: 40, cost: 22, category: "BEB", stock: 30,  minStock: 8,  unitType: "pza", unitQty: 0.5 },
  
  // Bebidas - litros
  { barcode: "7501234560069", sku: "BEB006", name: "Agua Mineral 1L",        price: 25, cost: 12, category: "BEB", stock: 60,  minStock: 15, unitType: "lt", unitQty: 1 },
  { barcode: "7501234560076", sku: "BEB007", name: "Jugo de Uva 1L",         price: 45, cost: 25, category: "BEB", stock: 25,  minStock: 8,  unitType: "lt", unitQty: 1 },
  
  // Alimentacion - piezas
  { barcode: "7502000100018", sku: "ALI001", name: "Sandwich Jamon y Queso",price: 55, cost: 28, category: "ALI", stock: 20,  minStock: 5,  unitType: "pza", unitQty: 1 },
  { barcode: "7502000100025", sku: "ALI002", name: "Tostada Tinga",          price: 45, cost: 22, category: "ALI", stock: 15,  minStock: 5,  unitType: "pza", unitQty: 1 },
  { barcode: "7502000100032", sku: "ALI003", name: "Pan Dulce (6 pzas)",     price: 35, cost: 18, category: "ALI", stock: 40,  minStock: 10, unitType: "pza", unitQty: 6 },
  { barcode: "7502000100049", sku: "ALI004", name: "Croissant Relleno",      price: 28, cost: 14, category: "ALI", stock: 25,  minStock: 8,  unitType: "pza", unitQty: 1 },
  
  // Botanas - piezas
  { barcode: "7503000100019", sku: "BOT001", name: "Papas Fritas Sabritas", price: 28, cost: 14, category: "BOT", stock: 60,  minStock: 15, unitType: "pza", unitQty: 1 },
  { barcode: "7503000100026", sku: "BOT002", name: "Chicles Orbit Menta",    price: 12, cost: 5,  category: "BOT", stock: 100, minStock: 20, unitType: "pza", unitQty: 1 },
  { barcode: "7503000100033", sku: "BOT003", name: "Galletas Oreo",          price: 22, cost: 10, category: "BOT", stock: 45,  minStock: 10, unitType: "pza", unitQty: 1 },
  { barcode: "7503000100040", sku: "BOT004", name: "Paletas Rockaleta",      price: 8,  cost: 3,  category: "BOT", stock: 80,  minStock: 20, unitType: "pza", unitQty: 1 },
  
  // Lacteos - piezas
  { barcode: "7504000100017", sku: "LAC001", name: "Yogurt Natural Entero",  price: 32, cost: 18, category: "LAC", stock: 25,  minStock: 8,  unitType: "pza", unitQty: 1 },
  { barcode: "7504000100024", sku: "LAC002", name: "Leche Entero 1L",        price: 28, cost: 15, category: "LAC", stock: 30,  minStock: 10, unitType: "lt", unitQty: 1 },
  { barcode: "7504000100031", sku: "LAC003", name: "Queso Manchego 200g",   price: 65, cost: 35, category: "LAC", stock: 15,  minStock: 5,  unitType: "g", unitQty: 200 },
  { barcode: "7504000100048", sku: "LAC004", name: "Crema Pastelera 250ml",  price: 38, cost: 20, category: "LAC", stock: 18,  minStock: 5,  unitType: "ml", unitQty: 250 },
  { barcode: "7504000100055", sku: "LAC005", name: "Yogurt Griego",          price: 45, cost: 24, category: "LAC", stock: 22,  minStock: 6,  unitType: "pza", unitQty: 1 },
  
  // Carniceria/Tienda - kilos
  { barcode: "7506000100013", sku: "CAR001", name: "Carne de Res Molida",   price: 120, cost: 80, category: "CAR", stock: 15, minStock: 5, unitType: "kg", unitQty: 1 },
  { barcode: "7506000100020", sku: "CAR002", name: "Pollo Entero",          price: 65,  cost: 40, category: "CAR", stock: 10, minStock: 3, unitType: "kg", unitQty: 1 },
  { barcode: "7506000100037", sku: "CAR003", name: "Jamón de Pavo",         price: 85,  cost: 50, category: "CAR", stock: 8,  minStock: 3, unitType: "kg", unitQty: 0.5 },
  
  // Frutas/Verduras - kilos
  { barcode: "7507000100012", sku: "FRU001", name: "Manzana Roja",           price: 35,  cost: 18, category: "FRU", stock: 20, minStock: 5, unitType: "kg", unitQty: 1 },
  { barcode: "7507000100029", sku: "FRU002", name: "Plátano Tabasco",        price: 22,  cost: 10, category: "FRU", stock: 25, minStock: 8, unitType: "kg", unitQty: 1 },
  { barcode: "7507000100036", sku: "FRU003", name: "Aguacate Hass",          price: 55,  cost: 28, category: "FRU", stock: 12, minStock: 4, unitType: "kg", unitQty: 1 },
  { barcode: "7507000100043", sku: "FRU004", name: "Naranja Valencia",       price: 25,  cost: 12, category: "FRU", stock: 30, minStock: 10, unitType: "kg", unitQty: 1 },
  
  // Tienda - metros
  { barcode: "7508000100018", sku: "FER001", name: "Cable Electrico 10m",  price: 85,  cost: 45, category: "FER", stock: 15, minStock: 5, unitType: "m", unitQty: 10 },
  { barcode: "7508000100025", sku: "FER002", name: "Manguera 5m",           price: 65,  cost: 30, category: "FER", stock: 8,  minStock: 3, unitType: "m", unitQty: 5 },
  
  // General
  { barcode: "7505000100014", sku: "GEN001", name: "Cigarros Camel",         price: 55, cost: 38, category: "GEN", stock: 40,  minStock: 10, unitType: "pza", unitQty: 1 },
  { barcode: "7505000100021", sku: "GEN002", name: "Encendedor Bic",         price: 15, cost: 6,  category: "GEN", stock: 50,  minStock: 15, unitType: "pza", unitQty: 1 },
  { barcode: "7505000100038", sku: "GEN003", name: "Baterias AA (4 pzas)",   price: 45, cost: 25, category: "GEN", stock: 30,  minStock: 8,  unitType: "pza", unitQty: 4 },
];

export function runSeed() {
  try {
    db.insert(products).values(sample).run();
    console.log("Seed completado: " + sample.length + " productos insertados.");
  } catch {
    console.log("Seed ya aplicado o error — omitiendo.");
  }
}
