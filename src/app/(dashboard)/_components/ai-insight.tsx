'use client';

import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { api } from '~/trpc/react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { cn } from '~/lib/utils';

type AIInsightProps = {
  userId: string;
};

export const AIInsight = ({ userId }: AIInsightProps): React.ReactElement => {
  const { data: insights, isLoading, refetch, isFetching } = api.dashboard.getAIInsights.useQuery(
    { userId },
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 1, // 1 minute
    }
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="size-4 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="size-4 text-emerald-500" />;
      default:
        return <Info className="size-4 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 shadow-lg backdrop-blur-sm">
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-pink-500/10 blur-3xl" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 shadow-lg shadow-indigo-500/20">
            <Sparkles className="size-4 text-white" />
          </div>
          <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-lg font-bold text-transparent dark:from-indigo-400 dark:to-purple-400">
            AI Insight
          </CardTitle>
          <Badge variant="outline" className="ml-2 border-indigo-200 bg-indigo-50/50 text-[10px] text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400">
            Beta
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-8 rounded-full hover:bg-white/50 dark:hover:bg-black/20"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("size-3.5 text-muted-foreground", isFetching && "animate-spin")} />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-2">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl bg-white/50 dark:bg-white/5" />
            <Skeleton className="h-16 w-full rounded-xl bg-white/50 dark:bg-white/5" />
          </div>
        ) : insights && insights.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight) => (
              <div 
                key={`${insight.title}-${insight.message}`} 
                className={cn(
                  "group relative rounded-xl border p-4 transition-all hover:scale-[1.02] hover:shadow-md",
                  getBgColor(insight.type)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-white/80 p-1 dark:bg-black/20">
                    {getIcon(insight.type)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      {insight.title}
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-foreground">
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="mb-2 size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Tidak ada insight baru saat ini.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
