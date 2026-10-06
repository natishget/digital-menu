'use client';

import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { setRestaurantSettings } from '../../lib/store/slices/themeSlice';

export default function SettingsSection() {
  const dispatch = useAppDispatch();
  const { venueName, serviceModel, themeConfig } = useAppSelector((state) => state.theme);

  const [formVenueName, setFormVenueName] = useState(venueName);
  const [formServiceModel, setFormServiceModel] = useState(serviceModel);
  const [fastingAutoSchedule, setFastingAutoSchedule] = useState(true);
  const [colors, setColors] = useState({
    primaryColor: themeConfig?.primaryColor || '#d97706',
    secondaryColor: themeConfig?.secondaryColor || '#78350f',
    accentColor: themeConfig?.accentColor || '#f59e0b',
    backgroundColor: themeConfig?.backgroundColor || '#1c1917',
    surfaceColor: themeConfig?.surfaceColor || '#292524',
    textColor: themeConfig?.textColor || '#fafaf9',
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleColorChange = (key: string, val: string) => {
    const updated = { ...colors, [key]: val };
    setColors(updated);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (key === 'primaryColor') root.style.setProperty('--color-primary', val);
      if (key === 'secondaryColor') root.style.setProperty('--color-secondary', val);
      if (key === 'accentColor') root.style.setProperty('--color-accent', val);
      if (key === 'backgroundColor') root.style.setProperty('--color-bg', val);
      if (key === 'surfaceColor') root.style.setProperty('--color-surface', val);
      if (key === 'textColor') root.style.setProperty('--color-text', val);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updateSettings({
        name: formVenueName,
        serviceModel: formServiceModel,
        fastingAutoSchedule,
        themeConfig: colors,
      });

      dispatch(
        setRestaurantSettings({
          name: updated.name,
          serviceModel: updated.serviceModel,
          themeConfig: updated.themeConfig,
        }),
      );

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-stone-800 pb-4">
        <h2 className="text-xl font-bold text-white">System Settings & Brand Customization</h2>
        <p className="text-xs text-stone-400">Configure operating service models, fasting auto-scheduler, and brand palette</p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs font-semibold">
          Venue settings and brand colors saved successfully!
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2">
            Venue Operations Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Venue Brand Name</label>
              <input
                type="text"
                value={formVenueName}
                onChange={(e) => setFormVenueName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Venue Service Operating Model</label>
              <select
                value={formServiceModel}
                onChange={(e) => setFormServiceModel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
              >
                <option value="SELF_SERVED">Self-Served (Customer Orders Direct)</option>
                <option value="WAITER_ASSISTED">Waiter-Assisted (Waiter Punches Orders)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-300">
              <input
                type="checkbox"
                checked={fastingAutoSchedule}
                onChange={(e) => setFastingAutoSchedule(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              <span>Automatic Fasting Calendar Engine (Wed & Fri Auto-Filter)</span>
            </label>
          </div>
        </div>

        {/* Theme Colors Palette Customizer */}
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>Dynamic Venue Brand Palette</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { key: 'primaryColor', label: 'Primary Brand Color' },
              { key: 'secondaryColor', label: 'Secondary Color' },
              { key: 'accentColor', label: 'Accent Color' },
              { key: 'backgroundColor', label: 'Background Color' },
              { key: 'surfaceColor', label: 'Surface Color' },
              { key: 'textColor', label: 'Typography Color' },
            ].map((clr) => (
              <div key={clr.key} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-stone-300">{clr.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(colors as any)[clr.key] || '#d97706'}
                    onChange={(e) => handleColorChange(clr.key, e.target.value)}
                    className="w-9 h-9 rounded-lg border border-stone-800 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={(colors as any)[clr.key] || '#d97706'}
                    onChange={(e) => handleColorChange(clr.key, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white font-mono focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2 self-start cursor-pointer"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save System Settings & Theme</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
