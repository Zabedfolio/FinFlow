import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'Finflow';
const COLLECTION_NAME = 'expenses';

/**
 * PUT Handler: Updates an expense by ID in MongoDB Atlas.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Ensure the ID is a valid 24-character hexadecimal MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid expense ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, amount, category, date } = body;

    // Construct the fields we actually want to update (selective update)
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json({ success: false, error: 'Title cannot be empty' }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ success: false, error: 'Amount must be positive' }, { status: 400 });
      }
      updateData.amount = parsedAmount;
    }

    if (category !== undefined) {
      const validCategories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Others'];
      if (!validCategories.includes(category)) {
        return NextResponse.json({ success: false, error: 'Invalid category selection' }, { status: 400 });
      }
      updateData.category = category;
    }

    if (date !== undefined) {
      if (isNaN(Date.parse(date))) {
        return NextResponse.json({ success: false, error: 'Invalid date selection' }, { status: 400 });
      }
      updateData.date = date;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No update data provided' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Update document in collection
    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' } // Tells MongoDB to return the updated record
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result._id.toString(),
        title: result.title,
        amount: result.amount,
        category: result.category,
        date: result.date,
        createdAt: result.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update expense: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE Handler: Deletes an expense by ID from MongoDB Atlas.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid expense ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTION_NAME).deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete expense: ' + error.message },
      { status: 500 }
    );
  }
}
