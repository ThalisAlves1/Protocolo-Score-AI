"use client";

import { useState } from "react";
import type { CaseForUi } from "@/lib/types";

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

type VitalSignRow = { name: string; value: string };
type AnswerKeyRow = { key: string; label: string; correctScore: number; explanation: string };

type AdminCaseFormProps = {
  cases: CaseForUi[];
};

function buildVitalSignRows(vitalSigns: Record<string, string | number | boolean | null>): VitalSignRow[] {
  return Object.entries(vitalSigns).map(([name, value]) => ({ name, value: String(value ?? "") }));
}

function buildVitalSignsObject(rows: VitalSignRow[]) {
  return rows.reduce<Record<string, string | number | boolean | null>>((acc, row) => {
    if (row.name.trim()) {
      acc[row.name.trim()] = row.value;
    }
    return acc;
  }, {});
}

function buildAnswerKeyPayload(items: AnswerKeyRow[]) {
  return items.map((item) => ({
    key: item.key.trim() || item.label.trim().toLowerCase().replace(/\s+/g, "_"),
    label: item.label,
    correctScore: Number(item.correctScore),
    explanation: item.explanation
  }));
}

export function AdminCaseForm({ cases }: AdminCaseFormProps) {
  const [title, setTitle] = useState(exampleCase.title);
  const [protocol, setProtocol] = useState<CaseForUi["protocol"]>(exampleCase.protocol);
  const [difficulty, setDifficulty] = useState<CaseForUi["difficulty"]>(exampleCase.difficulty);
  const [stem, setStem] = useState(exampleCase.stem);
  const [vitalSigns, setVitalSigns] = useState<VitalSignRow[]>(buildVitalSignRows(exampleCase.vitalSigns));
  const [answerItems, setAnswerItems] = useState<AnswerKeyRow[]>(
    exampleCase.answerKey.items.map((item) => ({
      key: item.key,
      label: item.label,
      correctScore: item.correctScore,
      explanation: item.explanation ?? ""
    }))
  );
  const [totalScore, setTotalScore] = useState(exampleCase.answerKey.totalScore);
  const [riskLevel, setRiskLevel] = useState(exampleCase.answerKey.riskLevel);
  const [expectedConduct, setExpectedConduct] = useState(exampleCase.answerKey.expectedConduct);
  const [explanation, setExplanation] = useState(exampleCase.answerKey.explanation);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetFromExample() {
    setTitle(exampleCase.title);
    setProtocol(exampleCase.protocol);
    setDifficulty(exampleCase.difficulty);
    setStem(exampleCase.stem);
    setVitalSigns(buildVitalSignRows(exampleCase.vitalSigns));
    setAnswerItems(
      exampleCase.answerKey.items.map((item) => ({
        key: item.key,
        label: item.label,
        correctScore: item.correctScore,
        explanation: item.explanation ?? ""
      }))
    );
    setTotalScore(exampleCase.answerKey.totalScore);
    setRiskLevel(exampleCase.answerKey.riskLevel);
    setExpectedConduct(exampleCase.answerKey.expectedConduct);
    setExplanation(exampleCase.answerKey.explanation);
    setStatus("");
    setEditingId(null);
  }

  async function save() {
    setStatus("");
    setLoading(true);

    const payload = {
      title: title.trim(),
      protocol,
      difficulty,
      stem: stem.trim(),
      vitalSigns: buildVitalSignsObject(vitalSigns),
      answerKey: {
        items: buildAnswerKeyPayload(answerItems),
        totalScore: Number(totalScore),
        riskLevel: riskLevel.trim(),
        expectedConduct: expectedConduct.trim(),
        explanation: explanation.trim()
      }
    };

    try {
      const url = editingId ? `/api/admin/cases/${editingId}` : "/api/admin/cases";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        let message = data.message || "Erro ao salvar caso.";
        if (data.errors) {
          const errors: string[] = [];
          const fieldErrors = data.errors.fieldErrors || {};
          for (const value of Object.values(fieldErrors)) {
            if (Array.isArray(value)) errors.push(...value.filter(Boolean));
          }
          if (data.errors.formErrors && Array.isArray(data.errors.formErrors)) {
            errors.push(...data.errors.formErrors.filter(Boolean));
          }
          if (errors.length) message += " " + errors.join(" ");
        }
        throw new Error(message);
      }

      setStatus(`Caso ${editingId ? "atualizado" : "salvo"} com sucesso: ${data.case.title}`);
      if (!editingId) {
        resetFromExample();
      } else {
        setEditingId(null);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function editCase(clinicalCase: CaseForUi) {
    setTitle(clinicalCase.title);
    setProtocol(clinicalCase.protocol);
    setDifficulty(clinicalCase.difficulty);
    setStem(clinicalCase.stem);
    setVitalSigns(buildVitalSignRows(clinicalCase.vitalSigns));
    setAnswerItems(
      clinicalCase.answerKey.items.map((item) => ({
        key: item.key,
        label: item.label,
        correctScore: item.correctScore,
        explanation: item.explanation ?? ""
      }))
    );
    setTotalScore(clinicalCase.answerKey.totalScore);
    setRiskLevel(clinicalCase.answerKey.riskLevel);
    setExpectedConduct(clinicalCase.answerKey.expectedConduct);
    setExplanation(clinicalCase.answerKey.explanation);
    setEditingId(clinicalCase.id);
    setStatus(`Editando caso: ${clinicalCase.title}`);
  }

  function updateVitalSign(index: number, field: keyof VitalSignRow, value: string) {
    setVitalSigns((current) => current.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)));
  }

  function updateAnswerItem(index: number, field: keyof AnswerKeyRow, value: string | number) {
    setAnswerItems((current) => current.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  }

  function addVitalSign() {
    setVitalSigns((current) => [...current, { name: "", value: "" }]);
  }

  function removeVitalSign(index: number) {
    setVitalSigns((current) => current.filter((_, idx) => idx !== index));
  }

  function addAnswerItem() {
    setAnswerItems((current) => [...current, { key: "", label: "", correctScore: 0, explanation: "" }]);
  }

  function removeAnswerItem(index: number) {
    setAnswerItems((current) => current.filter((_, idx) => idx !== index));
  }

  return (
    <div className="card">
      <h2>{editingId ? "Editar caso" : "Cadastrar caso"}</h2>
      <p>Use o formulário abaixo para criar ou atualizar casos sem precisar digitar JSON manualmente.</p>

      <div className="form">
        <div className="field">
          <label>Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do caso" />
        </div>

        <div className="field" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>Protocolo</label>
            <select value={protocol} onChange={(e) => setProtocol(e.target.value as CaseForUi["protocol"])}>
              <option value="NEWS2">NEWS2</option>
              <option value="MEOWS">MEOWS</option>
              <option value="PEWS">PEWS</option>
            </select>
          </div>
          <div>
            <label>Dificuldade</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as CaseForUi["difficulty"])}>
              <option value="FACIL">Fácil</option>
              <option value="MEDIO">Médio</option>
              <option value="DIFICIL">Difícil</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Contexto / história</label>
          <textarea value={stem} onChange={(e) => setStem(e.target.value)} placeholder="Descreva a situação clínica" />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Sinais vitais</h3>
            <button className="btn btn-secondary" type="button" onClick={addVitalSign}>Adicionar sinal</button>
          </div>
          {vitalSigns.map((row, index) => (
            <div key={index} className="field" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr auto", alignItems: "end" }}>
              <div>
                <label>Parâmetro</label>
                <input value={row.name} onChange={(e) => updateVitalSign(index, "name", e.target.value)} placeholder="Ex.: SpO2" />
              </div>
              <div>
                <label>Valor</label>
                <input value={row.value} onChange={(e) => updateVitalSign(index, "value", e.target.value)} placeholder="Ex.: 90%" />
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => removeVitalSign(index)} style={{ height: 42 }}>Remover</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Gabarito de pontuação</h3>
            <button className="btn btn-secondary" type="button" onClick={addAnswerItem}>Adicionar item</button>
          </div>
          {answerItems.map((item, index) => (
            <div key={index} className="field" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr auto", alignItems: "end" }}>
              <div>
                <label>Chave</label>
                <input value={item.key} onChange={(e) => updateAnswerItem(index, "key", e.target.value)} placeholder="Ex.: fr" />
              </div>
              <div>
                <label>Rótulo</label>
                <input value={item.label} onChange={(e) => updateAnswerItem(index, "label", e.target.value)} placeholder="Ex.: Frequência respiratória" />
              </div>
              <div>
                <label>Pontuação</label>
                <input
                  type="number"
                  value={item.correctScore}
                  onChange={(e) => updateAnswerItem(index, "correctScore", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => removeAnswerItem(index)} style={{ height: 42 }}>
                Remover
              </button>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Explicação</label>
                <textarea value={item.explanation} onChange={(e) => updateAnswerItem(index, "explanation", e.target.value)} placeholder="Descrição do critério" />
              </div>
            </div>
          ))}
        </div>

        <div className="field" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>Pontuação total</label>
            <input type="number" value={totalScore} onChange={(e) => setTotalScore(Number(e.target.value))} placeholder="17" />
          </div>
          <div>
            <label>Risco</label>
            <input value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} placeholder="Ex.: alto risco" />
          </div>
        </div>

        <div className="field">
          <label>Conduta esperada</label>
          <textarea value={expectedConduct} onChange={(e) => setExpectedConduct(e.target.value)} placeholder="Descreva a conduta esperada" />
        </div>

        <div className="field">
          <label>Explicação do caso</label>
          <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explique por que esta resposta é correta" />
        </div>

        {status && <div className="alert">{status}</div>}

        <div className="actions">
          <button className="btn btn-primary" disabled={loading} onClick={save}>
            {loading ? (editingId ? "Atualizando..." : "Salvando...") : editingId ? "Atualizar caso" : "Salvar caso"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={resetFromExample} disabled={loading} style={{ marginLeft: 12 }}>
            {editingId ? "Cancelar edição" : "Reiniciar formulário"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3>Últimos casos</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Protocolo</th>
              <th>Nível</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((clinicalCase) => (
              <tr key={clinicalCase.id}>
                <td>{clinicalCase.title}</td>
                <td>{clinicalCase.protocol}</td>
                <td>{clinicalCase.difficulty}</td>
                <td>
                  <button className="btn btn-secondary" type="button" onClick={() => editCase(clinicalCase)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
