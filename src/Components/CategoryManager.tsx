import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_URL } from '../config';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

const COMMON_ICONS = ['🛒', '🍽️', '🚗', '💡', '🏠', '⚕️', '🎮', '🛍️', '💼', '💻', '✈️', '🎬', '📚', '🏋️', '🎵', '🍕', '☕', '🎨', '🐕', '🚌'];
const COMMON_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#06B6D4'];

export function CategoryManager() {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '📊',
    color: '#3B82F6',
    parentId: ''
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCategories(data.sort((a: Category, b: Category) => a.sortOrder - b.sortOrder));
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const url = editingId 
        ? `${API_URL}/categories/${editingId}`
        : `${API_URL}/categories`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          sortOrder: editingId ? undefined : categories.length
        })
      });

      if (response.ok) {
        resetForm();
        loadCategories();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      icon: category.icon || '📊',
      color: category.color || '#3B82F6',
      parentId: category.parentId || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria?')) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadCategories();
      } else {
        const data = await response.json();
        alert(data.error || 'Impossibile eliminare la categoria');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', icon: '📊', color: '#3B82F6', parentId: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDragStart = (categoryId: string) => {
    setDraggedItem(categoryId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = categories.findIndex(c => c.id === draggedItem);
    const targetIndex = categories.findIndex(c => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);

    // Update sortOrder
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      sortOrder: index
    }));

    setCategories(updatedCategories);

    // Save to backend
    try {
      const token = await getToken();
      await fetch(`${API_URL}/categories/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categories: updatedCategories.map(c => ({ id: c.id, sortOrder: c.sortOrder }))
        })
      });
    } catch (error) {
      console.error('Error reordering categories:', error);
      loadCategories(); // Reload on error
    }

    setDraggedItem(null);
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestione Categorie</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Annulla' : '+ Nuova Categoria'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-semibold">
            {editingId ? 'Modifica Categoria' : 'Nuova Categoria'}
          </h3>

          <div>
            <label htmlFor="category-name" className="block text-sm font-medium mb-2">Nome *</label>
            <input
              id="category-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Es. Spese mediche"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category-icon" className="block text-sm font-medium mb-2">Icona</label>
              <div className="space-y-2">
                <input
                  id="category-icon"
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-2xl text-center"
                  maxLength={2}
                />
                <div className="flex flex-wrap gap-2">
                  {COMMON_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`text-2xl p-2 rounded hover:bg-gray-100 ${
                        formData.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="category-color" className="block text-sm font-medium mb-2">Colore</label>
              <div className="space-y-2">
                <input
                  id="category-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border rounded-lg cursor-pointer"
                />
                <div className="flex flex-wrap gap-2">
                  {COMMON_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full ${
                        formData.color === color ? 'ring-2 ring-gray-900 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {editingId ? 'Salva Modifiche' : 'Crea Categoria'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Annulla
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Le tue categorie</h3>
          <p className="text-sm text-gray-500">Trascina per riordinare</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nessuna categoria. Crea la tua prima categoria!
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                draggable
                onDragStart={() => handleDragStart(category.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(category.id)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-move ${
                  draggedItem === category.id
                    ? 'border-blue-500 bg-blue-50 opacity-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">⋮⋮</span>
                    <span className="text-2xl">{category.icon || '📊'}</span>
                  </div>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-gray-500">Ordine: {category.sortOrder}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  />
                  <button
                    onClick={() => handleEdit(category)}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    ✏️ Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    🗑️ Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
