import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'Finflow';
const COLLECTION_NAME = 'expenses';

/**
 * PUT Endpoint: Modifies an existing expense matching the URL ID parameter.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if the hex string is a valid 24-character MongoDB ID
    if (ObjectId.isValid(id) === false) {
      return NextResponse.json({ success: false, error: 'Invalid record ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { title, amount, category, date } = body;

    // Build the set parameters selectively based on what the user changed in the input form
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
      const allowedCategories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Others'];
      if (allowedCategories.includes(category) === false) {
        return NextResponse.json({ success: false, error: 'Invalid category selection' }, { status: 400 });
      }
      updateData.category = category;
    }

    if (date !== undefined) {
      if (isNaN(Date.parse(date)) === true) {
        return NextResponse.json({ success: false, error: 'Invalid date selection' }, { status: 400 });
      }
      updateData.date = date;
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Apply the updates to the matching database document
    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' } // Tells MongoDB to return the newly updated document
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Expense record not found' }, { status: 404 });
    }

    // Return the updated fields back to the client UI
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
    console.error('Error modifying database record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update record: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE Endpoint: Removes a specific expense matching the URL ID parameter.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (ObjectId.isValid(id) === false) {
      return NextResponse.json({ success: false, error: 'Invalid record ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Execute deletion query matching ObjectId
    const result = await db.collection(COLLECTION_NAME).deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Expense record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Expense record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting database record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete record: ' + error.message },
      { status: 500 }
    );
  }
}
