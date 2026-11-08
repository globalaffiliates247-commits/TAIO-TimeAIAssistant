import React, { useState, useRef } from 'react';
import { Bell, Music, Upload, Volume2, Play, Square, Check, AlertCircle, Trash2 } from 'lucide-react';
import { AlarmSettings, CustomSoundFile } from '../model/alarmTypes';
import {
  getPlatformAlarmCapability,
  triggerAlarmSound,
  stopAllAlarmSounds,
  saveAlarmSettings,
} from '../model/alarmScheduler';

interface AlarmSettingsSectionProps {
  settings: AlarmSettings;
  onSettingsChange: (newSettings: AlarmSettings) => void;
}

export const AlarmSettingsSection: React.FC<AlarmSettingsSectionProps> = ({
  settings,
  onSettingsChange,
}) => {
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
    reader.onload = () => {
      const base64 = reader.result as string;
      const customSound: CustomSoundFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataBase64: base64,
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
      <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Báo thức khi bắt đầu khối
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Rung và phát chuông khi tới giờ thực hiện khối việc
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {/* Sound Options */}
      {settings.enabled && (
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Âm thanh báo thức
            </label>
            <button
              onClick={handleTestSound}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isPlayingTest
                  ? 'bg-rose-500 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600'
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
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{testWarning}</span>
            </div>
          )}

          {/* Radio choice: Default sound vs Custom sound */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleSoundTypeChange('default')}
              className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                settings.soundType === 'default'
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-zinc-900 dark:text-zinc-100'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Music className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="text-xs font-semibold">Chuông chuẩn TAIO</div>
                  <div className="text-[11px] text-zinc-500">Hòa âm êm ái, rõ ràng</div>
                </div>
              </div>
              {settings.soundType === 'default' && (
                <Check className="w-4 h-4 text-amber-500 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSoundTypeChange('custom')}
              className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                settings.soundType === 'custom'
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-zinc-900 dark:text-zinc-100'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Upload className="w-4 h-4 text-amber-500" />
                <div className="truncate max-w-[140px]">
                  <div className="text-xs font-semibold">File của tôi</div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    {settings.customSound?.name || 'Tải file âm thanh...'}
                  </div>
                </div>
              </div>
              {settings.soundType === 'custom' && (
                <Check className="w-4 h-4 text-amber-500 shrink-0" />
              )}
            </button>
          </div>

          {/* Custom sound file selector */}
          {settings.soundType === 'custom' && (
            <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-700/80 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.aac,.mp4"
                onChange={handleFileUpload}
                className="hidden"
              />

              {settings.customSound ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Music className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-medium text-zinc-900 dark:text-zinc-200 truncate">
                      {settings.customSound.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 rounded text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Đổi file
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCustomSound}
                      className="p-1 rounded text-zinc-400 hover:text-rose-500"
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
                  className="w-full py-3 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 rounded-xl text-center text-xs text-zinc-600 dark:text-zinc-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span>Chọn file âm thanh từ điện thoại (MP3, M4A, WAV, AAC)</span>
                </button>
              )}
            </div>
          )}

          {/* Platform Capability Note */}
          <div className="pt-2 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>Nền tảng: {platformCap.description}</span>
          </div>
        </div>
      )}
    </div>
  );
};
