# Power BI Reporting Guide

This directory is intended for your Power BI `.pbix` files.

## Connecting Power BI to the Data Warehouse

1. Open Power BI Desktop.
2. Click **Get Data** -> **PostgreSQL database**.
3. **Server**: `localhost:5432` (Ensure your Docker container `olist_postgres` is running).
4. **Database**: `olist_dw`
5. **Data Connectivity mode**: Import (Recommended for performance) or DirectQuery.
6. When prompted for credentials, use:
   - **Username**: `olist_admin`
   - **Password**: `olist_secret_2024`

## Data Model Setup

Once connected, import the following tables from the `warehouse` schema:
- `fact_orders`
- `dim_customer`
- `dim_product`
- `dim_seller`
- `dim_date`
- `dim_payment`

Ensure the relationships are set up as a **Star Schema** with `fact_orders` in the center:
- `fact_orders[customer_key]` -> `dim_customer[customer_key]` (Many-to-1)
- `fact_orders[product_key]` -> `dim_product[product_key]` (Many-to-1)
- `fact_orders[seller_key]` -> `dim_seller[seller_key]` (Many-to-1)
- `fact_orders[date_key]` -> `dim_date[date_key]` (Many-to-1)
- `fact_orders[payment_key]` -> `dim_payment[payment_key]` (Many-to-1)

## Recommended DAX Measures

Create a new table called `_Measures` to store your analytical DAX formulas.

### Sales & Revenue
```dax
Total Revenue = SUM(fact_orders[payment_value])

Total Orders = DISTINCTCOUNT(fact_orders[order_id])

Total Items Sold = COUNT(fact_orders[order_item_id])

Avg Order Value = DIVIDE([Total Revenue], [Total Orders], 0)

Total Freight = SUM(fact_orders[freight_value])
```

### Delivery Performance
```dax
Avg Delivery Days = AVERAGE(fact_orders[actual_delivery_days])

Avg Estimated Days = AVERAGE(fact_orders[estimated_delivery_days])

On-Time Orders = CALCULATE([Total Orders], fact_orders[is_on_time] = TRUE())

On-Time Rate % = DIVIDE([On-Time Orders], [Total Orders], 0)
```

### Customer Intelligence
```dax
Total Customers = DISTINCTCOUNT(dim_customer[customer_unique_id])

Revenue per Customer = DIVIDE([Total Revenue], [Total Customers], 0)
```

## Recommended Dashboard Pages

1. **Executive Overview**: Total Revenue, Total Orders, AOV, Revenue by Month (Line chart).
2. **Geographic Performance**: Revenue by State (Map visual using `dim_customer[state]`).
3. **Product Analytics**: Top Categories by Revenue (Bar chart), Avg Review Score by Category.
4. **Delivery Operations**: On-Time Rate by State, Avg Delivery vs Estimated Days.
