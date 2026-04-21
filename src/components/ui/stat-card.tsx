"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "~/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { FinancialDisplay } from "./financial-display"

interface StatCardProps {
  title: string
  amount: number | string;
  type?: "income" | "expense" | "neutral" | "auto"
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  className?: string
  delay?: number
}

export function StatCard({
  title,
  amount,
  type = "neutral",
  icon,
  trend,
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={cn("glass card-hover border-white/10 dark:border-white/5", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && <div className="text-muted-foreground/80">{icon}</div>}
        </CardHeader>
        <CardContent>
          <FinancialDisplay
            amount={amount}
            type={type}
            className="text-2xl font-bold"
            showSign={false}
          />
          {trend && (
            <p className="mt-2 flex items-center text-xs">
              <span
                className={cn(
                  "font-medium mr-1",
                  trend.isPositive ? "text-emerald-500" : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
              <span className="text-muted-foreground">{trend.label}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
