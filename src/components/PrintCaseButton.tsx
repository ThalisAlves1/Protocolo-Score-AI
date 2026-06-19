"use client";

import type { CaseForUi } from "@/lib/types";

export function PrintCaseButton({ clinicalCase }: { clinicalCase: CaseForUi }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-button-container">
      <button className="btn btn-secondary" onClick={handlePrint} title="Imprimir caso para usar fisicamente">
        📄 Imprimir
      </button>
    </div>
  );
}
