import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Expense } from '@/types/expense';

// We specify database name and collection name clearly
const DB_NAME = 'expense_tracker';
const COLLECTION_NAME = 'expenses';

/**
 * GET Handler: Fetches all expenses from MongoDB Atlas.
 * Sorted by date in descending order (newest first).
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Fetch all records from the collection
    const rawExpenses = await db
      .collection(COLLECTION_NAME)
      .find({})
      .sort({ date: -1, _id: -1 })
      .toArray();

    // Map native MongoDB documents into frontend-friendly Expense types
    const expenses: Expense[] = rawExpenses.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      amount: doc.amount,
      category: doc.category,
      date: doc.date,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expenses: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST Handler: Creates a new expense in MongoDB Atlas.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, amount, category, date } = body;

    // Validation (clean, standard code suitable for freshers to learn from)
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be a positive number' }, { status: 400 });
    }

    const validCategories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Others'];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json({ success: false, error: 'Invalid category' }, { status: 400 });
    }

    if (!date || isNaN(Date.parse(date))) {
      return NextResponse.json({ success: false, error: 'Valid date is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Assemble the document to be inserted
    const newExpense = {
      title: title.trim(),
      amount: parsedAmount,
      category,
      date, // Format: YYYY-MM-DD
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(newExpense);

    // Return the created expense, including the stringified MongoDB ObjectId
    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newExpense,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create expense: ' + error.message },
      { status: 500 }
    );
  }
}
