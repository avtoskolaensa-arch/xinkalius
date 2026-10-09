export const EXPENSE_CATEGORIES:Record<string,string>={rent:"ქირა",wages:"ხელფასები",utilities:"კომუნალური",courier:"კურიერი",fees:"საკომისიოები",marketing:"რეკლამა",repairs:"შეკეთება",other:"სხვა"};
export type Expense={id:string;amount:number;category:string;description:string;paid_at:number;payment_source:string;shift_id:string|null;voided_at:number|null;void_reason:string|null};
export type Shift={id:string;opened_at:number;closed_at:number|null;opening_cash:number;expected_cash:number|null;counted_cash:number|null;difference:number|null;note:string;sales:number;expenses:number;added:number;removed:number;expected:number};
// These correlated subqueries also execute inside the atomic closing UPDATE.
export const SHIFT_SALES=`COALESCE((SELECT SUM(total) FROM orders WHERE orders.shift_id=cash_shifts.id AND orders.owner_id=cash_shifts.owner_id AND payment_status='cash_collected'),0)`;
export const SHIFT_EXPENSES=`COALESCE((SELECT SUM(amount) FROM expenses WHERE expenses.shift_id=cash_shifts.id AND expenses.owner_id=cash_shifts.owner_id AND voided_at IS NULL),0)`;
export const SHIFT_ADDED=`COALESCE((SELECT SUM(amount) FROM cash_movements WHERE cash_movements.shift_id=cash_shifts.id AND cash_movements.owner_id=cash_shifts.owner_id AND kind='in'),0)`;
export const SHIFT_REMOVED=`COALESCE((SELECT SUM(amount) FROM cash_movements WHERE cash_movements.shift_id=cash_shifts.id AND cash_movements.owner_id=cash_shifts.owner_id AND kind='out'),0)`;
export const SHIFT_BALANCE=`opening_cash+${SHIFT_SALES}-${SHIFT_EXPENSES}+${SHIFT_ADDED}-${SHIFT_REMOVED}`;
export const SHIFT_SELECT=`SELECT cash_shifts.*,${SHIFT_SALES} AS sales,${SHIFT_EXPENSES} AS expenses,${SHIFT_ADDED} AS added,${SHIFT_REMOVED} AS removed,COALESCE(expected_cash,${SHIFT_BALANCE}) AS expected FROM cash_shifts`;
export const CLOSE_SHIFT_SQL=`UPDATE cash_shifts SET expected_cash=${SHIFT_BALANCE},counted_cash=?,difference=?-(${SHIFT_BALANCE}),closed_at=?,close_key=?,close_hash=?,note=?,active_owner=NULL WHERE id=? AND owner_id=? AND closed_at IS NULL`;
export const COLLECT_DRAWER_SQL=`UPDATE orders SET payment_status='cash_collected',cash_received=?,updated_at=?,payment_collected_at=?,cash_destination='drawer',shift_id=(SELECT id FROM cash_shifts WHERE active_owner=? AND closed_at IS NULL) WHERE id=? AND owner_id=? AND payment_status='cash_due' AND status=? AND EXISTS(SELECT 1 FROM cash_shifts WHERE active_owner=? AND closed_at IS NULL)`;
export function operatingResult(revenue:number,cost:number|null,expenses:number){return cost===null?null:revenue-cost-expenses;}
export function localInput(ms=Date.now()){return new Date(ms+4*3600000).toISOString().slice(0,16);}
export function fromLocal(value:string){return Date.parse(value+":00+04:00");}
