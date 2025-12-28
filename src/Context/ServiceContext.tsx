import React, { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { TransactionRepository } from "../Ports/TransactionRepository";
import { HttpTransactionRepository } from "../Adapters/HttpTransactionRepository";

interface ServiceContainer {
    transactionRepo: TransactionRepository;
}

const ServiceContext = createContext<ServiceContainer | null>(null);

export const ServiceProvider = ({ children }: { children: ReactNode }) => {
    const { getToken } = useAuth();

    const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        // ⚠️ IMPORTANTE: Chiamare getToken() qui assicura che sia sempre fresco
        const token = await getToken();
        
        const headers = {
            ...init?.headers,
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        };

        const response = await fetch(input, {
            ...init,
            headers
        });

        // Gestione sessione scaduta
        if (response.status === 401) {
            console.error('Session expired or invalid token');
            // Clerk gestisce automaticamente il refresh, quindi questo dovrebbe essere raro
            // L'utente sarà reindirizzato al login dal ClerkProvider
        }

        return response;
    };

    const transactionRepo = new HttpTransactionRepository(authenticatedFetch);

    return (
        <ServiceContext.Provider value={{ transactionRepo }}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) {
        throw new Error("useServices must be used within a ServiceProvider");
    }
    return context;
};