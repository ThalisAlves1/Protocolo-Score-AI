import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminSession } from "@/lib/adminAuth";

export default async function AdminPage() {
  if (await isAdminSession()) redirect("/admin/casos");

  return (
    <main className="container admin-page">
      <section className="admin-login-grid">
        <div className="card">
          <div className="kicker">Entrada administrativa</div>
          <h1>Entrar no painel admin</h1>
          <p>
            Acesse para cadastrar casos clínicos, revisar gabaritos e preparar testes para os alunos.
          </p>
          <div className="alert">
            
          </div>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
