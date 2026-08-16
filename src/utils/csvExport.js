function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  const escaped = text.replaceAll('"', '""');

  if (/[",\r\n]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

export function createCsv(rows, columns) {
  const headerRow = columns.map((column) =>
    escapeCsvValue(column.header)
  );

  const dataRows = rows.map((row) =>
    columns.map((column) =>
      escapeCsvValue(
        typeof column.accessor === "function"
          ? column.accessor(row)
          : row[column.accessor]
      )
    )
  );

  return [headerRow, ...dataRows]
    .map((cells) => cells.join(","))
    .join("\r\n");
}

export function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
