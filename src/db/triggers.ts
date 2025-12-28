import { sql } from 'drizzle-orm';

export const updateUpdatedAtFunction = sql`
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
`;

export const applyUpdateTriggers = [
  sql`
  CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  `,
  
  sql`
  CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  `,
  
  sql`
  CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  `
];

export const updateAccountBalanceFunction = sql`
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    amount_diff INTEGER;
BEGIN
    -- INSERT: aggiungi amount al balance
    IF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'INCOME' THEN
            UPDATE accounts SET balance = balance + NEW.amount 
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'EXPENSE' THEN
            UPDATE accounts SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'TRANSFER' THEN
            -- Sottrai da account sorgente
            UPDATE accounts SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
            -- Aggiungi ad account destinazione
            UPDATE accounts SET balance = balance + NEW.amount 
            WHERE id = NEW.to_account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- DELETE: rimuovi amount dal balance
    IF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'INCOME' THEN
            UPDATE accounts SET balance = balance - OLD.amount 
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'EXPENSE' THEN
            UPDATE accounts SET balance = balance + OLD.amount 
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'TRANSFER' THEN
            UPDATE accounts SET balance = balance + OLD.amount 
            WHERE id = OLD.account_id;
            UPDATE accounts SET balance = balance - OLD.amount 
            WHERE id = OLD.to_account_id;
        END IF;
        RETURN OLD;
    END IF;
    
    -- UPDATE: calcola differenza e aggiorna
    IF (TG_OP = 'UPDATE') THEN
        -- Prima rimuovi vecchio importo
        IF OLD.type = 'INCOME' THEN
            UPDATE accounts SET balance = balance - OLD.amount 
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'EXPENSE' THEN
            UPDATE accounts SET balance = balance + OLD.amount 
            WHERE id = OLD.account_id;
        END IF;
        
        -- Poi aggiungi nuovo importo
        IF NEW.type = 'INCOME' THEN
            UPDATE accounts SET balance = balance + NEW.amount 
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'EXPENSE' THEN
            UPDATE accounts SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';
`;

export const applyAccountBalanceTrigger = sql`
CREATE TRIGGER update_balance_on_transaction
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();
`;

export const preventSameAccountTransferFunction = sql`
CREATE OR REPLACE FUNCTION prevent_same_account_transfer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'TRANSFER' AND NEW.account_id = NEW.to_account_id THEN
        RAISE EXCEPTION 'Cannot transfer to the same account';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';
`;

export const applyPreventSameAccountTransferTrigger = sql`
CREATE TRIGGER check_transfer_accounts
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION prevent_same_account_transfer();
`;

export const createAuditLogTable = sql`
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    row_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

CREATE INDEX audit_logs_table_name_idx ON audit_logs(table_name);
CREATE INDEX audit_logs_row_id_idx ON audit_logs(row_id);
CREATE INDEX audit_logs_changed_at_idx ON audit_logs(changed_at DESC);
`;

export const auditLogFunction = sql`
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, operation, row_id, new_data)
        VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, operation, row_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, operation, row_id, old_data)
        VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, row_to_json(OLD));
        RETURN OLD;
    END IF;
END;
$$ language 'plpgsql';
`;

export const applyAuditTriggers = [
  sql`
  CREATE TRIGGER audit_accounts
  AFTER INSERT OR UPDATE OR DELETE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();
  `,
  
  sql`
  CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();
  `
];

export const createAccountStatsView = sql`
CREATE MATERIALIZED VIEW IF NOT EXISTS account_stats AS
SELECT 
    a.id as account_id,
    a.name,
    a.type,
    a.balance,
    COUNT(t.id) as transaction_count,
    SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END) as total_expenses,
    MAX(t.date) as last_transaction_date
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id AND t.deleted_at IS NULL
WHERE a.deleted_at IS NULL
GROUP BY a.id, a.name, a.type, a.balance;

CREATE UNIQUE INDEX account_stats_account_id_idx ON account_stats(account_id);
`;

export const createCategoryStatsView = sql`
CREATE MATERIALIZED VIEW IF NOT EXISTS category_stats AS
SELECT 
    c.id as category_id,
    c.name,
    COUNT(t.id) as transaction_count,
    SUM(t.amount) as total_amount,
    AVG(t.amount) as avg_amount,
    MIN(t.date) as first_transaction,
    MAX(t.date) as last_transaction
FROM categories c
LEFT JOIN transactions t ON c.id = t.category_id 
    AND t.type = 'EXPENSE' 
    AND t.deleted_at IS NULL
GROUP BY c.id, c.name;

CREATE UNIQUE INDEX category_stats_category_id_idx ON category_stats(category_id);
`;

export const getBalanceBetweenDatesFunction = sql`
CREATE OR REPLACE FUNCTION get_balance_between_dates(
    p_account_id UUID,
    p_start_date TIMESTAMP,
    p_end_date TIMESTAMP
)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT 
        COALESCE(
            SUM(CASE 
                WHEN type = 'INCOME' THEN amount
                WHEN type = 'EXPENSE' THEN -amount
                ELSE 0
            END),
            0
        )
    INTO total
    FROM transactions
    WHERE account_id = p_account_id
        AND date BETWEEN p_start_date AND p_end_date
        AND deleted_at IS NULL;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;
`;

export const getTopCategoriesFunction = sql`
CREATE OR REPLACE FUNCTION get_top_categories(
    p_limit INTEGER DEFAULT 5,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(
    category_name VARCHAR,
    total_amount BIGINT,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name::VARCHAR,
        SUM(t.amount)::BIGINT as total,
        COUNT(t.id)::BIGINT as count
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'EXPENSE'
        AND t.deleted_at IS NULL
        AND (p_start_date IS NULL OR t.date >= p_start_date)
        AND (p_end_date IS NULL OR t.date <= p_end_date)
    GROUP BY c.name
    ORDER BY total DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
`;

export const checkCurrencyFunction = sql`
CREATE OR REPLACE FUNCTION check_transaction_currency()
RETURNS TRIGGER AS $$
DECLARE
    account_currency VARCHAR(3);
BEGIN
    SELECT currency INTO account_currency FROM accounts WHERE id = NEW.account_id;
    
    IF NEW.currency != account_currency THEN
        RAISE EXCEPTION 'Currency mismatch: Transaction is in %, but Account is in %', NEW.currency, account_currency;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';
`;

export const applyCheckCurrencyTrigger = sql`
CREATE TRIGGER validate_transaction_currency
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION check_transaction_currency();
`;

export const allTriggers = {
  updateUpdatedAt: [updateUpdatedAtFunction, ...applyUpdateTriggers],
  updateBalance: [updateAccountBalanceFunction, applyAccountBalanceTrigger],
  preventSameAccountTransfer: [
    preventSameAccountTransferFunction, 
    applyPreventSameAccountTransferTrigger
  ],
  auditLog: [createAuditLogTable, auditLogFunction, ...applyAuditTriggers],
  checkCurrency: [checkCurrencyFunction, applyCheckCurrencyTrigger]
};

export const allViews = {
  accountStats: createAccountStatsView,
  categoryStats: createCategoryStatsView
};

export const allFunctions = {
  getBalanceBetweenDates: getBalanceBetweenDatesFunction,
  getTopCategories: getTopCategoriesFunction
};
