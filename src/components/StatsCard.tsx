import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export default function StatsCard({ title, value, icon, trend, trendUp, className }: StatsCardProps) {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-heading font-bold mt-1">{value}</p>
            {trend && (
              <p className={cn("text-xs mt-1", trendUp ? "text-railway-green" : "text-destructive")}>
                {trend}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-railway-gold/10 flex items-center justify-center text-railway-gold">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
