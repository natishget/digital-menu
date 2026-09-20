'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Coffee,
  Globe,
  Leaf,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  X,
  CreditCard,
  QrCode,
  AlertTriangle,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { setLanguage, toggleFastingFilter } from '../../lib/store/slices/themeSlice';
import {
  setTableSession,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  CartModifierOption,
} from '../../lib/store/slices/cartSlice';
import { translations } from '../../lib/i18n/translations';
import { api } from '../../lib/api';

function CustomerMenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { language, isFastingOnly, venueName, serviceModel } = useAppSelector(
    (state) => state.theme,
  );
  const cart = useAppSelector((state) => state.cart);
  const t = translations[language];

  const tableId = searchParams.get('table_id');
  const token = searchParams.get('token');

  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [sessionError, setSessionError] = useState<string>('');
  const [effectiveServiceModel, setEffectiveServiceModel] = useState<string>('SELF_SERVED');

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Customization modal state
  const [customizingItem, setCustomizingItem] = useState<any | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});

  // Cart / Checkout Drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TELEBIRR' | 'CBE'>('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // 1. Validate QR Token Session
  useEffect(() => {
    if (tableId && token) {
      api
        .validateQrToken(tableId, token)
        .then((res) => {
          if (res.valid) {
            setSessionValid(true);
            setEffectiveServiceModel(res.effectiveServiceModel);
            dispatch(
              setTableSession({
                tableId: res.table.id,
                tableNumber: res.table.number,
                qrToken: token,
              }),
            );
          } else {
            setSessionValid(false);
            setSessionError(res.message || 'Invalid or expired QR token.');
          }
        })
        .catch((err) => {
          setSessionValid(false);
          setSessionError('Could not connect to server.');
        });
    } else {
      setSessionValid(true); // Standalone browsing demo mode
    }
  }, [tableId, token, dispatch]);

  // 2. Load Menu Categories & Items
  useEffect(() => {
    setLoading(true);
    api
      .getMenu(isFastingOnly, language)
      .then((res) => {
        if (res && res.categories) {
          setCategories(res.categories);
        }
      })
      .catch((err) => console.error('Error fetching menu:', err))
      .finally(() => setLoading(false));
  }, [isFastingOnly, language]);

  // Open item customization modal
  const openCustomizer = (item: any) => {
    setCustomizingItem(item);
    setItemQuantity(1);

    // Set initial default selections for required single-select modifier groups
    const initialMods: Record<string, string[]> = {};
    if (item.modifierGroups) {
      item.modifierGroups.forEach((group: any) => {
        if (group.isRequired && group.options && group.options.length > 0) {
          initialMods[group.id] = [group.options[0].id];
        } else {
          initialMods[group.id] = [];
        }
      });
    }
    setSelectedModifiers(initialMods);
  };

  // Toggle modifier option in customizer
  const handleModifierSelect = (group: any, optionId: string) => {
    const currentList = selectedModifiers[group.id] || [];

    if (group.maxSelection === 1) {
      // Single selection (Radio)
      setSelectedModifiers({
        ...selectedModifiers,
        [group.id]: [optionId],
      });
    } else {
      // Multiple selection (Checkbox)
      if (currentList.includes(optionId)) {
        setSelectedModifiers({
          ...selectedModifiers,
          [group.id]: currentList.filter((id) => id !== optionId),
        });
      } else {
        if (currentList.length < group.maxSelection) {
          setSelectedModifiers({
            ...selectedModifiers,
            [group.id]: [...currentList, optionId],
          });
        }
      }
    }
  };

  // Calculate total price for item being customized
  const calculateCustomizedPrice = () => {
    if (!customizingItem) return 0;
    let basePrice = customizingItem.price;
    let modifiersPrice = 0;

    if (customizingItem.modifierGroups) {
      customizingItem.modifierGroups.forEach((group: any) => {
        const selectedIds = selectedModifiers[group.id] || [];
        group.options.forEach((opt: any) => {
          if (selectedIds.includes(opt.id)) {
            modifiersPrice += opt.priceAdjustment;
          }
        });
      });
    }

    return (basePrice + modifiersPrice) * itemQuantity;
  };

  // Add customized item to Redux cart
  const handleAddToCart = () => {
    if (!customizingItem) return;

    const flattenedModifiers: CartModifierOption[] = [];
    if (customizingItem.modifierGroups) {
      customizingItem.modifierGroups.forEach((group: any) => {
        const selectedIds = selectedModifiers[group.id] || [];
        group.options.forEach((opt: any) => {
          if (selectedIds.includes(opt.id)) {
            flattenedModifiers.push({
              id: opt.id,
              nameEn: opt.nameEn,
              nameAm: opt.nameAm,
              priceAdjustment: opt.priceAdjustment,
            });
          }
        });
      });
    }

    dispatch(
      addToCart({
        menuItemId: customizingItem.id,
        nameEn: customizingItem.nameEn,
        nameAm: customizingItem.nameAm,
        price: customizingItem.price,
        quantity: itemQuantity,
        selectedModifiers: flattenedModifiers,
        fulfillmentStation: customizingItem.fulfillmentStation,
        imageUrl: customizingItem.imageUrl,
      }),
    );

    setCustomizingItem(null);
  };

  // Calculate cart total
  const cartTotalAmount = cart.items.reduce((acc, item) => {
    const itemModsPrice = item.selectedModifiers.reduce((mAcc, m) => mAcc + m.priceAdjustment, 0);
    return acc + (item.price + itemModsPrice) * item.quantity;
  }, 0);

  const cartTotalCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  // Submit Order to Backend
  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) return;
    setSubmittingOrder(true);

    try {
      const orderPayload = {
        tableId: cart.tableId || tableId || 'tbl1-id',
        qrToken: cart.qrToken || token || 'tbl1-tok-8f92a4e1',
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        paymentMethod,
        items: cart.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          selectedModifierOptionIds: item.selectedModifiers.map((m) => m.id),
        })),
      };

      const newOrder = await api.createOrder(orderPayload);

      // If Telebirr or CBE selected, process payment payload
      if (paymentMethod !== 'CASH') {
        await api.processPayment({
          orderId: newOrder.id,
          paymentMethod,
          transactionRef,
        });
      }

      dispatch(clearCart());
      setIsCartOpen(false);
      router.push(`/status/${newOrder.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to place order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (sessionValid === false) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-200 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">QR Session Invalid</h2>
          <p className="text-sm text-stone-600">{sessionError}</p>
          <p className="text-xs text-stone-400">
            Please re-scan the QR code printed on your cafe table tent.
          </p>
        </div>
      </div>
    );
  }

  const isReadonlyWaiterMode = effectiveServiceModel === 'WAITER_ASSISTED';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col pb-24 font-sans">
      {/* Venue Header */}
      <header className="sticky top-0 z-30 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-stone-200 shadow-xs px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-[var(--color-secondary)] leading-snug">
                {venueName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-amber-700">
                {cart.tableNumber && (
                  <span className="font-semibold bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                    {t.tableNumber} #{cart.tableNumber}
                  </span>
                )}
                {isReadonlyWaiterMode && (
                  <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md font-medium border border-blue-200">
                    Read-Only Mode
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={() => dispatch(setLanguage(language === 'en' ? 'am' : 'en'))}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 text-amber-900 border border-amber-300/80 hover:bg-amber-200 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.languageToggle}</span>
            </button>

            {/* Fasting Filter */}
            <button
              onClick={() => dispatch(toggleFastingFilter())}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isFastingOnly
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>{t.fastingFilter}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Categories Horizontal Bar */}
      <div className="sticky top-[57px] z-20 bg-[var(--color-bg)]/95 backdrop-blur-xs border-b border-stone-200 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-[var(--color-surface)] text-stone-700 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            {t.allCategories}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-[var(--color-surface)] text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-8">
        {isReadonlyWaiterMode && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-xs leading-relaxed">
              This venue is operating in <strong>Waiter-Assisted Mode</strong>. You can browse prices and descriptions. A waiter will take your order at your table.
            </p>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          categories
            .filter((c) => selectedCategory === 'all' || selectedCategory === c.id)
            .map((category) => (
              <section key={category.id} className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-[var(--color-secondary)] border-b border-amber-900/10 pb-2">
                  {category.name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[var(--color-surface)] border border-stone-200 hover:border-amber-400 transition-all flex justify-between gap-4 shadow-xs"
                    >
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-[var(--color-text)]">
                              {item.name}
                            </h3>
                            {item.isFastingFriendly && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                የጾም
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="font-extrabold text-base text-amber-700">
                            {item.price} ETB
                          </span>

                          {!isReadonlyWaiterMode && (
                            <button
                              onClick={() => openCustomizer(item)}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t.addToCart}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
        )}
      </main>

      {/* Sticky Bottom Bar */}
      {!isReadonlyWaiterMode && cartTotalCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-stone-200 p-4 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
                  {cartTotalCount}
                </span>
              </div>
              <div>
                <p className="text-xs text-stone-500">{t.total}</p>
                <p className="font-black text-lg text-amber-800 leading-tight">
                  {cartTotalAmount} ETB
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2"
            >
              <span>{t.checkout}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Item Customizer Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-[var(--color-surface)] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[var(--color-secondary)]">
                  {customizingItem.name}
                </h3>
                <p className="text-xs text-stone-500">Base Price: {customizingItem.price} ETB</p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modifiers List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              {customizingItem.modifierGroups?.map((group: any) => (
                <div key={group.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                      {group.name}
                    </h4>
                    <span className="text-[11px] font-semibold text-stone-400">
                      {group.isRequired ? t.required : t.optional}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {group.options.map((opt: any) => {
                      const isSelected = (selectedModifiers[group.id] || []).includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleModifierSelect(group, opt.id)}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-medium'
                              : 'border-stone-200 hover:border-stone-300 text-stone-700'
                          }`}
                        >
                          <span className="text-xs">{opt.name}</span>
                          <div className="flex items-center gap-2">
                            {opt.priceAdjustment > 0 && (
                              <span className="text-xs font-bold text-amber-700">
                                +{opt.priceAdjustment} ETB
                              </span>
                            )}
                            <div
                              className={`w-4 h-4 rounded-${group.maxSelection === 1 ? 'full' : 'md'} border flex items-center justify-center ${
                                isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-stone-200 flex items-center justify-between gap-4 bg-stone-50">
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                <button
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-stone-700 hover:bg-stone-200"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm w-4 text-center">{itemQuantity}</span>
                <button
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-stone-700 hover:bg-stone-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-between"
              >
                <span>{t.addToCart}</span>
                <span>{calculateCustomizedPrice()} ETB</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-[var(--color-surface)] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-base text-[var(--color-secondary)]">
                  {t.cartTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {cart.items.map((item) => {
                const itemModsPrice = item.selectedModifiers.reduce((acc, m) => acc + m.priceAdjustment, 0);
                const lineTotal = (item.price + itemModsPrice) * item.quantity;
                return (
                  <div
                    key={item.cartItemId}
                    className="p-3 rounded-xl border border-stone-200 flex flex-col gap-2 bg-stone-50/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-stone-900">{item.nameEn}</h4>
                        {item.selectedModifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedModifiers.map((m) => (
                              <span
                                key={m.id}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200"
                              >
                                {m.nameEn} {m.priceAdjustment > 0 && `(+${m.priceAdjustment} ETB)`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-xs text-amber-800">{lineTotal} ETB</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-stone-200">
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                cartItemId: item.cartItemId,
                                quantity: item.quantity - 1,
                              }),
                            )
                          }
                          className="text-stone-500 hover:text-stone-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                cartItemId: item.cartItemId,
                                quantity: item.quantity + 1,
                              }),
                            )
                          }
                          className="text-stone-500 hover:text-stone-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => dispatch(removeFromCart(item.cartItemId))}
                        className="text-[11px] text-red-600 hover:underline font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Checkout Form */}
              <div className="mt-4 pt-4 border-t border-stone-200 flex flex-col gap-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                  {t.customerInfo}
                </h4>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      {t.nameLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Abebe Bikila"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      {t.phoneLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="0911223344"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      {t.paymentMethod}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                          paymentMethod === 'CASH'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white border-stone-200 text-stone-700'
                        }`}
                      >
                        Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('TELEBIRR')}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                          paymentMethod === 'TELEBIRR'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white border-stone-200 text-stone-700'
                        }`}
                      >
                        Telebirr
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CBE')}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                          paymentMethod === 'CBE'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white border-stone-200 text-stone-700'
                        }`}
                      >
                        CBE Birr
                      </button>
                    </div>
                  </div>

                  {paymentMethod !== 'CASH' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Transaction Reference Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MOCK-TXN-12345"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                      />
                      <p className="text-[10px] text-amber-700 mt-1">
                        Dev mode: Auto-approves mock digital payments instantly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Summary & Submit */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm font-black text-stone-900">
                <span>{t.total}</span>
                <span className="text-amber-700">{cartTotalAmount} ETB</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submittingOrder}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingOrder ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>{t.placeOrder}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading Customer Digital Menu...</div>}>
      <CustomerMenuContent />
    </Suspense>
  );
}
