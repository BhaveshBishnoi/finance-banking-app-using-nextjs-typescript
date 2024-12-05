import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Summary {
  total_income: number;
  total_expense: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupBy = searchParams.get("groupBy"); // 'month' or 'account'
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    if (groupBy === "month") {
      const reports = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', date) as month,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expense
        FROM "Transaction"
        WHERE date BETWEEN ${startDate}::date AND ${endDate}::date
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month DESC
      `;
      return NextResponse.json(reports);
    }

    if (groupBy === "account") {
      const reports = await prisma.$queryRaw`
        SELECT 
          a.name as account_name,
          SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as total_income,
          SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as total_expense
        FROM "Transaction" t
        JOIN "Account" a ON t.accountId = a.id
        WHERE t.date BETWEEN ${startDate}::date AND ${endDate}::date
        GROUP BY a.id, a.name
      `;
      return NextResponse.json(reports);
    }

    // Default summary
    const summary = await prisma.$queryRaw<Summary[]>`
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expense
      FROM "Transaction"
      WHERE date BETWEEN ${startDate}::date AND ${endDate}::date
    `;
    return NextResponse.json(summary[0]);
  } catch (error: unknown) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
