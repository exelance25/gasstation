import type { LucideIcon } from "lucide-react";
import { Banknote, Building2, ChartLine, CreditCard, Wallet } from "lucide-react";

export type OperationItem = {
  id: string;
  icon: LucideIcon;
  labelTr: string;
  labelEn: string;
  enabled?: boolean;
};

export const operationsMenuItems: OperationItem[] = [
  { id: "atm", icon: Banknote, labelTr: "ATM İşlemleri", labelEn: "ATM Transactions", enabled: false },
  { id: "stocks", icon: Building2, labelTr: "Hisse Senetleri", labelEn: "Stocks", enabled: false },
  { id: "funds", icon: ChartLine, labelTr: "Fon İşlemleri", labelEn: "Fund Operations", enabled: false },
  { id: "bills", icon: CreditCard, labelTr: "Fatura Ödemeleri", labelEn: "Bill Payments", enabled: false },
  { id: "spending", icon: Wallet, labelTr: "Harcamalar", labelEn: "Spending", enabled: false },
];
