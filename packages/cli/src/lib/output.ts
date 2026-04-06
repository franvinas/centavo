export function printJson(value: unknown) {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

export function printKeyValue(rows: Array<[string, string | number | null]>) {
  const width = rows.reduce((max, [key]) => Math.max(max, key.length), 0);

  for (const [key, value] of rows) {
    process.stdout.write(`${key.padEnd(width)}  ${value ?? ""}\n`);
  }
}

export function printTable(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
) {
  const normalizedRows = rows.map((row) =>
    row.map((cell) =>
      cell === null || cell === undefined ? "" : String(cell),
    ),
  );
  const widths = headers.map((header, index) =>
    Math.max(
      header.length,
      ...normalizedRows.map((row) => (row[index] ?? "").length),
    ),
  );

  const formatRow = (row: string[]) =>
    row.map((cell, index) => cell.padEnd(widths[index])).join("  ");

  process.stdout.write(formatRow(headers) + "\n");
  process.stdout.write(
    widths.map((width) => "-".repeat(width)).join("  ") + "\n",
  );

  for (const row of normalizedRows) {
    process.stdout.write(formatRow(row) + "\n");
  }
}

export function printSection(title: string) {
  process.stdout.write(`${title}\n`);
}
