import React, { useState } from "react";
import { auth, createUserWithEmailAndPassword } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, UserPlus } from "lucide-react";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess("Cadastro realizado com sucesso! Redirecionando...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError("Erro ao cadastrar. " + (err?.message || ""));
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-blue-200 animate-fade-in"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/logo192.png" alt="Logo" className="w-16 h-16 mb-2" />
          <h2 className="text-3xl font-extrabold text-blue-700 mb-1">Criar Conta</h2>
          <p className="text-gray-500 text-center text-sm">Preencha os campos para se cadastrar.</p>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700">E-mail</label>
          <div className="flex items-center border rounded px-3 py-2 bg-gray-50 focus-within:ring-2 ring-blue-200">
            <Mail className="w-5 h-5 text-blue-400 mr-2" />
            <input
              type="email"
              className="w-full bg-transparent outline-none text-black"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Digite seu e-mail"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700">Senha</label>
          <div className="flex items-center border rounded px-3 py-2 bg-gray-50 focus-within:ring-2 ring-blue-200">
            <Lock className="w-5 h-5 text-blue-400 mr-2" />
            <input
              type="password"
              className="w-full bg-transparent outline-none text-black"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Digite sua senha"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700">Confirmar Senha</label>
          <div className="flex items-center border rounded px-3 py-2 bg-gray-50 focus-within:ring-2 ring-blue-200">
            <Lock className="w-5 h-5 text-blue-400 mr-2" />
            <input
              type="password"
              className="w-full bg-transparent outline-none text-black"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirme sua senha"
            />
          </div>
        </div>
        {error && <div className="mb-4 text-red-500 text-sm text-center animate-shake">{error}</div>}
        {success && <div className="mb-4 text-green-600 text-sm text-center animate-fade-in">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <UserPlus className="w-5 h-5" />
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
        <button
          type="button"
          className="w-full mt-3 bg-white border border-blue-600 text-blue-700 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-50 transition shadow-sm"
          onClick={() => navigate('/login')}
        >
          Já tenho conta
        </button>
        <div className="mt-6 text-center text-xs text-gray-400">© {new Date().getFullYear()} Controle Financeiro</div>
      </form>
    </div>
  );
};

export default Register; 