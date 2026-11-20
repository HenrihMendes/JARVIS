"use client";
export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="btn btn-outline !min-h-11 print:hidden">Imprimir</button>;
}
