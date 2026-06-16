"use client";

import { useState } from "react";

const exampleCase = {
  title: "Caso NEWS2 - desconforto respiratório",
  protocol: "NEWS2",
  difficulty: "MEDIO",
  stem: "Paciente adulto chega ao pronto atendimento com dispneia, sonolência e febre.",
  vitalSigns: {
    "Frequência respiratória": "28 irpm",
    "SpO2": "90%",
    "Oxigênio suplementar": "Sim",
    "PA sistólica": "92 mmHg",
    "Frequência cardíaca": "118 bpm",
    "Temperatura": "38,5 ºC",
    "Consciência": "Confuso"
  },
  answerKey: {
    items: [
      { key: "fr", label: "Frequência respiratória", correctScore: 3, explanation: "Taquipneia importante." },
      { key: "spo2", label: "Saturação de oxigênio", correctScore: 3, explanation: "Hipoxemia." },
      { key: "oxigenio", label: "Uso de oxigênio suplementar", correctScore: 2, explanation: "Pontua por necessidade de oxigênio." },
      { key: "pa", label: "Pressão arterial sistólica", correctScore: 3, explanation: "Hipotensão." },
      { key: "fc", label: "Frequência cardíaca", correctScore: 2, explanation: "Taquicardia." },
      { key: "temperatura", label: "Temperatura", correctScore: 1, explanation: "Febre." },
      { key: "consciencia", label: "Nível de consciência", correctScore: 3, explanation: "Alteração neurológica." }
    ],
    totalScore: 17,
    riskLevel: "alto risco",
    expectedConduct: "Acionar avaliação imediata, monitorização e escalonamento conforme protocolo institucional.",
    explanation: "Caso de alto risco por instabilidade respiratória, hemodinâmica e alteração de consciência."
  }
};

export function AdminCaseForm() {
  const [json, setJson] = useState(JSON.stringify(exampleCase, null, 2));
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setStatus("");
    setLoading(true);
    try {
      const payload = JSON.parse(json);
      const response = await fetch("/api/admin/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Erro ao salvar caso.");
      setStatus(`Caso salvo com sucesso: ${data.case.title}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Cadastrar caso via JSON</h2>
      <p>
        Esta tela é uma forma rápida para importar seus casos. Depois dá para trocar por um formulário visual com campos separados.
      </p>
      <div className="field">
        <label>JSON do caso clínico</label>
        <textarea style={{ minHeight: 520, fontFamily: "monospace" }} value={json} onChange={(e) => setJson(e.target.value)} />
      </div>
      {status && <div className="alert">{status}</div>}
      <div className="actions">
        <button className="btn btn-primary" disabled={loading} onClick={save}>{loading ? "Salvando..." : "Salvar caso"}</button>
      </div>
    </div>
  );
}
