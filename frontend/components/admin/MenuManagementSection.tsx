'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Utensils, Search, Coffee, Leaf } from 'lucide-react';
import { api } from '../../lib/api';

interface MenuManagementSectionProps {
  adminMenu: any[];
  onRefresh: () => void;
}

export default function MenuManagementSection({
  adminMenu,
  onRefresh,
}: MenuManagementSectionProps) {
  // Category form state
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatNameAm, setNewCatNameAm] = useState('');

  // Menu Item form state
  const [newItemCatId, setNewItemCatId] = useState(adminMenu[0]?.id || '');
  const [newItemNameEn, setNewItemNameEn] = useState('');
  const [newItemNameAm, setNewItemNameAm] = useState('');
  const [newItemDescEn, setNewItemDescEn] = useState('');
  const [newItemDescAm, setNewItemDescAm] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(120);
  const [newItemFasting, setNewItemFasting] = useState(false);
  const [newItemStation, setNewItemStation] = useState<'KITCHEN' | 'BARISTA'>('KITCHEN');

  // Search & Filter state
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameEn) return;
    try {
      await api.fetchApi('/menu/categories', {
        method: 'POST',
        body: JSON.stringify({
          nameEn: newCatNameEn,
          nameAm: newCatNameAm || newCatNameEn,
          sortOrder: adminMenu.length + 1,
        }),
      });
      setNewCatNameEn('');
      setNewCatNameAm('');
      onRefresh();
      alert('Category created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete category and all its menu items?')) return;
    try {
      await api.fetchApi(`/menu/categories/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCatId = newItemCatId || adminMenu[0]?.id;
    if (!newItemNameEn || !targetCatId) return;
    try {
      await api.fetchApi('/menu/items', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: targetCatId,
          nameEn: newItemNameEn,
          nameAm: newItemNameAm || newItemNameEn,
          descriptionEn: newItemDescEn,
          descriptionAm: newItemDescAm || newItemDescEn,
          price: Number(newItemPrice),
          isFastingFriendly: newItemFasting,
          fulfillmentStation: newItemStation,
        }),
      });
      setNewItemNameEn('');
      setNewItemNameAm('');
      setNewItemDescEn('');
      setNewItemDescAm('');
      onRefresh();
      alert('Menu Item created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to add menu item');
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await api.fetchApi(`/menu/items/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-stone-800 pb-4">
        <h2 className="text-xl font-bold text-white">Menu & Catalog Management</h2>
        <p className="text-xs text-stone-400">Manage categories, dishes, fasting tags, and fulfillment stations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Management Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Category Name (English)</label>
                <input
                  type="text"
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  placeholder="e.g. Hot Drinks"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Category Name (Amharic)</label>
                <input
                  type="text"
                  value={newCatNameAm}
                  onChange={(e) => setNewCatNameAm(e.target.value)}
                  placeholder="e.g. ፍላጎት መጠጦች"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Add Category
              </button>
            </form>
          </div>

          {/* Existing Categories List */}
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-3 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200 border-b border-stone-800 pb-2">
              Active Categories ({adminMenu.length})
            </h3>

            <div className="flex flex-col gap-2">
              {adminMenu.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs text-stone-100">{cat.nameEn}</p>
                    <p className="text-[11px] text-stone-400">{cat.nameAm}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-900 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items Management Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Create New Menu Item</span>
            </h3>

            <form onSubmit={handleCreateMenuItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Select Category</label>
                <select
                  value={newItemCatId || adminMenu[0]?.id || ''}
                  onChange={(e) => setNewItemCatId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                  required
                >
                  {adminMenu.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameAm})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Fulfillment Station</label>
                <select
                  value={newItemStation}
                  onChange={(e) => setNewItemStation(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                >
                  <option value="KITCHEN">Kitchen Station</option>
                  <option value="BARISTA">Barista Station</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Item Name (English)</label>
                <input
                  type="text"
                  value={newItemNameEn}
                  onChange={(e) => setNewItemNameEn(e.target.value)}
                  placeholder="e.g. Ethiopian Special Macchiato"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Item Name (Amharic)</label>
                <input
                  type="text"
                  value={newItemNameAm}
                  onChange={(e) => setNewItemNameAm(e.target.value)}
                  placeholder="e.g. ኢትዮጵያ ስፔሻል ማኪያቶ"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Price (ETB)</label>
                <input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-300">
                  <input
                    type="checkbox"
                    checked={newItemFasting}
                    onChange={(e) => setNewItemFasting(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span>Fasting Friendly (የጾም)</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-300 mb-1">Food Composition & Description</label>
                <textarea
                  value={newItemDescEn}
                  onChange={(e) => setNewItemDescEn(e.target.value)}
                  placeholder="Ingredients and prep notes..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Create Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Category & Menu Items Catalog View */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-500" />
              <span>Menu Catalog & Items View</span>
            </h3>
            <p className="text-xs text-stone-400">
              Browse menu items organized inside each category
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
              <input
                type="text"
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                placeholder="Search items or categories..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600 w-48 sm:w-64"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
            >
              <option value="ALL">All Categories ({adminMenu.length})</option>
              {adminMenu.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameEn} ({cat.items?.length || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {adminMenu.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            No categories created yet. Create a category above to start adding menu items.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {adminMenu
              .filter((cat) => selectedCategoryFilter === 'ALL' || cat.id === selectedCategoryFilter)
              .map((category) => {
                const matchingItems = (category.items || []).filter((item: any) => {
                  if (!menuSearchQuery) return true;
                  const q = menuSearchQuery.toLowerCase();
                  return (
                    item.nameEn?.toLowerCase().includes(q) ||
                    item.nameAm?.toLowerCase().includes(q) ||
                    category.nameEn?.toLowerCase().includes(q) ||
                    category.nameAm?.toLowerCase().includes(q)
                  );
                });

                if (menuSearchQuery && matchingItems.length === 0) {
                  return null;
                }

                return (
                  <div key={category.id} className="flex flex-col gap-3">
                    {/* Category Header */}
                    <div className="flex items-center justify-between bg-stone-950/80 px-4 py-3 rounded-xl border border-stone-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-bold text-xs">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{category.nameEn}</span>
                            {category.nameAm && (
                              <span className="text-xs text-stone-400 font-normal">({category.nameAm})</span>
                            )}
                          </h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-semibold text-[11px] border border-stone-700">
                          {category.items?.length || 0} items
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-300 border border-stone-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Category</span>
                      </button>
                    </div>

                    {/* Items Grid inside Category */}
                    {matchingItems.length === 0 ? (
                      <div className="p-6 rounded-xl bg-stone-950/40 border border-dashed border-stone-800 text-center text-xs text-stone-500">
                        No menu items inside this category yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matchingItems.map((item: any) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between gap-3 shadow-md hover:border-stone-700 transition-colors"
                          >
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="font-bold text-xs text-stone-100">{item.nameEn}</h5>
                                  <p className="text-[11px] text-stone-400 font-medium">{item.nameAm}</p>
                                </div>
                                <span className="font-black text-amber-400 text-sm whitespace-nowrap">
                                  {item.price} ETB
                                </span>
                              </div>

                              {item.descriptionEn && (
                                <p className="text-[11px] text-stone-400 line-clamp-2 mt-1">
                                  {item.descriptionEn}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 mt-auto">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border ${
                                    item.fulfillmentStation === 'BARISTA'
                                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                                      : 'bg-blue-950 text-blue-300 border-blue-800'
                                  }`}
                                >
                                  {item.fulfillmentStation === 'BARISTA' ? (
                                    <Coffee className="w-3 h-3" />
                                  ) : (
                                    <Utensils className="w-3 h-3" />
                                  )}
                                  <span>{item.fulfillmentStation || 'KITCHEN'}</span>
                                </span>

                                {item.isFastingFriendly && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                                    <Leaf className="w-3 h-3" />
                                    <span>የጾም</span>
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-900 transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
