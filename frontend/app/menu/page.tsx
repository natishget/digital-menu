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
  Clock,
  Search,
  Utensils,
  Smartphone,
  Building2,
  ChefHat,
  SlidersHorizontal,
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
import { formatOrderTime, getRelativeTimeAgo } from '../../lib/formatTime';

function CustomerMenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { language, isFastingOnly, venueName, serviceModel } = useAppSelector(
    (state) => state.theme,
  );
  const cart = useAppSelector((state) => state.cart);
  const t = translations[language] || translations.en;

  const tableId = searchParams.get('table_id');
  const token = searchParams.get('token');

  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [sessionError, setSessionError] = useState<string>('');
  const [effectiveServiceModel, setEffectiveServiceModel] = useState<string>('SELF_SERVED');

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Order tracking modal states
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackPhoneInput, setTrackPhoneInput] = useState('');
  const [activeOrdersList, setActiveOrdersList] = useState<any[] | null>(null);
  const [searchingActiveOrders, setSearchingActiveOrders] = useState(false);
  const [trackErrorMsg, setTrackErrorMsg] = useState('');

  const handleOpenTrackModal = async () => {
    setIsTrackModalOpen(true);
    setTrackErrorMsg('');
    setActiveOrdersList(null);

    if (effectiveServiceModel === 'WAITER_ASSISTED' && (cart.tableId || tableId)) {
      setSearchingActiveOrders(true);
      try {
        const tableOrders = await api.getActiveTableOrderPublic(
          cart.tableId || tableId!,
          cart.qrToken || token || '',
        );
        if (tableOrders && tableOrders.length > 0) {
          setActiveOrdersList(tableOrders);
        } else {
          setActiveOrdersList([]);
          setTrackErrorMsg('No active orders currently found for your table.');
        }
      } catch (err: any) {
        setTrackErrorMsg(err.message || 'Could not fetch active table orders.');
      } finally {
        setSearchingActiveOrders(false);
      }
    } else {
      if (customerPhone && !trackPhoneInput) {
        setTrackPhoneInput(customerPhone);
      }
    }
  };

  const handleSearchPhoneOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackPhoneInput.trim()) return;
    setSearchingActiveOrders(true);
    setTrackErrorMsg('');
    setActiveOrdersList(null);

    try {
      const orders = await api.getActiveOrdersByPhone(trackPhoneInput.trim());
      if (orders && orders.length > 0) {
        setActiveOrdersList(orders);
      } else {
        setActiveOrdersList([]);
        setTrackErrorMsg(t.noActiveOrdersMsg);
      }
    } catch (err: any) {
      setTrackErrorMsg(err.message || 'Failed to search active orders.');
    } finally {
      setSearchingActiveOrders(false);
    }
  };

  // 1. Validate QR Token Session or Self-Served Settings
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
        .catch(() => {
          setSessionValid(false);
          setSessionError('Could not connect to server.');
        });
    } else {
      api
        .getSettings()
        .then((settings) => {
          if (settings && settings.serviceModel === 'WAITER_ASSISTED') {
            setSessionValid(false);
            setSessionError('Waiter-Assisted mode requires scanning the QR code printed on your cafe table.');
          } else {
            setSessionValid(true);
            setEffectiveServiceModel('SELF_SERVED');
          }
        })
        .catch(() => {
          setSessionValid(true);
          setEffectiveServiceModel('SELF_SERVED');
        });
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

  // Category navigation scroll handler
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(`category-${catId}`);
    if (elem) {
      const yOffset = -140;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Filter categories and menu items
  const filteredCategories = categories
    .map((cat) => {
      const matchingItems = (cat.items || []).filter((item: any) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const nameEn = (item.nameEn || item.name || '').toLowerCase();
        const nameAm = (item.nameAm || '').toLowerCase();
        const descEn = (item.descriptionEn || item.description || '').toLowerCase();
        const descAm = (item.descriptionAm || '').toLowerCase();
        return nameEn.includes(q) || nameAm.includes(q) || descEn.includes(q) || descAm.includes(q);
      });
      return {
        ...cat,
        items: matchingItems,
      };
    })
    .filter((cat) => {
      if (selectedCategory !== 'all' && cat.id !== selectedCategory) return false;
      return cat.items && cat.items.length > 0;
    });

  const totalFilteredItems = filteredCategories.reduce(
    (acc, cat) => acc + (cat.items?.length || 0),
    0,
  );

  // Open item customization modal
  const openCustomizer = (item: any) => {
    setCustomizingItem(item);
    setItemQuantity(1);

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

  const handleModifierSelect = (group: any, optionId: string) => {
    const currentList = selectedModifiers[group.id] || [];

    if (group.maxSelection === 1) {
      setSelectedModifiers({
        ...selectedModifiers,
        [group.id]: [optionId],
      });
    } else {
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

  const cartTotalAmount = cart.items.reduce((acc, item) => {
    const itemModsPrice = item.selectedModifiers.reduce((mAcc, m) => mAcc + m.priceAdjustment, 0);
    return acc + (item.price + itemModsPrice) * item.quantity;
  }, 0);

  const cartTotalCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) return;

    const targetTableId = cart.tableId || tableId || undefined;
    const targetQrToken = cart.qrToken || token || undefined;

    if (effectiveServiceModel === 'WAITER_ASSISTED' && (!targetTableId || !targetQrToken)) {
      alert('Table QR code session required to place order in Waiter-Assisted mode. Please scan the QR code at your table.');
      return;
    }

    if (effectiveServiceModel === 'SELF_SERVED' && !customerName.trim()) {
      alert('Please enter your name so staff can call out your order when ready.');
      return;
    }

    setSubmittingOrder(true);

    try {
      const orderPayload = {
        tableId: targetTableId,
        qrToken: targetQrToken,
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
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900 p-8 rounded-2xl border border-red-900/50 shadow-2xl text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-red-950 text-red-400 border border-red-800 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-stone-100">QR Session Invalid</h2>
          <p className="text-xs text-stone-400 leading-relaxed">{sessionError}</p>
          <p className="text-[11px] text-stone-500 font-medium">
            Please re-scan the QR code printed on your dining table card.
          </p>
        </div>
      </div>
    );
  }

  const isReadonlyWaiterMode = effectiveServiceModel === 'WAITER_ASSISTED';

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col pb-24 font-sans">
      {/* Venue Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 shadow-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-stone-100 leading-tight">
                {venueName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-amber-500 mt-0.5">
                {cart.tableNumber && (
                  <span className="font-semibold bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-md border border-amber-800/80">
                    {t.tableNumber} #{cart.tableNumber}
                  </span>
                )}
                {isReadonlyWaiterMode && (
                  <span className="bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded-md font-medium border border-blue-800/80">
                    Waiter Assisted
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={() => dispatch(setLanguage(language === 'en' ? 'am' : 'en'))}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-stone-800 text-stone-200 border border-stone-700 hover:bg-stone-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.languageToggle}</span>
            </button>

            {/* Fasting Filter Toggle */}
            <button
              onClick={() => dispatch(toggleFastingFilter())}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                isFastingOnly
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-xs'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.fastingFilter}</span>
            </button>

            {/* Track Order Button */}
            <button
              onClick={handleOpenTrackModal}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.trackOrderBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sticky Search & Category Horizontal Filter Navigation */}
      <div className="sticky top-[57px] z-20 bg-stone-950/95 backdrop-blur-md border-b border-stone-800/80 px-4 py-3 flex flex-col gap-2.5">
        <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center gap-3">
          {/* Instant Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, ingredients..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Horizontal Category Tab Pills */}
          <div className="flex-1 w-full flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSelectCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>{t.allCategories}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-950/60 font-mono">
                {categories.reduce((a, c) => a + (c.items?.length || 0), 0)}
              </span>
            </button>

            {categories.map((cat) => {
              const catItemCount = cat.items?.length || 0;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-950/60 font-mono">
                    {catItemCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Catalog Grid */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-8">
        {isReadonlyWaiterMode && (
          <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-800/80 text-blue-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              This venue is currently operating in <strong>Waiter-Assisted Mode</strong>. You can browse menu prices and food compositions. A waiter will take your order at your table.
            </p>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center text-stone-500 flex flex-col items-center gap-3 bg-stone-900 border border-stone-800 p-8 rounded-2xl">
            <Utensils className="w-10 h-10 text-stone-600" />
            <p className="text-sm font-bold text-stone-300">No items match your query</p>
            <p className="text-xs text-stone-500 max-w-sm">
              Try searching with another keyword or reset category filters.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs shadow-sm hover:bg-amber-500"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              key={category.id}
              id={`category-${category.id}`}
              className="flex flex-col gap-4 scroll-mt-36"
            >
              {/* Category Header Banner */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {category.fulfillmentStation === 'BARISTA' ? (
                      <Coffee className="w-4 h-4" />
                    ) : (
                      <ChefHat className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-stone-100 tracking-tight leading-none">
                      {category.name}
                    </h2>
                    {category.nameAm && (
                      <span className="text-[11px] text-stone-500 font-medium">
                        {category.nameAm}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-900 text-stone-400 border border-stone-800 font-medium">
                    {category.items?.length || 0} dishes
                  </span>
                </div>
              </div>

              {/* Category Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map((item: any) => {
                  const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 transition-all flex justify-between gap-4 shadow-sm"
                    >
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm text-stone-100">
                                {item.name}
                              </h3>
                              {item.isFastingFriendly && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  የጾም
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                              {item.fulfillmentStation === 'BARISTA' ? 'Barista' : 'Kitchen'}
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed line-clamp-3">
                              <span className="font-medium text-amber-500/90">Composition: </span>
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-800/60">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-extrabold text-sm text-amber-400">
                              {item.price} ETB
                            </span>
                            {hasModifiers && (
                              <span className="text-[10px] text-stone-500 font-medium">
                                (Customizable)
                              </span>
                            )}
                          </div>

                          {!isReadonlyWaiterMode && (
                            <button
                              onClick={() => openCustomizer(item)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t.addToCart}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Sticky Bottom Floating Checkout Bar */}
      {!isReadonlyWaiterMode && cartTotalCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 p-4 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/20">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-stone-900">
                  {cartTotalCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-stone-400">{t.total}</p>
                <p className="font-extrabold text-base text-amber-400 leading-tight">
                  {cartTotalAmount} ETB
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-md flex items-center gap-2"
            >
              <span>{t.checkout}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Item Customizer Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-stone-100">
                  {customizingItem.name}
                </h3>
                <p className="text-xs text-amber-400">Base Price: {customizingItem.price} ETB</p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              {customizingItem.description && (
                <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Food Composition & Ingredients:</span>
                  </span>
                  <p className="text-stone-300 leading-relaxed font-normal">
                    {customizingItem.description}
                  </p>
                </div>
              )}
              {customizingItem.modifierGroups?.map((group: any) => (
                <div key={group.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                      {group.name}
                    </h4>
                    <span className="text-[11px] font-semibold text-stone-500">
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
                              ? 'border-amber-600 bg-amber-950/40 text-stone-100 font-medium'
                              : 'border-stone-800 hover:border-stone-700 text-stone-300'
                          }`}
                        >
                          <span className="text-xs">{opt.name}</span>
                          <div className="flex items-center gap-2">
                            {opt.priceAdjustment > 0 && (
                              <span className="text-xs font-bold text-amber-400">
                                +{opt.priceAdjustment} ETB
                              </span>
                            )}
                            <div
                              className={`w-4 h-4 rounded-${group.maxSelection === 1 ? 'full' : 'md'} border flex items-center justify-center ${
                                isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-700'
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

            <div className="p-4 border-t border-stone-800 flex items-center justify-between gap-4 bg-stone-950">
              <div className="flex items-center gap-3 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
                <button
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center font-bold text-stone-300 hover:bg-stone-700"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm w-4 text-center">{itemQuantity}</span>
                <button
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center font-bold text-stone-300 hover:bg-stone-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-between"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-stone-900 border-l border-stone-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-stone-100">
                  {t.cartTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {cart.items.map((item) => {
                const itemModsPrice = item.selectedModifiers.reduce((acc, m) => acc + m.priceAdjustment, 0);
                const lineTotal = (item.price + itemModsPrice) * item.quantity;
                return (
                  <div
                    key={item.cartItemId}
                    className="p-3.5 rounded-xl border border-stone-800 flex flex-col gap-2.5 bg-stone-950/60"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-stone-100">{item.nameEn}</h4>
                        {item.selectedModifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedModifiers.map((m) => (
                              <span
                                key={m.id}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800"
                              >
                                {m.nameEn} {m.priceAdjustment > 0 && `(+${m.priceAdjustment} ETB)`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-extrabold text-xs text-amber-400">{lineTotal} ETB</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                      <div className="flex items-center gap-2 bg-stone-900 px-2 py-1 rounded-lg border border-stone-800">
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                cartItemId: item.cartItemId,
                                quantity: item.quantity - 1,
                              }),
                            )
                          }
                          className="text-stone-400 hover:text-white"
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
                          className="text-stone-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => dispatch(removeFromCart(item.cartItemId))}
                        className="text-[11px] text-red-400 hover:underline font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 pt-4 border-t border-stone-800 flex flex-col gap-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                  {t.customerInfo}
                </h4>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">
                      {t.nameLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Abebe Bikila"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">
                      {t.phoneLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="0911223344"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">
                      {t.notesLabel}
                    </label>
                    <textarea
                      placeholder="Special prep instructions or dietary notes..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                    {t.paymentMethod}
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-[11px] font-semibold transition-all ${
                        paymentMethod === 'CASH'
                          ? 'border-amber-600 bg-amber-950/50 text-amber-300'
                          : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('TELEBIRR')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-[11px] font-semibold transition-all ${
                        paymentMethod === 'TELEBIRR'
                          ? 'border-amber-600 bg-amber-950/50 text-amber-300'
                          : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-sky-400" />
                      <span>Telebirr</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CBE')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-[11px] font-semibold transition-all ${
                        paymentMethod === 'CBE'
                          ? 'border-amber-600 bg-amber-950/50 text-amber-300'
                          : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span>CBE Birr</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-800 bg-stone-950 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm font-extrabold">
                <span className="text-stone-400">Total Amount</span>
                <span className="text-amber-400">{cartTotalAmount} ETB</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submittingOrder || cart.items.length === 0}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingOrder ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t.placeOrder}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Tracking Modal */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{t.statusTracking}</span>
              </h3>
              <button
                onClick={() => setIsTrackModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {effectiveServiceModel !== 'WAITER_ASSISTED' && (
              <form onSubmit={handleSearchPhoneOrders} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Phone Number..."
                  value={trackPhoneInput}
                  onChange={(e) => setTrackPhoneInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600"
                />
                <button
                  type="submit"
                  disabled={searchingActiveOrders}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors"
                >
                  {searchingActiveOrders ? 'Searching...' : 'Find'}
                </button>
              </form>
            )}

            {trackErrorMsg && (
              <p className="text-xs text-amber-400 font-medium text-center py-2">
                {trackErrorMsg}
              </p>
            )}

            {activeOrdersList && activeOrdersList.length > 0 && (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {activeOrdersList.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => {
                      setIsTrackModalOpen(false);
                      router.push(`/status/${ord.id}`);
                    }}
                    className="p-3 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-600 text-left flex items-center justify-between gap-2 transition-all"
                  >
                    <div>
                      <span className="font-bold text-xs text-stone-100">
                        Order #{ord.orderNumber}
                      </span>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Status: <span className="text-amber-400 font-semibold">{ord.status}</span>
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <CustomerMenuContent />
    </Suspense>
  );
}
