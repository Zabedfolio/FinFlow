import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Expense } from '@/types/expense';

const DB_NAME = 'Finflow';
const COLLECTION_NAME = 'expenses';

/**
 * GET Endpoint: Fetches all expenses from MongoDB.
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Fetch all database records as a raw array, sorting by date descending (newest first)
    const rawExpenses = await db
      .collection(COLLECTION_NAME)
      .find({})
      .sort({ date: -1, _id: -1 })
      .toArray();

    // Simplify: Use a traditional for-loop to build our frontend expense array
    const expenses: Expense[] = [];
    for (let i = 0; i < rawExpenses.length; i++) {
      const doc = rawExpenses[i];
      
      // Convert MongoDB's special ObjectId type into a standard string ID
      expenses.push({
        id: doc._id.toString(),
        title: doc.title,
        amount: doc.amount,
        category: doc.category,
        date: doc.date,
        createdAt: doc.createdAt,
      });
    }

    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    console.error('Error fetching database records:', error);
    return NextResponse.json(
      { success: false, error: 'Database connection failed: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST Endpoint: Creates a new expense in MongoDB.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, amount, category, date } = body;

    // Simple Form Validation Checks
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ success: false, error: 'Description title is required' }, { status: 400 });
    }
    
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be a positive number' }, { status: 400 });
    }

    // Verify category matches one of the 6 allowed strings
    const allowedCategories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Others'];
    if (!category || !allowedCategories.includes(category)) {
      return NextResponse.json({ success: false, error: 'Select a valid category' }, { status: 400 });
    }

    if (!date || isNaN(Date.parse(date))) {
      return NextResponse.json({ success: false, error: 'Please select a valid date' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Build the document structure we want to insert into MongoDB
    const newExpense = {
      title: title.trim(),
      amount: parsedAmount,
      category: category,
      date: date,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(newExpense);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newExpense,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating database record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save expense: ' + error.message },
      { status: 500 }
    );
  }
}
