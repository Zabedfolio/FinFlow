# FinFlow — Modern Glassmorphic Expense Tracker

FinFlow is a high-fidelity, responsive, and modern personal expense tracker. It is built using **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **MongoDB Atlas** (using the native `mongodb` driver), decorated with Yandex's official **Gravity UI Icons**.

This project is structured specifically to serve as a clean learning resource for junior web developers and freshers, avoiding complex or convoluted abstractions while maintaining industry-standard practices.

---

## 🌟 Key Features

1. **Dashboard Stats**:
   - **Total Spending**: Dynamically calculated sum of all logged transactions.
   - **Total Transactions**: Total number of entries logged.
   - **Top Category**: Displays the category with the highest monetary allocation.
2. **Visual Analytics**:
   - Interactive, custom-styled donut/pie chart powered by **Recharts** detailing cost allocations by category.
   - Live color-coded legend detailing total values and percentages per category.
3. **Advanced Controls**:
   - Live search filter to search expenses by title/description.
   - Category filtering dropdown.
   - Sorting options by newest/oldest date and highest/lowest cost.
4. **Interactive Modal Form (CRUD)**:
   - Full support for Adding, Editing, and Deleting records.
   - Validation checks on fields (Title, Amount, Category, Date picker).
   - Glassmorphic look with smooth blur overlays.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js (v16 App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (connected via official native `mongodb` Node driver)
- **Styling**: [Tailwind CSS (v4)](https://tailwindcss.com/)
- **Icons**: [@gravity-ui/icons](https://gravity-ui.com/icons)
- **Charts**: [Recharts](https://recharts.org/)

---

## 📁 Project Structure

```text
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── expenses/
│   │   │   │   └── route.ts         # GET all expenses, POST new expense
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts     # PUT update expense, DELETE expense
│   │   │   ├── globals.css          # Tailwind CSS configuration
│   │   │   ├── layout.tsx           # Global HTML wrapper and page metadata
│   │   │   └── page.tsx             # Interactive dashboard (Client Component)
│   ├── lib/
│   │   └── mongodb.ts               # MongoDB Client connection caching singleton
│   └── types/
│       └── expense.ts               # Shared TypeScript interface definitions
├── .env.example                     # Reference config structure for Atlas variables
├── .env.local                       # Local database environment variables (git-ignored)
├── tsconfig.json                    # TypeScript configurations
└── package.json                     # NPM packages & scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed (v18.x or newer recommended).
- A MongoDB Atlas database instance (or a local MongoDB instance).

### 2. Environment Configuration
Copy the `.env.example` file to create `.env.local` at the root of the project:
```bash
cp .env.example .env.local
```

Open `.env.local` and substitute your actual MongoDB Atlas connection URI:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/expense_tracker?retryWrites=true&w=majority
```

### 3. Installation
Install all project dependencies:
```bash
npm install
```

### 4. Running the Development Server
Launch the local Next.js development server:
```bash
npm run dev
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to view the live dashboard!

---

## 📈 Learnings for Freshers

- **MongoDB Caching Singleton**: Check out `src/lib/mongodb.ts` to see how we prevent connection leaks during Next.js Hot Module Replacement (HMR) module reloads.
- **REST CRUD APIs**: Examine `src/app/api/expenses/route.ts` and `src/app/api/expenses/[id]/route.ts` to see how Next.js App Router exposes API endpoints.
- **Hydration Safe Components**: View `src/app/page.tsx`'s `mounted` state handler. It ensures client-only components like charts do not attempt to pre-render on the server.
