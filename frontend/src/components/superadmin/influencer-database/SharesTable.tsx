"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Ban, Clock } from "lucide-react"
import type { InfluencerAccessShare } from "@/types/influencerDatabase"

interface SharesTableProps {
  shares: InfluencerAccessShare[]
  onEdit: (id: string) => void
  onRevoke: (id: string) => void
  onExtend: (id: string) => void
}

function formatDate(dateString: string | null) {
  if (!dateString) return "Never"
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export function SharesTable({ shares, onEdit, onRevoke, onExtend }: SharesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-center"># Influencers</TableHead>
          <TableHead className="text-center">Shared With</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shares.map((share) => {
          const expired = isExpired(share.expires_at)
          const active = share.is_active && !expired

          return (
            <TableRow key={share.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{share.name}</p>
                  {share.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {share.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">{share.influencer_ids.length}</TableCell>
              <TableCell className="text-center">{share.shared_with_users.length}</TableCell>
              <TableCell>{formatDate(share.expires_at)}</TableCell>
              <TableCell>
                <Badge variant={active ? "default" : "secondary"}>
                  {active ? "Active" : expired ? "Expired" : "Revoked"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(share.id)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExtend(share.id)}>
                      <Clock className="h-4 w-4 mr-2" />
                      Extend 90 Days
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onRevoke(share.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Revoke
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
