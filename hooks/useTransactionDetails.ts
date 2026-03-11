import { useEffect, useState } from "react";

import { Transaction, TransactionRepository } from "@/db/transaction.repository";
import { useAuthStore } from "@/store/auth.store";

export const useTransactionDetails = (transactionId?: string) => {
  const { user } = useAuthStore();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId || !user?.id) {
      setTransaction(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    TransactionRepository.getById(transactionId, user.id)
      .then((existing) => {
        if (isCancelled) {
          return;
        }

        if (!existing || existing.deleted_at) {
          setTransaction(null);
          setError("La transacción no existe o ya fue eliminada.");
          return;
        }

        setTransaction(existing);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setTransaction(null);
        setError("No se pudo cargar la transacción.");
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [transactionId, user?.id]);

  return {
    transaction,
    isLoading,
    error,
  };
};
