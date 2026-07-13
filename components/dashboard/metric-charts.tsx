"use client"

import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
}

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-popover-foreground">
        {label ? format(new Date(label), "MMM d, HH:mm") : ""}
      </p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="text-muted-foreground">
          <span className="font-mono font-medium text-foreground">
            {Number(entry.value).toLocaleString()}
            {unit}
          </span>{" "}
          {entry.name}
        </p>
      ))}
    </div>
  )
}

interface ChartCardProps {
  title: string
  description: string
  children: React.ReactNode
}

function ChartCard({ title, description, children }: ChartCardProps) {
  // Recharts' ResponsiveContainer cannot measure during SSR. Render a
  // same-height placeholder until the component mounts on the client.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[220px] w-full px-2">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              {children as React.ReactElement}
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export interface ChartDataPoint {
  ts: string
  latency: number
  qps: number
  cpu: number
  cacheHit: number
}

export function LatencyChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ChartCard title="Query latency (p95)" description="95th percentile response time over the last 24 hours">
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="ts" {...axisProps} tickFormatter={(v) => format(new Date(v), "HH:mm")} minTickGap={40} />
        <YAxis {...axisProps} width={40} />
        <Tooltip content={<ChartTooltip unit="ms" />} />
        <Area
          type="monotone"
          dataKey="latency"
          name="ms p95"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#latencyFill)"
        />
      </AreaChart>
    </ChartCard>
  )
}

export function ThroughputChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ChartCard title="Throughput" description="Queries per second served across all connections">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="ts" {...axisProps} tickFormatter={(v) => format(new Date(v), "HH:mm")} minTickGap={40} />
        <YAxis {...axisProps} width={40} />
        <Tooltip content={<ChartTooltip unit=" qps" />} />
        <Line
          type="monotone"
          dataKey="qps"
          name="qps"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartCard>
  )
}

export function CpuChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ChartCard title="CPU utilization" description="Compute load across monitored instances">
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="ts" {...axisProps} tickFormatter={(v) => format(new Date(v), "HH:mm")} minTickGap={40} />
        <YAxis {...axisProps} width={40} domain={[0, 100]} />
        <Tooltip content={<ChartTooltip unit="%" />} />
        <Area
          type="monotone"
          dataKey="cpu"
          name="% CPU"
          stroke="var(--color-chart-4)"
          strokeWidth={2}
          fill="url(#cpuFill)"
        />
      </AreaChart>
    </ChartCard>
  )
}

export function CacheHitChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ChartCard title="Cache hit ratio" description="Buffer cache efficiency over time">
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="ts" {...axisProps} tickFormatter={(v) => format(new Date(v), "HH:mm")} minTickGap={40} />
        <YAxis {...axisProps} width={40} domain={[80, 100]} />
        <Tooltip content={<ChartTooltip unit="%" />} />
        <Bar dataKey="cacheHit" name="% hit" fill="var(--color-chart-3)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ChartCard>
  )
}

