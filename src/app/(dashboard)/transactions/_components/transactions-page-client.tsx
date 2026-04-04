"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { TransactionsManager } from "./transactions-manager";
import { TransfersManager } from "./transfers-manager";
import type { RouterOutputs } from "~/trpc/react";

type TxPage = RouterOutputs["transaction"]["getAll"];
type TransferRow = RouterOutputs["transfer"]["getAll"][number];
type Account = RouterOutputs["account"]["getAll"][number];
type Category = RouterOutputs["category"]["getAll"][number];

type TransactionsPageClientProps = {
  userId: string;
  initialTransactionPage: TxPage;
  initialTransfers: TransferRow[];
  initialAccounts: Account[];
  initialCategories: Category[];
};

export const TransactionsPageClient = ({
  userId,
  initialTransactionPage,
  initialTransfers,
  initialAccounts,
  initialCategories,
}: TransactionsPageClientProps): React.ReactElement => {
  return (
    <Tabs defaultValue="transactions" className="gap-4">
      <TabsList>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="transfers">Transfers</TabsTrigger>
      </TabsList>
      <TabsContent value="transactions" className="mt-4">
        <TransactionsManager
          userId={userId}
          initialTransactionPage={initialTransactionPage}
          initialAccounts={initialAccounts}
          initialCategories={initialCategories}
        />
      </TabsContent>
      <TabsContent value="transfers" className="mt-4">
        <TransfersManager
          userId={userId}
          initialTransfers={initialTransfers}
          initialAccounts={initialAccounts}
        />
      </TabsContent>
    </Tabs>
  );
};
