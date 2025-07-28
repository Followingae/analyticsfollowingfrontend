"use client"

import * as React from "react"
import { type DateRange } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"

export default function Calendar05() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()

  return (
    <Calendar
      mode="range"
      selected={dateRange}
      onSelect={setDateRange}
      numberOfMonths={2}
      className="rounded-lg border shadow-sm"
      classNames={{
        day_selected: "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white",
        day_range_start: "bg-black text-white hover:bg-black hover:text-white",
        day_range_end: "bg-black text-white hover:bg-black hover:text-white", 
        day_range_middle: "bg-black/20 text-black hover:bg-black/20"
      }}
    />
  )
}
