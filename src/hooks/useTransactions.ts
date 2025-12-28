import { useState, useEffect, useCallback } from "react";
import { useServices } from "../Context/ServiceContext";
import { Transaction } from "../Transaction";

export function useTransactions() {
    const { transactionRepo } = useServices();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await transactionRepo.getAll();
            setTransactions(data.sort((a, b) => b.date.getTime() - a.date.getTime()));
        } finally {
            setLoading(false);
        }
    }, [transactionRepo]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { transactions, loading, refresh };
}