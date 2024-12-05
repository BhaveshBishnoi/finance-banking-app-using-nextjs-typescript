'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect, useMemo } from "react"
import { Account, Transaction, TransactionCategory, Tag } from "@/types/finance"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Tag as TagIcon, Plus } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "./ui/button"
import CommentPopup from './commentpopup'; // Import the CommentPopup component

const CATEGORIES: TransactionCategory[] = ['Income', 'Expense', 'Asset', 'Liability']
const RANDOM_TAGS = ['Entertainment', 'Repayment', 'Education', 'Grocery', 'Charity', 'Shopping']; // List of random tags

// Function to generate a random color from a predefined set
const getRandomColor = () => {
  const colors = ["red", "green", "blue", "orange", "purple"];
  return colors[Math.floor(Math.random() * colors.length)];
};

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [newTag, setNewTag] = useState('')
  const [showComment, setShowComment] = useState<{ [key: string]: string }>({})
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string }>({}); // State to track selected tags for each transaction
  const [showTagPopup, setShowTagPopup] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [existingTags, setExistingTags] = useState<string[]>([]); // Store existing tags
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null); // State to track the current transaction for comments
  const [isCommentPopupOpen, setIsCommentPopupOpen] = useState(false); // State to control the popup visibility
  const [transactionTags, setTransactionTags] = useState<{ [key: string]: string[] }>({}); // State to track tags for each transaction

  useEffect(() => {
    async function fetchData() {
      try {
        const [transactionsRes, accountsRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/accounts')
        ])

        if (transactionsRes.ok && accountsRes.ok) {
          const [transactionsData, accountsData] = await Promise.all([
            transactionsRes.json(),
            accountsRes.json()
          ])
          setTransactions(transactionsData)
          setAccounts(accountsData)
        }
      } catch (error) {
        console.log('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tags");
        if (!response.ok) throw new Error("Failed to fetch tags");
        const tags: Tag[] = await response.json();
        setExistingTags(tags.map((tag: Tag) => tag.name));
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, []);

  // Generate last 12 months for the filter
  const getMonthOptions = () => {
    const options = []
    const today = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      options.push({
        value: `${date.getFullYear()}-${date.getMonth()}`,
        label: format(date, 'MMMM yyyy')
      })
    }
    
    return options
  }

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    
    // Filter by account
    const accountMatch = selectedAccount === "all" || transaction.accountId === selectedAccount
    
    // Filter by month
    let monthMatch = true
    if (selectedMonth !== "all") {
      const [year, month] = selectedMonth.split('-').map(Number)
      const startDate = startOfMonth(new Date(year, month))
      const endDate = endOfMonth(startDate)
      
      monthMatch = isWithinInterval(transactionDate, { start: startDate, end: endDate })
    }
    
    // Filter by category
    const categoryMatch = selectedCategory === "all" || transaction.category === selectedCategory
    
    return accountMatch && monthMatch && categoryMatch
  })

  const handleCategoryChange = async (transactionId: string, category: TransactionCategory) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
      })

      if (!response.ok) throw new Error('Failed to update category')

      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId ? { ...t, category } : t
        )
      )

      toast.success('Category updated')
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.error('Failed to update category')
    }
  }

  const handleAddTag = async (transactionId: string, tagName: string) => {
    if (!tagName.trim()) return; // Prevent empty tags

    try {
      const response = await fetch(`/api/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName }),
      });

      if (!response.ok) {
        const error = await response.text();
        toast.error(`Failed to add tag: ${error}`);
        return;
      }

      const newTag = await response.json();

      // Add the new tag to the transaction
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId
            ? { ...transaction, tags: [...transaction.tags, newTag] }
            : transaction
        )
      );

      // Update the existing tags list
      setExistingTags((prev) => [...new Set([...prev, newTag.name])]);
      toast.success("Tag added successfully");
      setNewTag(""); // Clear input
      setShowTagPopup(false); // Close popover

      // Update transactionTags state
      setTransactionTags((prev) => ({
        ...prev,
        [transactionId]: [...(prev[transactionId] || []), newTag.name],
      }));
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Error adding tag");
    }
  };

  const handleUpdateComment = async (transactionId: string, comment: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      const updatedTransaction = await response.json();
      setTransactions(prev => 
        prev.map(t => (t.id === transactionId ? updatedTransaction : t))
      );
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleAddTagFromTextArea = (transactionId: string) => {
    if (newTag.trim()) { // Check if the newTag is not empty
      handleAddTag(transactionId, newTag.trim()); // Add the new tag
      setNewTag(''); // Clear the input after adding
      setShowTagPopup(false); // Close the popup
    }
  };

  if (loading) return <div>Loading transactions...</div>

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Recent Transactions</CardTitle>
            <span className="text-sm text-muted-foreground">
              ({filteredTransactions.length})
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {getMonthOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem 
                      key={category} 
                      value={category}
                      className={cn(
                        category === 'Income' && "text-green-600",
                        category === 'Expense' && "text-red-600",
                        category === 'Asset' && "text-blue-600",
                        category === 'Liability' && "text-orange-600"
                      )}
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto text-sm text-muted-foreground">
                {filteredTransactions.length} transactions
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const account = accounts.find(a => a.id === transaction.accountId);

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{account?.name}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {(transactionTags[transaction.id] || transaction.tags.map(tag => tag.name)).map(tag => (
                              <Badge key={tag} variant="secondary" className={`rounded-md bg-${getRandomColor()}-600`}>
                                #{tag}
                              </Badge>
                            ))}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setShowTagPopup(true)}>
                                  <TagIcon className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-4">
                                <div>
                                  <Textarea
                                    placeholder="Type your tag here..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    className="mb-4"
                                  />
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleAddTag(transaction.id, newTag)}
                                  >
                                    Add Tag
                                  </Button>
                                </div>
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium">Existing Tags:</h4>
                                  <div className="flex gap-2 flex-wrap mt-2">
                                    {existingTags.map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="secondary"
                                        onClick={() => {
                                          handleAddTag(transaction.id, tag); // Add existing tag
                                          setTransactionTags((prev) => ({
                                            ...prev,
                                            [transaction.id]: [...(prev[transaction.id] || []), tag],
                                          }));
                                        }}
                                        className="cursor-pointer"
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setCurrentTransactionId(transaction.id); // Set the current transaction ID
                                setIsCommentPopupOpen(true); // Open the comment popup
                              }}
                            >
                              {transaction.comment ? (
                                <span>{transaction.comment}</span> // Display the comment text
                              ) : (
                                <MessageSquare className="h-4 w-4" /> // Display the comment icon if no comment exists
                              )}
                            </Button>
                            {isCommentPopupOpen && currentTransactionId === transaction.id && (
                              <CommentPopup
                                triggerButton={<Button variant="ghost" size="sm">Edit Comment</Button>}
                                onSave={async (commentText) => {
                                  await handleUpdateComment(transaction.id, commentText); // Update the comment
                                  setIsCommentPopupOpen(false); // Close the popup after saving
                                }}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`text-right ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}$
                          {transaction.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
} 