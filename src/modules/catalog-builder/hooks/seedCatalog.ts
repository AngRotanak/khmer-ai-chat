import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db_firestore } from "~/lib/firebase"; // ✅ use your central firebase.ts

export async function seedCatalog(adminUid: string) {
  const catalogRef = collection(db_firestore, `admin_uploads/${adminUid}/catalog`);

  const items = [
    { status: "published", category: "electronics", title: "Smartphone X", price: 799.99, discount: 50, createdAt: Timestamp.now() },
    { status: "published", category: "electronics", title: "Laptop Pro", price: 1299.00, discount: 100, createdAt: Timestamp.now() },
    { status: "published", category: "fashion", title: "Sneakers", price: 120.00, discount: 20, createdAt: Timestamp.now() },
    { status: "published", category: "fashion", title: "Jacket", price: 200.00, discount: 30, createdAt: Timestamp.now() },
    { status: "published", category: "home", title: "Coffee Maker", price: 89.99, discount: 10, createdAt: Timestamp.now() }
  ];

  for (const item of items) {
    await addDoc(catalogRef, item);
  }

  console.log("✅ Seeded test catalog items!");
}
