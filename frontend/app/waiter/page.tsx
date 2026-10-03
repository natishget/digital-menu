'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  Plus,
  Minus,
  Send,
  Clock,
  KeyRound,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { logout, setCredentials } from '../../lib/store/slices/authSlice';
import { formatOrderTime, getRelativeTimeAgo } from '../../lib/formatTime';

export default function WaiterPosPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [activeTableOrders, setActiveTableOrders] = useState<any[]>([]);

  const [categories, setCategories] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadTables = useCallback(async () => {
    try {
      const res = await api.getTables();
      setTables(res || []);
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  }, []);

  const loadMenu = useCallback(async () => {
    try {
      const res = await api.getMenu(false, 'en');
      if (res && res.categories) setCategories(res.categories);
    } catch (err) {
      console.error('Error loading menu:', err);
    }
  }, []);

  useEffect(() => {
    if (!auth.accessToken && !auth.user) {
      setPinModalOpen(true);
    } else {
      loadTables();
      loadMenu();
    }
  }, [auth.accessToken, auth.user, loadTables, loadMenu]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    try {
      const res = await api.waiterPinLogin({ pin: pinInput });
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
      }
      dispatch(setCredentials(res));
      setPinModalOpen(false);
      loadTables();
      loadMenu();
    } catch (err: any) {
      setPinError(err.message || 'Invalid Waiter PIN');
    }
  };

  const handleSelectTable = async (tbl: any) => {
    setSelectedTable(tbl);
    setCartItems([]);
    try {
      const active = await api.getTableOrders(tbl.id);
      setActiveTableOrders(active || []);
    } catch (err) {
      console.error('Error loading active table orders:', err);
    }
  };

  const handleAddItemToWaiterCart = (item: any) => {
    const existingIndex = cartItems.findIndex((i) => i.menuItemId === item.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          menuItemId: item.id,
          nameEn: item.nameEn,
          price: item.price,
          quantity: 1,
          selectedModifierOptionIds: [],
        },
      ]);
    }
  };

  const handleUpdateCartQty = (idx: number, delta: number) => {
    const updated = [...cartItems];
    const newQty = updated[idx].quantity + delta;
    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else {
      updated[idx].quantity = newQty;
    }
    setCartItems(updated);
  };

  const handleFireWaiterOrder = async () => {
    if (!selectedTable || cartItems.length === 0) return;
    setSubmitting(true);
    try {
      await api.createWaiterOrder({
        tableId: selectedTable.id,
        items: cartItems.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          selectedModifierOptionIds: i.selectedModifierOptionIds || [],
        })),
      });

      setSuccessMsg(`Order fired to KDS for Table #${selectedTable.number}!`);
      setCartItems([]);
      setTimeout(() => setSuccessMsg(''), 4000);
      handleSelectTable(selectedTable);
    } catch (err: any) {
      alert(err.message || 'Failed to punch order');
    } finally {
      setSubmitting(false);
    }
  };

  const cartSubtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold shadow-md">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Waiter Tablet POS</h1>
            <p className="text-xs text-stone-400">
              Staff: <span className="text-amber-400 font-semibold">{auth.user?.name || 'Abebe (Waiter)'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTables}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 transition-colors"
            title="Refresh Tables"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              dispatch(logout());
              if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
              }
              router.push('/login');
            }}
            className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Column: Tables Grid (4 cols) */}
        <div className="lg:col-span-4 bg-stone-950 border-r border-stone-800 p-4 flex flex-col gap-4 overflow-y-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Select Dining Table
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {tables.map((tbl) => {
              const isSelected = selectedTable?.id === tbl.id;
              return (
                <button
                  key={tbl.id}
                  onClick={() => handleSelectTable(tbl)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                      : 'bg-stone-900 border-stone-800 hover:border-stone-700 text-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base">T-{tbl.number}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-950/70 text-stone-300 font-medium">
                      {tbl.effectiveServiceModel}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-stone-300 truncate">{tbl.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Quick Punch Menu (5 cols) */}
        <div className="lg:col-span-5 bg-stone-900/50 p-4 flex flex-col gap-4 overflow-y-auto border-r border-stone-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Quick Punch Menu Items
          </h2>

          {selectedTable ? (
            <div className="flex flex-col gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="flex flex-col gap-2">
                  <h3 className="text-xs font-bold text-amber-400 border-b border-stone-800 pb-1">
                    {cat.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.items?.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddItemToWaiterCart(item)}
                        className="p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-left flex flex-col justify-between gap-1 transition-all"
                      >
                        <span className="font-semibold text-xs text-stone-100">{item.name}</span>
                        <span className="font-bold text-xs text-amber-400">{item.price} ETB</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-stone-500 text-xs font-medium">
              Select a table from the left column to start punching items.
            </div>
          )}
        </div>

        {/* Right Column: Order Ticket & Active Table Orders (3 cols) */}
        <div className="lg:col-span-3 bg-stone-950 p-4 flex flex-col justify-between gap-4 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Current Ticket
              </h2>
              {selectedTable && (
                <span className="font-bold text-xs text-amber-400">
                  Table #{selectedTable.number}
                </span>
              )}
            </div>

            {successMsg && (
              <div className="my-3 p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs font-medium text-center">
                {successMsg}
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex flex-col gap-2 my-4">
              {cartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-stone-200">{item.nameEn}</p>
                    <p className="text-[10px] text-amber-400">{item.price * item.quantity} ETB</p>
                  </div>

                  <div className="flex items-center gap-2 bg-stone-950 px-2 py-1 rounded-lg border border-stone-800">
                    <button
                      onClick={() => handleUpdateCartQty(idx, -1)}
                      className="text-stone-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-white w-3 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateCartQty(idx, 1)}
                      className="text-stone-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <p className="text-xs text-stone-500 text-center py-4">
                  No items in current ticket. Click menu items to add.
                </p>
              )}
            </div>

            {/* Active Fired Orders for Selected Table */}
            {selectedTable && activeTableOrders && activeTableOrders.length > 0 && (
              <div className="mt-4 pt-3 border-t border-stone-800 flex flex-col gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Fired Orders ({activeTableOrders.length})</span>
                </h3>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {activeTableOrders.map((ord: any) => (
                    <div
                      key={ord.id}
                      className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-200">Order #{ord.orderNumber}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          {ord.status}
                        </span>
                      </div>

                      {ord.createdAt && (
                        <p className="text-[10px] font-medium text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500/80" />
                          <span>Fired: {formatOrderTime(ord.createdAt)} ({getRelativeTimeAgo(ord.createdAt)})</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-stone-800 pt-3 flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm font-extrabold">
              <span className="text-stone-400">Subtotal</span>
              <span className="text-amber-400">{cartSubtotal} ETB</span>
            </div>

            <button
              onClick={handleFireWaiterOrder}
              disabled={submitting || cartItems.length === 0 || !selectedTable}
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Fire Order to KDS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Waiter PIN Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Waiter PIN Auth</h3>
              <p className="text-xs text-stone-400 mt-0.5">Enter your 4-digit PIN code</p>
            </div>

            {pinError && (
              <p className="text-xs font-medium text-red-400 bg-red-950/80 px-3 py-1.5 rounded-xl border border-red-800">
                {pinError}
              </p>
            )}

            <form onSubmit={handlePinSubmit} className="w-full flex flex-col gap-4">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-2xl font-mono tracking-[0.8em] py-3 rounded-xl bg-stone-950 border border-stone-800 text-amber-400 focus:outline-none focus:border-amber-600"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                Authenticate POS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
