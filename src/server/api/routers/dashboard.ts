import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const dashboardRouter = createTRPCRouter({
  getSummary: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const [totalBalance, monthlyIncome, monthlyExpense] = await Promise.all([
        ctx.db.account.aggregate({
          where: { userId: input.userId },
          _sum: { balance: true },
        }),
        ctx.db.transaction.aggregate({
          where: {
            userId: input.userId,
            type: 'income',
            transactionDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
        ctx.db.transaction.aggregate({
          where: {
            userId: input.userId,
            type: 'expense',
            transactionDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        totalBalance: Number(totalBalance._sum.balance ?? 0),
        income: Number(monthlyIncome._sum.amount ?? 0),
        expense: Number(monthlyExpense._sum.amount ?? 0),
        netWorth: Number(totalBalance._sum.balance ?? 0),
      };
    }),

  getRecentTransactions: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const [transactions, transfers] = await Promise.all([
        ctx.db.transaction.findMany({
          where: { userId: input.userId },
          include: { account: true, category: true },
          orderBy: { transactionDate: 'desc' },
          take: input.limit,
        }),
        ctx.db.transferTransaction.findMany({
          where: { userId: input.userId },
          include: { fromAccount: true, toAccount: true },
          orderBy: { transactionDate: 'desc' },
          take: input.limit,
        }),
      ]);

      type UnifiedTransaction = {
        id: string;
        type: string;
        amount: number;
        note: string | null;
        transactionDate: Date;
        accountName: string;
        categoryName: string | null;
        toAccountName?: string;
      };

      const unified: UnifiedTransaction[] = [
        ...transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          note: t.note,
          transactionDate: t.transactionDate,
          accountName: t.account.name,
          categoryName: t.category?.name ?? null,
        })),
        ...transfers.map((t) => ({
          id: t.id,
          type: 'transfer' as const,
          amount: Number(t.amount),
          note: t.note,
          transactionDate: t.transactionDate,
          accountName: t.fromAccount.name,
          categoryName: null,
          toAccountName: t.toAccount.name,
        })),
      ];

      unified.sort(
        (a, b) =>
          b.transactionDate.getTime() - a.transactionDate.getTime()
      );

      return unified.slice(0, input.limit);
    }),

  getMonthlyTrend: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        months: z.number().min(1).max(24).default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const results = [];

      for (let i = input.months - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59
        );

        const [income, expense] = await Promise.all([
          ctx.db.transaction.aggregate({
            where: {
              userId: input.userId,
              type: 'income',
              transactionDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
          }),
          ctx.db.transaction.aggregate({
            where: {
              userId: input.userId,
              type: 'expense',
              transactionDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
          }),
        ]);

        results.push({
          month: start.toLocaleString('default', { month: 'short' }),
          year: start.getFullYear(),
          income: Number(income._sum.amount ?? 0),
          expense: Number(expense._sum.amount ?? 0),
        });
      }

      return results;
    }),

  getExpenseByCategory: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const expenses = await ctx.db.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: input.userId,
          type: 'expense',
          transactionDate: { gte: startOfMonth, lte: endOfMonth },
          categoryId: { not: null },
        },
        _sum: { amount: true },
      });

      const categoryIds = expenses
        .map((e) => e.categoryId)
        .filter((id): id is string => id !== null);

      const categories = await ctx.db.category.findMany({
        where: { id: { in: categoryIds } },
      });

      return expenses.map((e) => ({
        category:
          categories.find((c) => c.id === e.categoryId)?.name ?? 'Unknown',
        amount: Number(e._sum.amount ?? 0),
      }));
    }),

  getMonthlyTrendByRange: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        startYear: z.number(),
        startMonth: z.number().min(1).max(12),
        endYear: z.number(),
        endMonth: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = [];

      let year = input.startYear;
      let month = input.startMonth;

      while (
        year < input.endYear ||
        (year === input.endYear && month <= input.endMonth)
      ) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);

        const [income, expense] = await Promise.all([
          ctx.db.transaction.aggregate({
            where: {
              userId: input.userId,
              type: 'income',
              transactionDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
          }),
          ctx.db.transaction.aggregate({
            where: {
              userId: input.userId,
              type: 'expense',
              transactionDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
          }),
        ]);

        results.push({
          month: start.toLocaleString('default', { month: 'short' }),
          year,
          income: Number(income._sum.amount ?? 0),
          expense: Number(expense._sum.amount ?? 0),
        });

        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
      }

      return results;
    }),

  getExpenseByCategoryByRange: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        startYear: z.number(),
        startMonth: z.number().min(1).max(12),
        endYear: z.number(),
        endMonth: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startYear, input.startMonth - 1, 1);
      const endDate = new Date(input.endYear, input.endMonth, 0, 23, 59, 59);

      const expenses = await ctx.db.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: input.userId,
          type: 'expense',
          transactionDate: { gte: startDate, lte: endDate },
          categoryId: { not: null },
        },
        _sum: { amount: true },
      });

      const categoryIds = expenses
        .map((e) => e.categoryId)
        .filter((id): id is string => id !== null);

      const categories = await ctx.db.category.findMany({
        where: { id: { in: categoryIds } },
      });

      return expenses
        .map((e) => ({
          category:
            categories.find((c) => c.id === e.categoryId)?.name ?? 'Unknown',
          amount: Number(e._sum.amount ?? 0),
        }))
        .sort((a, b) => b.amount - a.amount);
    }),
  getAIInsights: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Average expenses over last 3 months
      const startOfThreeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

      const [currentMonthData, lastMonthData, categoryExpenses, budgets, totalBalance, threeMonthExpense] = await Promise.all([
        // 1. Current month totals
        Promise.all([
          ctx.db.transaction.aggregate({
            where: { userId: input.userId, type: 'income', transactionDate: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
            _sum: { amount: true },
          }),
          ctx.db.transaction.aggregate({
            where: { userId: input.userId, type: 'expense', transactionDate: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
            _sum: { amount: true },
          }),
        ]),
        // 2. Last month totals
        Promise.all([
          ctx.db.transaction.aggregate({
            where: { userId: input.userId, type: 'income', transactionDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
            _sum: { amount: true },
          }),
          ctx.db.transaction.aggregate({
            where: { userId: input.userId, type: 'expense', transactionDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
            _sum: { amount: true },
          }),
        ]),
        // 3. Category expenses current month
        ctx.db.transaction.groupBy({
          by: ['categoryId'],
          where: { userId: input.userId, type: 'expense', transactionDate: { gte: startOfCurrentMonth, lte: endOfCurrentMonth }, categoryId: { not: null } },
          _sum: { amount: true },
        }),
        // 4. Budgets current month
        ctx.db.budget.findMany({
          where: { userId: input.userId, month: currentMonth, year: currentYear },
          include: { category: true }
        }),
        // 5. Total Balance
        ctx.db.account.aggregate({
          where: { userId: input.userId },
          _sum: { balance: true }
        }),
        // 6. Last 3 months expense
        ctx.db.transaction.aggregate({
          where: { userId: input.userId, type: 'expense', transactionDate: { gte: startOfThreeMonthsAgo, lte: endOfLastMonth } },
          _sum: { amount: true }
        })
      ]);

      const currentIncome = Number(currentMonthData[0]._sum.amount ?? 0);
      const currentExpense = Number(currentMonthData[1]._sum.amount ?? 0);
      const lastExpense = Number(lastMonthData[1]._sum.amount ?? 0);
      const currentBalance = Number(totalBalance._sum.balance ?? 0);
      const avgMonthlyExpense = Number(threeMonthExpense._sum.amount ?? 0) / 3;

      const insights: {
        type: 'info' | 'warning' | 'success';
        message: string;
        title: string;
      }[] = [];

      // 1. Savings Rate Insight
      if (currentIncome > 0) {
        const savingsRate = ((currentIncome - currentExpense) / currentIncome) * 100;
        if (savingsRate > 20) {
          insights.push({
            type: 'success',
            title: 'Kesehatan Keuangan Bagus',
            message: `Rate tabungan Anda ${savingsRate.toFixed(1)}% bulan ini. Pertahankan gaya hidup ini!`,
          });
        } else if (savingsRate < 0) {
          insights.push({
            type: 'warning',
            title: 'Defisit Anggaran',
            message: 'Pengeluaran Anda bulan ini melebihi pemasukan. Coba cek kembali daftar belanja Anda.',
          });
        }
      }

      // 2. Month-over-Month Comparison
      if (lastExpense > 0) {
        const change = ((currentExpense - lastExpense) / lastExpense) * 100;
        if (change > 15) {
          insights.push({
            type: 'warning',
            title: 'Lonjakan Pengeluaran',
            message: `Pengeluaran Anda naik ${change.toFixed(1)}% dibanding bulan lalu. Pastikan ini pengeluaran terencana.`,
          });
        } else if (change < -10) {
          insights.push({
            type: 'success',
            title: 'Hemat Banget!',
            message: `Hebat! Pengeluaran Anda turun ${Math.abs(change).toFixed(1)}% dibanding bulan lalu.`,
          });
        }
      }

      // 3. Budget Alerts
      for (const budget of budgets) {
        const spent = Number(categoryExpenses.find(e => e.categoryId === budget.categoryId)?._sum.amount ?? 0);
        const ratio = (spent / Number(budget.amount)) * 100;
        
        if (ratio >= 100) {
          insights.push({
            type: 'warning',
            title: 'Budget Terlampaui!',
            message: `Pengeluaran di kategori '${budget.category.name}' sudah melebihi budget Anda sebesar ${ratio.toFixed(1)}%.`,
          });
        } else if (ratio >= 80) {
          insights.push({
            type: 'warning',
            title: 'Waspada Budget',
            message: `Pengeluaran kategori '${budget.category.name}' sudah mencapai ${ratio.toFixed(1)}% dari budget.`,
          });
        }
      }

      // 4. Emergency Fund Analysis
      if (avgMonthlyExpense > 0) {
        const monthsCovered = currentBalance / avgMonthlyExpense;
        if (monthsCovered >= 6) {
          insights.push({
            type: 'success',
            title: 'Dana Darurat Aman',
            message: `Saldo Anda cukup untuk menanggung pengeluaran selama ${monthsCovered.toFixed(1)} bulan ke depan. Hebat!`,
          });
        } else if (monthsCovered < 3) {
          insights.push({
            type: 'info',
            title: 'Fokus Tabungan',
            message: `Saldo Anda baru mencakup ${monthsCovered.toFixed(1)} bulan pengeluaran. Usahakan minimal 3-6 bulan sebagai dana darurat.`,
          });
        }
      }

      // 5. Daily Spending Pace (Pro-rated)
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const expectedPace = (currentExpense / dayOfMonth) * daysInMonth;
      
      if (currentIncome > 0 && expectedPace > currentIncome * 0.9) {
        insights.push({
          type: 'warning',
          title: 'Kecepatan Belanja',
          message: `Jika pola belanja berlanjut, Anda diprediksi akan menghabiskan ${((expectedPace/currentIncome)*100).toFixed(1)}% income bulan ini.`,
        });
      }

      // Default if no insights generated
      if (insights.length === 0) {
        insights.push({
          type: 'info',
          title: 'Terus Catat!',
          message: 'Semakin banyak data yang Anda masukkan, semakin akurat saran yang bisa kami berikan.',
        });
      }

      // Sort insights: warning first, then high success, then info
      return insights.sort((a, b) => {
        const order = { warning: 0, success: 1, info: 2 };
        return order[a.type] - order[b.type];
      });
    }),
});

