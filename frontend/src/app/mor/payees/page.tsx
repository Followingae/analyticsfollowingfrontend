'use client'

/**
 * The payee book: where the client's money actually goes.
 *
 * One at a time, or a CSV. The IBAN is validated server-side for shape, country length and
 * check digits before anything is stored, and a second account for the same payee is
 * refused rather than created — this is a wrong transfer waiting to happen otherwise.
 * Existing payees are skipped on import unless the person explicitly says to replace them.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ArrowLeft, Landmark, Upload, UserPlus } from 'lucide-react'
import { morApi, type MorPayee } from '@/services/morApi'

const EMPTY = {
  creator_username: '',
  account_holder: '',
  iban: '',
  bank_name: '',
  swift: '',
  country: '',
}

export default function PayeesPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <PayeesContent />
      </BrandUserInterface>
    </AuthGuard>
  )
}

function PayeesContent() {
  const [payees, setPayees] = useState<MorPayee[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const r = await morApi.payees()
      setPayees(r.data)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (replaceExisting = false) => {
    setSaving(true)
    try {
      const r = await morApi.addPayee({ ...form, replace_existing: replaceExisting })
      toast.success(
        r.data.action === 'updated'
          ? `${form.account_holder} updated.`
          : `${form.account_holder} added.`
      )
      setForm({ ...EMPTY })
      await load()
    } catch (e: any) {
      const message = String(e.message || '')
      if (message.includes('already on file')) {
        // Never silently overwrite where the money goes. Ask, name the account on file,
        // and let them decide.
        toast.error(message, {
          action: { label: 'Replace it', onClick: () => save(true) },
          duration: 10000,
        })
      } else {
        toast.error(message)
      }
    } finally {
      setSaving(false)
    }
  }

  const upload = async (file: File) => {
    setImporting(true)
    setImportResult(null)
    try {
      const r = await morApi.importPayees(file, 'skip')
      const c = r.data.counts
      setImportResult([
        `${c.added} added`,
        `${c.skipped} already on file and left alone`,
        `${c.failed} could not be read`,
        ...r.data.failed.map((f) => `Row ${f.row}: ${f.why}`),
      ])
      toast.success(`${c.added} payees added.`)
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const canSave =
    form.account_holder.trim().length > 0 &&
    form.iban.trim().length > 0 &&
    form.creator_username.trim().length > 0

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/mor">
            <ArrowLeft className="mr-2 h-4 w-4" /> Merchant of Record
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Payee bank details</h1>
        <p className="text-muted-foreground max-w-2xl">
          The accounts we transfer to on your behalf. Check every IBAN against the
          creator&apos;s own bank letter before you save it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Add a payee
          </CardTitle>
          <CardDescription>
            The name must match the bank account exactly, or the transfer is returned.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="creator_username"
              label="Creator handle"
              placeholder="creatorhandle"
              value={form.creator_username}
              onChange={(v) => setForm({ ...form, creator_username: v })}
            />
            <Field
              id="account_holder"
              label="Name on the account"
              placeholder="As the bank has it"
              value={form.account_holder}
              onChange={(v) => setForm({ ...form, account_holder: v })}
            />
            <Field
              id="iban"
              label="IBAN"
              placeholder="AE07 0331 2345 6789 0123 456"
              value={form.iban}
              onChange={(v) => setForm({ ...form, iban: v })}
            />
            <Field
              id="bank_name"
              label="Bank"
              placeholder="Emirates NBD"
              value={form.bank_name}
              onChange={(v) => setForm({ ...form, bank_name: v })}
            />
            <Field
              id="swift"
              label="SWIFT / BIC"
              placeholder="EBILAEAD"
              value={form.swift}
              onChange={(v) => setForm({ ...form, swift: v })}
            />
            <Field
              id="country"
              label="Country"
              placeholder="AE"
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v })}
            />
          </div>
          <Button onClick={() => save(false)} disabled={!canSave || saving}>
            {saving ? 'Checking the IBAN…' : 'Add payee'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> Upload a list
          </CardTitle>
          <CardDescription>
            A CSV with the columns creator_username, account_holder, iban, bank_name, swift,
            country. Anyone already on file is left exactly as they are.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            disabled={importing}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload(f)
            }}
          />
          {importing && <p className="text-sm text-muted-foreground">Reading the file…</p>}
          {importResult && (
            <Alert>
              <AlertDescription>
                <ul className="space-y-1 text-sm">
                  {importResult.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4" /> On file
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : payees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payees yet. Add one above, or upload your list.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Account name</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Country</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payees.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.creator_username ? `@${p.creator_username}` : '—'}
                    </TableCell>
                    <TableCell>{p.account_holder}</TableCell>
                    <TableCell className="font-mono text-xs">{p.iban_masked || '—'}</TableCell>
                    <TableCell>{p.bank_name || '—'}</TableCell>
                    <TableCell>
                      {p.country ? <Badge variant="outline">{p.country}</Badge> : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
