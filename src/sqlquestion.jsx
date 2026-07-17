import RevisionNotesLayout from './components/RevisionNotesLayout';


const SECTIONS = [
  // ─────────────────────────────────────────────────────────────
  {
    cat: "DDL — Data Definition Language",
    icon: "⊟",
    color: "#06B6D4",
    desc: "CREATE, ALTER, DROP — define and modify the structure of database objects.",
    topics: [
      {
        n: "CREATE TABLE — data types, constraints, defaults",
        tag: "DDL",
        desc: `CREATE TABLE defines a new table and its columns. Every column needs a name, a data type, and optionally a set of constraints.

DATA TYPES (PostgreSQL-centric, with MySQL/SQL Server notes):
• Integer: INT / INTEGER (4 bytes), BIGINT (8 bytes), SMALLINT (2 bytes), SERIAL/BIGSERIAL (auto-increment in PG), AUTO_INCREMENT (MySQL)
• Decimal: DECIMAL(p,s) / NUMERIC(p,s) — exact, FLOAT/DOUBLE PRECISION — approximate
• Text: VARCHAR(n) — variable up to n, CHAR(n) — fixed-width padded, TEXT — unlimited
• Date/Time: DATE, TIME, TIMESTAMP, TIMESTAMPTZ (with timezone), INTERVAL
• Boolean: BOOLEAN (PG), TINYINT(1) (MySQL)
• JSON: JSON, JSONB (binary JSON in PG — indexable and faster for queries)
• UUID: UUID (PG), CHAR(36) (MySQL)
• Binary: BYTEA (PG), BLOB (MySQL)

CONSTRAINTS enforce rules at the database level — never rely on application code alone.
• PRIMARY KEY: Unique + NOT NULL identifier. Every table should have one.
• UNIQUE: No duplicate values in the column(s).
• NOT NULL: Column cannot contain NULL.
• CHECK: Row-level condition that must evaluate to true.
• DEFAULT: Value inserted when no value is specified.
• FOREIGN KEY: References a primary key in another table — enforces referential integrity.`,
        code: `-- ── Basic table creation ────────────────────────────────
CREATE TABLE employees (
    -- Identity
    employee_id  BIGSERIAL       PRIMARY KEY,           -- auto-increment PK
    employee_uuid UUID           NOT NULL DEFAULT gen_random_uuid() UNIQUE,

    -- Personal info
    first_name   VARCHAR(100)    NOT NULL,
    last_name    VARCHAR(100)    NOT NULL,
    email        VARCHAR(255)    NOT NULL UNIQUE,
    phone        VARCHAR(20),                           -- nullable (no NOT NULL)

    -- Employment
    department   VARCHAR(100)    NOT NULL,
    job_title    VARCHAR(150),
    salary       DECIMAL(12, 2)  NOT NULL CHECK (salary > 0),
    hire_date    DATE            NOT NULL DEFAULT CURRENT_DATE,
    is_active    BOOLEAN         NOT NULL DEFAULT true,

    -- Foreign key
    manager_id   BIGINT          REFERENCES employees(employee_id) ON DELETE SET NULL,
    department_id INT            NOT NULL REFERENCES departments(dept_id) ON DELETE RESTRICT,

    -- Audit columns
    created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ── Multi-column constraints ──────────────────────────────
CREATE TABLE order_items (
    order_id    BIGINT     NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id  BIGINT     NOT NULL REFERENCES products(product_id),
    quantity    INT        NOT NULL CHECK (quantity > 0),
    unit_price  DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),

    PRIMARY KEY (order_id, product_id),          -- composite primary key
    UNIQUE (order_id, product_id)                -- redundant here but shows syntax
);

-- ── Named constraints (best practice — easier to drop/debug) ──
CREATE TABLE products (
    product_id  BIGSERIAL,
    sku         VARCHAR(50)  NOT NULL,
    price       DECIMAL(10,2),
    stock_qty   INT          DEFAULT 0,
    category    VARCHAR(50),

    CONSTRAINT pk_products        PRIMARY KEY (product_id),
    CONSTRAINT uq_products_sku    UNIQUE (sku),
    CONSTRAINT chk_products_price CHECK (price > 0),
    CONSTRAINT chk_products_stock CHECK (stock_qty >= 0)
);

-- ── Referential action options ────────────────────────────
-- ON DELETE CASCADE    → delete child rows when parent is deleted
-- ON DELETE SET NULL   → set FK column to NULL when parent deleted
-- ON DELETE RESTRICT   → prevent parent deletion if children exist (default)
-- ON DELETE NO ACTION  → like RESTRICT but deferred
-- ON UPDATE CASCADE    → update FK column when parent PK changes`
      },
      {
        n: "ALTER TABLE & DROP — modifying structure",
        tag: "DDL",
        desc: `ALTER TABLE modifies an existing table's structure without losing data (most of the time). Understanding what is safe vs dangerous is critical in production.

SAFE operations (usually non-blocking or fast):
• Adding a nullable column with a default
• Adding an index (use CONCURRENTLY in PostgreSQL to avoid locking)
• Adding a constraint with NOT VALID (validate later)
• Renaming a column

DANGEROUS operations (may lock the table or require rewrite):
• Adding a NOT NULL column without a default — requires full table scan
• Changing a column's type (may need full rewrite)
• Dropping a column (marks deleted, doesn't reclaim space until VACUUM)
• Adding a CHECK constraint (validates all existing rows — full scan)

Always test ALTERs on a copy of production data first. For large tables (millions of rows), use pg_repack or online schema change tools (gh-ost for MySQL, pglogical for PG).`,
        code: `-- ── Add columns ──────────────────────────────────────────
ALTER TABLE employees ADD COLUMN middle_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN bonus_pct   DECIMAL(5,2) NOT NULL DEFAULT 0.0;

-- ── Drop a column ─────────────────────────────────────────
ALTER TABLE employees DROP COLUMN middle_name;
ALTER TABLE employees DROP COLUMN IF EXISTS middle_name; -- no error if doesn't exist

-- ── Rename column and table ───────────────────────────────
ALTER TABLE employees RENAME COLUMN phone     TO phone_number;
ALTER TABLE employees RENAME TO staff;                -- rename entire table

-- ── Change data type ──────────────────────────────────────
ALTER TABLE employees ALTER COLUMN phone_number TYPE VARCHAR(30);
-- PostgreSQL: may require USING clause if implicit cast isn't possible:
ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(12,4)
    USING price::NUMERIC(12,4);

-- ── Add / drop constraints ────────────────────────────────
ALTER TABLE employees ADD CONSTRAINT chk_salary CHECK (salary BETWEEN 10000 AND 10000000);
ALTER TABLE employees DROP CONSTRAINT chk_salary;

ALTER TABLE employees ADD CONSTRAINT uq_email UNIQUE (email);
ALTER TABLE employees ALTER COLUMN department SET NOT NULL;
ALTER TABLE employees ALTER COLUMN bonus_pct  SET DEFAULT 5.0;
ALTER TABLE employees ALTER COLUMN bonus_pct  DROP DEFAULT;

-- ── Add FK after table creation ───────────────────────────
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    ON DELETE CASCADE;

-- ── PostgreSQL: safe index creation (non-blocking) ────────
CREATE INDEX CONCURRENTLY idx_employees_email ON employees(email);

-- ── DROP ──────────────────────────────────────────────────
DROP TABLE employees;                     -- error if table doesn't exist
DROP TABLE IF EXISTS employees;           -- safe
DROP TABLE employees CASCADE;             -- drops dependent views/FKs too
TRUNCATE TABLE employees;                 -- delete all rows fast (no rollback log)
TRUNCATE TABLE employees RESTART IDENTITY; -- also resets sequences`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "DML — Data Manipulation Language",
    icon: "✎",
    color: "#10B981",
    desc: "INSERT, UPDATE, DELETE, MERGE — manipulating the data inside tables.",
    topics: [
      {
        n: "INSERT — single, bulk, INSERT … SELECT, UPSERT",
        tag: "DML",
        desc: `INSERT adds new rows to a table. There are several forms that serve different needs.

SINGLE ROW INSERT: The most basic form. Specify columns explicitly (never rely on column order — it changes).

MULTI-ROW INSERT: Insert multiple rows in one statement. Much faster than N individual inserts because it reduces round-trips and transaction overhead.

INSERT … SELECT: Insert the result set of a SELECT query. Ideal for ETL, copying data between tables, or transforming data on insert.

UPSERT (INSERT … ON CONFLICT): PostgreSQL and MySQL 8+ support "upsert" — insert a row, but if a unique constraint is violated, either do nothing (ignore the duplicate) or update the existing row. Critical for idempotent data pipelines.

RETURNING (PostgreSQL): Get back the values of inserted/updated/deleted rows without a separate query. Extremely useful for getting the generated ID of a new row.`,
        code: `-- ── Single row insert (always specify column names) ────────
INSERT INTO employees (first_name, last_name, email, department, salary)
VALUES ('Alice', 'Smith', 'alice@company.com', 'Engineering', 95000.00);

-- ── Multi-row insert ──────────────────────────────────────
INSERT INTO employees (first_name, last_name, email, department, salary)
VALUES
    ('Bob',   'Jones',  'bob@company.com',   'Marketing',   65000.00),
    ('Carol', 'Taylor', 'carol@company.com', 'Engineering', 88000.00),
    ('Dave',  'Brown',  'dave@company.com',  'HR',          55000.00);

-- ── INSERT … SELECT (copy/transform from another table) ──
INSERT INTO employee_archive (employee_id, email, left_date)
SELECT employee_id, email, CURRENT_DATE
FROM   employees
WHERE  is_active = false;

-- ── UPSERT: ON CONFLICT DO NOTHING (idempotent insert) ────
INSERT INTO products (sku, name, price)
VALUES ('SKU-001', 'Widget', 29.99)
ON CONFLICT (sku) DO NOTHING;     -- if SKU exists, silently skip

-- ── UPSERT: ON CONFLICT DO UPDATE (update existing row) ──
INSERT INTO products (sku, name, price, stock_qty)
VALUES ('SKU-001', 'Widget Pro', 34.99, 100)
ON CONFLICT (sku)
DO UPDATE SET
    name      = EXCLUDED.name,      -- EXCLUDED = the row that was attempted
    price     = EXCLUDED.price,
    stock_qty = products.stock_qty + EXCLUDED.stock_qty, -- add to existing
    updated_at = NOW();

-- MySQL equivalent:
INSERT INTO products (sku, name, price)
VALUES ('SKU-001', 'Widget', 29.99)
ON DUPLICATE KEY UPDATE
    price = VALUES(price),
    updated_at = NOW();

-- ── RETURNING (PostgreSQL) — get the generated ID ─────────
INSERT INTO orders (customer_id, total_amount, status)
VALUES (42, 199.99, 'PENDING')
RETURNING order_id, created_at;   -- returns the auto-generated values

-- CTE with RETURNING to use the returned ID immediately
WITH new_order AS (
    INSERT INTO orders (customer_id, total_amount) VALUES (42, 199.99)
    RETURNING order_id
)
INSERT INTO order_items (order_id, product_id, quantity)
SELECT new_order.order_id, 101, 2
FROM   new_order;`
      },
      {
        n: "UPDATE, DELETE & MERGE",
        tag: "DML",
        desc: `UPDATE modifies existing rows. DELETE removes rows. MERGE (also called UPSERT in some dialects) combines insert, update, and delete in a single statement based on a join condition.

UPDATE SAFETY RULES:
• ALWAYS use a WHERE clause — UPDATE without WHERE modifies every row.
• Test your WHERE clause with SELECT first.
• Use LIMIT 1 when updating a single row to prevent accidents.
• In PostgreSQL, UPDATE … FROM joins to another table.

DELETE SAFETY RULES:
• ALWAYS use a WHERE clause — DELETE without WHERE deletes everything.
• Prefer soft-delete (is_deleted = true) over hard-delete for auditable data.
• TRUNCATE is faster for clearing entire tables but cannot be rolled back in some databases.

MERGE (SQL:2003 standard, supported in Oracle, SQL Server, PostgreSQL 15+):
• Performs INSERT, UPDATE, or DELETE in one pass based on whether a source row matches a target row.
• Ideal for ETL loads, syncing staging tables to production.`,
        code: `-- ── Basic UPDATE ────────────────────────────────────────
UPDATE employees
SET    salary    = salary * 1.10,   -- 10% raise
       updated_at = NOW()
WHERE  department = 'Engineering'
  AND  is_active  = true;

-- ── UPDATE with JOIN (PostgreSQL: UPDATE … FROM) ──────────
UPDATE employees e
SET    salary = e.salary * d.raise_multiplier
FROM   departments d
WHERE  e.department_id = d.dept_id
  AND  d.name = 'Engineering';

-- MySQL equivalent:
UPDATE employees e
JOIN   departments d ON e.department_id = d.dept_id
SET    e.salary = e.salary * d.raise_multiplier
WHERE  d.name = 'Engineering';

-- ── UPDATE returning (PostgreSQL) ────────────────────────
UPDATE orders
SET    status = 'SHIPPED', shipped_at = NOW()
WHERE  order_id = 1001
RETURNING order_id, status, shipped_at;

-- ── Soft delete (preferred over hard delete) ─────────────
ALTER TABLE employees ADD COLUMN deleted_at TIMESTAMPTZ;

UPDATE employees
SET    deleted_at = NOW(), is_active = false
WHERE  employee_id = 42;

-- Queries must filter: WHERE deleted_at IS NULL

-- ── Hard DELETE ───────────────────────────────────────────
DELETE FROM employees WHERE employee_id = 42;
DELETE FROM employees WHERE is_active = false AND hire_date < NOW() - INTERVAL '5 years';

-- DELETE with JOIN (delete orders that have no items)
DELETE FROM orders
WHERE order_id IN (
    SELECT o.order_id
    FROM   orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE  oi.order_id IS NULL
);

-- ── MERGE (PostgreSQL 15+ / SQL Server / Oracle) ──────────
-- Sync staging_orders into orders table
MERGE INTO orders AS target
USING staging_orders AS source
    ON target.order_id = source.order_id
WHEN MATCHED AND source.status != target.status THEN
    UPDATE SET
        status     = source.status,
        updated_at = NOW()
WHEN MATCHED AND source.status = 'CANCELLED' THEN
    DELETE
WHEN NOT MATCHED THEN
    INSERT (order_id, customer_id, total_amount, status)
    VALUES (source.order_id, source.customer_id, source.total_amount, source.status);`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "DQL — Queries & Joins",
    icon: "⌕",
    color: "#F59E0B",
    desc: "SELECT, all JOIN types, subqueries, aggregates, HAVING, DISTINCT and query execution order.",
    topics: [
      {
        n: "SELECT — clauses, execution order, DISTINCT, GROUP BY, HAVING",
        tag: "DQL",
        desc: `The SELECT statement retrieves data. The order you write clauses differs from the order the database engine executes them — understanding execution order explains why you can't use a SELECT alias in WHERE.

LOGICAL EXECUTION ORDER (not written order):
1. FROM / JOIN — determine which rows to work with
2. WHERE — filter individual rows BEFORE grouping
3. GROUP BY — group rows by specified columns
4. HAVING — filter GROUPS (after aggregation)
5. SELECT — compute output columns (aliases created here)
6. DISTINCT — remove duplicates
7. ORDER BY — sort results (can use SELECT aliases)
8. LIMIT / OFFSET — slice the result

WHY THIS MATTERS:
• You cannot use a SELECT alias in WHERE (WHERE runs before SELECT)
• You CAN use a SELECT alias in ORDER BY (ORDER BY runs after SELECT)
• WHERE filters rows before grouping; HAVING filters groups after aggregation
• Aggregate functions (COUNT, SUM, AVG, MAX, MIN) require GROUP BY for non-aggregate columns`,
        code: `-- ── Basic SELECT structure ───────────────────────────────
SELECT
    department,
    COUNT(*)                         AS total_employees,
    AVG(salary)                      AS avg_salary,
    MAX(salary)                      AS max_salary,
    MIN(hire_date)                   AS earliest_hire
FROM   employees
WHERE  is_active = true              -- filter ROWS before grouping
  AND  hire_date >= '2020-01-01'
GROUP  BY department                 -- group after filtering
HAVING COUNT(*) > 3                  -- filter GROUPS after aggregation
   AND AVG(salary) > 60000
ORDER  BY avg_salary DESC            -- can use alias (runs after SELECT)
LIMIT  10
OFFSET 0;

-- ── DISTINCT ─────────────────────────────────────────────
SELECT DISTINCT department FROM employees ORDER BY department;

-- DISTINCT ON (PostgreSQL) — first row per group by one column
SELECT DISTINCT ON (department)
    department, employee_id, salary
FROM employees
ORDER BY department, salary DESC;   -- within each dept, pick highest salary
-- Picks the FIRST row per department after ORDER BY

-- ── CASE expression ───────────────────────────────────────
SELECT
    first_name,
    salary,
    CASE
        WHEN salary >= 100000 THEN 'Senior'
        WHEN salary >= 70000  THEN 'Mid-level'
        WHEN salary >= 40000  THEN 'Junior'
        ELSE 'Entry'
    END                              AS seniority_level,
    CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END AS status
FROM employees;

-- ── COALESCE — first non-null value ───────────────────────
SELECT
    first_name,
    COALESCE(phone_number, email, 'No contact') AS contact_info,
    COALESCE(bonus_pct, 0)                      AS bonus_pct
FROM employees;

-- ── NULLIF — return null if two values are equal ──────────
SELECT NULLIF(division_result, 0);   -- prevents division-by-zero
SELECT 100.0 / NULLIF(count_value, 0) AS safe_divide;`
      },
      {
        n: "JOINs — INNER, LEFT, RIGHT, FULL, CROSS, SELF",
        tag: "DQL",
        desc: `JOINs combine rows from two or more tables based on a related column. Mastering JOINs is fundamental to SQL.

INNER JOIN: Returns only rows where the join condition is true in BOTH tables. Excludes rows with no match on either side.

LEFT JOIN (LEFT OUTER JOIN): Returns ALL rows from the left table and matching rows from the right. If no match in the right table, right-side columns are NULL. Use when you want all records from one table regardless of whether they have related records.

RIGHT JOIN: Mirror of LEFT JOIN — all rows from right, matching from left. In practice, you can always rewrite a RIGHT JOIN as a LEFT JOIN by swapping table order.

FULL OUTER JOIN: Returns all rows from both tables. NULLs appear on whichever side has no match. Used to find unmatched records in both tables.

CROSS JOIN: Cartesian product — every row from left combined with every row from right. N×M rows. Rarely intentional (usually a mistake if no ON condition in an old-style join).

SELF JOIN: A table joined to itself. Used for hierarchical data (employees and their managers) or comparing rows within the same table.`,
        code: `-- ── INNER JOIN — only matched rows ──────────────────────
SELECT e.first_name, e.last_name, d.dept_name, d.location
FROM   employees  e
INNER JOIN departments d ON e.department_id = d.dept_id;
-- Employees WITHOUT a department are EXCLUDED

-- ── LEFT JOIN — all employees, dept if exists ────────────
SELECT e.first_name, d.dept_name
FROM   employees  e
LEFT  JOIN departments d ON e.department_id = d.dept_id;
-- Employees without department: dept_name = NULL
-- Useful: find employees with no department assigned
SELECT e.first_name
FROM   employees  e
LEFT  JOIN departments d ON e.department_id = d.dept_id
WHERE  d.dept_id IS NULL;   -- only employees WITHOUT a dept

-- ── FULL OUTER JOIN — all rows from both tables ───────────
SELECT e.first_name, d.dept_name
FROM   employees  e
FULL OUTER JOIN departments d ON e.department_id = d.dept_id;
-- Unmatched employees: dept_name = NULL
-- Unmatched departments: employee columns = NULL

-- ── Multiple JOINs ────────────────────────────────────────
SELECT
    e.first_name  || ' ' || e.last_name  AS employee,
    d.dept_name,
    m.first_name  || ' ' || m.last_name  AS manager,
    r.role_title
FROM        employees  e
INNER JOIN  departments d  ON e.department_id  = d.dept_id
LEFT  JOIN  employees   m  ON e.manager_id     = m.employee_id  -- self join
LEFT  JOIN  employee_roles r ON e.employee_id  = r.employee_id;

-- ── SELF JOIN — employees and their manager ───────────────
SELECT
    emp.first_name  AS employee,
    mgr.first_name  AS manager
FROM   employees emp
LEFT JOIN employees mgr ON emp.manager_id = mgr.employee_id;

-- ── CROSS JOIN — all combinations (use with care) ────────
SELECT p.product_name, s.size_name
FROM   products p
CROSS JOIN sizes s;    -- every product in every size
-- If products=100 rows and sizes=5 rows → result is 500 rows

-- ── JOIN on multiple conditions ───────────────────────────
SELECT *
FROM orders o
INNER JOIN promotions p
    ON o.customer_id = p.customer_id
   AND o.order_date  BETWEEN p.start_date AND p.end_date
   AND o.total > p.min_order_value;`
      },
      {
        n: "Subqueries, CTEs (WITH) and correlated subqueries",
        tag: "DQL",
        desc: `Subqueries are queries nested inside another query. They can appear in SELECT, FROM, WHERE, and HAVING clauses.

SCALAR SUBQUERY: Returns exactly one row and one column. Can be used anywhere a single value is expected.

ROW SUBQUERY: Returns one row with multiple columns. Used with row constructors.

TABLE SUBQUERY (DERIVED TABLE): Returns multiple rows. Used in FROM as if it were a table.

CORRELATED SUBQUERY: References columns from the outer query. Executes once per row of the outer query — can be slow on large tables but sometimes unavoidable.

CTE (Common Table Expression) — WITH clause: Names a subquery for reuse within the same statement. Improves readability. In PostgreSQL, CTEs are by default optimisation fences (not inlined) until PG 12+. Use RECURSIVE CTEs for hierarchical/tree data.

PERFORMANCE NOTE: CTEs are not always better than subqueries for performance. In MySQL, CTEs are always materialised (can be slower). In PostgreSQL 12+, the optimiser can inline non-recursive CTEs.`,
        code: `-- ── Scalar subquery in SELECT ────────────────────────────
SELECT
    e.first_name,
    e.salary,
    (SELECT AVG(salary) FROM employees)        AS company_avg,
    e.salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees e;

-- ── Subquery in WHERE ─────────────────────────────────────
-- Employees earning above department average
SELECT first_name, salary, department
FROM   employees e1
WHERE  salary > (
    SELECT AVG(salary)
    FROM   employees e2
    WHERE  e2.department = e1.department   -- correlated: references outer e1
);

-- ── IN with subquery ──────────────────────────────────────
SELECT * FROM orders
WHERE customer_id IN (
    SELECT customer_id FROM customers WHERE country = 'UK'
);

-- ── EXISTS (often faster than IN for large sets) ─────────
SELECT c.customer_name
FROM   customers c
WHERE  EXISTS (
    SELECT 1
    FROM   orders o
    WHERE  o.customer_id = c.customer_id     -- correlated
      AND  o.total > 1000
);

-- ── CTE (WITH clause) — reusable named query ──────────────
WITH
dept_stats AS (
    SELECT
        department,
        AVG(salary)   AS avg_sal,
        COUNT(*)      AS headcount
    FROM employees
    WHERE is_active = true
    GROUP BY department
),
top_depts AS (
    SELECT department
    FROM   dept_stats
    WHERE  headcount > 5 AND avg_sal > 80000
)
SELECT e.first_name, e.salary, e.department
FROM   employees e
INNER JOIN top_depts td ON e.department = td.department
ORDER  BY e.salary DESC;

-- ── Recursive CTE — organisation hierarchy ────────────────
WITH RECURSIVE org_tree AS (
    -- Base case: top-level employees (no manager)
    SELECT employee_id, first_name, manager_id, 0 AS level
    FROM   employees
    WHERE  manager_id IS NULL

    UNION ALL

    -- Recursive case: employees of known employees
    SELECT e.employee_id, e.first_name, e.manager_id, ot.level + 1
    FROM   employees e
    INNER JOIN org_tree ot ON e.manager_id = ot.employee_id
)
SELECT level, first_name, employee_id
FROM   org_tree
ORDER  BY level, first_name;`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Window Functions",
    icon: "⊞",
    color: "#A855F7",
    desc: "ROW_NUMBER, RANK, LAG/LEAD, SUM OVER, PARTITION BY — analytics without collapsing rows.",
    topics: [
      {
        n: "OVER, PARTITION BY, ORDER BY, frame clauses",
        tag: "WINDOW",
        desc: `Window functions perform calculations across a set of rows related to the current row — unlike aggregate functions, they do NOT collapse rows into groups. Each row retains its identity while gaining access to aggregate or ranking information about a "window" of rows.

ANATOMY: function() OVER (PARTITION BY col ORDER BY col ROWS/RANGE BETWEEN … AND …)

PARTITION BY: Divides rows into groups (partitions) before the function is applied. Like GROUP BY but rows are NOT collapsed. Omitting PARTITION BY means the entire result set is one window.

ORDER BY in OVER: Defines the sequence within each partition. Required for ranking and navigation functions. Defines the "current row" concept for frame clauses.

FRAME CLAUSE (ROWS/RANGE BETWEEN … AND …): Defines the subset of the partition relative to the current row.
• ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW — running total (all rows from start to current)
• ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING — 5-row sliding window
• RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW — time-based window`,
        code: `-- ── Employee salary with department rank ──────────────────
SELECT
    first_name,
    department,
    salary,
    -- Rank within department by salary (highest = rank 1)
    RANK()        OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank,
    DENSE_RANK()  OVER (PARTITION BY department ORDER BY salary DESC) AS dept_dense_rank,
    ROW_NUMBER()  OVER (PARTITION BY department ORDER BY salary DESC) AS dept_row_num,
    -- Running total of salary within department
    SUM(salary)   OVER (PARTITION BY department ORDER BY hire_date
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_salary,
    -- Department total (no ORDER BY = whole partition)
    SUM(salary)   OVER (PARTITION BY department)     AS dept_total,
    -- Company total
    SUM(salary)   OVER ()                             AS company_total,
    -- Salary as % of department total
    ROUND(100.0 * salary / SUM(salary) OVER (PARTITION BY department), 2) AS pct_of_dept
FROM employees;

-- ── RANK vs DENSE_RANK vs ROW_NUMBER ─────────────────────
-- Salaries: 100, 90, 90, 80
-- RANK():        1,  2,  2,  4   ← gaps after ties
-- DENSE_RANK():  1,  2,  2,  3   ← no gaps
-- ROW_NUMBER():  1,  2,  3,  4   ← always unique

-- ── NTILE — divide into N buckets ─────────────────────────
SELECT
    first_name,
    salary,
    NTILE(4) OVER (ORDER BY salary DESC) AS salary_quartile
    -- 1 = top 25%, 2 = next 25%, etc.
FROM employees;

-- ── PERCENT_RANK / CUME_DIST ──────────────────────────────
SELECT
    first_name,
    salary,
    PERCENT_RANK() OVER (ORDER BY salary)  AS percentile,   -- 0.0 to 1.0
    CUME_DIST()    OVER (ORDER BY salary)  AS cume_dist     -- 0 < value <= 1.0
FROM employees;

-- ── Sliding window average (last 3 months revenue) ────────
SELECT
    month,
    revenue,
    AVG(revenue) OVER (
        ORDER BY month
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW  -- 3-row window
    ) AS rolling_3m_avg
FROM monthly_revenue
ORDER BY month;`
      },
      {
        n: "LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE",
        tag: "WINDOW",
        desc: `Navigation window functions access values from OTHER rows relative to the current row — without a self-join. They are essential for time-series analysis, calculating period-over-period changes, and finding first/last occurrences.

LAG(col, n, default): Returns the value of col from n rows BEFORE the current row. Default value if no previous row exists.

LEAD(col, n, default): Returns the value of col from n rows AFTER the current row.

FIRST_VALUE(col): Returns the first value of col in the current window frame.

LAST_VALUE(col): Returns the last value — WATCH OUT: the default frame is ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, so LAST_VALUE is always the current row unless you extend the frame to ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING.

NTH_VALUE(col, n): Returns the value at position n in the window.`,
        code: `-- ── LAG and LEAD — period-over-period comparison ──────────
SELECT
    month,
    revenue,
    LAG(revenue, 1, 0) OVER (ORDER BY month)   AS prev_month_revenue,
    LEAD(revenue, 1)   OVER (ORDER BY month)   AS next_month_revenue,
    revenue - LAG(revenue, 1, revenue) OVER (ORDER BY month) AS mom_change,
    ROUND(100.0 * (revenue - LAG(revenue, 1, revenue) OVER (ORDER BY month))
          / NULLIF(LAG(revenue, 1) OVER (ORDER BY month), 0), 2)  AS mom_pct_change
FROM monthly_revenue
ORDER BY month;

-- ── LAG within partitions (per product) ───────────────────
SELECT
    product_id,
    sale_date,
    units_sold,
    LAG(units_sold) OVER (PARTITION BY product_id ORDER BY sale_date) AS prev_day_units,
    units_sold - LAG(units_sold) OVER (PARTITION BY product_id ORDER BY sale_date) AS day_change
FROM daily_sales;

-- ── FIRST_VALUE and LAST_VALUE ────────────────────────────
SELECT
    employee_id,
    department,
    salary,
    FIRST_VALUE(salary) OVER (
        PARTITION BY department
        ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS dept_highest_salary,
    LAST_VALUE(salary) OVER (
        PARTITION BY department
        ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING  -- critical!
    ) AS dept_lowest_salary
FROM employees;

-- ── Practical: find previous order date per customer ──────
SELECT
    customer_id,
    order_id,
    order_date,
    LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_order_date,
    order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS days_since_last_order
FROM orders
ORDER BY customer_id, order_date;

-- ── Select only top 1 per group using ROW_NUMBER ──────────
WITH ranked AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
)
SELECT * FROM ranked WHERE rn = 1;   -- highest earner per department`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Indexes",
    icon: "◈",
    color: "#F97316",
    desc: "B-tree, hash, partial, composite, covering indexes — how they work and when to use each.",
    topics: [
      {
        n: "Index types, creation, covering indexes & when NOT to index",
        tag: "INDEX",
        desc: `An index is a separate data structure that allows the database to find rows quickly without scanning the entire table. The trade-off: faster reads at the cost of slower writes (index must be maintained) and extra storage.

B-TREE INDEX (default): Balanced tree structure. Supports equality, range queries (<, >, BETWEEN), LIKE 'prefix%', ORDER BY, and NULL checks. The right choice for most columns.

HASH INDEX: Only supports equality (=). Faster than B-tree for equality lookups. Does not support range queries or sorting. Not WAL-logged in older PostgreSQL versions (use only in PostgreSQL 10+).

PARTIAL INDEX: Indexes only rows satisfying a WHERE condition. Much smaller and faster than a full index. Perfect for tables with skewed distributions (e.g., only active records).

COMPOSITE INDEX (multi-column): Indexes multiple columns together. Column order matters: the index is used only if queries filter on a prefix of the index columns. Index on (a, b, c) is used for queries filtering on: a, a+b, a+b+c — but NOT for b alone or c alone.

COVERING INDEX (INCLUDE): Stores additional columns in the index leaf pages. A query can be answered entirely from the index without touching the main table (index-only scan). Dramatically speeds up frequently queried column combinations.

WHEN NOT TO INDEX: Small tables (sequential scan is faster), high-write-low-read tables (write overhead outweighs read benefit), columns with very low cardinality (boolean, gender), columns never used in WHERE/JOIN/ORDER BY.`,
        code: `-- ── Create standard B-tree index ─────────────────────────
CREATE INDEX idx_employees_email        ON employees (email);
CREATE INDEX idx_employees_department   ON employees (department);
CREATE INDEX idx_orders_customer_date   ON orders (customer_id, order_date DESC);

-- ── Unique index (enforces uniqueness AND speeds lookups) ──
CREATE UNIQUE INDEX uix_products_sku ON products (sku);

-- ── Partial index — only active employees ────────────────
-- Only a fraction of rows are indexed → smaller, faster
CREATE INDEX idx_employees_active_email
ON employees (email)
WHERE is_active = true;

-- This index is used by:
SELECT * FROM employees WHERE email = 'alice@company.com' AND is_active = true;
-- But NOT by:
SELECT * FROM employees WHERE email = 'alice@company.com'; -- condition doesn't match

-- ── Composite index — column order matters ────────────────
CREATE INDEX idx_orders_customer_status_date
ON orders (customer_id, status, order_date);
-- Used for:  WHERE customer_id = ?
--            WHERE customer_id = ? AND status = ?
--            WHERE customer_id = ? AND status = ? AND order_date > ?
-- NOT used:  WHERE status = ?                      (no leading customer_id)
-- NOT used:  WHERE order_date > ?                  (no leading columns)

-- ── Covering index (INCLUDE) — avoid heap fetch ────────────
-- Query: SELECT order_date, total FROM orders WHERE customer_id = 42 ORDER BY order_date
CREATE INDEX idx_orders_cover
ON orders (customer_id, order_date)
INCLUDE (total);          -- total is stored in leaf but not part of the key
-- The entire query can be satisfied from the index — no table access needed

-- ── Expression index ──────────────────────────────────────
CREATE INDEX idx_employees_lower_email ON employees (LOWER(email));
-- Used by: WHERE LOWER(email) = 'alice@company.com'  (case-insensitive search)

-- ── GIN index for full-text search and JSONB ─────────────
CREATE INDEX idx_products_fts ON products USING GIN (to_tsvector('english', description));
CREATE INDEX idx_events_data   ON events   USING GIN (event_data);  -- for JSONB @> queries

-- ── View index usage ──────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM employees WHERE email = 'alice@company.com';
-- Look for: "Index Scan" or "Index Only Scan" (good) vs "Seq Scan" (may need index)

-- ── Drop an index ─────────────────────────────────────────
DROP INDEX idx_employees_email;
DROP INDEX CONCURRENTLY idx_employees_email;  -- non-blocking (PostgreSQL)`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Views",
    icon: "⊙",
    color: "#06B6D4",
    desc: "Simple views, updatable views, and materialized views — stored queries as virtual tables.",
    topics: [
      {
        n: "Views — definition, updatable views, security & use cases",
        tag: "VIEW",
        desc: `A VIEW is a named, stored SELECT query that behaves like a virtual table. When you query a view, the database transparently executes the underlying SELECT and returns the result.

WHAT A VIEW IS NOT: A view is NOT a copy of the data. It has no storage of its own (except materialized views). Every query against a view re-executes the underlying SQL.

USE CASES:
1. ABSTRACTION: Hide complex joins behind a simple name. Application code queries a clean view instead of a 6-table join.
2. SECURITY (row and column security): Expose only certain columns or rows to certain users. Grant SELECT on the view, not the underlying table.
3. BACKWARDS COMPATIBILITY: When you restructure a table, keep the old view interface so existing queries don't break.
4. SIMPLIFICATION: Named shortcuts for commonly used query patterns.

UPDATABLE VIEWS: PostgreSQL and MySQL can automatically make a view updatable (INSERT/UPDATE/DELETE flow through to the base table) if the view meets strict conditions: single base table, no DISTINCT, no GROUP BY/HAVING, no aggregates, no UNION, no subqueries in WHERE.

WITH CHECK OPTION: Prevents INSERT/UPDATE through a view from creating rows that would no longer be visible through that view (violating the view's WHERE condition).`,
        code: `-- ── Simple view ──────────────────────────────────────────
CREATE OR REPLACE VIEW v_active_employees AS
SELECT
    employee_id,
    first_name || ' ' || last_name  AS full_name,
    email,
    department,
    salary,
    hire_date
FROM employees
WHERE is_active = true;

-- Query it just like a table
SELECT * FROM v_active_employees WHERE department = 'Engineering';

-- ── View for security — hide salary column ────────────────
CREATE OR REPLACE VIEW v_employee_directory AS
SELECT employee_id, first_name, last_name, email, department
FROM   employees
WHERE  is_active = true;
-- No salary column exposed
-- Grant to public-facing role:
GRANT SELECT ON v_employee_directory TO app_readonly_role;

-- ── Complex view hiding a multi-table join ────────────────
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
    o.order_id,
    o.order_date,
    c.customer_name,
    c.email          AS customer_email,
    COUNT(oi.product_id)     AS item_count,
    SUM(oi.quantity)         AS total_units,
    SUM(oi.quantity * oi.unit_price) AS calculated_total,
    o.status
FROM orders o
JOIN customers   c  ON o.customer_id  = c.customer_id
JOIN order_items oi ON o.order_id     = oi.order_id
GROUP BY o.order_id, o.order_date, c.customer_name, c.email, o.status;

SELECT * FROM v_order_summary WHERE status = 'PENDING' ORDER BY order_date;

-- ── Updatable view with CHECK OPTION ──────────────────────
CREATE OR REPLACE VIEW v_engineering_employees AS
SELECT * FROM employees WHERE department = 'Engineering'
WITH CHECK OPTION;    -- prevents INSERT/UPDATE of non-Engineering rows

-- This works (department = Engineering):
UPDATE v_engineering_employees SET salary = 99000 WHERE employee_id = 1;

-- This FAILS with ERROR (would make row invisible to view):
UPDATE v_engineering_employees SET department = 'HR' WHERE employee_id = 1;

-- ── Drop a view ───────────────────────────────────────────
DROP VIEW v_active_employees;
DROP VIEW IF EXISTS v_active_employees;
DROP VIEW v_active_employees CASCADE;   -- also drops views that depend on this one`
      },
      {
        n: "Materialized Views — definition, refresh strategies & when to use",
        tag: "VIEW",
        desc: `A MATERIALIZED VIEW stores the result of a query physically on disk — unlike a regular view which re-executes its query every time. Think of it as a cached query result that you can index.

WHEN TO USE MATERIALIZED VIEWS:
• The underlying query is expensive (large aggregates, many joins) and the data doesn't need to be perfectly real-time.
• Read queries on the view are far more frequent than writes to the source tables.
• You need to add indexes to the view result (impossible with regular views).
• Dashboard/reporting queries that run many times per second against millions of rows.

FRESHNESS vs PERFORMANCE TRADE-OFF: Materialized views are stale as soon as the source data changes. You must REFRESH them explicitly or via a scheduled job.

REFRESH STRATEGIES:
• REFRESH MATERIALIZED VIEW name — full refresh, locks the view (no reads during refresh)
• REFRESH MATERIALIZED VIEW CONCURRENTLY name — allows reads during refresh (requires a unique index on the view)
• pg_cron / cron job — schedule refreshes during off-peak hours
• Trigger-based refresh — refresh on every source table change (expensive for high-write tables)

INCREMENTAL REFRESH: PostgreSQL does not support incremental refresh natively. Timescale's continuous aggregates and Snowflake's dynamic tables offer this. For PostgreSQL, consider manual incremental logic or pg_partman.`,
        code: `-- ── Create materialized view ─────────────────────────────
CREATE MATERIALIZED VIEW mv_sales_summary AS
SELECT
    DATE_TRUNC('month', o.order_date)  AS sale_month,
    p.category,
    COUNT(DISTINCT o.order_id)         AS order_count,
    SUM(oi.quantity)                   AS units_sold,
    SUM(oi.quantity * oi.unit_price)   AS revenue,
    AVG(oi.unit_price)                 AS avg_price
FROM orders o
JOIN order_items oi ON o.order_id    = oi.order_id
JOIN products    p  ON oi.product_id = p.product_id
WHERE o.status = 'COMPLETED'
GROUP BY 1, 2
WITH DATA;    -- WITH DATA = populate immediately; WITH NO DATA = empty shell

-- ── Add indexes to materialized view ─────────────────────
-- This is the key advantage over regular views!
CREATE INDEX idx_mv_sales_month    ON mv_sales_summary (sale_month);
CREATE UNIQUE INDEX idx_mv_sales_pk ON mv_sales_summary (sale_month, category);
-- UNIQUE index on mv is required for CONCURRENTLY refresh

-- ── Query the materialized view (instant) ────────────────
SELECT * FROM mv_sales_summary
WHERE sale_month >= '2025-01-01'
ORDER BY revenue DESC;

-- ── Refresh strategies ────────────────────────────────────
-- Full refresh — locks view, fastest to complete
REFRESH MATERIALIZED VIEW mv_sales_summary;

-- Concurrent refresh — no downtime, requires unique index
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_summary;

-- Schedule with pg_cron (every hour at :00)
SELECT cron.schedule('0 * * * *', $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_summary$$);

-- ── Check when view was last refreshed ───────────────────
SELECT schemaname, matviewname, last_refresh
FROM pg_stat_user_tables
WHERE relname = 'mv_sales_summary';

-- ── Drop materialized view ────────────────────────────────
DROP MATERIALIZED VIEW mv_sales_summary;
DROP MATERIALIZED VIEW IF EXISTS mv_sales_summary;`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Stored Procedures & Functions",
    icon: "⊳",
    color: "#EC4899",
    desc: "Stored procedures, user-defined functions, and the difference between them.",
    topics: [
      {
        n: "Functions — scalar, table-returning, PL/pgSQL",
        tag: "FUNCTION",
        desc: `A FUNCTION in SQL is a named, reusable piece of code that takes inputs, performs logic, and returns a value. Functions can be used inside SELECT, WHERE, and other SQL clauses — procedures cannot.

FUNCTION vs PROCEDURE (key differences):
• Functions RETURN a value; procedures may or may not.
• Functions CAN be called inside a SELECT statement; procedures cannot.
• Functions (in PostgreSQL) cannot commit/rollback transactions; procedures can.
• Functions can be used in expressions; procedures are called with CALL.

FUNCTION TYPES:
• SCALAR: Returns a single value. Used in SELECT column list or WHERE clause.
• TABLE-RETURNING (TABLE / SETOF): Returns a set of rows — queryable like a table.
• AGGREGATE: Custom aggregate function (used with GROUP BY).

PL/pgSQL is PostgreSQL's procedural language. It adds variables, conditionals (IF/ELSIF/ELSE), loops (LOOP, FOR, WHILE), exception handling, and dynamic SQL to regular SQL.

VOLATILITY LABELS:
• IMMUTABLE: No database access, same inputs always produce same output. Safest for query optimisation and indexing.
• STABLE: No side effects, but can read from database. Consistent within a transaction.
• VOLATILE (default): Can modify database, result may change between calls.`,
        code: `-- ── Scalar function (SQL language) ──────────────────────
CREATE OR REPLACE FUNCTION full_name(p_first VARCHAR, p_last VARCHAR)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE                  -- no DB access, pure computation
AS $$
    SELECT TRIM(p_first) || ' ' || TRIM(p_last);
$$;

SELECT full_name(first_name, last_name) FROM employees;

-- ── Scalar function with PL/pgSQL ────────────────────────
CREATE OR REPLACE FUNCTION get_employee_tier(p_salary DECIMAL)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF    p_salary >= 120000 THEN RETURN 'Principal';
    ELSIF p_salary >= 90000  THEN RETURN 'Senior';
    ELSIF p_salary >= 60000  THEN RETURN 'Mid-level';
    ELSIF p_salary >= 35000  THEN RETURN 'Junior';
    ELSE                          RETURN 'Intern';
    END IF;
END;
$$;

SELECT first_name, salary, get_employee_tier(salary) AS tier FROM employees;

-- ── Table-returning function ──────────────────────────────
CREATE OR REPLACE FUNCTION get_employees_by_dept(p_dept VARCHAR)
RETURNS TABLE(
    employee_id  BIGINT,
    full_name    TEXT,
    salary       DECIMAL,
    hire_date    DATE
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        employee_id,
        first_name || ' ' || last_name,
        salary,
        hire_date
    FROM employees
    WHERE department = p_dept AND is_active = true
    ORDER BY salary DESC;
$$;

SELECT * FROM get_employees_by_dept('Engineering');

-- ── PL/pgSQL function with exception handling ──────────────
CREATE OR REPLACE FUNCTION safe_divide(numerator NUMERIC, denominator NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF denominator = 0 THEN
        RAISE EXCEPTION 'Division by zero: denominator cannot be 0';
    END IF;
    RETURN numerator / denominator;
EXCEPTION
    WHEN division_by_zero THEN
        RETURN NULL;    -- or re-raise with RAISE
END;
$$;

-- ── Function with loop and variables ──────────────────────
CREATE OR REPLACE FUNCTION nth_fibonacci(n INT)
RETURNS BIGINT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    a BIGINT := 0;
    b BIGINT := 1;
    i INT := 0;
    temp BIGINT;
BEGIN
    IF n <= 0 THEN RETURN 0; END IF;
    WHILE i < n - 1 LOOP
        temp := a + b;
        a    := b;
        b    := temp;
        i    := i + 1;
    END LOOP;
    RETURN b;
END;
$$;

-- ── Drop function ─────────────────────────────────────────
DROP FUNCTION IF EXISTS full_name(VARCHAR, VARCHAR);`
      },
      {
        n: "Stored Procedures — CALL, transactions, OUT parameters",
        tag: "PROCEDURE",
        desc: `A STORED PROCEDURE is a named block of SQL/procedural code stored in the database. Unlike functions, procedures are called with the CALL statement and can include explicit transaction control (COMMIT, ROLLBACK) — making them suitable for multi-step business operations.

KEY DIFFERENCES from functions:
• Procedures use CALL; functions are used in expressions.
• Procedures CAN use COMMIT and ROLLBACK (in PostgreSQL 11+, Oracle, SQL Server).
• Procedures can have IN, OUT, and INOUT parameters.
• Procedures do not have a RETURNS clause (they return values via OUT parameters).

WHEN TO USE PROCEDURES:
• Multi-step business operations that must be atomic (e.g., transfer funds between accounts).
• Batch processing jobs run on a schedule.
• Operations that require explicit transaction demarcation.
• ETL data transformation steps.

WHEN TO USE FUNCTIONS:
• Reusable calculations or data retrieval used in SELECT statements.
• Returning a single value or a result set.
• Any case where you need to call it inline in a query.`,
        code: `-- ── Simple stored procedure (PostgreSQL 11+) ─────────────
CREATE OR REPLACE PROCEDURE update_employee_salary(
    IN p_employee_id BIGINT,
    IN p_new_salary  DECIMAL,
    OUT p_old_salary DECIMAL,
    OUT p_updated    BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Fetch current salary
    SELECT salary INTO p_old_salary
    FROM employees WHERE employee_id = p_employee_id;

    IF NOT FOUND THEN
        p_updated := false;
        RETURN;
    END IF;

    -- Validate
    IF p_new_salary <= 0 THEN
        RAISE EXCEPTION 'Salary must be positive, got: %', p_new_salary;
    END IF;

    -- Update
    UPDATE employees
    SET salary = p_new_salary, updated_at = NOW()
    WHERE employee_id = p_employee_id;

    p_updated := true;
    COMMIT;    -- explicit commit (only valid in procedures!)
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_updated := false;
        RAISE;     -- re-raise the exception
END;
$$;

-- ── Call the procedure ────────────────────────────────────
CALL update_employee_salary(42, 95000.00, NULL, NULL);

-- Capture OUT parameters (in PL/pgSQL block)
DO $$
DECLARE
    v_old_sal DECIMAL;
    v_updated BOOLEAN;
BEGIN
    CALL update_employee_salary(42, 95000.00, v_old_sal, v_updated);
    RAISE NOTICE 'Old salary: %, Updated: %', v_old_sal, v_updated;
END;
$$;

-- ── Batch processing procedure with transaction control ────
CREATE OR REPLACE PROCEDURE process_pending_orders(
    IN p_batch_size INT DEFAULT 100
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id BIGINT;
    v_count    INT := 0;
BEGIN
    FOR v_order_id IN
        SELECT order_id FROM orders
        WHERE status = 'PENDING'
        ORDER BY created_at
        LIMIT p_batch_size
    LOOP
        BEGIN
            -- Process each order in its own sub-transaction
            UPDATE orders SET status = 'PROCESSING' WHERE order_id = v_order_id;
            PERFORM ship_order(v_order_id);   -- call another function
            UPDATE orders SET status = 'SHIPPED' WHERE order_id = v_order_id;
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed order %: %', v_order_id, SQLERRM;
            UPDATE orders SET status = 'ERROR', error_msg = SQLERRM
            WHERE order_id = v_order_id;
        END;
    END LOOP;

    COMMIT;
    RAISE NOTICE 'Processed % orders', v_count;
END;
$$;

CALL process_pending_orders(50);`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Triggers",
    icon: "⚡",
    color: "#F59E0B",
    desc: "Auto-executed code in response to INSERT, UPDATE, or DELETE — audit trails, derived columns, validation.",
    topics: [
      {
        n: "Triggers — BEFORE, AFTER, FOR EACH ROW, use cases & risks",
        tag: "TRIGGER",
        desc: `A TRIGGER is a procedure that automatically executes in response to a specified event (INSERT, UPDATE, DELETE, TRUNCATE) on a table or view.

TRIGGER TIMING:
• BEFORE: Fires before the operation. Can modify the row (via NEW) or cancel the operation (by returning NULL). Used for input validation and derived column computation.
• AFTER: Fires after the operation completes. Cannot modify the row. Used for audit logging and cascading updates to other tables.
• INSTEAD OF: Fires on views instead of the INSERT/UPDATE/DELETE. Used to make views updatable.

TRIGGER SCOPE:
• FOR EACH ROW: Fires once per affected row. Has access to OLD (before) and NEW (after) record values.
• FOR EACH STATEMENT: Fires once per SQL statement, regardless of how many rows are affected.

COMMON USE CASES:
• Audit trails: Log every change to a separate audit table.
• Automatic timestamps: Set updated_at = NOW() on every UPDATE.
• Derived columns: Compute a full_name column from first_name and last_name.
• Validation: Enforce complex business rules that CHECK constraints can't express.
• Cascading denormalised data: Update a summary/cache table when source changes.

RISKS: Triggers make behaviour invisible to application developers — bugs are hard to trace. Triggers fire in cascades. Heavy trigger use degrades write performance. Document triggers clearly.`,
        code: `-- ── Step 1: Create the trigger function ──────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();   -- NEW = the row being inserted/updated
    RETURN NEW;                -- must return the (possibly modified) row
END;
$$;

-- ── Step 2: Attach to table ───────────────────────────────
CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees    -- fires before UPDATE
    FOR EACH ROW                  -- once per updated row
    EXECUTE FUNCTION set_updated_at();

-- Now every UPDATE automatically sets updated_at
UPDATE employees SET salary = 95000 WHERE employee_id = 1;
-- updated_at is automatically set — no application code needed

-- ── Audit log trigger ─────────────────────────────────────
CREATE TABLE employee_audit (
    audit_id    BIGSERIAL PRIMARY KEY,
    operation   CHAR(1)    NOT NULL,   -- I / U / D
    employee_id BIGINT,
    old_salary  DECIMAL,
    new_salary  DECIMAL,
    changed_by  TEXT       DEFAULT CURRENT_USER,
    changed_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION audit_employee_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_audit (operation, employee_id, new_salary)
        VALUES ('I', NEW.employee_id, NEW.salary);

    ELSIF TG_OP = 'UPDATE' THEN
        -- Only audit if salary actually changed
        IF OLD.salary IS DISTINCT FROM NEW.salary THEN
            INSERT INTO employee_audit (operation, employee_id, old_salary, new_salary)
            VALUES ('U', NEW.employee_id, OLD.salary, NEW.salary);
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO employee_audit (operation, employee_id, old_salary)
        VALUES ('D', OLD.employee_id, OLD.salary);
    END IF;

    RETURN NEW;  -- for AFTER triggers, return value is ignored
END;
$$;

CREATE TRIGGER trg_employee_audit
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION audit_employee_changes();

-- ── Prevent deletion of active employees ─────────────────
CREATE OR REPLACE FUNCTION prevent_active_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.is_active = true THEN
        RAISE EXCEPTION 'Cannot delete active employee %. Deactivate first.', OLD.employee_id;
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_no_active_delete
    BEFORE DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION prevent_active_deletion();

-- ── Drop trigger ──────────────────────────────────────────
DROP TRIGGER trg_employees_updated_at ON employees;`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Transactions",
    icon: "⇄",
    color: "#8B5CF6",
    desc: "ACID properties, isolation levels, deadlocks, savepoints, and advisory locks.",
    topics: [
      {
        n: "ACID, isolation levels & locking",
        tag: "TRANSACTION",
        desc: `A TRANSACTION is a unit of work that either fully succeeds or fully fails — there is no partial state.

ACID PROPERTIES:
• ATOMICITY: All operations in a transaction succeed or all are rolled back. No partial commits.
• CONSISTENCY: The database moves from one valid state to another. Constraints are enforced at commit time.
• ISOLATION: Concurrent transactions appear to execute serially. One transaction doesn't see uncommitted changes from another.
• DURABILITY: Once committed, data survives system crashes (written to WAL/redo log before commit returns).

ISOLATION LEVELS (from weakest to strongest):
• READ UNCOMMITTED: Sees dirty reads (uncommitted changes). Rarely used in practice. Not supported in PostgreSQL.
• READ COMMITTED (default in PG, MySQL): Sees only committed data. Prevents dirty reads. Allows non-repeatable reads (same SELECT can return different data within a transaction).
• REPEATABLE READ: Same SELECT returns same data throughout transaction. Prevents dirty and non-repeatable reads. PostgreSQL's RR also prevents phantom reads.
• SERIALIZABLE: Full isolation — transactions appear to execute one at a time. Slowest. Uses predicate locking in PostgreSQL.

LOCKING:
• ROW-LEVEL LOCKS: SELECT … FOR UPDATE locks specific rows. SELECT … FOR SHARE allows other readers but prevents updates.
• TABLE-LEVEL LOCKS: LOCK TABLE … IN mode. Rarely needed directly.
• DEADLOCK: T1 holds lock A, wants B. T2 holds lock B, wants A. Database detects and rolls back one transaction.`,
        code: `-- ── Basic transaction ────────────────────────────────────
BEGIN;
    UPDATE accounts SET balance = balance - 500 WHERE account_id = 1;
    UPDATE accounts SET balance = balance + 500 WHERE account_id = 2;
COMMIT;   -- both updates committed atomically
-- Or: ROLLBACK; -- undo both updates

-- ── Isolation level ───────────────────────────────────────
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    -- All reads within this transaction see the same snapshot
    SELECT balance FROM accounts WHERE account_id = 1;  -- snapshot taken here
    -- ... other work ...
    SELECT balance FROM accounts WHERE account_id = 1;  -- same result, even if others committed
COMMIT;

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    -- Strongest isolation — serialization errors possible, must retry
COMMIT;

-- ── Savepoints — partial rollback ─────────────────────────
BEGIN;
    INSERT INTO orders (customer_id, total) VALUES (1, 100);
    SAVEPOINT after_order;

    INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 99, 2);
    -- This fails (product 99 doesn't exist)

    ROLLBACK TO SAVEPOINT after_order;  -- undo only the failed insert
    -- The order insert is still in effect!

    INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 5, 2);
    RELEASE SAVEPOINT after_order;
COMMIT;

-- ── Explicit row locking ──────────────────────────────────
BEGIN;
    -- Lock the row for update — other transactions that try FOR UPDATE will WAIT
    SELECT * FROM accounts WHERE account_id = 1 FOR UPDATE;
    UPDATE accounts SET balance = balance - 500 WHERE account_id = 1;
COMMIT;

-- SKIP LOCKED — process queues without blocking
SELECT * FROM jobs
WHERE  status = 'PENDING'
ORDER  BY created_at
LIMIT  10
FOR UPDATE SKIP LOCKED;   -- skip rows already locked by other workers
-- Each worker gets a different batch — no contention!

-- ── Deadlock prevention — always lock in same order ────────
-- Safe: always lock account with lower ID first
BEGIN;
SELECT * FROM accounts WHERE account_id = LEAST(1, 2)   FOR UPDATE;
SELECT * FROM accounts WHERE account_id = GREATEST(1, 2) FOR UPDATE;
-- ...
COMMIT;

-- ── Advisory locks — application-level named locks ────────
SELECT pg_try_advisory_lock(12345);   -- returns true if acquired, false if not
-- Use for: distributed cron jobs (only one instance should run at a time)
SELECT pg_advisory_unlock(12345);`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Schema & Database Design",
    icon: "⬡",
    color: "#10B981",
    desc: "Schemas, sequences, domains, enums, normalisation, and best practices for database structure.",
    topics: [
      {
        n: "Schemas, sequences, enums, domains & types",
        tag: "SCHEMA",
        desc: `SCHEMA is a namespace within a database. It organises objects (tables, views, functions) into logical groups, preventing name collisions and controlling access.

A database can have many schemas. PostgreSQL's default schema is "public". Common usage:
• Separate schemas per application module (auth, orders, inventory)
• Separate schemas per tenant (multi-tenancy)
• Stage/landing schemas for ETL pipelines

SEQUENCE: A generator that produces unique integer values, typically used for primary keys. SERIAL / BIGSERIAL are shorthand for creating a sequence and defaulting a column to nextval(sequence). Use sequences directly when you need more control.

ENUM TYPE: A custom type with a fixed list of valid string values. More type-safe than VARCHAR with a CHECK constraint. Enums are ordered in PostgreSQL (you can ORDER BY an enum column). Adding values is safe; removing values requires a table rewrite.

DOMAIN: A user-defined type based on an existing type with additional constraints. Centralises validation logic — change the domain's constraint once, all columns using it are updated.

COMPOSITE TYPE: A type with multiple fields — like a row type. Used as function parameters or column types for complex embedded structures.`,
        code: `-- ── Schemas ───────────────────────────────────────────────
CREATE SCHEMA orders;
CREATE SCHEMA IF NOT EXISTS inventory;

-- Fully qualified object names
CREATE TABLE orders.order_lines (
    line_id    BIGSERIAL PRIMARY KEY,
    order_id   BIGINT NOT NULL
);

-- Set the search path (default schema for unqualified names)
SET search_path TO orders, inventory, public;

-- Grant schema access
GRANT USAGE  ON SCHEMA orders TO app_user;
GRANT CREATE ON SCHEMA orders TO app_admin;

-- ── Sequences ─────────────────────────────────────────────
CREATE SEQUENCE seq_order_number
    START    100000
    INCREMENT 1
    NO MAXVALUE
    CACHE 20;         -- cache 20 values in memory for performance

-- Use it
SELECT nextval('seq_order_number');  -- 100000
SELECT nextval('seq_order_number');  -- 100001
SELECT currval('seq_order_number');  -- current value in this session
SELECT lastval();                    -- last value returned by any sequence in session

ALTER SEQUENCE seq_order_number RESTART WITH 200000;  -- reset

-- Default column value
CREATE TABLE orders (
    order_id     BIGINT DEFAULT nextval('seq_order_number') PRIMARY KEY,
    order_number VARCHAR(20) GENERATED ALWAYS AS
                 ('ORD-' || LPAD(order_id::TEXT, 8, '0')) STORED
);

-- ── Enum types ────────────────────────────────────────────
CREATE TYPE order_status AS ENUM (
    'DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
);

CREATE TABLE orders (
    order_id  BIGSERIAL PRIMARY KEY,
    status    order_status NOT NULL DEFAULT 'PENDING'
);

-- Add a new value (safe, no table rewrite)
ALTER TYPE order_status ADD VALUE 'RETURNED' AFTER 'DELIVERED';

-- ── Domain — reusable constrained type ────────────────────
CREATE DOMAIN email_address AS VARCHAR(255)
    CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

CREATE DOMAIN positive_money AS DECIMAL(15, 2)
    CHECK (VALUE > 0);

CREATE DOMAIN percentage AS DECIMAL(5, 2)
    CHECK (VALUE BETWEEN 0 AND 100);

CREATE TABLE employees (
    employee_id BIGSERIAL    PRIMARY KEY,
    email       email_address  NOT NULL UNIQUE,   -- validates automatically
    salary      positive_money NOT NULL,
    commission  percentage
);`
      },
      {
        n: "Normalisation — 1NF, 2NF, 3NF, BCNF & denormalisation trade-offs",
        tag: "SCHEMA",
        desc: `Normalisation is the process of organising a database to reduce redundancy and improve data integrity. Each normal form (NF) builds on the previous.

FIRST NORMAL FORM (1NF): Each column holds atomic values (no arrays or lists in a cell). Each row is unique (has a primary key). Each column has a single type.

SECOND NORMAL FORM (2NF): Meets 1NF AND every non-key column is fully functionally dependent on the ENTIRE primary key. Eliminates partial dependencies. Relevant only for composite primary keys.

THIRD NORMAL FORM (3NF): Meets 2NF AND no non-key column depends on another non-key column (no transitive dependencies). Every non-key attribute depends only on the primary key.

BOYCE-CODD NORMAL FORM (BCNF): A stricter version of 3NF. Every determinant must be a candidate key. Eliminates anomalies 3NF misses in some multi-valued dependency scenarios.

DENORMALISATION: Intentionally violating normal forms for read performance. Adding redundant data (e.g., storing customer_name in orders table instead of joining) avoids expensive joins on hot read paths. Trade-off: read speed gained, write complexity added (must keep redundant data in sync).

RULE OF THUMB: Normalise first, denormalise only where profiling shows a real performance bottleneck.`,
        code: `-- ── BAD: Violates 1NF — multiple values in one column ────
-- orders: order_id | products (comma-separated) ← WRONG
-- '1001', 'Phone,Case,Charger'   ← can't index or query per product

-- GOOD: 1NF — one value per column
CREATE TABLE order_items (
    order_id    BIGINT,
    product_id  BIGINT,
    quantity    INT,
    PRIMARY KEY (order_id, product_id)
);

-- ── BAD: Violates 2NF — partial dependency ────────────────
-- order_items: order_id | product_id | quantity | product_name | category
-- product_name and category depend on product_id ALONE, not on (order_id, product_id)

-- GOOD: 2NF — move product info to its own table
CREATE TABLE products (
    product_id   BIGINT PRIMARY KEY,
    product_name VARCHAR(200),
    category     VARCHAR(100)
);
CREATE TABLE order_items (
    order_id    BIGINT REFERENCES orders,
    product_id  BIGINT REFERENCES products,   -- FK to products table
    quantity    INT,
    unit_price  DECIMAL(10,2),   -- snapshot at time of order (not from products table)
    PRIMARY KEY (order_id, product_id)
);

-- ── BAD: Violates 3NF — transitive dependency ─────────────
-- employees: emp_id | dept_id | dept_name | dept_location
-- dept_name and dept_location depend on dept_id (not directly on emp_id)
-- If department moves, must update every employee row ← anomaly

-- GOOD: 3NF — separate departments table
CREATE TABLE departments (
    dept_id      SERIAL PRIMARY KEY,
    dept_name    VARCHAR(100),
    location     VARCHAR(200)
);
CREATE TABLE employees (
    emp_id   BIGSERIAL PRIMARY KEY,
    dept_id  INT REFERENCES departments  -- no more dept_name here
);

-- ── Controlled denormalisation for performance ────────────
-- HIGH-TRAFFIC READ: "show order card with customer name"
-- Instead of joining orders → customers on every page load:
CREATE TABLE orders (
    order_id         BIGSERIAL PRIMARY KEY,
    customer_id      BIGINT  NOT NULL REFERENCES customers,
    customer_name    VARCHAR(200),  -- ← DENORMALISED (redundant copy)
    total_items      INT     DEFAULT 0,  -- ← DENORMALISED count
    total_amount     DECIMAL(12,2)
);
-- Maintain it via trigger when customers.name changes
-- Trade-off: much faster read, slightly complex write`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Performance & Query Optimisation",
    icon: "⚡",
    color: "#F97316",
    desc: "EXPLAIN ANALYZE, query plan reading, N+1, pagination, and common anti-patterns.",
    topics: [
      {
        n: "EXPLAIN ANALYZE — reading query plans & optimisation",
        tag: "PERFORMANCE",
        desc: `EXPLAIN shows the query plan (how the database intends to execute the query). EXPLAIN ANALYZE actually runs the query and shows actual vs estimated row counts and timings.

KEY PLAN NODES:
• Seq Scan: Full table scan — reads every row. Fine for small tables; bad on large tables without an index.
• Index Scan: Uses a B-tree index to find rows, then fetches from the heap. Fast for small result sets.
• Index Only Scan: Entire result satisfied from the index — never touches the heap. Fastest read possible.
• Bitmap Heap Scan: Uses index to build a bitmap of pages, then fetches those pages. Good for medium-sized result sets.
• Hash Join: Builds a hash table from one input, probes with the other. Good for large equi-joins.
• Merge Join: Sorts both inputs, merges. Good when both sides are already sorted (or have sorted indexes).
• Nested Loop: For each row of the outer, scans the inner. Good when outer is small and inner has an index.
• Sort: Sorts the result — expensive if it spills to disk (look for "Sort Method: external merge").
• Hash Aggregate: Builds a hash table for GROUP BY. Memory-intensive for high-cardinality groups.

KEY METRICS: rows (estimated vs actual — large divergence means stale statistics), width (bytes per row), cost (arbitrary units — relative comparison only), actual time, loops.`,
        code: `-- ── EXPLAIN ANALYZE ──────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT e.first_name, d.dept_name
FROM   employees e
JOIN   departments d ON e.department_id = d.dept_id
WHERE  e.salary > 80000
ORDER  BY e.salary DESC
LIMIT  20;

-- Sample output to read:
-- Limit  (cost=487.35..487.40 rows=20) (actual time=2.841..2.847 rows=20)
--   ->  Sort  (cost=487.35..490.60 rows=1300) (actual time=2.839..2.842 rows=20)
--         Sort Key: e.salary DESC
--         Sort Method: top-N heapsort  Memory: 26kB
--       ->  Hash Join  (cost=15.60..461.10 rows=1300) (actual time=0.413..2.721 rows=1300)
--             Hash Cond: (e.department_id = d.dept_id)
--             ->  Seq Scan on employees e  (cost=0....430.00 rows=1300 width=28)
--                   Filter: (salary > 80000)
--                   Rows Removed by Filter: 700
--             ->  Hash  (cost=9.40..9.40 rows=490 width=16)
--                   ->  Seq Scan on departments d
-- Planning Time: 0.456 ms
-- Execution Time: 2.891 ms

-- ── Diagnose: stale statistics ────────────────────────────
-- If estimated rows vs actual rows diverge greatly:
ANALYZE employees;              -- update statistics for one table
ANALYZE;                        -- update all tables (or via autovacuum)

-- ── Diagnose: identify missing index ─────────────────────
-- Look for "Seq Scan" on a large table with a filter
-- Then check if an index exists:
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'employees';

-- Create the missing index if needed
CREATE INDEX CONCURRENTLY idx_employees_salary ON employees(salary);

-- ── Common anti-patterns ──────────────────────────────────
-- BAD: Function on indexed column breaks index usage
SELECT * FROM employees WHERE UPPER(email) = 'ALICE@CO.COM';
-- FIX: CREATE INDEX idx_upper_email ON employees(UPPER(email));

-- BAD: Leading wildcard can't use B-tree index
SELECT * FROM products WHERE name LIKE '%widget%';
-- FIX: Use GIN full-text index or pg_trgm extension
CREATE INDEX idx_products_trgm ON products USING GIN (name gin_trgm_ops);

-- BAD: Implicit type cast breaks index
SELECT * FROM orders WHERE order_id = '1001';  -- '1001' is text, order_id is INT
-- FIX: Match types: WHERE order_id = 1001;

-- BAD: OR on different columns can't use either index efficiently
SELECT * FROM employees WHERE email = 'a@b.com' OR department = 'Eng';
-- FIX: UNION instead
SELECT * FROM employees WHERE email = 'a@b.com'
UNION
SELECT * FROM employees WHERE department = 'Eng';`
      },
      {
        n: "Pagination, N+1 problem & CTEs for complex queries",
        tag: "PERFORMANCE",
        desc: `PAGINATION: Two main approaches — OFFSET/LIMIT and keyset (cursor) pagination.

OFFSET pagination is simple but degrades with large offsets. To show page 1000 of 20 rows, the database must generate 20,000 rows and throw away 19,980. For large datasets this is very slow.

KEYSET PAGINATION (also called cursor pagination): Instead of skipping rows, filter based on the last seen value. WHERE id > last_seen_id is O(log n) via the primary key index. Much faster for deep pages. Limitation: random page jumps aren't possible.

N+1 QUERY PROBLEM: A loop that executes one query to get N items, then one query per item to get related data — N+1 queries total. Classic ORM anti-pattern. Fix by using JOIN or IN subquery to fetch all related data in one query.

CTE MATERIALISATION: In older PostgreSQL (< 12), CTEs are always materialised (evaluated once, result stored in memory). In PG 12+, the optimiser can inline a CTE. Use MATERIALIZED keyword to force materialisation (useful when the CTE is expensive and referenced multiple times).`,
        code: `-- ── OFFSET pagination (simple but slow for deep pages) ───
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 10000;
-- Must generate 10020 rows internally, throw away first 10000 ← SLOW!

-- ── Keyset pagination (fast at any depth) ─────────────────
-- Page 1:
SELECT order_id, created_at, total FROM orders
ORDER BY created_at DESC, order_id DESC
LIMIT 20;
-- → remember last row: created_at='2025-01-15', order_id=4500

-- Page 2 (using cursor):
SELECT order_id, created_at, total FROM orders
WHERE (created_at, order_id) < ('2025-01-15', 4500)   -- row value comparison
ORDER BY created_at DESC, order_id DESC
LIMIT 20;
-- O(log n) using index on (created_at, order_id) — fast regardless of depth

-- ── N+1 Problem ───────────────────────────────────────────
-- BAD (N+1): Get customers, then loop for each customer's orders
SELECT * FROM customers WHERE country = 'UK';  -- returns 500 customers
-- For each customer (in application code):
SELECT * FROM orders WHERE customer_id = ?;    -- 500 separate queries!
-- Total: 501 queries

-- GOOD (1 query with JOIN):
SELECT c.customer_id, c.customer_name,
       o.order_id, o.total, o.order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.country = 'UK';
-- 1 query, all data returned

-- GOOD (2 queries using IN — when join inflates rows):
SELECT * FROM customers WHERE country = 'UK';              -- query 1
SELECT * FROM orders WHERE customer_id IN (1, 2, 3, ...); -- query 2 (one for all)

-- ── CTE for complex multi-step analytics ──────────────────
WITH
-- Step 1: active customers in last 90 days
active_customers AS (
    SELECT DISTINCT customer_id
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
),
-- Step 2: their lifetime value
clv AS (
    SELECT
        o.customer_id,
        COUNT(DISTINCT o.order_id)          AS order_count,
        SUM(o.total)                        AS lifetime_value,
        AVG(o.total)                        AS avg_order_value,
        MAX(o.order_date)                   AS last_order_date
    FROM orders o
    INNER JOIN active_customers ac ON o.customer_id = ac.customer_id
    GROUP BY o.customer_id
),
-- Step 3: segment them
segmented AS (
    SELECT *,
        CASE
            WHEN lifetime_value >= 10000 THEN 'VIP'
            WHEN lifetime_value >= 1000  THEN 'Regular'
            ELSE 'Occasional'
        END AS segment
    FROM clv
)
SELECT s.segment, COUNT(*), AVG(s.lifetime_value), AVG(s.avg_order_value)
FROM segmented s
GROUP BY s.segment
ORDER BY AVG(s.lifetime_value) DESC;`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Advanced SQL Features",
    icon: "◈",
    color: "#A855F7",
    desc: "JSON/JSONB queries, full-text search, GENERATE_SERIES, lateral joins, and useful extensions.",
    topics: [
      {
        n: "JSON/JSONB, ARRAY types & full-text search",
        tag: "ADVANCED",
        desc: `PostgreSQL has world-class JSON support. JSONB (binary JSON) stores data in a decomposed binary format — it's indexable and supports efficient queries with GIN indexes. Regular JSON stores the raw text and preserves whitespace and key order.

USE JSONB WHEN:
• You need to query into the JSON structure (e.g., find by a nested field).
• You need indexing on JSON keys.
• Data is written once but read many times.

USE JSON (raw) WHEN:
• You only need to store and retrieve the blob, not query into it.
• You need to preserve key order or exact formatting.

FULL-TEXT SEARCH: PostgreSQL has built-in full-text search using tsvector (document representation) and tsquery (search expression). GIN indexes make FTS queries fast. For more advanced needs, consider pg_trgm (trigram similarity) for "fuzzy" search.`,
        code: `-- ── JSONB operations ──────────────────────────────────────
CREATE TABLE events (
    event_id   BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100),
    payload    JSONB,          -- use JSONB for queryable JSON
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO events (event_type, payload) VALUES (
    'order_placed',
    '{"orderId": "ORD-001", "customer": {"id": 42, "tier": "VIP"},
      "items": [{"sku": "A1", "qty": 2}, {"sku": "B3", "qty": 1}],
      "total": 199.99}'
);

-- ── JSONB operators ───────────────────────────────────────
-- -> returns JSON,  ->> returns text
SELECT payload -> 'customer'          AS customer_obj,   -- {"id": 42, "tier": "VIP"}
       payload -> 'customer' ->> 'id' AS customer_id,    -- "42"
       (payload ->> 'total')::DECIMAL AS order_total,    -- 199.99
       payload -> 'items' -> 0        AS first_item       -- {"sku": "A1", "qty": 2}
FROM   events;

-- @> contains operator (uses GIN index)
SELECT * FROM events
WHERE payload @> '{"customer": {"tier": "VIP"}}';   -- events from VIP customers

-- ? key exists
SELECT * FROM events WHERE payload ? 'discount';   -- events that have a discount field

-- #> path operator
SELECT payload #> '{customer, tier}' FROM events;  -- navigate nested path
SELECT payload #>> '{items, 0, sku}' FROM events;  -- first item's sku

-- ── GIN index for JSONB ───────────────────────────────────
CREATE INDEX idx_events_payload ON events USING GIN (payload);
-- Now @> queries are fast even on millions of rows

-- ── ARRAY type ────────────────────────────────────────────
CREATE TABLE products (
    product_id BIGSERIAL PRIMARY KEY,
    name       VARCHAR(200),
    tags       TEXT[],          -- array of text
    prices     DECIMAL(10,2)[]  -- array of decimals
);

INSERT INTO products (name, tags, prices)
VALUES ('Widget', ARRAY['electronics','gadget','popular'], ARRAY[9.99, 14.99, 19.99]);

-- Array operators
SELECT * FROM products WHERE 'electronics' = ANY(tags);  -- contains value
SELECT * FROM products WHERE tags @> ARRAY['electronics','gadget'];  -- contains all
SELECT * FROM products WHERE tags && ARRAY['popular', 'sale'];       -- overlaps

-- Unnest array to rows
SELECT product_id, UNNEST(tags) AS tag FROM products;

-- ── Full-text search ──────────────────────────────────────
-- Create tsvector column
ALTER TABLE products ADD COLUMN search_vec TSVECTOR;
UPDATE products SET search_vec = to_tsvector('english', name || ' ' || description);
CREATE INDEX idx_products_fts ON products USING GIN (search_vec);

-- Search
SELECT name, ts_rank(search_vec, query) AS rank
FROM products, to_tsquery('english', 'widget & pro') AS query
WHERE search_vec @@ query
ORDER BY rank DESC;

-- pg_trgm for fuzzy / "did you mean?" search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_trgm ON products USING GIN (name gin_trgm_ops);
SELECT name, similarity(name, 'widgit') AS sim   -- note typo
FROM products
WHERE name % 'widgit'                            -- similarity threshold (default 0.3)
ORDER BY sim DESC;`
      },
      {
        n: "GENERATE_SERIES, LATERAL JOIN & useful utility queries",
        tag: "ADVANCED",
        desc: `GENERATE_SERIES is one of PostgreSQL's most useful functions. It generates a set of values — integers, timestamps, or dates — filling a range with regular intervals. Essential for creating date dimension tables, filling gaps in time-series data, and generating test data.

LATERAL JOIN: A LATERAL subquery can reference columns from tables to its left in the FROM clause — like a correlated subquery but returning multiple rows. Think of it as "for each row in the left table, execute this subquery". Used for top-N per group (cleaner than ROW_NUMBER CTE), and calling set-returning functions per row.

USEFUL UTILITY QUERIES: Every SQL developer needs a toolkit of handy queries for exploring database structure, finding duplicates, detecting gaps in sequences, and generating reports.`,
        code: `-- ── GENERATE_SERIES — date range ─────────────────────────
-- Every day of 2025
SELECT generate_series(
    '2025-01-01'::DATE,
    '2025-12-31'::DATE,
    '1 day'::INTERVAL
)::DATE AS day;

-- Find days with no orders (gap detection)
SELECT day::DATE AS missing_date
FROM   generate_series('2025-01-01', '2025-03-31', '1 day') AS day
LEFT JOIN orders o ON o.order_date = day::DATE
WHERE  o.order_id IS NULL;

-- Fill time-series gaps with 0s (hourly revenue for last 24 hours)
SELECT
    hours.hour,
    COALESCE(SUM(o.total), 0) AS revenue
FROM generate_series(
    NOW() - INTERVAL '24 hours',
    NOW(),
    '1 hour'::INTERVAL
) AS hours(hour)
LEFT JOIN orders o ON DATE_TRUNC('hour', o.created_at) = hours.hour
GROUP BY hours.hour
ORDER BY hours.hour;

-- ── LATERAL JOIN — top 3 orders per customer ─────────────
SELECT c.customer_name, top_orders.*
FROM customers c
CROSS JOIN LATERAL (
    SELECT order_id, total, order_date
    FROM orders o
    WHERE o.customer_id = c.customer_id   -- references c from outer query
    ORDER BY total DESC
    LIMIT 3
) AS top_orders;

-- ── LATERAL with a function call ──────────────────────────
SELECT e.employee_id, team_info.*
FROM employees e
CROSS JOIN LATERAL get_team_info(e.department_id) AS team_info;

-- ── Useful utility queries ────────────────────────────────
-- Find duplicate emails
SELECT email, COUNT(*) AS dupes
FROM employees
GROUP BY email
HAVING COUNT(*) > 1;

-- Find tables with most rows
SELECT relname, n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC LIMIT 20;

-- Find largest tables by disk size
SELECT
    relname,
    pg_size_pretty(pg_total_relation_size(oid)) AS total_size,
    pg_size_pretty(pg_relation_size(oid))        AS table_size,
    pg_size_pretty(pg_indexes_size(oid))         AS index_size
FROM pg_class WHERE relkind = 'r'
ORDER BY pg_total_relation_size(oid) DESC LIMIT 20;

-- Find missing indexes (sequential scans on large tables)
SELECT relname, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100 AND n_live_tup > 10000
ORDER BY seq_tup_read DESC;

-- Find slow queries (requires pg_stat_statements)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 10;`
      },
    ]
  },
];

// ── Tag palette ───────────────────────────────────────────────
const TAG_META = {
  DDL:         { bg: "#0E3A4A", text: "#06B6D4", border: "#0C4A5E" },
  DML:         { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  DQL:         { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  WINDOW:      { bg: "#2D1A4A", text: "#A855F7", border: "#3A2060" },
  INDEX:       { bg: "#3A1F0A", text: "#F97316", border: "#4A2A0E" },
  VIEW:        { bg: "#0E3A4A", text: "#06B6D4", border: "#0C4A5E" },
  FUNCTION:    { bg: "#3A1A2E", text: "#EC4899", border: "#4A2040" },
  PROCEDURE:   { bg: "#3A1A2E", text: "#EC4899", border: "#4A2040" },
  TRIGGER:     { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  TRANSACTION: { bg: "#2D1A4A", text: "#8B5CF6", border: "#3A2060" },
  SCHEMA:      { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  PERFORMANCE: { bg: "#3A1F0A", text: "#F97316", border: "#4A2A0E" },
  ADVANCED:    { bg: "#2D1A4A", text: "#A855F7", border: "#3A2060" },
};

export default function SQLReference() {
  return (
    <RevisionNotesLayout
      pageKey="sql"
      title="SQL Reference"
      subtitle="Complete SQL reference from DDL to advanced features with PostgreSQL examples."
      categoryIcon="🗄️"
      categoryColor="#3B82F6"
      sections={SECTIONS}
      tagMeta={TAG_META}
    />
  );
}

export { SECTIONS };
