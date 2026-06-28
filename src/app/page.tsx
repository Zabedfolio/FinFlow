'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  TrashBin, 
  Magnifier, 
  Xmark, 
  ChevronDown,
  Cup,
  Car,
  ShoppingCart,
  PlugConnection,
  Play,
  Gear
} from '@gravity-ui/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Expense, ExpenseCategory } from '@/types/expense';

// Simple helper function to get the icon component for each category
function getCategoryIcon(category: ExpenseCategory) {
  if (category === 'Food') return Cup;
  if (category === 'Transport') return Car;
  if (category === 'Shopping') return ShoppingCart;
  if (category === 'Utilities') return PlugConnection;
  if (category === 'Entertainment') return Play;
  return Gear; // Default fallback icon for 'Others'
}

// Simple helper function to get the Tailwind styling color classes for badges
function getCategoryColorClass(category: ExpenseCategory) {
  if (category === 'Food') {
    return 'bg-rose-500/10 text-rose-600 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
  }
  if (category === 'Transport') {
    return 'bg-sky-500/10 text-sky-600 border-sky-200/50 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30';
  }
  if (category === 'Shopping') {
    return 'bg-amber-500/10 text-amber-600 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
  }
  if (category === 'Utilities') {
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
  }
  if (category === 'Entertainment') {
    return 'bg-violet-500/10 text-violet-600 border-violet-200/50 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30';
  }
  return 'bg-zinc-500/10 text-zinc-600 border-zinc-200/50 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-700/50';
}

// Simple helper function to get the Recharts fill color for the pie segments
function getCategoryChartColor(category: ExpenseCategory) {
  if (category === 'Food') return '#f43f5e';
  if (category === 'Transport') return '#0ea5e9';
  if (category === 'Shopping') return '#f59e0b';
  if (category === 'Utilities') return '#10b981';
  if (category === 'Entertainment') return '#8b5cf6';
  return '#71717a';
}

export default function ExpenseTrackerDashboard() {
  // --- STATE VARIABLES ---
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  
  // Modals visibility
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<string>('add'); // 'add' or 'edit'
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  
  // Form Inputs
  const [formTitle, setFormTitle] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Food');
  const [formDate, setFormDate] = useState<string>('');
  
  // Feedback States
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Hydration state (forces chart to wait for client browser to render, avoiding server errors)
  const [mounted, setMounted] = useState<boolean>(false);

  // --- FETCHING DATA (Runs once on start) ---
  useEffect(() => {
    setMounted(true);
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/expenses');
      const json = await res.json();
      
      if (json.success === true) {
        setExpenses(json.data);
      } else {
        setError(json.error || 'Failed to fetch expenses.');
      }
    } catch (err: any) {
      setError('Could not connect to server database. Ensure Atlas is running.');
    } finally {
      setLoading(false);
    }
  }

  // --- MODAL CONTROLLERS ---
  function openAddModal() {
    setModalMode('add');
    setEditingExpenseId(null);
    setFormTitle('');
    setFormAmount('');
    setFormCategory('Food');
    
    // Set form date to today's date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(expense: Expense) {
    setModalMode('edit');
    // Save standard ID string from database document
    const expenseId = expense.id || expense._id || null;
    setEditingExpenseId(expenseId);
    
    setFormTitle(expense.title);
    setFormAmount(expense.amount.toString());
    setFormCategory(expense.category);
    setFormDate(expense.date);
    setFormError(null);
    setIsModalOpen(true);
  }

  // --- CRUD ACTIONS ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Simple Form Validation Checks
    if (formTitle.trim() === '') {
      setFormError('Please enter a description title.');
      return;
    }
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than zero.');
      return;
    }
    if (formDate === '') {
      setFormError('Please select a date.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formTitle,
        amount: parsedAmount,
        category: formCategory,
        date: formDate
      };

      let res;
      if (modalMode === 'add') {
        res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/expenses/${editingExpenseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const json = await res.json();
      if (json.success === true) {
        setIsModalOpen(false);
        fetchExpenses(); // Reload list after add/edit success
      } else {
        setFormError(json.error || 'Failed to submit data.');
      }
    } catch (err: any) {
      setFormError('Failed to communicate with server api.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmDelete = confirm('Are you sure you want to delete this expense record?');
    if (confirmDelete === false) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success === true) {
        // Instantly remove deleted item from local state list to avoid full page refresh delay
        const updatedExpenses = expenses.filter(item => item.id !== id && item._id !== id);
        setExpenses(updatedExpenses);
      } else {
        alert(json.error || 'Failed to delete record.');
      }
    } catch (err: any) {
      alert('Connection error. Failed to delete.');
    }
  }

  // --- STATS COMPUTATIONS (Easy loops for beginners instead of complex array.reduce helper) ---
  let totalAmount = 0;
  
  let foodTotal = 0;
  let transportTotal = 0;
  let shoppingTotal = 0;
  let utilitiesTotal = 0;
  let entertainmentTotal = 0;
  let othersTotal = 0;

  // Simple forEach loop to sum up cost values and split them by category
  expenses.forEach(item => {
    totalAmount = totalAmount + item.amount;
    
    if (item.category === 'Food') {
      foodTotal = foodTotal + item.amount;
    } else if (item.category === 'Transport') {
      transportTotal = transportTotal + item.amount;
    } else if (item.category === 'Shopping') {
      shoppingTotal = shoppingTotal + item.amount;
    } else if (item.category === 'Utilities') {
      utilitiesTotal = utilitiesTotal + item.amount;
    } else if (item.category === 'Entertainment') {
      entertainmentTotal = entertainmentTotal + item.amount;
    } else {
      othersTotal = othersTotal + item.amount;
    }
  });

  // Simple checks to see which category has the highest spending amount
  let topCategoryName = 'N/A';
  let topCategoryVal = 0;

  if (foodTotal > topCategoryVal) {
    topCategoryVal = foodTotal;
    topCategoryName = 'Food';
  }
  if (transportTotal > topCategoryVal) {
    topCategoryVal = transportTotal;
    topCategoryName = 'Transport';
  }
  if (shoppingTotal > topCategoryVal) {
    topCategoryVal = shoppingTotal;
    topCategoryName = 'Shopping';
  }
  if (utilitiesTotal > topCategoryVal) {
    topCategoryVal = utilitiesTotal;
    topCategoryName = 'Utilities';
  }
  if (entertainmentTotal > topCategoryVal) {
    topCategoryVal = entertainmentTotal;
    topCategoryName = 'Entertainment';
  }
  if (othersTotal > topCategoryVal) {
    topCategoryVal = othersTotal;
    topCategoryName = 'Others';
  }

  // Assemble chart data array from our variables for Recharts
  const chartData = [];
  if (foodTotal > 0) chartData.push({ name: 'Food', value: foodTotal, fill: '#f43f5e' });
  if (transportTotal > 0) chartData.push({ name: 'Transport', value: transportTotal, fill: '#0ea5e9' });
  if (shoppingTotal > 0) chartData.push({ name: 'Shopping', value: shoppingTotal, fill: '#f59e0b' });
  if (utilitiesTotal > 0) chartData.push({ name: 'Utilities', value: utilitiesTotal, fill: '#10b981' });
  if (entertainmentTotal > 0) chartData.push({ name: 'Entertainment', value: entertainmentTotal, fill: '#8b5cf6' });
  if (othersTotal > 0) chartData.push({ name: 'Others', value: othersTotal, fill: '#71717a' });

  // --- FILTER & SORT LOGIC (Simple filter & sort methods) ---
  const filteredExpenses = expenses
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

  // Categories list array for rendering select options easily
  const allCategories: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Others'];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* HEADER BAR */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-extrabold text-lg">
              FF
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                FinFlow
              </h1>
              <p className="text-xs text-zinc-400">Personal Expense Tracker Dashboard</p>
            </div>
          </div>
          
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:translate-y-[-1px] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-8">
        
        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Total Spending */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-indigo-500/30 group">
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-300" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Spending</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">
                ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">Aggregated from all logged expenses</p>
          </div>

          {/* Card 2: Total Transactions */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-sky-500/30 group">
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-sky-500/10 blur-2xl group-hover:bg-sky-500/20 transition-all duration-300" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Transactions</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">{expenses.length}</span>
              <span className="text-sm font-semibold text-zinc-500">entries</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">Total transaction records saved</p>
          </div>

          {/* Card 3: Top Category */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-amber-500/30 group">
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all duration-300" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Top Spending Area</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{topCategoryName}</span>
              {topCategoryVal > 0 && (
                <span className="text-sm font-bold text-amber-400/90">
                  (${topCategoryVal.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-zinc-400">Highest sum allocation</p>
          </div>
        </div>

        {/* CONTENT LAYOUT CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ANALYTICS GRAPH (LEFT PANEL) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4">Spending Analytics</h2>
              
              {/* Donut chart component */}
              <div className="h-64 flex flex-col items-center justify-center">
                {mounted && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          borderColor: '#27272a',
                          color: '#fff',
                          borderRadius: '8px'
                        }} 
                        formatter={(val) => [`$${val}`, 'Amount Spent']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-zinc-500 text-sm text-center">
                    {loading ? 'Crunching numbers...' : 'No transaction logs yet to draw graphs.'}
                  </div>
                )}
              </div>

              {/* Categorized totals list legend */}
              {chartData.length > 0 && (
                <div className="mt-4 flex flex-col gap-2.5">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-2 mb-1">
                    Breakdown by Category
                  </div>
                  {allCategories.map((catName) => {
                    // Pull pre-calculated amount variables directly using checks
                    let value = 0;
                    if (catName === 'Food') value = foodTotal;
                    else if (catName === 'Transport') value = transportTotal;
                    else if (catName === 'Shopping') value = shoppingTotal;
                    else if (catName === 'Utilities') value = utilitiesTotal;
                    else if (catName === 'Entertainment') value = entertainmentTotal;
                    else value = othersTotal;

                    const IconComponent = getCategoryIcon(catName);
                    const colorHex = getCategoryChartColor(catName);
                    const percentage = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(0) : '0';

                    return (
                      <div key={catName} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <span 
                            className="h-2 w-2 rounded-full" 
                            style={{ backgroundColor: colorHex }} 
                          />
                          <IconComponent className="h-4.5 w-4.5 text-zinc-400" />
                          <span>{catName}</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-zinc-400">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          <span className="text-xs text-zinc-500">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* LIST LOGS & FILTERS (RIGHT PANEL) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* CONTROLS (SEARCH & DROP-DOWN FILTERS) */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Keyword Search Input */}
              <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Magnifier className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search expense description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Filters & Sorters */}
              <div className="flex w-full md:w-auto gap-4 items-center justify-end">
                {/* Category Select Dropdown */}
                <div className="relative w-1/2 md:w-44">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none transition-all cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Order Select Dropdown */}
                <div className="relative w-1/2 md:w-44">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none transition-all cursor-pointer"
                  >
                    <option value="date-desc">Newest Date</option>
                    <option value="date-asc">Oldest Date</option>
                    <option value="amount-desc">Highest Cost</option>
                    <option value="amount-asc">Lowest Cost</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TRANSACTION RECORDS CONTAINER */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-xl overflow-hidden">
              
              {/* Desktop view: Classic Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Expense Details</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 w-32 bg-zinc-800 rounded" /></td>
                          <td className="px-6 py-4"><div className="h-6 w-20 bg-zinc-800 rounded-full" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
                          <td className="px-6 py-4 text-right"><div className="h-4 w-16 bg-zinc-800 rounded ml-auto" /></td>
                          <td className="px-6 py-4"><div className="h-8 w-16 bg-zinc-800 rounded mx-auto" /></td>
                        </tr>
                      ))
                    ) : error ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-rose-500 font-medium">{error}</td>
                      </tr>
                    ) : filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          No logged expenses match your current selection filter.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((expense) => {
                        const CategoryIcon = getCategoryIcon(expense.category);
                        const badgeColors = getCategoryColorClass(expense.category);
                        return (
                          <tr key={expense.id || expense._id} className="hover:bg-zinc-900/40 group transition-all">
                            <td className="px-6 py-4">
                              <span className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                                {expense.title}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeColors}`}>
                                <CategoryIcon className="h-3.5 w-3.5" />
                                {expense.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-zinc-400">
                              {new Date(expense.date).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                timeZone: 'UTC' // Timezone independent display format
                              })}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-white text-base">
                              ${expense.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => openEditModal(expense)}
                                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:text-indigo-400 transition-all cursor-pointer"
                                  title="Edit Entry"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(expense.id || expense._id || '')}
                                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:text-rose-500 transition-all cursor-pointer"
                                  title="Delete Entry"
                                >
                                  <TrashBin className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile view: Stacked list layout */}
              <div className="sm:hidden block p-4 flex flex-col gap-4">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
                      <div className="h-4 w-2/3 bg-zinc-800 rounded" />
                      <div className="flex justify-between">
                        <div className="h-6 w-20 bg-zinc-800 rounded-full" />
                        <div className="h-4 w-12 bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ))
                ) : error ? (
                  <div className="text-center text-rose-500 font-medium py-6">{error}</div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="text-center text-zinc-500 py-8">
                    No logged expenses match your current selection filter.
                  </div>
                ) : (
                  filteredExpenses.map((expense) => {
                    const CategoryIcon = getCategoryIcon(expense.category);
                    const badgeColors = getCategoryColorClass(expense.category);
                    return (
                      <div 
                        key={expense.id || expense._id} 
                        className="rounded-xl border border-zinc-850 bg-zinc-900/40 p-4 flex flex-col gap-3.5 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-white leading-snug">{expense.title}</h4>
                          <span className="text-base font-extrabold text-white shrink-0">
                            ${expense.amount.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold border ${badgeColors}`}>
                            <CategoryIcon className="h-3 w-3" />
                            {expense.category}
                          </span>
                          <span className="text-zinc-500">
                            {new Date(expense.date).toLocaleDateString(undefined, { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              timeZone: 'UTC'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/40">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-semibold hover:border-zinc-700 hover:text-indigo-400 transition-all cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id || expense._id || '')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-semibold hover:border-zinc-700 hover:text-rose-500 transition-all cursor-pointer"
                          >
                            <TrashBin className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL overlay (Form) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          />
          
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <Xmark className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-6">
              {modalMode === 'add' ? 'Log New Expense' : 'Modify Expense Log'}
            </h3>

            {formError && (
              <div className="mb-5 p-3 rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Field 1: Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Coffee shop, Office rent"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-855 bg-zinc-950 text-sm text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>

              {/* Field 2: Cost Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-855 bg-zinc-950 text-sm text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>

              {/* Field 3: Category Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Category</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-zinc-850 bg-zinc-950 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none transition-all cursor-pointer"
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 4: Date Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-850 bg-zinc-950 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>

              {/* Modal Buttons */}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-transparent hover:bg-zinc-800 text-zinc-300 font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : modalMode === 'add' ? 'Add Log' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER BAR */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 px-6 text-center text-xs text-zinc-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} FinFlow. Built with Next.js, MongoDB Atlas & Gravity UI Icons.</p>
          <div className="flex gap-4">
            <span className="text-zinc-650">Clean code structure, designed for freshers & junior developers.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
