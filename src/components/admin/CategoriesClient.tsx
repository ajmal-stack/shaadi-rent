"use client";

import { useState, useMemo, useTransition } from "react";
import { FolderOpen, Plus, X, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import { AdminSearch } from "./AdminSearch";
import { toggleCategoryActive, createCategory, updateCategory } from "@/app/(admin)/admin/categories/actions";
import type { Category, GenderType } from "@/types/database";

interface CategoryWithCount extends Category {
  outfit_count: number;
}

const GENDER_LABELS: Record<GenderType, string> = {
  bride: "👰 Bride",
  groom: "🤵 Groom",
  unisex: "🎭 Unisex",
};

interface CategoriesClientProps {
  initialCategories: CategoryWithCount[];
}

type FormState = {
  name: string;
  gender_type: GenderType;
  description: string;
};

const DEFAULT_FORM: FormState = { name: "", gender_type: "bride", description: "" };

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState<CategoryWithCount[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.includes(q)
    );
  }, [categories, search]);

  async function handleToggle(id: string, currentActive: boolean) {
    startTransition(async () => {
      const result = await toggleCategoryActive(id, !currentActive);
      if (result.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_active: !currentActive } : c))
        );
        toast.success(`Category ${!currentActive ? "activated" : "deactivated"}.`);
      } else {
        toast.error(result.error ?? "Failed.");
      }
    });
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    startTransition(async () => {
      const result = await createCategory({
        name: form.name,
        gender_type: form.gender_type,
        description: form.description || undefined,
      });
      if (result.success) {
        toast.success("Category created successfully.");
        setShowCreateForm(false);
        setForm(DEFAULT_FORM);
        // Optimistic — server will revalidate
        const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        setCategories((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: form.name,
            slug,
            gender_type: form.gender_type,
            description: form.description || null,
            image_url: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            outfit_count: 0,
          },
        ]);
      } else {
        toast.error(result.error ?? "Failed to create.");
      }
    });
  }

  async function handleUpdate(id: string) {
    if (!form.name.trim()) return;
    startTransition(async () => {
      const result = await updateCategory(id, {
        name: form.name,
        gender_type: form.gender_type,
        description: form.description || undefined,
      });
      if (result.success) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, name: form.name, gender_type: form.gender_type, description: form.description || null }
              : c
          )
        );
        toast.success("Category updated.");
        setEditingId(null);
        setForm(DEFAULT_FORM);
      } else {
        toast.error(result.error ?? "Failed to update.");
      }
    });
  }

  function startEdit(cat: CategoryWithCount) {
    setEditingId(cat.id);
    setForm({ name: cat.name, gender_type: cat.gender_type, description: cat.description ?? "" });
    setShowCreateForm(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminSearch value={search} onChange={setSearch} placeholder="Search categories…" className="sm:w-64" />
        <button
          type="button"
          onClick={() => { setShowCreateForm(true); setEditingId(null); setForm(DEFAULT_FORM); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
        >
          <Plus size={15} />
          New Category
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-900 text-sm">Create New Category</h3>
            <button type="button" onClick={() => setShowCreateForm(false)} className="text-stone-400 hover:text-stone-700">
              <X size={16} />
            </button>
          </div>
          <CategoryForm form={form} setForm={setForm} />
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={isPending || !form.name.trim()}
              onClick={handleCreate}
              className="px-4 py-2 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Creating…" : "Create Category"}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-stone-600 text-sm hover:bg-stone-100 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState icon={FolderOpen} title="No categories found" description="Create your first category to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Slug</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Gender</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Outfits</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Active</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((cat) => (
                  <>
                    <tr key={cat.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-stone-900">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-stone-400 truncate max-w-[200px]">{cat.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded">{cat.slug}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-stone-600">{GENDER_LABELS[cat.gender_type]}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm font-semibold text-stone-700">{cat.outfit_count}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggle(cat.id, cat.is_active)}
                          className={`transition-colors disabled:opacity-50 ${cat.is_active ? "text-emerald-600 hover:text-emerald-800" : "text-stone-400 hover:text-stone-600"}`}
                        >
                          {cat.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {editingId === cat.id ? (
                          <button type="button" onClick={cancelEdit} className="text-xs text-stone-400 hover:text-stone-700">
                            Cancel
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                    {/* Edit form row */}
                    {editingId === cat.id && (
                      <tr key={`${cat.id}-edit`} className="bg-stone-50/80">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="space-y-3">
                            <CategoryForm form={form} setForm={setForm} />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={isPending || !form.name.trim()}
                                onClick={() => handleUpdate(cat.id)}
                                className="px-4 py-2 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
                              >
                                {isPending ? "Saving…" : "Save Changes"}
                              </button>
                              <button type="button" onClick={cancelEdit} className="px-4 py-2 text-stone-600 text-sm hover:bg-stone-200 rounded-xl transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryForm({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-stone-600 mb-1">
          Category Name *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Bridal Lehenga"
          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1">
          Gender Type *
        </label>
        <select
          value={form.gender_type}
          onChange={(e) => setForm((p) => ({ ...p, gender_type: e.target.value as GenderType }))}
          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
        >
          <option value="bride">Bride</option>
          <option value="groom">Groom</option>
          <option value="unisex">Unisex</option>
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-semibold text-stone-600 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Short description of this category"
          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
        />
      </div>
    </div>
  );
}
