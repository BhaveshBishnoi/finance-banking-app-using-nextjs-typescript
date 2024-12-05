import { AccountsDashboard } from "@/components/accounts-dashboard"
import { StatementUploader } from "@/components/statement-uploader"
import { AddAccountDialog } from "@/components/add-account-dialog"
import { TransactionsTable } from "@/components/transactions-table"

export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Company Finance Dashboard</h1>
        <AddAccountDialog />
      </div>
      
      <div className="grid gap-8">
        <div className="space-y-8">
          <StatementUploader />
          <AccountsDashboard />
        </div>
        <TransactionsTable />
      </div>
    </div>
  )
}
