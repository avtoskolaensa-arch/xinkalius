// Bind owner, inclusive collection start and exclusive collection end to every query.
// Costs come from the sold item snapshots; joining the current catalog is incorrect.
const PAID = `WITH paid AS (
 SELECT id, subtotal, delivery_fee, total, payment_status, source, fulfillment, payment_collected_at,
 CASE WHEN json_valid(items_json) THEN CASE WHEN json_type(items_json)='array' THEN items_json ELSE '[]' END ELSE '[]' END AS items_json
 FROM orders WHERE owner_id=? AND payment_collected_at>=? AND payment_collected_at<?
 AND payment_status IN ('cash_collected','terminal_collected') AND status<>'cancelled'
) , line_items AS (
 SELECT p.id AS order_id, CASE WHEN j.type='object' THEN j.value ELSE '{}' END AS item
 FROM paid p LEFT JOIN json_each(p.items_json) j ON 1=1
)`;
const VALID_COST = `json_type(l.item,'$.cost')='integer' AND json_extract(l.item,'$.cost')>=0 AND json_type(l.item,'$.quantity')='integer' AND json_extract(l.item,'$.quantity')>0`;
const SALES = `${PAID}, costs AS (
 SELECT l.order_id AS id,
 COALESCE(SUM(CASE WHEN ${VALID_COST} THEN json_extract(l.item,'$.quantity')*json_extract(l.item,'$.cost') ELSE 0 END),0) AS cost,
 SUM(CASE WHEN ${VALID_COST} THEN 0 ELSE 1 END) AS missing,
 COALESCE(SUM(CASE WHEN json_type(l.item,'$.quantity')='integer' AND json_extract(l.item,'$.quantity')>0 THEN json_extract(l.item,'$.quantity') ELSE 0 END),0) AS units
 FROM line_items l GROUP BY l.order_id
), sales AS (SELECT p.*, c.cost, c.missing, c.units FROM paid p JOIN costs c ON c.id=p.id)`;
const METRICS = `COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue,
 COALESCE(SUM(subtotal),0) AS productSales, COALESCE(SUM(delivery_fee),0) AS deliveryFees,
 CASE WHEN COALESCE(SUM(missing),0)=0 THEN COALESCE(SUM(cost),0) ELSE NULL END AS cost,
 CASE WHEN COALESCE(SUM(missing),0)=0 THEN COALESCE(SUM(subtotal-cost),0) ELSE NULL END AS grossProfit`;
export const SUMMARY_SQL = `${SALES} SELECT ${METRICS}, COALESCE(SUM(units),0) AS units,
 COALESCE(SUM(CASE WHEN missing>0 THEN 1 ELSE 0 END),0) AS missingCostOrders,
 COALESCE(SUM(CASE WHEN payment_status='cash_collected' THEN total ELSE 0 END),0) AS cash,
 COALESCE(SUM(CASE WHEN payment_status='terminal_collected' THEN total ELSE 0 END),0) AS terminal,
 COALESCE(SUM(CASE WHEN source='web' THEN total ELSE 0 END),0) AS web,
 COALESCE(SUM(CASE WHEN source='pos' THEN total ELSE 0 END),0) AS pos,
 COALESCE(SUM(CASE WHEN fulfillment='pickup' THEN 1 ELSE 0 END),0) AS pickupOrders,
 COALESCE(SUM(CASE WHEN fulfillment='delivery' THEN 1 ELSE 0 END),0) AS deliveryOrders
 FROM sales`;
export const SERIES_SQL = `${SALES} SELECT strftime(?,payment_collected_at/1000,'unixepoch',?) AS key, ${METRICS} FROM sales GROUP BY key ORDER BY key`;
export const PRODUCTS_SQL = `${PAID} SELECT json_extract(l.item,'$.id') AS id,
 MAX(json_extract(l.item,'$.name')) AS name,MAX(json_extract(l.item,'$.translations.en.name')) AS nameEn,MAX(json_extract(l.item,'$.translations.ru.name')) AS nameRu,
 SUM(json_extract(l.item,'$.quantity')) AS quantity,
 SUM(json_extract(l.item,'$.quantity')*json_extract(l.item,'$.price')) AS revenue,
 CASE WHEN SUM(CASE WHEN ${VALID_COST} THEN 0 ELSE 1 END)=0 THEN SUM(json_extract(l.item,'$.quantity')*json_extract(l.item,'$.cost')) ELSE NULL END AS cost,
 CASE WHEN SUM(CASE WHEN ${VALID_COST} THEN 0 ELSE 1 END)=0 THEN SUM(json_extract(l.item,'$.quantity')*(json_extract(l.item,'$.price')-json_extract(l.item,'$.cost'))) ELSE NULL END AS grossProfit
 FROM line_items l WHERE json_type(l.item,'$.id')='text' AND json_type(l.item,'$.name')='text' AND json_type(l.item,'$.quantity')='integer' AND json_extract(l.item,'$.quantity')>0 AND json_type(l.item,'$.price')='integer' AND json_extract(l.item,'$.price')>=0 GROUP BY json_extract(l.item,'$.id') ORDER BY revenue DESC,quantity DESC,id LIMIT 10`;
export const UNDATED_SQL = `SELECT COUNT(*) AS count FROM orders WHERE owner_id=? AND payment_collected_at IS NULL AND payment_status IN ('cash_collected','terminal_collected') AND status<>'cancelled'`;

// Active orders survive business-day rollover; only daily totals use the range.
export const KITCHEN_SUMMARY_SQL = `SELECT
 COALESCE(SUM(CASE WHEN created_at>=? AND created_at<? THEN 1 ELSE 0 END),0) AS today_count,
 COALESCE(SUM(CASE WHEN payment_collected_at>=? AND payment_collected_at<? AND payment_status='cash_collected' AND status<>'cancelled' THEN total ELSE 0 END),0) AS cash,
 COALESCE(SUM(CASE WHEN payment_collected_at>=? AND payment_collected_at<? AND payment_status='terminal_collected' AND status<>'cancelled' THEN total ELSE 0 END),0) AS terminal,
 COALESCE(SUM(CASE WHEN status NOT IN ('completed','cancelled') THEN 1 ELSE 0 END),0) AS active
 FROM orders WHERE owner_id=?`;
