# CV. Venus — E-commerce Web App

**CV. Venus** is a full-stack e-commerce web application for a local distributor of **Garuda Food, Mondelez, and Cleo** serving **North Halmahera (Halmahera Utara), Indonesia**. The UI is inspired by the planet *Venus* with a dominant blue palette, soft gradients, and subtle cosmic effects.

---

## 🔎 Project Overview

This project aims to provide a fast, mobile-friendly shopping experience for local customers while giving the distributor a powerful admin dashboard to manage inventory, orders, and promotions without accessing the database console directly.

Key goals:

* Display product catalog (snacks, biscuits, drinks, daily needs).
* Allow customers to add to cart, checkout, and view order history.
* Provide admin features: manage products (Add/Edit/Delete), manage stock, and process orders.
* Support promotional rules like **Buy X Get Y (free)** and **percentage discounts**.
* Automatically decrement stock when orders are completed.

---

## ✨ Main Features

* Public pages: **Home**, **About**, **Shop / Items**, **Search (live + debounced)**, **Cart**, **Checkout**, **Order History**, **Account**.
* Admin Dashboard: Orders to deliver, update order status, add tracking number.
* Inventory Management: Add / Edit / Delete products, upload images, update stock.
* Discount Engine: supports `BUY_X_GET_Y` and `PERCENTAGE` discount types and applies discounts server-side at checkout.
* Stock Management: stock is validated and reduced automatically during checkout (transactional/atomic).
* Notifications: UI toasts, loading skeletons, and smooth animations for better UX.

---

## 🧰 Tech Stack (recommended)

* **Frontend**: Next.js (React) + Tailwind CSS (+ Framer Motion for animations)
* **Backend & DB**: Supabase (Postgres, Auth, Storage)
* **Hosting**: Vercel (frontend) + Supabase (database & storage)
* **Authentication**: Supabase Auth (roles: `user`, `admin`)
* **Server-side logic**: Edge Functions / Next.js API routes using `SUPABASE_SERVICE_ROLE_KEY` for sensitive transactions

---

## ⚙️ Quick Start

### Prerequisites

* Node.js (v18+ recommended)
* npm or pnpm
* Supabase account

### Local setup

```bash
git clone <repo-url>
cd cv-venus
npm install
```

Create `.env.local` (do not commit):

```
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=pk.xxxxxx
SUPABASE_SERVICE_ROLE_KEY=sk.xxxxxx   # server-only
```

Run dev server:

```bash
npm run dev
# open http://localhost:3000
```

---

## 🗂 Suggested Database Tables (brief)

**products**

* id (uuid PK)
* name
* slug
* description
* price (numeric)
* stock (int)
* category
* brand
* image\_url
* created\_at

**orders**

* id (uuid PK)
* user\_id (uuid FK to auth.users)
* total (numeric)
* status (text) — pending, packed, shipped, delivered
* shipping\_address (jsonb)
* tracking\_number
* created\_at

**order\_items**

* id
* order\_id
* product\_id
* quantity
* unit\_price

**discounts**

* id
* type (`BUY_X_GET_Y` | `PERCENTAGE`)
* params (jsonb) — e.g. `{ "x": 10, "y": 1 }` or `{ "min_qty": 10, "percent": 10 }`
* active (boolean)

---

## 🔐 Security & Best Practices

* Enable **Row Level Security (RLS)** in Supabase and create policies so only admin users can `INSERT`/`UPDATE`/`DELETE` on `products` and other protected tables.
* Perform critical operations such as *creating an order*, *applying discounts*, and *decrementing stock* on server-side using `SUPABASE_SERVICE_ROLE_KEY` inside Edge Functions or API routes.
* Never expose service role keys in client-side code.

---

## 🔁 Stock Decrement & Atomic Checkout

Implement checkout as an atomic server-side transaction:

1. Validate cart items & available stock.
2. Apply discounts (server-side) and recalc totals.
3. Insert `orders` and `order_items` in a single transaction.
4. Decrement product stock (or use DB trigger) within the same transaction.

Optional example SQL trigger to fail when stock is insufficient (illustrative):

```sql
CREATE OR REPLACE FUNCTION decrease_stock()
RETURNS trigger AS $$
BEGIN
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id AND stock >= NEW.quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrease_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION decrease_stock();
```

> Note: using server-side transaction + service role is recommended over relying only on triggers, so you can handle rollback and better error messages.

---

## 🎯 Promo / Discount Logic (server-side)

Implement the discount application logic on server to avoid client manipulation.

* **BUY\_X\_GET\_Y** (`{ x, y }`): `free = floor(qty / x) * y` → add `free` quantity or add line item with `unit_price = 0`.
* **PERCENTAGE** (`{ min_qty, percent }`): if `qty >= min_qty`, discount = `line_total * percent / 100`.

Example: buying 10 cartons with `BUY_X_GET_Y` (x=10, y=1) → customer receives 11 cartons but pays for 10.

---

## 🛠 Admin Features

* Protected admin pages where authenticated admin can:

  * Add/Edit/Delete products
  * Update stock and product images (Supabase Storage)
  * View & process orders, change status, add tracking
* Admin actions use server-side endpoints to maintain security and atomicity.

---

## 📦 Deployment

* Push frontend to **Vercel** and set environment variables in Vercel dashboard.
* Supabase remains as the database & storage provider.
* For critical API endpoints, use Vercel Serverless Functions or Supabase Edge Functions with `SUPABASE_SERVICE_ROLE_KEY`.

---

## 🤝 Contribution

Contributions are welcome. Open an issue or submit a PR. If you'd like help generating SQL schema, API route examples (Next.js), or admin UI components, I can provide them.

---

## 📬 Contact

If you want me to: create `README.md` directly in your repo, add SQL schema, or scaffold admin pages, tell me which part to generate next.

---

*README generated for CV. Venus — E-commerce.*
