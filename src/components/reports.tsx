"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface ReportItem {
  month?: string;
  account_name?: string;
  total_income: number;
  total_expense: number;
}

export function Reports() {
  const [groupBy, setGroupBy] = useState<"month" | "account" | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["reports", groupBy, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: format(dateRange.from || new Date(), "yyyy-MM-dd"),
        endDate: format(dateRange.to || new Date(), "yyyy-MM-dd"),
        ...(groupBy && { groupBy }),
      });
      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select onValueChange={(value: "month" | "account") => setGroupBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">By Month</SelectItem>
            <SelectItem value="account">By Account</SelectItem>
          </SelectContent>
        </Select>
        <DatePickerWithRange 
          date={dateRange} 
          setDate={(range) => setDateRange({
            from: range?.from ?? undefined,
            to: range?.to ?? undefined
          })}
        />
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupBy ? (
            Array.isArray(reportData) && reportData.map((item: ReportItem, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>
                    {groupBy === "month"
                      ? format(new Date(item.month || new Date()), "MMMM yyyy")
                      : item.account_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-green-600">
                      Income: {formatCurrency(Number(item.total_income))}
                    </div>
                    <div className="text-red-600">
                      Expense: {formatCurrency(Number(item.total_expense))}
                    </div>
                    <div className="font-bold">
                      Net: {formatCurrency(Number(item.total_income) - Number(item.total_expense))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Overall Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-green-600">
                    Total Income: {formatCurrency(Number(reportData?.total_income || 0))}
                  </div>
                  <div className="text-red-600">
                    Total Expense: {formatCurrency(Number(reportData?.total_expense || 0))}
                  </div>
                  <div className="font-bold">
                    Net: {formatCurrency(Number(reportData?.total_income || 0) - Number(reportData?.total_expense || 0))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 