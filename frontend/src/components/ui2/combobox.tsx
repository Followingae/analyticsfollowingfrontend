"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ComboboxOption = {
  value: string
  label: string
  disabled?: boolean
}

type ComboboxProps = {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  contentClassName?: string
  /** Clicking the selected option again clears the selection. Default: true. */
  clearable?: boolean
}

function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyText = "No results.",
  disabled,
  className,
  contentClassName,
  clearable = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selected = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          data-slot="combobox-trigger"
          className={cn(
            "w-full justify-between rounded-ds-control font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-slot="combobox-content"
        align="start"
        className={cn(
          "w-[--radix-popover-trigger-width] rounded-ds-overlay p-0",
          contentClassName
        )}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => {
                    const next =
                      clearable && option.value === value ? "" : option.value
                    onValueChange?.(next)
                    setOpen(false)
                  }}
                >
                  {option.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto size-4",
                      option.value === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox, type ComboboxOption, type ComboboxProps }
