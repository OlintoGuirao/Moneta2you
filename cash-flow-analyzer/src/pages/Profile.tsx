import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, ShieldCheck, Trash2 } from "lucide-react";

const PERMISSIONS = [
  { value: "view", label: "Só ver" },
  { value: "edit", label: "Ver e editar" },
];

const Profile: React.FC = () => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentUser = auth.currentUser;
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, "financeUsers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "categories"),
      where("user", "==", currentUser.email)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => doc.data().name));
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (users.some(u => u.email === email)) {
        setError("Usuário já adicionado.");
        setLoading(false);
        return;
      }
      await addDoc(collection(db, "financeUsers"), {
        email,
        permission,
        owner: currentUser?.email
      });
      setEmail("");
      setPermission("view");
    } catch (err) {
      setError("Erro ao adicionar usuário.");
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    await deleteDoc(doc(db, "financeUsers", id));
  };

  const handlePermissionChange = async (id: string, newPermission: string) => {
    await updateDoc(doc(db, "financeUsers", id), { permission: newPermission });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await addDoc(collection(db, "categories"), { name: newCategory.trim(), user: currentUser?.email });
      setNewCategory("");
    } catch {
      // feedback de erro opcional
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 py-10 px-2">
      <div className="bg-white rounded-2xl shadow-xl p-0 w-full max-w-2xl border border-blue-100 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center py-8 px-6 border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
          <Users className="w-12 h-12 text-blue-600 mb-2" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-blue-700 mb-1">Gerenciar Acesso</h2>
          <p className="text-gray-500 text-center text-sm max-w-md">Adicione, remova e defina permissões de acesso para outros usuários do seu Controle Financeiro.</p>
        </div>
        {/* Formulário de adicionar usuário */}
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-2 px-6 py-6 bg-blue-50 rounded-b-2xl border-b border-blue-100">
          <input
            type="email"
            placeholder="E-mail do usuário"
            className="border px-3 py-2 rounded-lg w-full text-black bg-white focus:ring-2 ring-blue-200 shadow-sm"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <select
            className="border px-2 py-2 rounded-lg text-black bg-white focus:ring-2 ring-blue-200 shadow-sm"
            value={permission}
            onChange={e => setPermission(e.target.value)}
          >
            {PERMISSIONS.map((p, idx) => (
              <option key={p.value + '-' + idx} value={p.value}>{p.label}</option>
            ))}
          </select>
          <Button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md">
            <UserPlus className="w-4 h-4" /> Adicionar
          </Button>
        </form>
        {error && <div className="text-red-500 mb-4 text-center animate-shake px-6">{error}</div>}
        {/* Lista de usuários */}
        <div className="px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {users.length === 0 && (
            <div className="col-span-2 text-center text-gray-400 py-8">Nenhum usuário adicionado ainda.</div>
          )}
          {users.map(user => (
            <div key={user.id} className="flex flex-col gap-3 bg-gray-50 rounded-xl p-5 shadow group transition hover:shadow-lg border border-blue-50 relative">
              <div className="flex items-center gap-3">
                <img
                  src={`https://ui-avatars.com/api/?name=${user.email}`}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border"
                />
                <div className="flex-1">
                  <span className="text-black font-semibold block truncate">{user.email}</span>
                  <span className="text-xs text-gray-400">{user.permission === 'edit' ? 'Pode editar' : 'Só visualiza'}</span>
                </div>
                {user.permission === 'edit' && <ShieldCheck className="w-5 h-5 text-green-600" title="Pode editar" />}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <select
                  className="border px-2 py-1 rounded-lg text-black bg-white focus:ring-2 ring-blue-200 shadow-sm"
                  value={user.permission}
                  onChange={e => handlePermissionChange(user.id, e.target.value)}
                >
                  {PERMISSIONS.map((p, idx) => (
                    <option key={p.value + '-' + idx} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <Button variant="destructive" onClick={() => handleRemove(user.id)} className="px-3 py-1 rounded-lg font-semibold flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
        {/* Nova seção: categorias */}
        <div className="px-6 py-6 border-b border-blue-100">
          <h3 className="text-lg font-bold mb-2">Categorias Personalizadas</h3>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Nova categoria"
              className="border px-3 py-2 rounded-lg text-black bg-gray-50 focus:ring-2 ring-blue-200"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              required
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md">Adicionar</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, idx) => (
              <span key={cat + idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{cat}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 