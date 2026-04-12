"""
Sheet Music Sales Analyzer
===========================
Reads the Shopify orders export CSV and produces two output files:

  sheet_music_sales_full.csv   — all paid sheet music titles with all-time
                                  and past-year revenue/sales side by side
  sheet_music_top10_summary.csv — top 10 tables for all-time and past year

Usage:
    python3 analyze_sheet_music_sales.py

Make sure the orders CSV is in the same folder as this script, or update
INPUT_FILE below to point to the correct path.

"Past year" is defined as the 12 months ending on the date the script runs.
"""

import csv
import sys
from collections import defaultdict
from datetime import datetime, timezone, timedelta

csv.field_size_limit(10**7)

# ── Configuration ─────────────────────────────────────────────────────────────

INPUT_FILE  = 'orders_export_1 2.csv'
OUTPUT_FULL = 'sheet_music_sales_full.csv'
OUTPUT_TOP10 = 'sheet_music_top10_summary.csv'

# Products that are NOT sheet music — excluded from analysis
EXCLUDE_KEYWORDS = [
    'membership', 'lesson', 'warmup', 'hanon', 'arduino', 'led', 'theory',
    'missed lesson', 'intro piano', 'tip', 'store credit', 'ticket', 'we are one',
    'test concert', 'concert in', 'piano tribute - midi'
]

# ── Helpers ────────────────────────────────────────────────────────────────────

def is_sheet_music(name: str) -> bool:
    """Return True if the line-item name looks like a paid sheet music product."""
    name_lower = name.lower()
    return not any(kw in name_lower for kw in EXCLUDE_KEYWORDS)


def parse_created_at(s: str):
    """Parse a Shopify 'Created at' timestamp such as '2026-04-10 20:25:36 -0700'.
    Returns a timezone-aware datetime, or None on failure."""
    s = s.strip()
    if not s:
        return None
    try:
        dt = datetime.strptime(s[:19], '%Y-%m-%d %H:%M:%S')
        tz_part = s[20:].strip()            # e.g. "-0700"
        sign   = 1 if tz_part[0] == '+' else -1
        tz_h   = int(tz_part[1:3])
        tz_m   = int(tz_part[3:5])
        offset = timezone(timedelta(hours=sign * tz_h, minutes=sign * tz_m))
        return dt.replace(tzinfo=offset)
    except Exception:
        return None

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    # "Past year" cutoff: 12 months ago from today
    now = datetime.now(tz=timezone.utc)
    cutoff_date = now - timedelta(days=365)
    print(f"Analysing orders from all time, and past-year cutoff: {cutoff_date.date()}")

    # order_id → {'created_at': datetime|None, 'items': [(name, actual_price)]}
    orders = {}

    with open(INPUT_FILE, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        headers = next(reader)

        name_idx            = headers.index('Name')
        created_at_idx      = headers.index('Created at')
        lineitem_name_idx   = headers.index('Lineitem name')
        lineitem_price_idx  = headers.index('Lineitem price')
        lineitem_disc_idx   = headers.index('Lineitem discount')

        for row in reader:
            if len(row) <= lineitem_name_idx:
                continue

            order_id      = row[name_idx].strip()
            lineitem_name = row[lineitem_name_idx].strip()

            # First row for each order carries the timestamp
            if order_id not in orders:
                orders[order_id] = {
                    'created_at': parse_created_at(row[created_at_idx]),
                    'items': []
                }

            try:
                item_price = float(row[lineitem_price_idx].strip() or 0)
            except ValueError:
                item_price = 0.0

            try:
                item_disc = float(row[lineitem_disc_idx].strip() or 0)
            except ValueError:
                item_disc = 0.0

            actual_price = item_price - item_disc

            if lineitem_name and is_sheet_music(lineitem_name) and actual_price > 0:
                orders[order_id]['items'].append((lineitem_name, actual_price))

    # ── Aggregate ──────────────────────────────────────────────────────────────

    alltime_revenue  = defaultdict(float)
    alltime_count    = defaultdict(int)
    pastyear_revenue = defaultdict(float)
    pastyear_count   = defaultdict(int)

    for data in orders.values():
        created_at  = data['created_at']
        is_pastyear = created_at is not None and created_at >= cutoff_date

        for name, price in data['items']:
            alltime_revenue[name]  += price
            alltime_count[name]    += 1
            if is_pastyear:
                pastyear_revenue[name] += price
                pastyear_count[name]   += 1

    sorted_alltime  = sorted(alltime_revenue.items(),  key=lambda x: x[1], reverse=True)
    sorted_pastyear = sorted(pastyear_revenue.items(), key=lambda x: x[1], reverse=True)
    pastyear_rank   = {t: i + 1 for i, (t, _) in enumerate(sorted_pastyear)}

    # ── Print summary ──────────────────────────────────────────────────────────

    print(f"\nAll-time : {len(sorted_alltime)} titles | "
          f"${sum(r for _,r in sorted_alltime):,.2f} revenue | "
          f"{sum(alltime_count.values())} sales")
    print(f"Past year: {len(sorted_pastyear)} titles | "
          f"${sum(r for _,r in sorted_pastyear):,.2f} revenue | "
          f"{sum(pastyear_count.values())} sales")

    print("\nTop 10 All-Time:")
    for i, (t, r) in enumerate(sorted_alltime[:10], 1):
        print(f"  {i:>2}. {t}: ${r:,.2f} ({alltime_count[t]} sales)")

    print(f"\nTop 10 Past Year (since {cutoff_date.date()}):")
    for i, (t, r) in enumerate(sorted_pastyear[:10], 1):
        print(f"  {i:>2}. {t}: ${r:,.2f} ({pastyear_count[t]} sales)")

    # ── Write full CSV ─────────────────────────────────────────────────────────

    with open(OUTPUT_FULL, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'All-Time Rank', 'Title',
            'All-Time Revenue (USD)', 'All-Time Sales', 'All-Time Avg Price',
            'Past Year Revenue (USD)', 'Past Year Sales', 'Past Year Avg Price',
            'Past Year Rank'
        ])
        for rank, (title, revenue) in enumerate(sorted_alltime, 1):
            at_count = alltime_count[title]
            at_avg   = revenue / at_count if at_count else 0

            py_rev   = pastyear_revenue.get(title, 0.0)
            py_count = pastyear_count.get(title, 0)
            py_avg   = py_rev / py_count if py_count else 0
            py_rank  = pastyear_rank.get(title, 'N/A')

            writer.writerow([
                rank, title,
                f"{revenue:.2f}", at_count, f"{at_avg:.2f}",
                f"{py_rev:.2f}", py_count, f"{py_avg:.2f}",
                py_rank
            ])

    print(f"\nFull CSV → {OUTPUT_FULL}")

    # ── Write top-10 summary CSV ───────────────────────────────────────────────

    with open(OUTPUT_TOP10, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        writer.writerow(['=== TOP 10 ALL-TIME (by Revenue) ==='])
        writer.writerow(['Rank', 'Title', 'Total Revenue (USD)', 'Number of Sales', 'Avg Price'])
        for i, (title, revenue) in enumerate(sorted_alltime[:10], 1):
            count = alltime_count[title]
            writer.writerow([i, title, f"{revenue:.2f}", count, f"{revenue/count:.2f}"])

        writer.writerow([])
        writer.writerow([f'=== TOP 10 PAST YEAR {cutoff_date.date()} to {now.date()} (by Revenue) ==='])
        writer.writerow(['Rank', 'Title', 'Revenue (USD)', 'Number of Sales', 'Avg Price'])
        for i, (title, revenue) in enumerate(sorted_pastyear[:10], 1):
            count = pastyear_count[title]
            writer.writerow([i, title, f"{revenue:.2f}", count, f"{revenue/count:.2f}"])

    print(f"Top 10 CSV → {OUTPUT_TOP10}")


if __name__ == '__main__':
    main()
