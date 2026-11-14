import React, { useState, useRef } from 'react';
import { Bell, Music, Upload, Volume2, Play, Square, Check, AlertCircle, Trash2 } from 'lucide-react';
import { AlarmSettings, CustomSoundFile } from '../model/alarmTypes';
import { useApp } from '@/context/AppContext';
import {
  getPlatformAlarmCapability,
  triggerAlarmSound,
  stopAllAlarmSounds,
  saveAlarmSettings,
} from '../model/alarmScheduler';
import { importNativeAlarmSound } from '../../native/alarmBridge';

// Keep an in-app (web) playback copy only for small files: localStorage holds ~5 MB in total.
const MAX_WEB_COPY_BYTES = 1_500_000;

interface AlarmSettingsSectionProps {
  settings: AlarmSettings;
  onSettingsChange: (newSettings: AlarmSettings) => void;
}

export const AlarmSettingsSection: React.FC<AlarmSettingsSectionProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { palette } = useApp();
  const isCool = palette === 'cool';

  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [testWarning, setTestWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const platformCap = getPlatformAlarmCapability();

  const handleToggle = (enabled: boolean) => {
    const updated = { ...settings, enabled };
    onSettingsChange(updated);
    saveAlarmSettings(updated);
  };

  const handleSoundTypeChange = (soundType: 'default' | 'custom') => {
    const updated = { ...settings, soundType };
    onSettingsChange(updated);
    saveAlarmSettings(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      // v0.3.24: on the installed app, copy the file into the phone so native alarms can play it.
      let nativeSoundName: string | undefined;
      if (platformCap.capability !== 'web_unsupported') {
        const res = await importNativeAlarmSound(file.name, base64);
        if (!res.ok) {
          setTestWarning(`Không dùng được file "${file.name}" (${res.error || 'lỗi không rõ'}). Hãy thử file mp3, m4a hoặc wav khác.`);
          return;
        }
        nativeSoundName = res.soundName;
      }
      const customSound: CustomSoundFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataBase64: !nativeSoundName || file.size <= MAX_WEB_COPY_BYTES ? base64 : undefined,
        nativeSoundName,
      };

      const updated: AlarmSettings = {
        ...settings,
        soundType: 'custom',
        customSound,
      };
      onSettingsChange(updated);
      saveAlarmSettings(updated);
      setTestWarning(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomSound = () => {
    const updated: AlarmSettings = {
      ...settings,
      soundType: 'default',
      customSound: undefined,
    };
    onSettingsChange(updated);
    saveAlarmSettings(updated);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTestSound = async () => {
    if (isPlayingTest) {
      stopAllAlarmSounds();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    setTestWarning(null);

    const res = await triggerAlarmSound(settings);
    if (res.isFallbackDefault && res.fallbackReason) {
      setTestWarning(res.fallbackReason);
    }

    // Auto stop test after 6 seconds if user doesn't press stop
    setTimeout(() => {
      setIsPlayingTest(false);
      stopAllAlarmSounds();
    }, 6000);
  };

  return (
    <div className="space-y-4">
      {/* Toggle row */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isCool ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-[#E0401F]'
          }`}>
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Báo thức khi bắt đầu khối
            </h4>
            <p className="text-[11px] text-slate-500">
              Rung và phát chuông khi tới giờ thực hiện khối việc
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={() => handleToggle(!settings.enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none cursor-pointer ${
            settings.enabled ? (isCool ? 'bg-blue-600' : 'bg-[#E0401F]') : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
              settings.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Sound Options */}
      {settings.enabled && (
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Âm thanh báo thức
            </label>
            <button
              onClick={handleTestSound}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isPlayingTest
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              {isPlayingTest ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Dừng thử</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Thử chuông</span>
                </>
              )}
            </button>
          </div>

          {/* Test sound warning / fallback banner */}
          {testWarning && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{testWarning}</span>
            </div>
          )}

          {/* Radio choice: Default sound vs Custom sound */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleSoundTypeChange('default')}
              className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                settings.soundType === 'default'
                  ? isCool
                    ? 'border-blue-500 bg-blue-50/80 text-slate-900 shadow-2xs'
                    : 'border-[#E0401F] bg-orange-50/70 text-slate-900 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Music className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900">Chuông chuẩn TAIO</div>
                  <div className="text-[11px] text-slate-500">Hòa âm êm ái, rõ ràng</div>
                </div>
              </div>
              {settings.soundType === 'default' && (
                <Check className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'} shrink-0`} />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSoundTypeChange('custom')}
              className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                settings.soundType === 'custom'
                  ? isCool
                    ? 'border-blue-500 bg-blue-50/80 text-slate-900 shadow-2xs'
                    : 'border-[#E0401F] bg-orange-50/70 text-slate-900 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Upload className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
                <div className="truncate max-w-[140px]">
                  <div className="text-xs font-bold text-slate-900">File của tôi</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {settings.customSound?.name || 'Tải file âm thanh...'}
                  </div>
                </div>
              </div>
              {settings.soundType === 'custom' && (
                <Check className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'} shrink-0`} />
              )}
            </button>
          </div>

          {/* Custom sound file selector */}
          {settings.soundType === 'custom' && (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.aac,.mp4"
                onChange={handleFileUpload}
                className="hidden"
              />

              {settings.customSound ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Music className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'} shrink-0`} />
                    <span className="font-semibold text-slate-900 truncate">
                      {settings.customSound.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-2 py-1 rounded text-[11px] font-semibold ${isCool ? 'text-blue-600' : 'text-[#E0401F]'} hover:underline`}
                    >
                      Đổi file
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCustomSound}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                      title="Xoá file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-xl text-center text-xs text-slate-600 transition-colors flex items-center justify-center gap-2 bg-white"
                >
                  <Upload className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
                  <span>Chọn file âm thanh từ điện thoại (MP3, M4A, WAV, AAC)</span>
                </button>
              )}
            </div>
          )}

          {/* Platform Capability Note */}
          <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${isCool ? 'bg-blue-500' : 'bg-[#E0401F]'} shrink-0`} />
            <span>Nền tảng: {platformCap.description}</span>
          </div>
        </div>
      )}
    </div>
  );
};
