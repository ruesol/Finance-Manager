import React, { createContext, useContext, ReactNode } from "react";
import { TransactionRepository } from "../Ports/TransactionRepository";
import { InMemoryTransactionRepository } from "../Adapters/InMemoryTransactionRepository";

interface ServiceContainer {
    transactionRepo: TransactionRepository;
}

const ServiceContext = createContext<ServiceContainer | null>(null);

const transactionRepo = new InMemoryTransactionRepository();

export const ServiceProvider = ({ children }: { children: ReactNode }) => {
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